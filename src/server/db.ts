import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
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
  NotificationItem,
  AuditLog,
  AppSettings,
} from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure necessary directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Calculate age from Date of Birth
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

// Compute passport status
export function getPassportStatus(expiryDate: string, warningDays: number = 180): 'valid' | 'expiring_soon' | 'expired' {
  if (!expiryDate) return 'expired';
  const exp = new Date(expiryDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= warningDays) return 'expiring_soon';
  return 'valid';
}

function getDefaultSettings(): AppSettings {
  return {
    companyNameAr: 'سكاي واي للسفريات - مصر',
    companyNameEn: 'SkyWay Travel Egypt',
    commercialReg: 'س.ت: 10492850 - القاهرة',
    iataCode: 'IATA-96248-EG',
    phone: '+20 2 2450 8899 / +20 100 234 5678',
    email: 'cairo@skyway-travel.com',
    addressAr: '18 شارع الطيران، مدينة نصر، القاهرة، جمهورية مصر العربية',
    addressEn: '18 El-Tayaran St, Nasr City, Cairo, Egypt',
    defaultCurrency: 'EGP',
    currencies: ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'KWD'],
    passportWarningDays: 180,
    bookingRefPrefix: 'SKW',
    invoiceFooterAr: 'شكراً لتعاملكم مع سكاي واي للسفريات بمصر - نتمنى لكم رحلة ممتعة وآمنة يا فندم',
    invoiceFooterEn: 'Thank you for choosing SkyWay Travel Egypt - Wishing you a pleasant journey',
    logoUrl: '',
    logoType: 'default',
    taglineAr: 'نظام إدارة وكالات السفر والسياحة المتكامل',
    taglineEn: 'Enterprise Travel Agency Management Platform',
  };
}

// Initial seed data with authentic enterprise travel records
function createInitialSeed(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('SkyWay@2026', salt); // Default secure demo password

  const users: User[] = [
    {
      id: 'USR-101',
      name: 'Tariq Al-Mansoor',
      email: 'admin@skyway.com',
      passwordHash,
      role: 'admin',
      phone: '+966 50 111 2233',
      status: 'active',
      permissions: {
        canManageCustomers: true,
        canManagePassports: true,
        canManageBookings: true,
        canManageVisas: true,
        canManageFinances: true,
        canDeleteRecords: true,
        canExportExcel: true,
        canManageEmployees: true,
        canManageSettings: true,
        canViewAuditLogs: true,
      },
      createdAt: '2026-01-15T08:00:00Z',
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'USR-102',
      name: 'Sarah Jenkins',
      email: 'sarah.ops@skyway.com',
      passwordHash,
      role: 'manager',
      phone: '+966 50 222 3344',
      status: 'active',
      permissions: {
        canManageCustomers: true,
        canManagePassports: true,
        canManageBookings: true,
        canManageVisas: true,
        canManageFinances: true,
        canDeleteRecords: false,
        canExportExcel: true,
        canManageEmployees: false,
        canManageSettings: false,
        canViewAuditLogs: true,
      },
      createdAt: '2026-01-20T09:30:00Z',
      lastLogin: '2026-10-07T11:20:00Z',
    },
    {
      id: 'USR-103',
      name: 'Omar Farooq',
      email: 'omar.accounts@skyway.com',
      passwordHash,
      role: 'accountant',
      phone: '+966 50 333 4455',
      status: 'active',
      permissions: {
        canManageCustomers: true,
        canManagePassports: false,
        canManageBookings: true,
        canManageVisas: false,
        canManageFinances: true,
        canDeleteRecords: false,
        canExportExcel: true,
        canManageEmployees: false,
        canManageSettings: false,
        canViewAuditLogs: false,
      },
      createdAt: '2026-02-01T10:00:00Z',
      lastLogin: '2026-10-08T09:15:00Z',
    },
    {
      id: 'USR-104',
      name: 'Layla Al-Harbi',
      email: 'layla.agent@skyway.com',
      passwordHash,
      role: 'employee',
      phone: '+966 50 444 5566',
      status: 'active',
      permissions: {
        canManageCustomers: true,
        canManagePassports: true,
        canManageBookings: true,
        canManageVisas: true,
        canManageFinances: false,
        canDeleteRecords: false,
        canExportExcel: true,
        canManageEmployees: false,
        canManageSettings: false,
        canViewAuditLogs: false,
      },
      createdAt: '2026-02-15T10:00:00Z',
      lastLogin: '2026-10-08T14:40:00Z',
    },
  ];

  const customers: Customer[] = [
    {
      id: 'CUST-1001',
      fullNameAr: 'عبدالرحمن محمد السالم',
      fullNameEn: 'Abdulrahman Mohammed Al-Salem',
      nationalId: '1098472910',
      dob: '1984-06-15',
      age: calculateAge('1984-06-15'),
      nationality: 'Saudi Arabia',
      gender: 'male',
      phone: '+966 55 987 1234',
      whatsapp: '+966 55 987 1234',
      email: 'a.alsalem@enterprise.sa',
      address: 'حي النخيل، الرياض',
      emergencyContactName: 'Fahad Al-Salem',
      emergencyContactPhone: '+966 55 111 9988',
      notes: 'عميل مميز (VIP) - يفضل دائماً مقاعد درجة رجال الأعمال',
      status: 'vip',
      assignedEmployeeId: 'USR-102',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-09-12T14:00:00Z',
    },
    {
      id: 'CUST-1002',
      fullNameAr: 'فاطمة سلطان القحطاني',
      fullNameEn: 'Fatima Sultan Al-Qahtani',
      nationalId: '1087364521',
      dob: '1991-11-20',
      age: calculateAge('1991-11-20'),
      nationality: 'Saudi Arabia',
      gender: 'female',
      phone: '+966 54 876 5432',
      whatsapp: '+966 54 876 5432',
      email: 'fatima.qahtani@gmail.com',
      address: 'حي الحمراء، جدة',
      emergencyContactName: 'Noura Al-Qahtani',
      emergencyContactPhone: '+966 54 333 2211',
      notes: 'رحلات عائلية موسمية وحجوزات فنادق خمس نجوم',
      status: 'active',
      assignedEmployeeId: 'USR-104',
      createdAt: '2026-03-10T12:00:00Z',
      updatedAt: '2026-08-15T09:00:00Z',
    },
    {
      id: 'CUST-1003',
      fullNameAr: 'خالد عبدالله الشمري',
      fullNameEn: 'Khalid Abdullah Al-Shammari',
      nationalId: '1076253412',
      dob: '1978-03-08',
      age: calculateAge('1978-03-08'),
      nationality: 'Kuwait',
      gender: 'male',
      phone: '+965 99 887 766',
      whatsapp: '+965 99 887 766',
      email: 'khalid.shammari@biz.kw',
      address: 'الشويخ، الكويت',
      emergencyContactName: 'Bader Al-Shammari',
      emergencyContactPhone: '+965 97 123 456',
      notes: 'سفر أعمال منتظم بين الخليج ولندن وباريس',
      status: 'active',
      assignedEmployeeId: 'USR-104',
      createdAt: '2026-04-05T08:30:00Z',
      updatedAt: '2026-07-20T11:00:00Z',
    },
    {
      id: 'CUST-1004',
      fullNameAr: 'منى إبراهيم الدوسري',
      fullNameEn: 'Mona Ibrahim Al-Dossary',
      nationalId: '1065142398',
      dob: '1995-09-02',
      age: calculateAge('1995-09-02'),
      nationality: 'Saudi Arabia',
      gender: 'female',
      phone: '+966 56 123 9876',
      whatsapp: '+966 56 123 9876',
      email: 'mona.dossary@horizon.com',
      address: 'حي الشاطئ، الدمام',
      emergencyContactName: 'Sara Al-Dossary',
      emergencyContactPhone: '+966 56 888 7766',
      notes: 'تقديم تأشيرات شنغن وتأشيرات سياحية للمملكة المتحدة',
      status: 'active',
      assignedEmployeeId: 'USR-102',
      createdAt: '2026-05-12T14:15:00Z',
      updatedAt: '2026-09-28T16:00:00Z',
    },
    {
      id: 'CUST-1005',
      fullNameAr: 'د. زياد طارق النجار',
      fullNameEn: 'Dr. Ziyad Tariq Al-Najjar',
      nationalId: '1054031287',
      dob: '1972-12-19',
      age: calculateAge('1972-12-19'),
      nationality: 'United Arab Emirates',
      gender: 'male',
      phone: '+971 50 765 4321',
      whatsapp: '+971 50 765 4321',
      email: 'dr.ziyad@medcare.ae',
      address: 'جميرا 1، دبي',
      emergencyContactName: 'Reem Al-Najjar',
      emergencyContactPhone: '+971 50 999 1122',
      notes: 'سفر سنوي مؤتمرات طبية وعطلات استجمام',
      status: 'vip',
      assignedEmployeeId: 'USR-101',
      createdAt: '2026-06-01T09:00:00Z',
      updatedAt: '2026-10-01T10:30:00Z',
    },
  ];

  const nationalIdRecords: NationalIdRecord[] = [
    {
      id: 'NID-1001',
      customerId: 'CUST-1001',
      idNumber: '1098472910',
      issueDate: '2020-04-10',
      expiryDate: '2030-04-09',
      verificationStatus: 'verified',
      notes: 'تمت المطابقة والتحقق من الهوية الوطنية السعودية',
      createdAt: '2026-03-01T10:15:00Z',
    },
    {
      id: 'NID-1002',
      customerId: 'CUST-1002',
      idNumber: '1087364521',
      issueDate: '2021-08-15',
      expiryDate: '2031-08-14',
      verificationStatus: 'verified',
      notes: 'هوية وطنية مطابقة لسجل الأحوال المدنية',
      createdAt: '2026-03-10T12:10:00Z',
    },
    {
      id: 'NID-1003',
      customerId: 'CUST-1003',
      idNumber: '278030801234',
      issueDate: '2019-01-20',
      expiryDate: '2029-01-19',
      verificationStatus: 'verified',
      notes: 'البطاقة المدنية الكويتية',
      createdAt: '2026-04-05T08:45:00Z',
    },
    {
      id: 'NID-1004',
      customerId: 'CUST-1004',
      idNumber: '1065142398',
      issueDate: '2022-03-05',
      expiryDate: '2032-03-04',
      verificationStatus: 'verified',
      notes: 'هوية وطنية سارية المفعول',
      createdAt: '2026-05-12T14:30:00Z',
    },
    {
      id: 'NID-1005',
      customerId: 'CUST-1005',
      idNumber: '784197212345678',
      issueDate: '2021-05-10',
      expiryDate: '2031-05-09',
      verificationStatus: 'verified',
      notes: 'الهوية الوطنية الإماراتية الرسمية',
      createdAt: '2026-06-01T09:15:00Z',
    },
  ];

  const passports: Passport[] = [
    {
      id: 'PASS-1001',
      customerId: 'CUST-1001',
      passportNumber: 'K4891024',
      holderNameAr: 'عبدالرحمن محمد السالم',
      holderNameEn: 'Abdulrahman Mohammed Al-Salem',
      nationality: 'Saudi Arabia',
      dob: '1984-06-15',
      gender: 'male',
      issueDate: '2021-05-10',
      expiryDate: '2031-05-09',
      issuingAuthority: 'جوازات الرياض',
      passportType: 'regular',
      notes: 'جواز ساري صالح لجميع الوجهات الدولية',
      status: 'valid',
      createdAt: '2026-03-01T10:20:00Z',
    },
    {
      id: 'PASS-1002',
      customerId: 'CUST-1002',
      passportNumber: 'G9812401',
      holderNameAr: 'فاطمة سلطان القحطاني',
      holderNameEn: 'Fatima Sultan Al-Qahtani',
      nationality: 'Saudi Arabia',
      dob: '1991-11-20',
      gender: 'female',
      issueDate: '2021-12-01',
      expiryDate: '2026-12-15', // Expiring soon (< 90 days from Oct 2026!)
      issuingAuthority: 'جوازات جدة',
      passportType: 'regular',
      notes: 'تنبيه: الجواز ينتهي قريباً (أقل من شهرين)',
      status: 'expiring_soon',
      createdAt: '2026-03-10T12:30:00Z',
    },
    {
      id: 'PASS-1003',
      customerId: 'CUST-1003',
      passportNumber: 'P7620194',
      holderNameAr: 'خالد عبدالله الشمري',
      holderNameEn: 'Khalid Abdullah Al-Shammari',
      nationality: 'Kuwait',
      dob: '1978-03-08',
      gender: 'male',
      issueDate: '2022-02-14',
      expiryDate: '2032-02-13',
      issuingAuthority: 'الكويت - إدارة الجوازات',
      passportType: 'regular',
      notes: 'جواز إلكتروني كويتي ساري',
      status: 'valid',
      createdAt: '2026-04-05T09:00:00Z',
    },
    {
      id: 'PASS-1004',
      customerId: 'CUST-1004',
      passportNumber: 'K3109845',
      holderNameAr: 'منى إبراهيم الدوسري',
      holderNameEn: 'Mona Ibrahim Al-Dossary',
      nationality: 'Saudi Arabia',
      dob: '1995-09-02',
      gender: 'female',
      issueDate: '2023-01-20',
      expiryDate: '2033-01-19',
      issuingAuthority: 'جوازات الدمام',
      passportType: 'regular',
      notes: 'جواز ساري، تم تقديم فيزا شنغن عليه',
      status: 'valid',
      createdAt: '2026-05-12T14:40:00Z',
    },
    {
      id: 'PASS-1005',
      customerId: 'CUST-1005',
      passportNumber: 'E9018234',
      holderNameAr: 'د. زياد طارق النجار',
      holderNameEn: 'Dr. Ziyad Tariq Al-Najjar',
      nationality: 'United Arab Emirates',
      dob: '1972-12-19',
      gender: 'male',
      issueDate: '2016-04-12',
      expiryDate: '2026-04-11', // Already expired!
      issuingAuthority: 'إقامة وشؤون الأجانب دبي',
      passportType: 'regular',
      notes: 'جواز منتهي الصلاحية - مطلوب تجديد لتنفيذ الحجوزات القادمة',
      status: 'expired',
      createdAt: '2026-06-01T09:30:00Z',
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'SUPP-101',
      name: 'Saudi Arabian Airlines (SAUDIA)',
      serviceType: 'airline',
      contactPerson: 'Corporate Desk',
      phone: '+966 9200 22222',
      email: 'b2b@saudia.com',
      balanceOwed: 4200,
      currency: 'USD',
      notes: 'شريك الطيران الوطني - تسويات نصف شهرية بحساب الوكالة',
      status: 'active',
    },
    {
      id: 'SUPP-102',
      name: 'Emirates Airline',
      serviceType: 'airline',
      contactPerson: 'Ahmed Al-Suwaidi',
      phone: '+971 600 555555',
      email: 'agency.support@emirates.com',
      balanceOwed: 2850,
      currency: 'USD',
      notes: 'حجوزات رحلات أوروبا والولايات المتحدة',
      status: 'active',
    },
    {
      id: 'SUPP-103',
      name: 'Four Seasons Global Hospitality',
      serviceType: 'hotel',
      contactPerson: 'Elena Rossi',
      phone: '+33 1 49 52 70 00',
      email: 'traveltrade@fourseasons.com',
      balanceOwed: 3600,
      currency: 'USD',
      notes: 'فنادق ومنتجعات فاخرة لعملاء VIP',
      status: 'active',
    },
    {
      id: 'SUPP-104',
      name: 'VFS Global Services',
      serviceType: 'visa_agent',
      contactPerson: 'Visa Processing Unit',
      phone: '+966 11 520 4880',
      email: 'info.sa@vfsglobal.com',
      balanceOwed: 650,
      currency: 'USD',
      notes: 'معالجة تأشيرات شنغن والمملكة المتحدة وكندا',
      status: 'active',
    },
    {
      id: 'SUPP-105',
      name: 'Al-Safwa Luxury Transport',
      serviceType: 'transport',
      contactPerson: 'Mansoor Al-Harthi',
      phone: '+966 50 888 1234',
      email: 'limo@alsafwa.sa',
      balanceOwed: 400,
      currency: 'USD',
      notes: 'خدمات نقل المطار وسيارات ليموزين VIP في الرياض وجدة',
      status: 'active',
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'BK-2026-001',
      bookingRef: 'SKW-2026-1088',
      customerId: 'CUST-1001',
      serviceCategory: 'flight',
      destination: 'London Heathrow (LHR)',
      origin: 'Riyadh King Khalid (RUH)',
      departureDate: '2026-10-18',
      returnDate: '2026-10-26',
      airline: 'Saudia Airlines',
      flightNumber: 'SV 115 / SV 116',
      ticketNumber: '065-2489102401',
      hotelDetails: 'The Langham, London (Deluxe King Room)',
      supplierId: 'SUPP-101',
      assignedEmployeeId: 'USR-102',
      status: 'confirmed',
      totalPrice: 4850,
      supplierCost: 3900,
      currency: 'USD',
      travelers: [
        {
          nameAr: 'عبدالرحمن محمد السالم',
          nameEn: 'Abdulrahman Mohammed Al-Salem',
          passportNumber: 'K4891024',
          dob: '1984-06-15',
          type: 'adult',
        },
      ],
      internalNotes: 'رحلة أعمال مهمة - تم تأكيد مقعد رجال الأعمال 02K وتجهيز سيارة الاستقبال في هيثرو',
      createdAt: '2026-09-20T11:00:00Z',
      updatedAt: '2026-10-02T15:30:00Z',
    },
    {
      id: 'BK-2026-002',
      bookingRef: 'SKW-2026-1092',
      customerId: 'CUST-1002',
      serviceCategory: 'package',
      destination: 'Switzerland (Zurich & Interlaken)',
      origin: 'Jeddah King Abdulaziz (JED)',
      departureDate: '2026-11-05',
      returnDate: '2026-11-14',
      airline: 'Emirates Airline',
      flightNumber: 'EK 804 / EK 087',
      hotelDetails: 'Victoria-Jungfrau Grand Hotel & Spa Interlaken',
      supplierId: 'SUPP-102',
      assignedEmployeeId: 'USR-104',
      status: 'confirmed',
      totalPrice: 8400,
      supplierCost: 6700,
      currency: 'USD',
      travelers: [
        {
          nameAr: 'فاطمة سلطان القحطاني',
          nameEn: 'Fatima Sultan Al-Qahtani',
          passportNumber: 'G9812401',
          dob: '1991-11-20',
          type: 'adult',
        },
      ],
      internalNotes: 'بكج سياحي عائلي شامل تذاكر القطارات الجبلية Swiss Travel Pass',
      createdAt: '2026-09-25T14:20:00Z',
      updatedAt: '2026-10-05T09:15:00Z',
    },
    {
      id: 'BK-2026-003',
      bookingRef: 'SKW-2026-1095',
      customerId: 'CUST-1003',
      serviceCategory: 'flight',
      destination: 'Paris Charles de Gaulle (CDG)',
      origin: 'Kuwait International (KWI)',
      departureDate: '2026-10-22',
      returnDate: '2026-10-29',
      airline: 'Emirates Airline',
      flightNumber: 'EK 856 / EK 073',
      ticketNumber: '176-8891024312',
      hotelDetails: 'Four Seasons Hotel George V Paris',
      supplierId: 'SUPP-102',
      assignedEmployeeId: 'USR-104',
      status: 'confirmed',
      totalPrice: 6200,
      supplierCost: 5100,
      currency: 'USD',
      travelers: [
        {
          nameAr: 'خالد عبدالله الشمري',
          nameEn: 'Khalid Abdullah Al-Shammari',
          passportNumber: 'P7620194',
          dob: '1978-03-08',
          type: 'adult',
        },
      ],
      internalNotes: 'حجز فندقي وتذاكر طيران لأسابيع الموضة والاستثمار في باريس',
      createdAt: '2026-09-30T16:00:00Z',
      updatedAt: '2026-10-06T10:00:00Z',
    },
    {
      id: 'BK-2026-004',
      bookingRef: 'SKW-2026-1100',
      customerId: 'CUST-1004',
      serviceCategory: 'visa',
      destination: 'France / Schengen Area',
      departureDate: '2026-12-01',
      supplierId: 'SUPP-104',
      assignedEmployeeId: 'USR-102',
      status: 'pending',
      totalPrice: 750,
      supplierCost: 450,
      currency: 'USD',
      travelers: [
        {
          nameAr: 'منى إبراهيم الدوسري',
          nameEn: 'Mona Ibrahim Al-Dossary',
          passportNumber: 'K3109845',
          dob: '1995-09-02',
          type: 'adult',
        },
      ],
      internalNotes: 'معاملة تأشيرة شنغن فرنسية شاملة التأمين الطبي وحجز الموعد وتجهيز الملف',
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-07T12:00:00Z',
    },
    {
      id: 'BK-2026-005',
      bookingRef: 'SKW-2026-1104',
      customerId: 'CUST-1005',
      serviceCategory: 'hotel',
      destination: 'Tokyo, Japan',
      origin: 'Dubai International (DXB)',
      departureDate: '2026-11-12',
      returnDate: '2026-11-20',
      hotelDetails: 'Aman Tokyo (Premier Room)',
      supplierId: 'SUPP-103',
      assignedEmployeeId: 'USR-101',
      status: 'confirmed',
      totalPrice: 11500,
      supplierCost: 9600,
      currency: 'USD',
      travelers: [
        {
          nameAr: 'د. زياد طارق النجار',
          nameEn: 'Dr. Ziyad Tariq Al-Najjar',
          passportNumber: 'E9018234',
          dob: '1972-12-19',
          type: 'adult',
        },
      ],
      internalNotes: 'إقامة فندقية فاخرة 8 ليالٍ مع إفطار وترقية غرفة مجانية',
      createdAt: '2026-10-02T13:00:00Z',
      updatedAt: '2026-10-07T14:00:00Z',
    },
  ];

  const visaApplications: VisaApplication[] = [
    {
      id: 'VISA-2026-001',
      applicationRef: 'VSA-FR-9821',
      customerId: 'CUST-1004',
      travelerName: 'Mona Ibrahim Al-Dossary',
      passportNumber: 'K3109845',
      destinationCountry: 'France',
      visaCategory: 'tourist',
      submissionDate: '2026-10-03',
      appointmentDate: '2026-10-15',
      expectedDecisionDate: '2026-10-28',
      status: 'appointment_scheduled',
      checklist: [
        { id: '1', nameAr: 'جواز السفر الأصلي ساري المفعول', nameEn: 'Valid Original Passport', isCompleted: true },
        { id: '2', nameAr: 'صورتان شخصيتان حديثتان خلفية بيضاء', nameEn: 'Two Recent Passport Photos', isCompleted: true },
        { id: '3', nameAr: 'تعريف بالراتب ومصدق من الغرفة التجارية', nameEn: 'Employment Certificate', isCompleted: true },
        { id: '4', nameAr: 'كشف حساب بنكي لآخر 3 أشهر باللغة الإنجليزية', nameEn: '3-Month Bank Statement', isCompleted: true },
        { id: '5', nameAr: 'تأمين سفر طبي يغطي 30 ألف يورو', nameEn: 'Travel Medical Insurance (€30K)', isCompleted: true },
        { id: '6', nameAr: 'حجز طيران وفندق مبدئي مؤكد', nameEn: 'Flight & Hotel Vouchers', isCompleted: true },
        { id: '7', nameAr: 'تعبئة استمارة الشنغن الرسمية وتوقيعها', nameEn: 'Schengen Application Form Signed', isCompleted: true },
      ],
      fees: 750,
      currency: 'USD',
      assignedEmployeeId: 'USR-102',
      notes: 'الموعد مؤكد في مركز VFS Global الخبر - تم تسليم العميل كافة المستندات المترجمة',
      createdAt: '2026-10-01T10:30:00Z',
      updatedAt: '2026-10-04T11:00:00Z',
    },
    {
      id: 'VISA-2026-002',
      applicationRef: 'VSA-UK-1044',
      customerId: 'CUST-1001',
      travelerName: 'Abdulrahman Mohammed Al-Salem',
      passportNumber: 'K4891024',
      destinationCountry: 'United Kingdom',
      visaCategory: 'business',
      submissionDate: '2026-08-10',
      appointmentDate: '2026-08-18',
      expectedDecisionDate: '2026-09-02',
      status: 'approved',
      checklist: [
        { id: '1', nameAr: 'جواز السفر الأصلي', nameEn: 'Original Passport', isCompleted: true },
        { id: '2', nameAr: 'خطاب دعوة تجاري من بريطانيا', nameEn: 'UK Business Invitation Letter', isCompleted: true },
        { id: '3', nameAr: 'كشف حساب بنك الاستثمار للشركة', nameEn: 'Company Bank Statement', isCompleted: true },
        { id: '4', nameAr: 'سجل تجاري مترجم', nameEn: 'Translated Commercial Registration', isCompleted: true },
      ],
      fees: 850,
      currency: 'USD',
      assignedEmployeeId: 'USR-102',
      notes: 'تم استلام الجواز بتأشيرة أعمال صالحة لمدة سنتين',
      createdAt: '2026-08-05T09:00:00Z',
      updatedAt: '2026-09-03T14:00:00Z',
    },
    {
      id: 'VISA-2026-003',
      applicationRef: 'VSA-US-3320',
      customerId: 'CUST-1003',
      travelerName: 'Khalid Abdullah Al-Shammari',
      passportNumber: 'P7620194',
      destinationCountry: 'United States',
      visaCategory: 'tourist',
      submissionDate: '2026-09-15',
      appointmentDate: '2026-11-20',
      status: 'under_review',
      checklist: [
        { id: '1', nameAr: 'نموذج DS-160 معتمد', nameEn: 'Approved DS-160 Confirmation', isCompleted: true },
        { id: '2', nameAr: 'إيصال دفع رسوم السفارة الأمريكية', nameEn: 'MRV Fee Payment Receipt', isCompleted: true },
        { id: '3', nameAr: 'حجز المقابلة الشخصية في القنصلية', nameEn: 'Consular Interview Appointment', isCompleted: true },
      ],
      fees: 600,
      currency: 'USD',
      assignedEmployeeId: 'USR-104',
      notes: 'تم دفع الرسوم وتأكيد موعد المقابلة في السفارة الأمريكية',
      createdAt: '2026-09-12T11:00:00Z',
      updatedAt: '2026-09-22T16:00:00Z',
    },
  ];

  const payments: Payment[] = [
    {
      id: 'PAY-1001',
      paymentRef: 'REC-2026-501',
      customerId: 'CUST-1001',
      bookingId: 'BK-2026-001',
      date: '2026-09-22',
      amount: 4850,
      currency: 'USD',
      paymentMethod: 'credit_card',
      transactionRef: 'AUTH-992810',
      recordedById: 'USR-103',
      notes: 'سداد كامل قيمة حجز رحلة لندن (مدفوع بالكامل)',
      createdAt: '2026-09-22T12:00:00Z',
    },
    {
      id: 'PAY-1002',
      paymentRef: 'REC-2026-502',
      customerId: 'CUST-1002',
      bookingId: 'BK-2026-002',
      date: '2026-09-28',
      amount: 5000,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      transactionRef: 'TRF-SNB-882104',
      recordedById: 'USR-103',
      notes: 'دفعة أولى 5000 دولار من إجمالي 8400 دولار لبكج سويسرا (متبقي 3400 دولار)',
      createdAt: '2026-09-28T10:30:00Z',
    },
    {
      id: 'PAY-1003',
      paymentRef: 'REC-2026-503',
      customerId: 'CUST-1003',
      bookingId: 'BK-2026-003',
      date: '2026-10-02',
      amount: 6200,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      transactionRef: 'TRF-NBK-449120',
      recordedById: 'USR-103',
      notes: 'سداد كامل حجز باريس عبر تحويل بنك الكويت الوطني',
      createdAt: '2026-10-02T11:45:00Z',
    },
    {
      id: 'PAY-1004',
      paymentRef: 'REC-2026-504',
      customerId: 'CUST-1004',
      bookingId: 'BK-2026-004',
      date: '2026-10-01',
      amount: 750,
      currency: 'USD',
      paymentMethod: 'pos',
      transactionRef: 'POS-MADA-33291',
      recordedById: 'USR-102',
      notes: 'سداد رسوم تأشيرة فرنسا كاملة عبر بطاقة مدى بالفرع',
      createdAt: '2026-10-01T10:15:00Z',
    },
    {
      id: 'PAY-1005',
      paymentRef: 'REC-2026-505',
      customerId: 'CUST-1005',
      bookingId: 'BK-2026-005',
      date: '2026-10-03',
      amount: 6000,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      transactionRef: 'ENBD-991204',
      recordedById: 'USR-103',
      notes: 'دفعة مقدمة 6000 دولار لإقامة طوكيو (متبقي 5500 دولار)',
      createdAt: '2026-10-03T14:00:00Z',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'EXP-1001',
      expenseRef: 'EXP-2026-301',
      category: 'supplier_cost',
      date: '2026-09-21',
      amount: 3900,
      currency: 'USD',
      supplierId: 'SUPP-101',
      bookingId: 'BK-2026-001',
      description: 'إصدار تذاكر الخطوط السعودية درجة أولى ورجال أعمال لحجز لندن',
      recordedById: 'USR-103',
      createdAt: '2026-09-21T14:00:00Z',
    },
    {
      id: 'EXP-1002',
      expenseRef: 'EXP-2026-302',
      category: 'supplier_cost',
      date: '2026-09-26',
      amount: 4200,
      currency: 'USD',
      supplierId: 'SUPP-102',
      bookingId: 'BK-2026-002',
      description: 'دفعة حجز طيران الإمارات رحلات سويسرا',
      recordedById: 'USR-103',
      createdAt: '2026-09-26T15:30:00Z',
    },
    {
      id: 'EXP-1003',
      expenseRef: 'EXP-2026-303',
      category: 'supplier_cost',
      date: '2026-10-01',
      amount: 450,
      currency: 'USD',
      supplierId: 'SUPP-104',
      bookingId: 'BK-2026-004',
      description: 'رسوم VFS والتأمين الصحي لتأشيرة فرنسا',
      recordedById: 'USR-103',
      createdAt: '2026-10-01T11:00:00Z',
    },
    {
      id: 'EXP-1004',
      expenseRef: 'EXP-2026-304',
      category: 'office_rent',
      date: '2026-10-01',
      amount: 2500,
      currency: 'USD',
      description: 'إيجار المقر الإداري للوكالة - برج الأعمال الملكي',
      recordedById: 'USR-103',
      createdAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 'EXP-1005',
      expenseRef: 'EXP-2026-305',
      category: 'software',
      date: '2026-10-02',
      amount: 420,
      currency: 'USD',
      description: 'اشتراكات أنظمة التوزيع العالمية أماديوس وGDS وخدمات سحابية',
      recordedById: 'USR-103',
      createdAt: '2026-10-02T10:00:00Z',
    },
  ];

  const documents: CustomerDocument[] = [
    {
      id: 'DOC-1001',
      customerId: 'CUST-1001',
      bookingId: 'BK-2026-001',
      title: 'تذكرة سفر إلكترونية - لندن (E-Ticket London LHR)',
      documentType: 'ticket',
      fileName: 'eticket_sv_115_london.pdf',
      fileSize: 428000,
      mimeType: 'application/pdf',
      filePath: '/uploads/sample_eticket_london.pdf',
      uploadedById: 'USR-102',
      createdAt: '2026-09-22T13:00:00Z',
    },
    {
      id: 'DOC-1002',
      customerId: 'CUST-1001',
      title: 'صورة جواز السفر المعتمدة',
      documentType: 'passport_scan',
      fileName: 'passport_scan_alsalem.jpg',
      fileSize: 852000,
      mimeType: 'image/jpeg',
      filePath: '/uploads/sample_passport_scan.jpg',
      uploadedById: 'USR-102',
      createdAt: '2026-03-01T10:30:00Z',
    },
    {
      id: 'DOC-1003',
      customerId: 'CUST-1002',
      bookingId: 'BK-2026-002',
      title: 'قسيمة الفندق - سويسرا (Hotel Voucher Victoria-Jungfrau)',
      documentType: 'voucher',
      fileName: 'hotel_voucher_switzerland.pdf',
      fileSize: 312000,
      mimeType: 'application/pdf',
      filePath: '/uploads/sample_voucher_swiss.pdf',
      uploadedById: 'USR-104',
      createdAt: '2026-09-28T12:00:00Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'NOTIF-101',
      type: 'passport_expiry',
      titleAr: 'جواز سفر يقترب من الانتهاء',
      titleEn: 'Passport Expiring Soon',
      messageAr: 'جواز سفر العميل فاطمة سلطان القحطاني (G9812401) ينتهي خلال 60 يوماً.',
      messageEn: 'Customer Fatima Al-Qahtani passport (G9812401) expires within 60 days.',
      targetUrl: '/passports',
      isRead: false,
      createdAt: '2026-10-07T08:00:00Z',
    },
    {
      id: 'NOTIF-102',
      type: 'upcoming_departure',
      titleAr: 'موعد إقلاع رحلة قادم',
      titleEn: 'Upcoming Flight Departure',
      messageAr: 'رحلة العميل عبدالرحمن السالم إلى لندن (SKW-2026-1088) تنطلق خلال 10 أيام.',
      messageEn: 'Customer Abdulrahman Al-Salem flight to London departs in 10 days.',
      targetUrl: '/bookings/BK-2026-001',
      isRead: false,
      createdAt: '2026-10-08T09:00:00Z',
    },
    {
      id: 'NOTIF-103',
      type: 'unpaid_balance',
      titleAr: 'مستحقات دفع متبقية',
      titleEn: 'Outstanding Balance Due',
      messageAr: 'يوجد رصيد متبقي بقيمة 3,400 USD على حجز سويسرا (SKW-2026-1092).',
      messageEn: 'Outstanding balance of 3,400 USD on Switzerland booking (SKW-2026-1092).',
      targetUrl: '/payments',
      isRead: false,
      createdAt: '2026-10-08T11:00:00Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'LOG-1001',
      userId: 'USR-101',
      userName: 'Tariq Al-Mansoor',
      action: 'login',
      entity: 'user',
      entityId: 'USR-101',
      details: 'تسجيل دخول ناجح إلى لوحة الإدارة الرئيسية',
      ip: '192.168.1.10',
      createdAt: '2026-10-08T18:00:00Z',
    },
    {
      id: 'LOG-1002',
      userId: 'USR-102',
      userName: 'Sarah Jenkins',
      action: 'update',
      entity: 'visa',
      entityId: 'VISA-2026-001',
      details: 'تحديث حالة تأشيرة فرنسا إلى: موعد مجدول في VFS',
      ip: '192.168.1.25',
      createdAt: '2026-10-04T11:00:00Z',
    },
    {
      id: 'LOG-1003',
      userId: 'USR-103',
      userName: 'Omar Farooq',
      action: 'create',
      entity: 'payment',
      entityId: 'PAY-1005',
      details: 'تسجيل سند قبض رقم REC-2026-505 بقيمة 6,000 USD',
      ip: '192.168.1.30',
      createdAt: '2026-10-03T14:00:00Z',
    },
  ];

  return {
    users,
    customers,
    nationalIdRecords,
    passports,
    bookings,
    visaApplications,
    suppliers,
    payments,
    expenses,
    documents,
    notifications,
    auditLogs,
    settings: getDefaultSettings(),
  };
}

// In-memory cache for ultra-fast query serving with atomic disk write syncing
let dbCache: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (dbCache) {
    return dbCache;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      return dbCache!;
    } catch (err) {
      console.error('Error reading database file, resetting to initial seed:', err);
    }
  }

  // Create initial seed and save to disk
  dbCache = createInitialSeed();
  saveDatabase(dbCache);
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema): void {
  dbCache = data;
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (error) {
    console.error('Failed to atomically write database file:', error);
    // Fallback direct write
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}

// Helper to log audit events
export function logAuditEvent(
  userId: string,
  userName: string,
  action: AuditLog['action'],
  entity: AuditLog['entity'],
  entityId: string,
  details: string,
  ip?: string
) {
  const db = getDatabase();
  const log: AuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    action,
    entity,
    entityId,
    details,
    ip,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  // Keep last 1000 audit logs to prevent infinite file expansion
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  saveDatabase(db);
}

// Create backup file
export function createBackup(): { filename: string; timestamp: string; size: number } {
  const db = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `skyway_backup_${timestamp}.json`;
  const backupPath = path.join(BACKUPS_DIR, filename);

  const dataStr = JSON.stringify(db, null, 2);
  fs.writeFileSync(backupPath, dataStr, 'utf-8');
  const stats = fs.statSync(backupPath);

  return {
    filename,
    timestamp: new Date().toISOString(),
    size: stats.size,
  };
}

// Restore database from backup content or filename
export function restoreDatabase(jsonContent: string): boolean {
  try {
    const parsed: DatabaseSchema = JSON.parse(jsonContent);
    if (!parsed.customers || !parsed.bookings || !parsed.users) {
      throw new Error('Invalid backup schema format');
    }
    saveDatabase(parsed);
    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    return false;
  }
}

// List all backups
export function listBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  const files = fs.readdirSync(BACKUPS_DIR);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const filePath = path.join(BACKUPS_DIR, f);
      const stat = fs.statSync(filePath);
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
