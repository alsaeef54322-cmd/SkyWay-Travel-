import { AppSettings, Booking, Customer, Payment } from '../types/client.ts';

/**
 * Print HTML directly via a hidden <iframe> without popups or window.open
 * Works seamlessly in all browsers and sandboxed iframe environments.
 */
export function printHtmlViaHiddenIframe(htmlContent: string) {
  // Remove existing print iframe if any
  const oldIframe = document.getElementById('skyway-print-iframe');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'skyway-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html dir="auto">
    <head>
      <meta charset="utf-8">
      <title>طباعة مستند - سكاي واي للسفريات</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Cairo', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 24px;
          color: #0F172A;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Allow styles and webfonts a moment to resolve, then invoke native print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.print():', err);
      window.print();
    }
  }, 400);
}

/**
 * Global fallback for printing documents:
 * Instead of window.open (which is blocked inside iframes), this triggers hidden iframe printing
 * and dispatches an event for the in-app preview modal.
 */
export function openPrintableDocument(title: string, htmlContent: string) {
  // Dispatch custom event for in-app preview modal if registered
  const event = new CustomEvent('skyway:open-print-preview', {
    detail: { title, htmlContent },
  });
  window.dispatchEvent(event);

  // Also ready the silent hidden iframe print
  printHtmlViaHiddenIframe(htmlContent);
}

export function triggerPrint() {
  window.print();
}

// -------------------------------------------------------------------
// HTML DOCUMENT TEMPLATES
// -------------------------------------------------------------------

function renderCompanyLogoHtml(settings?: AppSettings) {
  if (settings?.logoUrl && !settings.logoUrl.startsWith('preset:')) {
    return `<div style="margin-bottom: 8px;"><img src="${settings.logoUrl}" alt="Logo" style="max-height: 52px; max-width: 140px; object-fit: contain;" /></div>`;
  }
  return `
    <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #0B1730 0%, #123B67 50%, #38A7E8 100%); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
      <span style="color: #ffffff; font-size: 22px;">✈</span>
    </div>
  `;
}

// 1. Travel Itinerary & Confirmation
export function generateBookingItineraryHtml(
  booking: Booking,
  customer?: Customer,
  settings?: AppSettings
): string {
  const companyAr = settings?.companyNameAr || 'سكاي واي للسفريات - مصر';
  const companyEn = settings?.companyNameEn || 'SkyWay Travel Egypt';
  const iata = settings?.iataCode || 'IATA-96248-EG';
  const cr = settings?.commercialReg || 'CR-10492850';
  const phone = settings?.phone || '+20 2 2450 8899';
  const email = settings?.email || 'operations@skyway-travel.com';
  const logoHtml = renderCompanyLogoHtml(settings);

  return `
    <div style="max-width: 800px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-family: 'Cairo', 'Plus Jakarta Sans', sans-serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B1730; padding-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${logoHtml}
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0B1730; font-weight: 800;">${companyAr}</h1>
            <h2 style="margin: 2px 0 0; font-size: 15px; color: #38A7E8; font-weight: 600;">${companyEn}</h2>
            <p style="margin: 4px 0 0; font-size: 11px; color: #64748B;">IATA: ${iata} · CR: ${cr}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #0B1730; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: bold; font-family: monospace;">
            ${booking.bookingRef}
          </div>
          <p style="margin: 6px 0 0; font-size: 11px; color: #64748B;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')} / ${new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>

      <!-- Title -->
      <div style="text-align: center; margin: 24px 0 16px;">
        <h3 style="margin: 0; font-size: 18px; color: #0B1730; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">
          تأكيد حجز وسند خط سير رحلة / TRAVEL ITINERARY & CONFIRMATION
        </h3>
      </div>

      <!-- Customer & Trip Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #F8FAFC; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
        <div>
          <div style="font-size: 11px; color: #64748B; font-weight: bold;">بيانات العميل المسافر / TRAVELER INFO</div>
          <div style="font-size: 15px; font-weight: bold; margin-top: 4px; color: #0F172A;">${customer?.fullNameAr || customer?.fullNameEn || 'العميل'}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">الهاتف: ${customer?.phone || '-'}</div>
          <div style="font-size: 12px; color: #475569;">البريد: ${customer?.email || '-'}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #64748B; font-weight: bold;">تفاصيل الوجهة / DESTINATION DETAILS</div>
          <div style="font-size: 15px; font-weight: bold; margin-top: 4px; color: #0F172A;">${booking.destination}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">تاريخ المغادرة: ${booking.departureDate}</div>
          ${booking.returnDate ? `<div style="font-size: 12px; color: #475569;">تاريخ العودة: ${booking.returnDate}</div>` : ''}
        </div>
      </div>

      <!-- Flight / Service Breakdown -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="background: #0B1730; color: #ffffff;">
            <th style="padding: 10px; text-align: right; border-radius: 4px 0 0 0;">الخدمة / البند</th>
            <th style="padding: 10px; text-align: right;">التفاصيل ومزود الخدمة</th>
            <th style="padding: 10px; text-align: center;">الحالة</th>
            <th style="padding: 10px; text-align: left; border-radius: 0 4px 0 0;">القيمة (${booking.currency})</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #E2E8F0; background: #ffffff;">
            <td style="padding: 12px; font-weight: bold;">${(booking.serviceCategory || 'FLIGHT').toUpperCase()}</td>
            <td style="padding: 12px;">
              ${booking.airline ? `<strong>طيران:</strong> ${booking.airline} (${booking.flightNumber || ''})<br/>` : ''}
              ${booking.ticketNumber ? `<strong>رقم التذكرة:</strong> ${booking.ticketNumber}<br/>` : ''}
              ${booking.hotelDetails ? `<strong>الفندق:</strong> ${booking.hotelDetails}` : ''}
            </td>
            <td style="padding: 12px; color: #16A34A; font-weight: bold; text-align: center;">مؤكد (CONFIRMED)</td>
            <td style="padding: 12px; font-family: monospace; font-weight: bold; font-size: 14px;">${Number(booking.totalPrice || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <!-- Financial Totals -->
      <div style="margin-left: auto; width: 320px; background: #F1F5F9; padding: 14px; border-radius: 8px; margin-bottom: 28px; border: 1px solid #CBD5E1;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span>المبلغ الإجمالي / Total:</span>
          <span style="font-weight: bold; font-family: monospace;">${Number(booking.totalPrice || 0).toLocaleString()} ${booking.currency}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #16A34A;">
          <span>المبلغ المسدد / Paid:</span>
          <span style="font-weight: bold; font-family: monospace;">${Number(booking.paidAmount || 0).toLocaleString()} ${booking.currency}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #CBD5E1; padding-top: 6px; color: #0B1730;">
          <span>الرصيد المتبقي / Balance:</span>
          <span style="font-family: monospace;">${Number(booking.remainingBalance || 0).toLocaleString()} ${booking.currency}</span>
        </div>
      </div>

      <!-- Footer Policy -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #64748B; text-align: center; line-height: 1.6;">
        <p style="margin: 0; font-weight: 600;">${settings?.invoiceFooterAr || 'شكراً لاختياركم سكاي واي للسفريات - نتمنى لكم رحلة سعيدة وآمنة'}</p>
        <p style="margin: 4px 0 0;">${phone} · ${email}</p>
      </div>
    </div>
  `;
}

// 2. Official Payment Receipt (سند قبض رسمي)
export function generatePaymentReceiptHtml(
  payment: Payment,
  customer?: Customer,
  settings?: AppSettings
): string {
  const companyAr = settings?.companyNameAr || 'سكاي واي للسفريات - مصر';
  const companyEn = settings?.companyNameEn || 'SkyWay Travel Egypt';
  const logoHtml = renderCompanyLogoHtml(settings);

  return `
    <div style="max-width: 720px; margin: 0 auto; border: 2px solid #0B1730; border-radius: 12px; padding: 32px; background: #ffffff; font-family: 'Cairo', 'Plus Jakarta Sans', sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B1730; padding-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${logoHtml}
          <div>
            <h2 style="margin: 0; font-size: 22px; color: #0B1730; font-weight: 800;">${companyAr}</h2>
            <h3 style="margin: 0; font-size: 14px; color: #38A7E8; font-weight: 600;">${companyEn}</h3>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: 800; color: #0B1730;">سند قبض مالي معتمد</div>
          <div style="font-size: 12px; font-family: monospace; color: #64748B; font-weight: bold;">RECEIPT NO: ${payment.paymentRef}</div>
          <div style="font-size: 11px; color: #64748B;">التاريخ: ${payment.date}</div>
        </div>
      </div>

      <div style="margin: 24px 0; line-height: 2.2; font-size: 14px;">
        <p style="margin: 0;">
          <strong>استلمنا من المكرم / Received From:</strong>
          <span style="border-bottom: 1px dashed #94A3B8; display: inline-block; min-width: 320px; padding: 0 8px; font-weight: bold; color: #0F172A;">
            ${customer?.fullNameAr || customer?.fullNameEn || 'العميل'}
          </span>
        </p>
        <p style="margin: 10px 0 0;">
          <strong>مبلغ وقدره / The Sum Of:</strong>
          <span style="background: #F1F5F9; border: 1px solid #CBD5E1; padding: 4px 14px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 17px; color: #0B1730;">
            ${Number(payment.amount || 0).toLocaleString()} ${payment.currency}
          </span>
        </p>
        <p style="margin: 10px 0 0;">
          <strong>طريقة السداد / Payment Method:</strong>
          <span style="font-weight: bold; color: #0369A1;">${(payment.paymentMethod || 'cash').toUpperCase()}</span>
          ${payment.transactionRef ? ` — رقم المعاملة: <span style="font-family: monospace; font-weight: bold;">${payment.transactionRef}</span>` : ''}
        </p>
        <p style="margin: 10px 0 0;">
          <strong>وذلك مقابل / In Payment Of:</strong>
          <span style="border-bottom: 1px dashed #94A3B8; display: inline-block; min-width: 360px; padding: 0 8px;">
            ${payment.notes || 'سداد خدمات سياحية وتذاكر وحجوزات سفر'}
          </span>
        </p>
      </div>

      <div style="margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #CBD5E1; font-size: 13px;">
        <div style="text-align: center; width: 200px;">
          <div style="color: #64748B;">توقيع المستلم / Receiver</div>
          <div style="height: 48px;"></div>
          <div style="font-weight: bold; border-top: 1px solid #94A3B8; padding-top: 4px; color: #0F172A;">قسم المحاسبة والمالية</div>
        </div>
        <div style="text-align: center; width: 140px;">
          <div style="color: #64748B; font-size: 11px; margin-bottom: 4px;">الختم المعتمد / Official Seal</div>
          <div style="width: 75px; height: 75px; border: 2px dashed #38A7E8; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #0369A1; font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2;">
            SKYWAY<br/>OFFICIAL<br/>SEAL
          </div>
        </div>
      </div>
    </div>
  `;
}

// 3. Customer Statement of Account (كشف حساب عميل معتمد)
export function generateCustomerStatementHtml(
  customer: Customer,
  bookings: Booking[],
  payments: Payment[],
  settings?: AppSettings
): string {
  const companyAr = settings?.companyNameAr || 'سكاي واي للسفريات - مصر';
  const companyEn = settings?.companyNameEn || 'SkyWay Travel Egypt';
  const currency = settings?.defaultCurrency || 'EGP';
  const logoHtml = renderCompanyLogoHtml(settings);

  const totalInvoiced = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = totalInvoiced - totalPaid;

  return `
    <div style="max-width: 820px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; background: #ffffff; font-family: 'Cairo', 'Plus Jakarta Sans', sans-serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B1730; padding-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${logoHtml}
          <div>
            <h2 style="margin: 0; font-size: 22px; color: #0B1730; font-weight: 800;">${companyAr}</h2>
            <h3 style="margin: 0; font-size: 13px; color: #38A7E8;">${companyEn}</h3>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: 800; color: #0B1730;">كشف حساب عميل معتمد</div>
          <div style="font-size: 11px; color: #64748B;">تاريخ الطباعة: ${new Date().toISOString().split('T')[0]}</div>
        </div>
      </div>

      <!-- Customer Summary -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
        <div>
          <div><strong>العميل:</strong> ${customer.fullNameAr || customer.fullNameEn}</div>
          <div><strong>الهاتف:</strong> ${customer.phone}</div>
          <div><strong>البريد:</strong> ${customer.email}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>إجمالي الفواتير:</strong> ${totalInvoiced.toLocaleString()} ${currency}</div>
          <div><strong>إجمالي المسدد:</strong> ${totalPaid.toLocaleString()} ${currency}</div>
          <div style="font-size: 15px; font-weight: bold; color: ${balance > 0 ? '#DC2626' : '#16A34A'}; margin-top: 4px;">
            <strong>الرصيد المستحق:</strong> ${balance.toLocaleString()} ${currency}
          </div>
        </div>
      </div>

      <!-- Bookings Table -->
      <h4 style="margin: 16px 0 8px; font-size: 14px; color: #0B1730;">جدول الحجوزات والفواتير (${bookings.length})</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
        <thead>
          <tr style="background: #0B1730; color: #ffffff;">
            <th style="padding: 8px; text-align: right;">رقم الحجز</th>
            <th style="padding: 8px; text-align: right;">الوجهة والخدمة</th>
            <th style="padding: 8px; text-align: center;">التاريخ</th>
            <th style="padding: 8px; text-align: left;">المبلغ (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map((b) => `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 8px; font-family: monospace; font-weight: bold;">${b.bookingRef}</td>
              <td style="padding: 8px;">${b.destination} (${b.serviceCategory})</td>
              <td style="padding: 8px; text-align: center;">${b.departureDate}</td>
              <td style="padding: 8px; font-family: monospace;">${Number(b.totalPrice || 0).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Payments Table -->
      <h4 style="margin: 16px 0 8px; font-size: 14px; color: #0B1730;">جدول سندات القبض والدفعات (${payments.length})</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
        <thead>
          <tr style="background: #0369A1; color: #ffffff;">
            <th style="padding: 8px; text-align: right;">رقم السند</th>
            <th style="padding: 8px; text-align: right;">طريقة الدفع</th>
            <th style="padding: 8px; text-align: center;">التاريخ</th>
            <th style="padding: 8px; text-align: left;">المبلغ (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map((p) => `
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 8px; font-family: monospace; font-weight: bold;">${p.paymentRef}</td>
              <td style="padding: 8px;">${p.paymentMethod.toUpperCase()}</td>
              <td style="padding: 8px; text-align: center;">${p.date}</td>
              <td style="padding: 8px; font-family: monospace; color: #16A34A; font-weight: bold;">${Number(p.amount || 0).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Footer Stamp -->
      <div style="border-top: 1px solid #CBD5E1; padding-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: #64748B;">
        <div>تم إصدار هذا الكشف آلياً بواسطة نظام سكاي واي لإدارة وكالات السفر</div>
        <div>ختم المحاسبة والاعتماد</div>
      </div>
    </div>
  `;
}
