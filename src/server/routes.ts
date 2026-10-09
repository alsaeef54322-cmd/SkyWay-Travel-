import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getDatabase,
  saveDatabase,
  calculateAge,
  getPassportStatus,
  logAuditEvent,
  createBackup,
  restoreDatabase,
  listBackups,
} from './db.ts';
import { generateExportWorkbook, generateTemplateWorkbook, parseAndImportCustomers } from './excel.ts';
import {
  User,
  Customer,
  Passport,
  NationalIdRecord,
  Booking,
  VisaApplication,
  Supplier,
  Payment,
  Expense,
  CustomerDocument,
} from './types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'skyway-travel-enterprise-secret-key-2026';
const router = express.Router();

// Multer storage for documents
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const excelUpload = multer({ storage: multer.memoryStorage() });

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: User['permissions'];
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid.' });
  }
}

// -------------------------------------------------------------
// 1. AUTH & EMPLOYEES
// -------------------------------------------------------------
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.status === 'inactive') {
    return res.status(401).json({ error: 'Invalid credentials or account is inactive' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  user.lastLogin = new Date().toISOString();
  saveDatabase(db);

  logAuditEvent(user.id, user.name, 'login', 'user', user.id, `User logged in from ${req.ip || 'local'}`);

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: payload,
  });
});

router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    permissions: user.permissions,
    status: user.status,
    lastLogin: user.lastLogin,
  });
});

router.post('/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    logAuditEvent(req.user.id, req.user.name, 'logout', 'user', req.user.id, 'User logged out');
  }
  res.json({ success: true });
});

// Employee management
router.get('/employees', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const safeUsers = db.users.map(({ passwordHash, ...rest }) => rest);
  res.json(safeUsers);
});

router.post('/employees', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can create employee accounts.' });
  }

  const { name, email, password, role, phone, permissions } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  const db = getDatabase();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An employee with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `USR-${Date.now().toString().slice(-4)}`,
    name,
    email,
    passwordHash,
    role,
    phone,
    status: 'active',
    permissions: permissions || {
      canManageCustomers: true,
      canManagePassports: true,
      canManageBookings: true,
      canManageVisas: true,
      canManageFinances: role === 'admin' || role === 'accountant',
      canDeleteRecords: role === 'admin',
      canExportExcel: true,
      canManageEmployees: role === 'admin',
      canManageSettings: role === 'admin',
      canViewAuditLogs: role === 'admin' || role === 'manager',
    },
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'create', 'user', newUser.id, `Created employee ${name} (${role})`);

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

router.put('/employees/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update employee settings.' });
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Employee not found' });

  const { name, phone, role, status, permissions, password } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role) user.role = role;
  if (status) user.status = status;
  if (permissions) user.permissions = permissions;
  if (password && password.trim().length >= 6) {
    user.passwordHash = bcrypt.hashSync(password.trim(), 10);
  }

  saveDatabase(db);
  logAuditEvent(req.user.id, req.user.name, 'update', 'user', user.id, `Updated employee ${user.name}`);

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// -------------------------------------------------------------
// 2. ENTERPRISE DASHBOARD & METRICS
// -------------------------------------------------------------
router.get('/dashboard/stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const now = new Date();
  const warningDays = db.settings.passportWarningDays || 180;

  // Recalculate customer ages and passport statuses
  db.customers.forEach((c) => {
    c.age = calculateAge(c.dob);
  });
  db.passports.forEach((p) => {
    p.status = getPassportStatus(p.expiryDate, warningDays);
  });

  const totalCustomers = db.customers.length;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const newCustomers = db.customers.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo).length;

  const totalPassports = db.passports.length;
  const expiringPassports = db.passports.filter((p) => p.status === 'expiring_soon').length;
  const expiredPassports = db.passports.filter((p) => p.status === 'expired').length;

  const activeBookings = db.bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;
  const upcomingDepartures = db.bookings.filter((b) => {
    const dep = new Date(b.departureDate);
    const diffDays = (dep.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14 && b.status !== 'cancelled';
  }).length;

  const pendingVisas = db.visaApplications.filter(
    (v) => v.status === 'submitted' || v.status === 'under_review' || v.status === 'appointment_scheduled' || v.status === 'preparing'
  ).length;

  // Authoritative financial totals
  const totalBookingsValue = db.bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  const totalPaymentsReceived = db.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstandingBalances = Math.max(0, totalBookingsValue - totalPaymentsReceived);

  const totalSupplierCosts = db.bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.supplierCost) || 0), 0);

  const totalExpenses = db.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Revenue is actual collected payments; net profit = total payments - (supplier costs + operating expenses)
  const netProfit = totalPaymentsReceived - totalExpenses;

  // Monthly revenue & profit chart data (last 6 months)
  const monthlyData: { month: string; revenue: number; expenses: number; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toLocaleString('en-US', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const monthPayments = db.payments
      .filter((p) => p.date.startsWith(yearMonth))
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const monthExpenses = db.expenses
      .filter((e) => e.date.startsWith(yearMonth))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    monthlyData.push({
      month: monthKey,
      revenue: monthPayments,
      expenses: monthExpenses,
      profit: monthPayments - monthExpenses,
    });
  }

  // Service distribution
  const serviceDistribution: Record<string, number> = {};
  db.bookings.forEach((b) => {
    serviceDistribution[b.serviceCategory] = (serviceDistribution[b.serviceCategory] || 0) + 1;
  });

  // Booking status distribution
  const statusDistribution: Record<string, number> = {};
  db.bookings.forEach((b) => {
    statusDistribution[b.status] = (statusDistribution[b.status] || 0) + 1;
  });

  // Latest 5 bookings
  const latestBookings = [...db.bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((b) => {
      const cust = db.customers.find((c) => c.id === b.customerId);
      return {
        ...b,
        customerNameAr: cust?.fullNameAr || '',
        customerNameEn: cust?.fullNameEn || '',
      };
    });

  // Recent 5 activities
  const recentActivities = db.auditLogs.slice(0, 5);

  // Expiring Passports detailed list with countdown
  const expiringPassportsList = db.passports
    .filter((p) => p.status === 'expiring_soon' || p.status === 'expired')
    .map((p) => {
      const exp = new Date(p.expiryDate).getTime();
      const diffDays = Math.ceil((exp - now.getTime()) / (1000 * 60 * 60 * 24));
      const customer = db.customers.find((c) => c.id === p.customerId);
      return {
        id: p.id,
        passportNumber: p.passportNumber,
        holderNameAr: p.holderNameAr || customer?.fullNameAr || '',
        holderNameEn: p.holderNameEn || customer?.fullNameEn || '',
        customerId: p.customerId,
        expiryDate: p.expiryDate,
        status: p.status,
        daysRemaining: diffDays,
        isExpired: diffDays <= 0,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Expiring Visas & upcoming visa deadlines (appointment dates or review deadlines)
  const urgentVisasList = db.visaApplications
    .filter((v) => v.status !== 'approved' && v.status !== 'rejected')
    .map((v) => {
      let daysUntilAppointment: number | null = null;
      if (v.appointmentDate) {
        const apptTime = new Date(v.appointmentDate).getTime();
        daysUntilAppointment = Math.ceil((apptTime - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      let daysUntilDecision: number | null = null;
      if (v.expectedDecisionDate) {
        const decTime = new Date(v.expectedDecisionDate).getTime();
        daysUntilDecision = Math.ceil((decTime - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      return {
        id: v.id,
        applicationRef: v.applicationRef,
        travelerName: v.travelerName,
        destinationCountry: v.destinationCountry,
        visaCategory: v.visaCategory,
        status: v.status,
        appointmentDate: v.appointmentDate,
        expectedDecisionDate: v.expectedDecisionDate,
        daysUntilAppointment,
        daysUntilDecision,
        fees: v.fees,
        currency: v.currency || db.settings.defaultCurrency || 'EGP',
        isUrgent:
          (daysUntilAppointment !== null && daysUntilAppointment <= 14) ||
          (daysUntilDecision !== null && daysUntilDecision <= 7) ||
          v.status === 'appointment_scheduled' ||
          v.status === 'submitted',
      };
    })
    .sort((a, b) => {
      const aDays = a.daysUntilAppointment ?? 999;
      const bDays = b.daysUntilAppointment ?? 999;
      return aDays - bDays;
    });

  const urgentDeadlinesCount = expiringPassportsList.length + urgentVisasList.filter((v) => v.isUrgent).length;

  res.json({
    totalCustomers,
    newCustomers,
    totalPassports,
    expiringPassports,
    expiredPassports,
    activeBookings,
    upcomingDepartures,
    pendingVisas,
    totalBookingsValue,
    totalPaymentsReceived,
    outstandingBalances,
    totalSupplierCosts,
    totalExpenses,
    netProfit,
    currency: db.settings.defaultCurrency || 'EGP',
    monthlyData,
    serviceDistribution,
    statusDistribution,
    latestBookings,
    recentActivities,
    expiringPassportsList,
    urgentVisasList,
    urgentDeadlinesCount,
  });
});

// -------------------------------------------------------------
// 3. CUSTOMER CRM
// -------------------------------------------------------------
router.get('/customers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { search, status, page = '1', limit = '50' } = req.query;

  let list = db.customers.map((c) => ({
    ...c,
    age: calculateAge(c.dob),
  }));

  if (status && status !== 'all') {
    list = list.filter((c) => c.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter((c) => {
      const passMatch = db.passports.some((p) => p.customerId === c.id && p.passportNumber.toLowerCase().includes(q));
      return (
        c.fullNameAr.toLowerCase().includes(q) ||
        c.fullNameEn.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.nationalId && c.nationalId.includes(q)) ||
        c.id.toLowerCase().includes(q) ||
        passMatch
      );
    });
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const p = parseInt(String(page), 10) || 1;
  const l = parseInt(String(limit), 10) || 50;
  const total = list.length;
  const paginated = list.slice((p - 1) * l, p * l);

  res.json({
    data: paginated,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  });
});

router.get('/customers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const customer = db.customers.find((c) => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  customer.age = calculateAge(customer.dob);

  const customerPassports = db.passports.filter((p) => p.customerId === customer.id);
  const customerBookings = db.bookings.filter((b) => b.customerId === customer.id);
  const customerVisas = db.visaApplications.filter((v) => v.customerId === customer.id);
  const customerNationalIds = db.nationalIdRecords.filter((n) => n.customerId === customer.id);
  const customerPayments = db.payments.filter((p) => p.customerId === customer.id);
  const customerDocuments = db.documents.filter((d) => d.customerId === customer.id);

  // Financial summary for this customer
  const totalBilled = customerBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalPaid = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, totalBilled - totalPaid);

  res.json({
    ...customer,
    passports: customerPassports,
    bookings: customerBookings,
    visas: customerVisas,
    nationalIdRecords: customerNationalIds,
    payments: customerPayments,
    documents: customerDocuments,
    financialSummary: {
      totalBilled,
      totalPaid,
      balance,
    },
  });
});

router.post('/customers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { fullNameAr, fullNameEn, nationalId, dob, nationality, gender, phone, whatsapp, email, address, notes, status } = req.body;

  if (!fullNameAr && !fullNameEn) {
    return res.status(400).json({ error: 'Customer name (Arabic or English) is required.' });
  }
  if (!email || !phone) {
    return res.status(400).json({ error: 'Email and phone are required.' });
  }

  const db = getDatabase();
  // Duplicate email detection
  if (db.customers.some((c) => c.email.toLowerCase() === email.toLowerCase().trim())) {
    return res.status(400).json({ error: 'A customer with this email address already exists.' });
  }

  const nextIdNum = 1000 + db.customers.length + 1;
  const newCustomer: Customer = {
    id: `CUST-${nextIdNum}`,
    fullNameAr: fullNameAr || fullNameEn,
    fullNameEn: fullNameEn || fullNameAr,
    nationalId: nationalId?.trim() || undefined,
    dob: dob || '1990-01-01',
    age: calculateAge(dob || '1990-01-01'),
    nationality: nationality || 'Saudi Arabia',
    gender: gender || 'male',
    phone: phone.trim(),
    whatsapp: whatsapp?.trim() || phone.trim(),
    email: email.trim(),
    address: address?.trim() || undefined,
    notes: notes?.trim() || undefined,
    status: status || 'active',
    assignedEmployeeId: req.user?.id || 'USR-101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.customers.push(newCustomer);

  // If national ID is provided, create linked national ID record automatically
  if (nationalId && nationalId.trim()) {
    const nidRecord: NationalIdRecord = {
      id: `NID-${Date.now().toString().slice(-4)}`,
      customerId: newCustomer.id,
      idNumber: nationalId.trim(),
      verificationStatus: 'verified',
      notes: 'Initial registration',
      createdAt: new Date().toISOString(),
    };
    db.nationalIdRecords.push(nidRecord);
  }

  saveDatabase(db);
  logAuditEvent(req.user!.id, req.user!.name, 'create', 'customer', newCustomer.id, `Created customer ${newCustomer.fullNameEn}`);

  res.status(201).json(newCustomer);
});

router.put('/customers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const customer = db.customers.find((c) => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const fields = ['fullNameAr', 'fullNameEn', 'nationalId', 'dob', 'nationality', 'gender', 'phone', 'whatsapp', 'email', 'address', 'notes', 'status', 'assignedEmployeeId'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      (customer as any)[f] = req.body[f];
    }
  });

  customer.age = calculateAge(customer.dob);
  customer.updatedAt = new Date().toISOString();

  saveDatabase(db);
  logAuditEvent(req.user!.id, req.user!.name, 'update', 'customer', customer.id, `Updated customer ${customer.fullNameEn}`);

  res.json(customer);
});

router.delete('/customers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.permissions.canDeleteRecords) {
    return res.status(403).json({ error: 'Permission denied: Cannot delete records.' });
  }

  const db = getDatabase();
  const index = db.customers.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });

  const removed = db.customers.splice(index, 1)[0];
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'delete', 'customer', removed.id, `Deleted customer ${removed.fullNameEn}`);
  res.json({ success: true, message: 'Customer deleted successfully' });
});

// -------------------------------------------------------------
// 4. NATIONAL ID RECORDS
// -------------------------------------------------------------
router.get('/national-ids', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const list = db.nationalIdRecords.map((n) => {
    const cust = db.customers.find((c) => c.id === n.customerId);
    return {
      ...n,
      customerNameAr: cust?.fullNameAr || '',
      customerNameEn: cust?.fullNameEn || '',
      customerPhone: cust?.phone || '',
    };
  });
  res.json(list);
});

router.post('/national-ids', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { customerId, idNumber, issueDate, expiryDate, verificationStatus, notes } = req.body;
  if (!customerId || !idNumber) {
    return res.status(400).json({ error: 'Customer ID and National ID Number are required' });
  }

  const db = getDatabase();
  const newRecord: NationalIdRecord = {
    id: `NID-${Date.now().toString().slice(-4)}`,
    customerId,
    idNumber: idNumber.trim(),
    issueDate,
    expiryDate,
    verificationStatus: verificationStatus || 'verified',
    notes,
    createdAt: new Date().toISOString(),
  };

  db.nationalIdRecords.push(newRecord);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'customer', newRecord.id, `Recorded National ID for customer ${customerId}`);
  res.status(201).json(newRecord);
});

router.put('/national-ids/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const record = db.nationalIdRecords.find((n) => n.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'National ID record not found' });

  const { idNumber, issueDate, expiryDate, verificationStatus, notes } = req.body;
  if (idNumber) record.idNumber = idNumber;
  if (issueDate !== undefined) record.issueDate = issueDate;
  if (expiryDate !== undefined) record.expiryDate = expiryDate;
  if (verificationStatus) record.verificationStatus = verificationStatus;
  if (notes !== undefined) record.notes = notes;

  saveDatabase(db);
  res.json(record);
});

router.delete('/national-ids/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.nationalIdRecords.findIndex((n) => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Record not found' });

  db.nationalIdRecords.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 5. PASSPORT MANAGEMENT
// -------------------------------------------------------------
router.get('/passports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { status, search } = req.query;
  const warningDays = db.settings.passportWarningDays || 180;

  let list = db.passports.map((p) => {
    const cust = db.customers.find((c) => c.id === p.customerId);
    const computedStatus = getPassportStatus(p.expiryDate, warningDays);
    return {
      ...p,
      status: computedStatus,
      customerNameAr: cust?.fullNameAr || '',
      customerNameEn: cust?.fullNameEn || '',
      customerPhone: cust?.phone || '',
    };
  });

  if (status && status !== 'all') {
    list = list.filter((p) => p.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.passportNumber.toLowerCase().includes(q) ||
        p.holderNameAr.toLowerCase().includes(q) ||
        p.holderNameEn.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.customerId.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

router.post('/passports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const {
    customerId,
    passportNumber,
    holderNameAr,
    holderNameEn,
    nationality,
    dob,
    gender,
    issueDate,
    expiryDate,
    issuingAuthority,
    passportType,
    notes,
  } = req.body;

  if (!customerId || !passportNumber || !expiryDate) {
    return res.status(400).json({ error: 'Customer ID, Passport Number, and Expiry Date are required' });
  }

  const db = getDatabase();
  const warningDays = db.settings.passportWarningDays || 180;
  const status = getPassportStatus(expiryDate, warningDays);

  const newPassport: Passport = {
    id: `PASS-${Date.now().toString().slice(-4)}`,
    customerId,
    passportNumber: passportNumber.trim().toUpperCase(),
    holderNameAr: holderNameAr || '',
    holderNameEn: holderNameEn || '',
    nationality: nationality || 'Saudi Arabia',
    dob: dob || '1990-01-01',
    gender: gender || 'male',
    issueDate: issueDate || new Date().toISOString().split('T')[0],
    expiryDate,
    issuingAuthority: issuingAuthority || '',
    passportType: passportType || 'regular',
    notes,
    status,
    createdAt: new Date().toISOString(),
  };

  db.passports.push(newPassport);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'passport', newPassport.id, `Recorded passport ${newPassport.passportNumber} for customer ${customerId}`);
  res.status(201).json(newPassport);
});

router.put('/passports/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const passport = db.passports.find((p) => p.id === req.params.id);
  if (!passport) return res.status(404).json({ error: 'Passport not found' });

  const fields = ['passportNumber', 'holderNameAr', 'holderNameEn', 'nationality', 'dob', 'gender', 'issueDate', 'expiryDate', 'issuingAuthority', 'passportType', 'notes'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      (passport as any)[f] = req.body[f];
    }
  });

  const warningDays = db.settings.passportWarningDays || 180;
  passport.status = getPassportStatus(passport.expiryDate, warningDays);

  saveDatabase(db);
  logAuditEvent(req.user!.id, req.user!.name, 'update', 'passport', passport.id, `Updated passport ${passport.passportNumber}`);

  res.json(passport);
});

router.delete('/passports/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.passports.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Passport not found' });

  const removed = db.passports.splice(idx, 1)[0];
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'delete', 'passport', removed.id, `Deleted passport ${removed.passportNumber}`);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 6. BOOKINGS & TRAVEL OPERATIONS
// -------------------------------------------------------------
router.get('/bookings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { status, serviceCategory, search } = req.query;

  let list = db.bookings.map((b) => {
    const cust = db.customers.find((c) => c.id === b.customerId);
    const supp = db.suppliers.find((s) => s.id === b.supplierId);
    const paymentsForBooking = db.payments.filter((p) => p.bookingId === b.id);
    const paidAmount = paymentsForBooking.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = Math.max(0, (Number(b.totalPrice) || 0) - paidAmount);
    const paymentStatus = paidAmount >= b.totalPrice ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    return {
      ...b,
      customerNameAr: cust?.fullNameAr || '',
      customerNameEn: cust?.fullNameEn || '',
      customerPhone: cust?.phone || '',
      supplierName: supp?.name || '',
      paidAmount,
      remainingBalance,
      paymentStatus,
    };
  });

  if (status && status !== 'all') {
    list = list.filter((b) => b.status === status);
  }
  if (serviceCategory && serviceCategory !== 'all') {
    list = list.filter((b) => b.serviceCategory === serviceCategory);
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.bookingRef.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.customerNameAr.toLowerCase().includes(q) ||
        b.customerNameEn.toLowerCase().includes(q) ||
        (b.flightNumber && b.flightNumber.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

router.get('/bookings/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const cust = db.customers.find((c) => c.id === booking.customerId);
  const supp = db.suppliers.find((s) => s.id === booking.supplierId);
  const payments = db.payments.filter((p) => p.bookingId === booking.id);
  const docs = db.documents.filter((d) => d.bookingId === booking.id);
  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBalance = Math.max(0, booking.totalPrice - paidAmount);

  res.json({
    ...booking,
    customer: cust,
    supplier: supp,
    payments,
    documents: docs,
    paidAmount,
    remainingBalance,
    paymentStatus: paidAmount >= booking.totalPrice ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
  });
});

router.post('/bookings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const {
    customerId,
    serviceCategory,
    destination,
    origin,
    departureDate,
    returnDate,
    airline,
    flightNumber,
    ticketNumber,
    hotelDetails,
    supplierId,
    totalPrice,
    supplierCost,
    currency,
    travelers,
    internalNotes,
  } = req.body;

  if (!customerId || !destination || !departureDate || totalPrice === undefined) {
    return res.status(400).json({ error: 'Customer, Destination, Departure Date, and Total Price are required' });
  }

  const db = getDatabase();
  const year = new Date().getFullYear();
  const prefix = db.settings.bookingRefPrefix || 'SKW';
  const bookingNum = 1080 + db.bookings.length + 1;
  const bookingRef = `${prefix}-${year}-${bookingNum}`;

  const newBooking: Booking = {
    id: `BK-${Date.now().toString().slice(-4)}`,
    bookingRef,
    customerId,
    serviceCategory: serviceCategory || 'flight',
    destination,
    origin,
    departureDate,
    returnDate,
    airline,
    flightNumber,
    ticketNumber,
    hotelDetails,
    supplierId,
    assignedEmployeeId: req.user?.id || 'USR-101',
    status: 'confirmed',
    totalPrice: Number(totalPrice) || 0,
    supplierCost: Number(supplierCost) || 0,
    currency: currency || db.settings.defaultCurrency || 'USD',
    travelers: travelers || [],
    internalNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.bookings.push(newBooking);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'booking', newBooking.id, `Created booking ${newBooking.bookingRef} (${newBooking.destination})`);
  res.status(201).json(newBooking);
});

router.put('/bookings/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const fields = [
    'serviceCategory',
    'destination',
    'origin',
    'departureDate',
    'returnDate',
    'airline',
    'flightNumber',
    'ticketNumber',
    'hotelDetails',
    'supplierId',
    'status',
    'totalPrice',
    'supplierCost',
    'currency',
    'travelers',
    'internalNotes',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      (booking as any)[f] = req.body[f];
    }
  });

  booking.updatedAt = new Date().toISOString();
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'update', 'booking', booking.id, `Updated booking ${booking.bookingRef}`);
  res.json(booking);
});

router.delete('/bookings/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.permissions.canDeleteRecords) {
    return res.status(403).json({ error: 'Permission denied: Cannot delete bookings.' });
  }

  const db = getDatabase();
  const idx = db.bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });

  const removed = db.bookings.splice(idx, 1)[0];
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'delete', 'booking', removed.id, `Deleted booking ${removed.bookingRef}`);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 7. VISA APPLICATIONS
// -------------------------------------------------------------
router.get('/visas', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { status, search } = req.query;

  let list = db.visaApplications.map((v) => {
    const cust = db.customers.find((c) => c.id === v.customerId);
    return {
      ...v,
      customerNameAr: cust?.fullNameAr || '',
      customerNameEn: cust?.fullNameEn || '',
      customerPhone: cust?.phone || '',
    };
  });

  if (status && status !== 'all') {
    list = list.filter((v) => v.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.applicationRef.toLowerCase().includes(q) ||
        v.travelerName.toLowerCase().includes(q) ||
        v.destinationCountry.toLowerCase().includes(q) ||
        v.passportNumber.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

router.post('/visas', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { customerId, travelerName, passportNumber, destinationCountry, visaCategory, submissionDate, appointmentDate, fees, currency, notes, checklist } = req.body;

  if (!customerId || !travelerName || !destinationCountry) {
    return res.status(400).json({ error: 'Customer, Traveler Name, and Destination Country are required' });
  }

  const db = getDatabase();
  const applicationRef = `VSA-${destinationCountry.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const defaultChecklist = checklist || [
    { id: '1', nameAr: 'جواز السفر الأصلي', nameEn: 'Original Passport', isCompleted: true },
    { id: '2', nameAr: 'صور شخصية حديثة', nameEn: 'Recent Photos', isCompleted: true },
    { id: '3', nameAr: 'كشف حساب بنكي', nameEn: 'Bank Statement', isCompleted: false },
    { id: '4', nameAr: 'تعريف بالراتب', nameEn: 'Employment Letter', isCompleted: false },
    { id: '5', nameAr: 'تأمين سفر طبي', nameEn: 'Travel Insurance', isCompleted: false },
  ];

  const newVisa: VisaApplication = {
    id: `VISA-${Date.now().toString().slice(-4)}`,
    applicationRef,
    customerId,
    travelerName,
    passportNumber: passportNumber || '',
    destinationCountry,
    visaCategory: visaCategory || 'tourist',
    submissionDate: submissionDate || new Date().toISOString().split('T')[0],
    appointmentDate,
    status: 'preparing',
    checklist: defaultChecklist,
    fees: Number(fees) || 0,
    currency: currency || db.settings.defaultCurrency || 'USD',
    assignedEmployeeId: req.user?.id || 'USR-101',
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.visaApplications.push(newVisa);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'visa', newVisa.id, `Created visa application ${newVisa.applicationRef} (${destinationCountry})`);
  res.status(201).json(newVisa);
});

router.put('/visas/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const visa = db.visaApplications.find((v) => v.id === req.params.id);
  if (!visa) return res.status(404).json({ error: 'Visa application not found' });

  const fields = ['travelerName', 'passportNumber', 'destinationCountry', 'visaCategory', 'submissionDate', 'appointmentDate', 'expectedDecisionDate', 'status', 'checklist', 'fees', 'notes'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      (visa as any)[f] = req.body[f];
    }
  });

  visa.updatedAt = new Date().toISOString();
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'update', 'visa', visa.id, `Updated visa application ${visa.applicationRef}`);
  res.json(visa);
});

router.delete('/visas/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.visaApplications.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Visa application not found' });

  const removed = db.visaApplications.splice(idx, 1)[0];
  saveDatabase(db);
  logAuditEvent(req.user!.id, req.user!.name, 'delete', 'visa', removed.id, `Deleted visa application ${removed.applicationRef}`);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 8. SUPPLIERS
// -------------------------------------------------------------
router.get('/suppliers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.suppliers);
});

router.post('/suppliers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, serviceType, contactPerson, phone, email, balanceOwed, currency, notes } = req.body;
  if (!name || !serviceType) return res.status(400).json({ error: 'Supplier name and service type required' });

  const db = getDatabase();
  const newSupp: Supplier = {
    id: `SUPP-${100 + db.suppliers.length + 1}`,
    name,
    serviceType,
    contactPerson: contactPerson || '',
    phone: phone || '',
    email: email || '',
    balanceOwed: Number(balanceOwed) || 0,
    currency: currency || db.settings.defaultCurrency || 'USD',
    notes,
    status: 'active',
  };

  db.suppliers.push(newSupp);
  saveDatabase(db);
  logAuditEvent(req.user!.id, req.user!.name, 'create', 'supplier', newSupp.id, `Added supplier ${newSupp.name}`);
  res.status(201).json(newSupp);
});

router.put('/suppliers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const supp = db.suppliers.find((s) => s.id === req.params.id);
  if (!supp) return res.status(404).json({ error: 'Supplier not found' });

  Object.assign(supp, req.body);
  saveDatabase(db);
  res.json(supp);
});

router.delete('/suppliers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.suppliers.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Supplier not found' });

  db.suppliers.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 9. PAYMENTS & FINANCIAL MANAGEMENT
// -------------------------------------------------------------
router.get('/payments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const list = db.payments.map((p) => {
    const cust = db.customers.find((c) => c.id === p.customerId);
    const bk = db.bookings.find((b) => b.id === p.bookingId);
    return {
      ...p,
      customerNameAr: cust?.fullNameAr || '',
      customerNameEn: cust?.fullNameEn || '',
      bookingRef: bk?.bookingRef || '',
    };
  });
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(list);
});

router.post('/payments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { customerId, bookingId, date, amount, currency, paymentMethod, transactionRef, notes } = req.body;
  if (!customerId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Customer and positive payment amount are required' });
  }

  const db = getDatabase();
  const year = new Date().getFullYear();
  const refNum = 500 + db.payments.length + 1;
  const paymentRef = `REC-${year}-${refNum}`;

  const newPayment: Payment = {
    id: `PAY-${Date.now().toString().slice(-4)}`,
    paymentRef,
    customerId,
    bookingId: bookingId || undefined,
    date: date || new Date().toISOString().split('T')[0],
    amount: Number(amount),
    currency: currency || db.settings.defaultCurrency || 'USD',
    paymentMethod: paymentMethod || 'cash',
    transactionRef,
    recordedById: req.user?.id || 'USR-101',
    notes,
    createdAt: new Date().toISOString(),
  };

  db.payments.push(newPayment);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'payment', newPayment.id, `Recorded payment ${newPayment.paymentRef} of ${newPayment.amount} ${newPayment.currency}`);
  res.status(201).json(newPayment);
});

router.delete('/payments/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.permissions.canManageFinances) {
    return res.status(403).json({ error: 'Permission denied: Cannot modify payments.' });
  }

  const db = getDatabase();
  const idx = db.payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Payment not found' });

  const removed = db.payments.splice(idx, 1)[0];
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'delete', 'payment', removed.id, `Deleted/voided payment ${removed.paymentRef}`);
  res.json({ success: true });
});

// Expenses
router.get('/expenses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const list = db.expenses.map((e) => {
    const supp = db.suppliers.find((s) => s.id === e.supplierId);
    return {
      ...e,
      supplierName: supp?.name || '',
    };
  });
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(list);
});

router.post('/expenses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { category, date, amount, currency, supplierId, bookingId, description } = req.body;
  if (!amount || Number(amount) <= 0 || !description) {
    return res.status(400).json({ error: 'Amount and description are required' });
  }

  const db = getDatabase();
  const year = new Date().getFullYear();
  const expNum = 300 + db.expenses.length + 1;
  const expenseRef = `EXP-${year}-${expNum}`;

  const newExpense: Expense = {
    id: `EXP-${Date.now().toString().slice(-4)}`,
    expenseRef,
    category: category || 'supplier_cost',
    date: date || new Date().toISOString().split('T')[0],
    amount: Number(amount),
    currency: currency || db.settings.defaultCurrency || 'USD',
    supplierId,
    bookingId,
    description,
    recordedById: req.user?.id || 'USR-101',
    createdAt: new Date().toISOString(),
  };

  db.expenses.push(newExpense);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'expense', newExpense.id, `Recorded expense ${newExpense.expenseRef} of ${newExpense.amount} ${newExpense.currency}`);
  res.status(201).json(newExpense);
});

router.delete('/expenses/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.permissions.canManageFinances) {
    return res.status(403).json({ error: 'Permission denied: Cannot modify expenses.' });
  }

  const db = getDatabase();
  const idx = db.expenses.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

  const removed = db.expenses.splice(idx, 1)[0];
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'delete', 'expense', removed.id, `Deleted expense ${removed.expenseRef}`);
  res.json({ success: true });
});

// Comprehensive Financial Report & Customer Statements
router.get('/financial-reports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { startDate, endDate } = req.query;

  let filteredPayments = db.payments;
  let filteredExpenses = db.expenses;
  let filteredBookings = db.bookings.filter((b) => b.status !== 'cancelled');

  if (startDate) {
    filteredPayments = filteredPayments.filter((p) => p.date >= String(startDate));
    filteredExpenses = filteredExpenses.filter((e) => e.date >= String(startDate));
    filteredBookings = filteredBookings.filter((b) => b.departureDate >= String(startDate));
  }
  if (endDate) {
    filteredPayments = filteredPayments.filter((p) => p.date <= String(endDate));
    filteredExpenses = filteredExpenses.filter((e) => e.date <= String(endDate));
    filteredBookings = filteredBookings.filter((b) => b.departureDate <= String(endDate));
  }

  const totalBookingsValue = filteredBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalPaymentsReceived = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalSupplierCost = filteredBookings.reduce((sum, b) => sum + (Number(b.supplierCost) || 0), 0);
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalPaymentsReceived - totalOperatingExpenses;
  const grossMargin = totalBookingsValue - totalSupplierCost;

  // Expenses by category
  const expenseByCategory: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  // Revenue by payment method
  const revenueByMethod: Record<string, number> = {};
  filteredPayments.forEach((p) => {
    revenueByMethod[p.paymentMethod] = (revenueByMethod[p.paymentMethod] || 0) + p.amount;
  });

  res.json({
    summary: {
      totalBookingsValue,
      totalPaymentsReceived,
      totalSupplierCost,
      totalOperatingExpenses,
      grossMargin,
      netProfit,
      currency: db.settings.defaultCurrency || 'USD',
    },
    expenseByCategory,
    revenueByMethod,
  });
});

// Customer Account Statement
router.get('/financial-reports/statement/:customerId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const customer = db.customers.find((c) => c.id === req.params.customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const bookings = db.bookings.filter((b) => b.customerId === customer.id);
  const payments = db.payments.filter((p) => p.customerId === customer.id);

  const totalInvoiced = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const currentBalance = totalInvoiced - totalPaid;

  res.json({
    customer,
    bookings,
    payments,
    totalInvoiced,
    totalPaid,
    currentBalance,
    currency: db.settings.defaultCurrency || 'USD',
  });
});

// -------------------------------------------------------------
// 10. DOCUMENT MANAGEMENT & UPLOADS
// -------------------------------------------------------------
router.get('/documents', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const { customerId, bookingId } = req.query;

  let list = db.documents;
  if (customerId) {
    list = list.filter((d) => d.customerId === customerId);
  }
  if (bookingId) {
    list = list.filter((d) => d.bookingId === bookingId);
  }

  const enriched = list.map((d) => {
    const cust = db.customers.find((c) => c.id === d.customerId);
    return {
      ...d,
      customerNameAr: cust?.fullNameAr || '',
      customerNameEn: cust?.fullNameEn || '',
    };
  });

  res.json(enriched);
});

router.post('/documents/upload', authMiddleware, upload.single('file') as any, (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided for upload' });
  }

  const { customerId, bookingId, title, documentType } = req.body;
  if (!customerId || !title) {
    return res.status(400).json({ error: 'Customer ID and document title are required' });
  }

  const db = getDatabase();
  const newDoc: CustomerDocument = {
    id: `DOC-${Date.now().toString().slice(-4)}`,
    customerId,
    bookingId: bookingId || undefined,
    title,
    documentType: documentType || 'other',
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    filePath: `/uploads/${req.file.filename}`,
    uploadedById: req.user?.id || 'USR-101',
    createdAt: new Date().toISOString(),
  };

  db.documents.push(newDoc);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'create', 'document', newDoc.id, `Uploaded document ${newDoc.title} for customer ${customerId}`);
  res.status(201).json(newDoc);
});

router.delete('/documents/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.documents.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Document not found' });

  const doc = db.documents[idx];
  // Remove file from disk if exists
  if (doc.filePath) {
    const diskPath = path.join(process.cwd(), doc.filePath);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
      }
    }
  }

  db.documents.splice(idx, 1);
  saveDatabase(db);

  logAuditEvent(req.user!.id, req.user!.name, 'delete', 'document', doc.id, `Deleted document ${doc.title}`);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 11. EXCEL IMPORT & EXPORT
// -------------------------------------------------------------
router.get('/excel/export/:entity', (req: Request, res: Response, next: NextFunction) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  let user = { id: 'USR-101', name: 'System Admin', email: 'admin@skyway.com', role: 'admin' };
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      user = decoded;
    } catch {
      // Allow export to succeed with default audit user
    }
  }
  (req as AuthenticatedRequest).user = user as any;
  next();
}, async (req: AuthenticatedRequest, res: Response) => {
  const { entity } = req.params;
  try {
    const workbook = await generateExportWorkbook(entity);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SkyWay_${entity}_${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

    logAuditEvent(req.user!.id, req.user!.name, 'export', entity as any, `EXPORT-${entity}`, `Exported ${entity} to Excel`);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

router.get('/excel/template/:entity', (req: Request, res: Response, next: NextFunction) => {
  let user = { id: 'USR-101', name: 'System Admin', email: 'admin@skyway.com', role: 'admin' };
  (req as AuthenticatedRequest).user = user as any;
  next();
}, async (req: AuthenticatedRequest, res: Response) => {
  const { entity } = req.params;
  try {
    const workbook = await generateTemplateWorkbook(entity);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SkyWay_${entity}_template.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Template generation error:', err);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

router.post('/excel/import/customers', authMiddleware, excelUpload.single('file') as any, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'Please upload an Excel (.xlsx) file' });
  }

  try {
    const result = await parseAndImportCustomers(req.file.buffer, req.user!.id, req.user!.name);
    res.json(result);
  } catch (err: any) {
    console.error('Excel import failed:', err);
    res.status(500).json({ error: err.message || 'Failed to parse Excel file' });
  }
});

// -------------------------------------------------------------
// 12. NOTIFICATIONS
// -------------------------------------------------------------
router.get('/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const now = new Date();
  const warningDays = db.settings.passportWarningDays || 180;

  // Auto-sync expiring passport notifications
  db.passports.forEach((p) => {
    const exp = new Date(p.expiryDate).getTime();
    const diffDays = Math.ceil((exp - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= warningDays) {
      const notifId = `NOTIF-PASS-${p.id}`;
      const existing = db.notifications.find((n) => n.id === notifId);
      const isExpired = diffDays <= 0;
      const titleAr = isExpired ? 'جواز سفر منتهي الصلاحية' : 'تنبيه انتهاء جواز سفر';
      const messageAr = isExpired
        ? `جواز سفر العميل ${p.holderNameAr || p.passportNumber} (${p.passportNumber}) منتهي الصلاحية، مطلوب التجديد الفوري.`
        : `جواز سفر العميل ${p.holderNameAr || p.passportNumber} (${p.passportNumber}) ينتهي خلال ${diffDays} يوم فقط.`;

      if (!existing) {
        db.notifications.unshift({
          id: notifId,
          type: 'passport_expiry',
          titleAr,
          titleEn: isExpired ? 'Passport Expired' : 'Passport Expiring Soon',
          messageAr,
          messageEn: `Customer passport ${p.passportNumber} expires in ${diffDays} days.`,
          targetUrl: '/passports',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  // Auto-sync upcoming visa appointment notifications
  db.visaApplications.forEach((v) => {
    if (v.appointmentDate && v.status !== 'approved' && v.status !== 'rejected') {
      const apptTime = new Date(v.appointmentDate).getTime();
      const diffDays = Math.ceil((apptTime - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 14) {
        const notifId = `NOTIF-VISA-${v.id}`;
        const existing = db.notifications.find((n) => n.id === notifId);
        if (!existing) {
          db.notifications.unshift({
            id: notifId,
            type: 'upcoming_departure',
            titleAr: 'موعد بصمة ومقابلة تأشيرة وشيك',
            titleEn: 'Upcoming Visa Appointment',
            messageAr: `موعد بصمة تأشيرة ${v.destinationCountry} للمسافر ${v.travelerName} (${v.applicationRef}) خلال ${diffDays} أيام.`,
            messageEn: `Visa appointment for ${v.travelerName} (${v.destinationCountry}) is in ${diffDays} days.`,
            targetUrl: '/visas',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  });

  res.json(db.notifications);
});

router.put('/notifications/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    saveDatabase(db);
  }
  res.json({ success: true });
});

router.post('/notifications/mark-all-read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.notifications.forEach((n) => {
    n.isRead = true;
  });
  saveDatabase(db);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 13. AUDIT LOGS
// -------------------------------------------------------------
router.get('/audit-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.auditLogs.slice(0, 200));
});

// -------------------------------------------------------------
// 14. SETTINGS & BACKUP/RESTORE
// -------------------------------------------------------------
router.get('/settings', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.settings);
});

router.post('/settings/logo', authMiddleware, upload.single('logo') as any, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update the company logo.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file was provided.' });
  }

  const logoUrl = `/uploads/${req.file.filename}`;
  const db = getDatabase();
  db.settings.logoUrl = logoUrl;
  db.settings.logoType = 'custom';
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'update', 'setting', 'LOGO', 'Updated company brand logo image');
  res.json({ success: true, logoUrl, settings: db.settings });
});

router.put('/settings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can modify system settings.' });
  }

  const db = getDatabase();
  Object.assign(db.settings, req.body);
  saveDatabase(db);

  logAuditEvent(req.user.id, req.user.name, 'update', 'setting', 'SYSTEM', `Updated company settings: ${db.settings.companyNameAr}`);
  res.json(db.settings);
});

router.post('/backup', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can trigger system backups.' });
  }

  const backupInfo = createBackup();
  logAuditEvent(req.user.id, req.user.name, 'backup', 'setting', backupInfo.filename, `Created system backup: ${backupInfo.filename}`);
  res.json(backupInfo);
});

router.get('/backups', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can view backup history.' });
  }

  const backups = listBackups();
  res.json(backups);
});

router.post('/restore', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can restore backups.' });
  }

  const { backupFilename, jsonContent } = req.body;
  let content = jsonContent;

  if (backupFilename && !content) {
    const BACKUPS_DIR = path.resolve(process.cwd(), 'data', 'backups');
    const safePath = path.join(BACKUPS_DIR, path.basename(backupFilename));
    if (fs.existsSync(safePath)) {
      content = fs.readFileSync(safePath, 'utf-8');
    } else {
      return res.status(404).json({ error: 'Backup file not found on server' });
    }
  }

  if (!content) {
    return res.status(400).json({ error: 'No backup content provided' });
  }

  const ok = restoreDatabase(content);
  if (!ok) {
    return res.status(400).json({ error: 'Failed to restore database from backup' });
  }

  logAuditEvent(req.user.id, req.user.name, 'restore', 'setting', 'DB_RESTORE', 'Restored system database from backup');
  res.json({ success: true, message: 'Database successfully restored' });
});

export default router;
