import ExcelJS from 'exceljs';
import { getDatabase, calculateAge, getPassportStatus, logAuditEvent } from './db.ts';
import { Customer, Passport, Booking, Payment, Expense, VisaApplication } from './types.ts';

// Style constants for professional enterprise spreadsheets
const BRAND_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0B1730' }, // SkyWay Midnight Navy
};

const BRAND_HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Arial',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

// Protect against Excel formula injection (=, +, -, @)
export function sanitizeCellValue(val: any): any {
  if (typeof val === 'string') {
    if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
      return `'${val}`;
    }
  }
  return val;
}

// Generate Excel Workbook for export
export async function generateExportWorkbook(entity: string): Promise<ExcelJS.Workbook> {
  const db = getDatabase();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SkyWay Travel | سكاي واي للسفريات';
  workbook.created = new Date();

  if (entity === 'customers') {
    const sheet = workbook.addWorksheet('Customers - العملاء', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Customer ID / معرف العميل', key: 'id', width: 16 },
      { header: 'Full Name (Arabic) / الاسم بالعربية', key: 'fullNameAr', width: 28 },
      { header: 'Full Name (English) / الاسم بالإنجليزية', key: 'fullNameEn', width: 28 },
      { header: 'National ID / رقم الهوية', key: 'nationalId', width: 18 },
      { header: 'Date of Birth / تاريخ الميلاد', key: 'dob', width: 16 },
      { header: 'Age / العمر', key: 'age', width: 10 },
      { header: 'Nationality / الجنسية', key: 'nationality', width: 18 },
      { header: 'Gender / الجنس', key: 'gender', width: 12 },
      { header: 'Phone / الهاتف', key: 'phone', width: 18 },
      { header: 'Email / البريد الإلكتروني', key: 'email', width: 26 },
      { header: 'Status / الحالة', key: 'status', width: 14 },
      { header: 'Created Date / تاريخ التسجيل', key: 'createdAt', width: 20 },
    ];

    db.customers.forEach((c) => {
      sheet.addRow({
        id: sanitizeCellValue(c.id),
        fullNameAr: sanitizeCellValue(c.fullNameAr),
        fullNameEn: sanitizeCellValue(c.fullNameEn),
        nationalId: sanitizeCellValue(c.nationalId || '-'),
        dob: sanitizeCellValue(c.dob),
        age: c.age,
        nationality: sanitizeCellValue(c.nationality),
        gender: sanitizeCellValue(c.gender),
        phone: sanitizeCellValue(c.phone),
        email: sanitizeCellValue(c.email),
        status: sanitizeCellValue(c.status),
        createdAt: c.createdAt.split('T')[0],
      });
    });

    formatHeaderRow(sheet);
  } else if (entity === 'passports') {
    const sheet = workbook.addWorksheet('Passports - جوازات السفر', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Record ID', key: 'id', width: 14 },
      { header: 'Passport Number / رقم الجواز', key: 'passportNumber', width: 18 },
      { header: 'Customer ID / معرف العميل', key: 'customerId', width: 16 },
      { header: 'Holder Name (Arabic)', key: 'holderNameAr', width: 26 },
      { header: 'Holder Name (English)', key: 'holderNameEn', width: 26 },
      { header: 'Nationality / الجنسية', key: 'nationality', width: 18 },
      { header: 'Issue Date / تاريخ الإصدار', key: 'issueDate', width: 16 },
      { header: 'Expiry Date / تاريخ الانتهاء', key: 'expiryDate', width: 16 },
      { header: 'Issuing Authority / جهة الإصدار', key: 'issuingAuthority', width: 22 },
      { header: 'Status / الحالة', key: 'status', width: 16 },
    ];

    db.passports.forEach((p) => {
      sheet.addRow({
        id: sanitizeCellValue(p.id),
        passportNumber: sanitizeCellValue(p.passportNumber),
        customerId: sanitizeCellValue(p.customerId),
        holderNameAr: sanitizeCellValue(p.holderNameAr),
        holderNameEn: sanitizeCellValue(p.holderNameEn),
        nationality: sanitizeCellValue(p.nationality),
        issueDate: sanitizeCellValue(p.issueDate),
        expiryDate: sanitizeCellValue(p.expiryDate),
        issuingAuthority: sanitizeCellValue(p.issuingAuthority),
        status: sanitizeCellValue(p.status),
      });
    });

    formatHeaderRow(sheet);
  } else if (entity === 'bookings') {
    const sheet = workbook.addWorksheet('Bookings - الحجوزات', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Booking Ref / رقم الحجز', key: 'bookingRef', width: 18 },
      { header: 'Customer ID / معرف العميل', key: 'customerId', width: 16 },
      { header: 'Service / نوع الخدمة', key: 'serviceCategory', width: 16 },
      { header: 'Destination / الوجهة', key: 'destination', width: 26 },
      { header: 'Departure / تاريخ المغادرة', key: 'departureDate', width: 16 },
      { header: 'Return / تاريخ العودة', key: 'returnDate', width: 16 },
      { header: 'Total Price / السعر الإجمالي', key: 'totalPrice', width: 16 },
      { header: 'Supplier Cost / تكلفة المورد', key: 'supplierCost', width: 16 },
      { header: 'Currency / العملة', key: 'currency', width: 12 },
      { header: 'Status / حالة الحجز', key: 'status', width: 14 },
      { header: 'Booking Date / تاريخ الحجز', key: 'createdAt', width: 16 },
    ];

    db.bookings.forEach((b) => {
      sheet.addRow({
        bookingRef: sanitizeCellValue(b.bookingRef),
        customerId: sanitizeCellValue(b.customerId),
        serviceCategory: sanitizeCellValue(b.serviceCategory),
        destination: sanitizeCellValue(b.destination),
        departureDate: sanitizeCellValue(b.departureDate),
        returnDate: sanitizeCellValue(b.returnDate || '-'),
        totalPrice: b.totalPrice,
        supplierCost: b.supplierCost,
        currency: sanitizeCellValue(b.currency),
        status: sanitizeCellValue(b.status),
        createdAt: b.createdAt.split('T')[0],
      });
    });

    formatHeaderRow(sheet);
  } else if (entity === 'visas') {
    const sheet = workbook.addWorksheet('Visa Applications - التأشيرات', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Application Ref', key: 'applicationRef', width: 18 },
      { header: 'Traveler Name', key: 'travelerName', width: 26 },
      { header: 'Passport Number', key: 'passportNumber', width: 18 },
      { header: 'Destination Country', key: 'destinationCountry', width: 20 },
      { header: 'Category', key: 'visaCategory', width: 14 },
      { header: 'Appointment Date', key: 'appointmentDate', width: 16 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Fees', key: 'fees', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
    ];

    db.visaApplications.forEach((v) => {
      sheet.addRow({
        applicationRef: sanitizeCellValue(v.applicationRef),
        travelerName: sanitizeCellValue(v.travelerName),
        passportNumber: sanitizeCellValue(v.passportNumber),
        destinationCountry: sanitizeCellValue(v.destinationCountry),
        visaCategory: sanitizeCellValue(v.visaCategory),
        appointmentDate: sanitizeCellValue(v.appointmentDate || '-'),
        status: sanitizeCellValue(v.status),
        fees: v.fees,
        currency: sanitizeCellValue(v.currency),
      });
    });

    formatHeaderRow(sheet);
  } else if (entity === 'payments') {
    const sheet = workbook.addWorksheet('Payments - المقبوضات', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Payment Ref / رقم السند', key: 'paymentRef', width: 18 },
      { header: 'Customer ID / معرف العميل', key: 'customerId', width: 16 },
      { header: 'Booking ID / الحجز', key: 'bookingId', width: 16 },
      { header: 'Date / التاريخ', key: 'date', width: 14 },
      { header: 'Amount / المبلغ', key: 'amount', width: 14 },
      { header: 'Currency / العملة', key: 'currency', width: 12 },
      { header: 'Method / طريقة الدفع', key: 'paymentMethod', width: 16 },
      { header: 'Transaction Ref', key: 'transactionRef', width: 20 },
      { header: 'Notes / ملاحظات', key: 'notes', width: 30 },
    ];

    db.payments.forEach((p) => {
      sheet.addRow({
        paymentRef: sanitizeCellValue(p.paymentRef),
        customerId: sanitizeCellValue(p.customerId),
        bookingId: sanitizeCellValue(p.bookingId || '-'),
        date: sanitizeCellValue(p.date),
        amount: p.amount,
        currency: sanitizeCellValue(p.currency),
        paymentMethod: sanitizeCellValue(p.paymentMethod),
        transactionRef: sanitizeCellValue(p.transactionRef || '-'),
        notes: sanitizeCellValue(p.notes || ''),
      });
    });

    formatHeaderRow(sheet);
  } else if (entity === 'expenses') {
    const sheet = workbook.addWorksheet('Expenses - المصروفات', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Expense Ref / رقم السند', key: 'expenseRef', width: 18 },
      { header: 'Category / البند', key: 'category', width: 18 },
      { header: 'Date / التاريخ', key: 'date', width: 14 },
      { header: 'Amount / المبلغ', key: 'amount', width: 14 },
      { header: 'Currency / العملة', key: 'currency', width: 12 },
      { header: 'Description / البيان', key: 'description', width: 36 },
    ];

    db.expenses.forEach((e) => {
      sheet.addRow({
        expenseRef: sanitizeCellValue(e.expenseRef),
        category: sanitizeCellValue(e.category),
        date: sanitizeCellValue(e.date),
        amount: e.amount,
        currency: sanitizeCellValue(e.currency),
        description: sanitizeCellValue(e.description),
      });
    });

    formatHeaderRow(sheet);
  }

  return workbook;
}

function formatHeaderRow(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1);
  row.height = 26;
  row.eachCell((cell) => {
    cell.fill = BRAND_HEADER_FILL;
    cell.font = BRAND_HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF38A7E8' } },
    };
  });
}

// Generate template for customer import
export async function generateTemplateWorkbook(entity: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${entity}_template`);

  if (entity === 'customers') {
    sheet.columns = [
      { header: 'Full Name (Arabic)', key: 'fullNameAr', width: 26 },
      { header: 'Full Name (English)', key: 'fullNameEn', width: 26 },
      { header: 'National ID', key: 'nationalId', width: 18 },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 22 },
      { header: 'Nationality', key: 'nationality', width: 18 },
      { header: 'Gender (male/female)', key: 'gender', width: 18 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Address', key: 'address', width: 24 },
      { header: 'Notes', key: 'notes', width: 26 },
    ];

    // Add sample row
    sheet.addRow({
      fullNameAr: 'سامي فهد الدوسري',
      fullNameEn: 'Sami Fahad Al-Dossary',
      nationalId: '1098123456',
      dob: '1989-05-14',
      nationality: 'Saudi Arabia',
      gender: 'male',
      phone: '+966 50 123 4567',
      email: 'sami.dossary@example.com',
      address: 'الرياض، حي السليمانية',
      notes: 'عميل جديد تم استيراده من النظام السابق',
    });

    formatHeaderRow(sheet);
  } else if (entity === 'passports') {
    sheet.columns = [
      { header: 'Customer ID', key: 'customerId', width: 16 },
      { header: 'Passport Number', key: 'passportNumber', width: 18 },
      { header: 'Holder Name (Arabic)', key: 'holderNameAr', width: 24 },
      { header: 'Holder Name (English)', key: 'holderNameEn', width: 24 },
      { header: 'Nationality', key: 'nationality', width: 18 },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 20 },
      { header: 'Gender (male/female)', key: 'gender', width: 16 },
      { header: 'Issue Date (YYYY-MM-DD)', key: 'issueDate', width: 20 },
      { header: 'Expiry Date (YYYY-MM-DD)', key: 'expiryDate', width: 20 },
      { header: 'Issuing Authority', key: 'issuingAuthority', width: 22 },
    ];

    sheet.addRow({
      customerId: 'CUST-1001',
      passportNumber: 'N9988776',
      holderNameAr: 'عبدالرحمن محمد السالم',
      holderNameEn: 'Abdulrahman Mohammed Al-Salem',
      nationality: 'Saudi Arabia',
      dob: '1984-06-15',
      gender: 'male',
      issueDate: '2024-01-10',
      expiryDate: '2034-01-09',
      issuingAuthority: 'جوازات الرياض',
    });

    formatHeaderRow(sheet);
  }

  return workbook;
}

// Parse and validate imported customers from an ExcelJS buffer
export async function parseAndImportCustomers(buffer: any, currentUserId: string, currentUserName: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];

  const db = getDatabase();
  const results = {
    totalRows: 0,
    importedCount: 0,
    errors: [] as { row: number; error: string; data?: any }[],
    preview: [] as Partial<Customer>[],
  };

  const existingEmails = new Set(db.customers.map((c) => c.email.toLowerCase()));
  const existingPhones = new Set(db.customers.map((c) => c.phone));
  const newCustomers: Customer[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    results.totalRows++;

    const fullNameAr = String(row.getCell(1).value || '').trim();
    const fullNameEn = String(row.getCell(2).value || '').trim();
    const nationalId = String(row.getCell(3).value || '').trim();
    const dobRaw = row.getCell(4).value;
    const nationality = String(row.getCell(5).value || 'Saudi Arabia').trim();
    const genderRaw = String(row.getCell(6).value || 'male').toLowerCase().trim();
    const phone = String(row.getCell(7).value || '').trim();
    const email = String(row.getCell(8).value || '').toLowerCase().trim();
    const address = String(row.getCell(9).value || '').trim();
    const notes = String(row.getCell(10).value || '').trim();

    // Validation
    if (!fullNameAr && !fullNameEn) {
      results.errors.push({ row: rowNumber, error: 'Customer name (Arabic or English) is required.' });
      return;
    }

    if (!email || !email.includes('@')) {
      results.errors.push({ row: rowNumber, error: `Invalid email address: ${email}` });
      return;
    }

    if (existingEmails.has(email)) {
      results.errors.push({ row: rowNumber, error: `Duplicate customer email: ${email} already exists in database.` });
      return;
    }

    let dobString = '1990-01-01';
    if (dobRaw instanceof Date) {
      dobString = dobRaw.toISOString().split('T')[0];
    } else if (typeof dobRaw === 'string' && dobRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dobString = dobRaw;
    }

    const gender = genderRaw === 'female' ? 'female' : 'male';
    const age = calculateAge(dobString);

    const nextIdNum = 1000 + db.customers.length + newCustomers.length + 1;
    const newCustomer: Customer = {
      id: `CUST-${nextIdNum}`,
      fullNameAr: fullNameAr || fullNameEn,
      fullNameEn: fullNameEn || fullNameAr,
      nationalId: nationalId || undefined,
      dob: dobString,
      age,
      nationality,
      gender,
      phone: phone || '+966 50 000 0000',
      whatsapp: phone || undefined,
      email,
      address: address || undefined,
      notes: notes || undefined,
      status: 'active',
      assignedEmployeeId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newCustomers.push(newCustomer);
    existingEmails.add(email);
  });

  if (newCustomers.length > 0) {
    db.customers.push(...newCustomers);
    // Persist to database
    const { saveDatabase } = await import('./db.ts');
    saveDatabase(db);
    logAuditEvent(
      currentUserId,
      currentUserName,
      'import',
      'customer',
      `COUNT-${newCustomers.length}`,
      `Imported ${newCustomers.length} customer records from Excel file.`
    );
  }

  results.importedCount = newCustomers.length;
  results.preview = newCustomers.slice(0, 5);
  return results;
}
