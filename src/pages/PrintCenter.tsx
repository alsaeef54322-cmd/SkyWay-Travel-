import React, { useState, useEffect } from 'react';
import { Printer, Plane, CreditCard, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { usePrint } from '../context/PrintContext.tsx';
import { Booking, Payment, Customer, AppSettings } from '../types/client.ts';
import { api } from '../lib/api.ts';
import {
  generateBookingItineraryHtml,
  generatePaymentReceiptHtml,
  generateCustomerStatementHtml,
} from '../lib/pdf.ts';

export const PrintCenter: React.FC = () => {
  const { t, language } = useLanguage();
  const { openPrintPreview, printDirect } = usePrint();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected items for printing
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [bkData, payData, custData, setts]: [any, any, any, any] = await Promise.all([
          api.get('/api/bookings'),
          api.get('/api/payments'),
          api.get('/api/customers?limit=100'),
          api.get('/api/settings'),
        ]);
        setBookings(bkData || []);
        setPayments(payData || []);
        setCustomers(custData?.data || []);
        setSettings(setts);
        if (bkData?.length > 0) setSelectedBookingId(bkData[0].id);
        if (payData?.length > 0) setSelectedPaymentId(payData[0].id);
        if (custData?.data?.length > 0) setSelectedCustomerId(custData.data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrintBooking = () => {
    const bk = bookings.find((b) => b.id === selectedBookingId);
    if (!bk) return;
    const cust = customers.find((c) => c.id === bk.customerId);
    const html = generateBookingItineraryHtml(bk, cust, settings || undefined);
    openPrintPreview(language === 'ar' ? `تأكيد حجز: ${bk.bookingRef}` : `Itinerary: ${bk.bookingRef}`, html);
  };

  const handlePrintPayment = () => {
    const pay = payments.find((p) => p.id === selectedPaymentId);
    if (!pay) return;
    const cust = customers.find((c) => c.id === pay.customerId);
    const html = generatePaymentReceiptHtml(pay, cust, settings || undefined);
    openPrintPreview(language === 'ar' ? `سند قبض: ${pay.paymentRef}` : `Receipt: ${pay.paymentRef}`, html);
  };

  const handlePrintStatement = () => {
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;
    const custBookings = bookings.filter((b) => b.customerId === cust.id);
    const custPayments = payments.filter((p) => p.customerId === cust.id);
    const html = generateCustomerStatementHtml(cust, custBookings, custPayments, settings || undefined);
    openPrintPreview(
      language === 'ar' ? `كشف حساب: ${cust.fullNameAr || cust.fullNameEn}` : `Statement: ${cust.fullNameEn || cust.fullNameAr}`,
      html
    );
  };

  const handleDirectTestPrint = () => {
    const testHtml = `
      <div style="max-width: 600px; margin: 40px auto; padding: 30px; border: 2px solid #0B1730; border-radius: 12px; font-family: 'Cairo', sans-serif; text-align: center;">
        <h1 style="color: #0B1730; margin: 0 0 10px;">${settings?.companyNameAr || 'سكاي واي للسفريات'} - صفحة اختبار الطباعة</h1>
        <p style="color: #38A7E8; font-size: 14px; margin: 0 0 20px;">${(settings?.companyNameEn || 'SKYWAY TRAVEL').toUpperCase()} - PRINT VERIFICATION TEST</p>
        <div style="background: #F1F5F9; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.8;">
          <p style="margin: 0;">تم تأكيد عمل نظام الطباعة بنجاح وبدون حظر النوافذ المنبثقة.</p>
          <p style="margin: 4px 0 0; color: #16A34A; font-weight: bold;">الحالة: جاهز للطباعة والعمليات الرسمية ✓</p>
          <p style="margin: 4px 0 0; font-family: monospace;">التاريخ والوقت: ${new Date().toLocaleString('ar-SA')}</p>
        </div>
      </div>
    `;
    openPrintPreview(language === 'ar' ? 'اختبار جاهزية الطباعة' : 'Print Readiness Test', testHtml);
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Printer className="w-6 h-6 text-sky-500" />
            <span>{t('printCenter')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'مركز الطباعة الموحد لإصدار تذاكر السفر وسندات القبض وكشوفات الحساب المعتمدة'
              : 'Unified document printing center with Arabic text shaping, branding, and receipts'}
          </p>
        </div>

        <button
          onClick={handleDirectTestPrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 text-xs font-bold hover:bg-sky-100 transition-colors shadow-2xs"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'ar' ? 'اختبار الطابعة والمعاينة' : 'Test Printer & Preview'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Booking Itinerary Printing */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'سند تأكيد الحجز' : 'Travel Itinerary Voucher'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'بيانات المسافرين والتذاكر والخدمات' : 'Official itinerary confirmation'}
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs">
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'اختر الحجز:' : 'Select Booking:'}
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden font-medium text-xs text-slate-900 dark:text-white"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingRef} — {b.destination}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handlePrintBooking}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'معاينة وطباعة التذكرة' : 'Preview & Print'}</span>
          </button>
        </div>

        {/* 2. Payment Receipt Voucher Printing */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'سند قبض مالي معتمد' : 'Payment Receipt'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'سند مالي مرقم ومختوم بالختم' : 'Numbered voucher with seal'}
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs">
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'اختر سند القبض:' : 'Select Receipt:'}
              </label>
              <select
                value={selectedPaymentId}
                onChange={(e) => setSelectedPaymentId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden font-medium text-xs text-slate-900 dark:text-white"
              >
                {payments.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.paymentRef} — {Number(p.amount || 0).toLocaleString()} {p.currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handlePrintPayment}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'معاينة وطباعة السند' : 'Preview & Print'}</span>
          </button>
        </div>

        {/* 3. Customer Statement of Account */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'كشف حساب عميل' : 'Account Statement'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'تقرير تفصيلي بالفواتير والمدفوعات' : 'Itemized debit/credit report'}
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs">
              <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'اختر العميل:' : 'Select Customer:'}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden font-medium text-xs text-slate-900 dark:text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullNameAr || c.fullNameEn} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handlePrintStatement}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'معاينة وطباعة كشف الحساب' : 'Preview & Print'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
