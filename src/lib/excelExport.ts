/**
 * Enterprise Excel Export & Download Engine with Client-side ExcelJS Fallback
 * Provides 100% reliable spreadsheet generation in browser sandbox & iframe environments.
 */

import ExcelJS from 'exceljs';

const BRAND_NAVY = 'FF0B1730';
const BRAND_SKY = 'FF38A7E8';

function triggerBlobDownload(blob: Blob, fileName: string): boolean {
  try {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Keep blob URL alive for 25 seconds so the browser download engine completes
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 25000);
    return true;
  } catch (err) {
    console.error('Trigger blob download failed:', err);
    return false;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('skyway_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Client-side fallback workbook generator in case server endpoint is unavailable or blocked
 */
async function generateClientSideWorkbook(entity: string): Promise<Blob> {
  const headers = getAuthHeaders();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SkyWay Travel | سكاي واي للسفريات';
  workbook.created = new Date();

  if (entity === 'customers') {
    const res = await fetch('/api/customers?limit=1000', { headers });
    const json = await res.json();
    const list = json.data || json || [];

    const sheet = workbook.addWorksheet('العملاء - Customers', { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'معرف العميل (ID)', key: 'id', width: 16 },
      { header: 'الاسم بالعربية', key: 'fullNameAr', width: 28 },
      { header: 'الاسم بالإنجليزية', key: 'fullNameEn', width: 28 },
      { header: 'رقم الهوية الوطنية', key: 'nationalId', width: 18 },
      { header: 'الجنسية', key: 'nationality', width: 18 },
      { header: 'العمر', key: 'age', width: 10 },
      { header: 'رقم الهاتف', key: 'phone', width: 18 },
      { header: 'البريد الإلكتروني', key: 'email', width: 26 },
      { header: 'الحالة', key: 'status', width: 14 },
      { header: 'تاريخ التسجيل', key: 'createdAt', width: 16 },
    ];

    list.forEach((c: any) => {
      sheet.addRow({
        id: c.id,
        fullNameAr: c.fullNameAr,
        fullNameEn: c.fullNameEn,
        nationalId: c.nationalId || '-',
        nationality: c.nationality,
        age: c.age,
        phone: c.phone,
        email: c.email,
        status: c.status,
        createdAt: c.createdAt ? c.createdAt.split('T')[0] : '',
      });
    });
    styleSheetHeaders(sheet);
  } else if (entity === 'passports') {
    const res = await fetch('/api/passports', { headers });
    const list = (await res.json()) || [];

    const sheet = workbook.addWorksheet('جوازات السفر - Passports', { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'رقم السجل', key: 'id', width: 14 },
      { header: 'رقم الجواز', key: 'passportNumber', width: 18 },
      { header: 'اسم حامل الجواز (عربي)', key: 'holderNameAr', width: 26 },
      { header: 'اسم حامل الجواز (إنجليزي)', key: 'holderNameEn', width: 26 },
      { header: 'الجنسية', key: 'nationality', width: 18 },
      { header: 'تاريخ الإصدار', key: 'issueDate', width: 16 },
      { header: 'تاريخ الانتهاء', key: 'expiryDate', width: 16 },
      { header: 'الحالة', key: 'status', width: 16 },
    ];

    list.forEach((p: any) => {
      sheet.addRow({
        id: p.id,
        passportNumber: p.passportNumber,
        holderNameAr: p.holderNameAr,
        holderNameEn: p.holderNameEn,
        nationality: p.nationality,
        issueDate: p.issueDate,
        expiryDate: p.expiryDate,
        status: p.status,
      });
    });
    styleSheetHeaders(sheet);
  } else if (entity === 'bookings') {
    const res = await fetch('/api/bookings', { headers });
    const list = (await res.json()) || [];

    const sheet = workbook.addWorksheet('الحجوزات - Bookings', { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'رقم الحجز', key: 'bookingRef', width: 18 },
      { header: 'معرف العميل', key: 'customerId', width: 16 },
      { header: 'نوع الخدمة', key: 'serviceCategory', width: 16 },
      { header: 'الوجهة', key: 'destination', width: 24 },
      { header: 'تاريخ السفر', key: 'departureDate', width: 16 },
      { header: 'تاريخ العودة', key: 'returnDate', width: 16 },
      { header: 'الإجمالي', key: 'totalPrice', width: 14 },
      { header: 'المدفوع', key: 'paidAmount', width: 14 },
      { header: 'المتبقي', key: 'remainingBalance', width: 14 },
      { header: 'العملة', key: 'currency', width: 12 },
      { header: 'الحالة', key: 'status', width: 14 },
    ];

    list.forEach((b: any) => {
      sheet.addRow({
        bookingRef: b.bookingRef,
        customerId: b.customerId,
        serviceCategory: b.serviceCategory,
        destination: b.destination,
        departureDate: b.departureDate,
        returnDate: b.returnDate || '-',
        totalPrice: b.totalPrice,
        paidAmount: b.paidAmount || 0,
        remainingBalance: b.remainingBalance || 0,
        currency: b.currency,
        status: b.status,
      });
    });
    styleSheetHeaders(sheet);
  } else if (entity === 'visas') {
    const res = await fetch('/api/visas', { headers });
    const list = (await res.json()) || [];

    const sheet = workbook.addWorksheet('التأشيرات - Visas', { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'رقم الطلب', key: 'applicationRef', width: 18 },
      { header: 'اسم المسافر', key: 'travelerName', width: 26 },
      { header: 'رقم الجواز', key: 'passportNumber', width: 18 },
      { header: 'دولة الوجهة', key: 'destinationCountry', width: 20 },
      { header: 'نوع التأشيرة', key: 'visaCategory', width: 16 },
      { header: 'موعد البصمة', key: 'appointmentDate', width: 16 },
      { header: 'الحالة', key: 'status', width: 16 },
      { header: 'الرسوم', key: 'fees', width: 12 },
    ];

    list.forEach((v: any) => {
      sheet.addRow({
        applicationRef: v.applicationRef,
        travelerName: v.travelerName,
        passportNumber: v.passportNumber,
        destinationCountry: v.destinationCountry,
        visaCategory: v.visaCategory,
        appointmentDate: v.appointmentDate || '-',
        status: v.status,
        fees: v.fees,
      });
    });
    styleSheetHeaders(sheet);
  } else if (entity === 'payments') {
    const res = await fetch('/api/payments', { headers });
    const list = (await res.json()) || [];

    const sheet = workbook.addWorksheet('المقبوضات - Payments', { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'رقم السند', key: 'paymentRef', width: 18 },
      { header: 'معرف العميل', key: 'customerId', width: 16 },
      { header: 'التاريخ', key: 'date', width: 14 },
      { header: 'المبلغ', key: 'amount', width: 14 },
      { header: 'العملة', key: 'currency', width: 12 },
      { header: 'طريقة الدفع', key: 'paymentMethod', width: 16 },
      { header: 'رقم المعاملة', key: 'transactionRef', width: 20 },
      { header: 'ملاحظات', key: 'notes', width: 28 },
    ];

    list.forEach((p: any) => {
      sheet.addRow({
        paymentRef: p.paymentRef,
        customerId: p.customerId,
        date: p.date,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        transactionRef: p.transactionRef || '-',
        notes: p.notes || '',
      });
    });
    styleSheetHeaders(sheet);
  } else if (entity === 'expenses') {
    const res = await fetch('/api/expenses', { headers });
    const list = (await res.json()) || [];

    const sheet = workbook.addWorksheet('المصروفات - Expenses', { views: [{ showGridLines: true }] });
    sheet.columns = [
      { header: 'رقم السند', key: 'expenseRef', width: 18 },
      { header: 'البند / الفئة', key: 'category', width: 20 },
      { header: 'التاريخ', key: 'date', width: 14 },
      { header: 'المبلغ', key: 'amount', width: 14 },
      { header: 'العملة', key: 'currency', width: 12 },
      { header: 'البيان والتفاصيل', key: 'description', width: 36 },
    ];

    list.forEach((e: any) => {
      sheet.addRow({
        expenseRef: e.expenseRef,
        category: e.category,
        date: e.date,
        amount: e.amount,
        currency: e.currency,
        description: e.description,
      });
    });
    styleSheetHeaders(sheet);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function styleSheetHeaders(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_NAVY },
    };
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: BRAND_SKY } },
    };
  });
}

/**
 * Public export function: tries server endpoint with Authorization header & token query,
 * and if that fails, automatically switches to client-side ExcelJS fallback.
 */
export async function downloadExcelFile(entity: string, fileName?: string): Promise<boolean> {
  const token = localStorage.getItem('skyway_token');
  const targetName = fileName || `SkyWay_${entity}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Try Engine 1: Server endpoint
  try {
    const url = `/api/excel/export/${entity}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) {
        return triggerBlobDownload(blob, targetName);
      }
    }
  } catch (err) {
    console.warn('Server Excel export failed, attempting client-side generation fallback:', err);
  }

  // Try Engine 2: Client-side ExcelJS fallback
  try {
    const fallbackBlob = await generateClientSideWorkbook(entity);
    return triggerBlobDownload(fallbackBlob, targetName);
  } catch (err) {
    console.error('All Excel export mechanisms failed:', err);
    throw new Error('فشل تصدير ملف الإكسل. يرجى التحقق من الاتصال والمحاولة مجدداً.');
  }
}

/**
 * Download sample template file for importing
 */
export async function downloadTemplateFile(entity: string): Promise<boolean> {
  const token = localStorage.getItem('skyway_token');
  const targetName = `SkyWay_${entity}_template.xlsx`;

  try {
    const url = `/api/excel/template/${entity}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) {
        return triggerBlobDownload(blob, targetName);
      }
    }
  } catch (err) {
    console.warn('Server template download failed:', err);
  }

  // Client-side fallback template
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('قالب العملاء - Customers Template');
    sheet.columns = [
      { header: 'الاسم بالعربية', key: 'fullNameAr', width: 25 },
      { header: 'الاسم بالإنجليزية', key: 'fullNameEn', width: 25 },
      { header: 'رقم الهوية', key: 'nationalId', width: 18 },
      { header: 'تاريخ الميلاد (YYYY-MM-DD)', key: 'dob', width: 22 },
      { header: 'الجنسية', key: 'nationality', width: 18 },
      { header: 'الجنس (male/female)', key: 'gender', width: 18 },
      { header: 'رقم الهاتف', key: 'phone', width: 18 },
      { header: 'البريد الإلكتروني', key: 'email', width: 25 },
    ];
    sheet.addRow({
      fullNameAr: 'محمد أحمد السعيد',
      fullNameEn: 'Mohammed Ahmed Al-Saeed',
      nationalId: '1098765432',
      dob: '1988-06-15',
      nationality: 'Saudi Arabia',
      gender: 'male',
      phone: '+966501234567',
      email: 'mohammed@example.com',
    });
    styleSheetHeaders(sheet);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return triggerBlobDownload(blob, targetName);
  } catch (e) {
    console.error('Failed to generate template:', e);
    return false;
  }
}
