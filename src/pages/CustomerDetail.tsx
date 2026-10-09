import React, { useEffect, useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Plane,
  CreditCard,
  Compass,
  Printer,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { usePrint } from '../context/PrintContext.tsx';
import { Customer, Passport, Booking, VisaApplication, Payment } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { triggerPrint, generateCustomerStatementHtml } from '../lib/pdf.ts';

interface CustomerDetailProps {
  customerId: string;
  onNavigate: (path: string) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId, onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const { openPrintPreview } = usePrint();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/customers/${customerId}`);
      setCustomer(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        {t('loading')}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer not found</h3>
        <button
          onClick={() => onNavigate('/customers')}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const { financialSummary } = customer;

  const handlePrintStatement = () => {
    if (!customer) return;
    const html = generateCustomerStatementHtml(
      customer,
      customer.bookings || [],
      customer.payments || []
    );
    openPrintPreview(
      language === 'ar' ? `كشف حساب: ${customer.fullNameAr || customer.fullNameEn}` : `Statement: ${customer.fullNameEn || customer.fullNameAr}`,
      html
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action and back navigation */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate('/customers')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {direction === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{language === 'ar' ? 'العودة لقائمة العملاء' : 'Back to Customers'}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintStatement}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-md hover:bg-sky-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة كشف الحساب' : 'Print Statement'}</span>
          </button>
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة الملف' : 'Print Profile'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="p-6 md:p-8 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
              {(customer.fullNameEn || customer.fullNameAr || 'C')[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {language === 'ar' ? customer.fullNameAr : customer.fullNameEn}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    customer.status === 'vip'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {t(customer.status as any)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? customer.fullNameEn : customer.fullNameAr} · ID: {customer.id}
              </div>

              {/* Badges / Contacts */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-mono">{customer.phone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-500" />
                  <span>{customer.email}</span>
                </span>
                {customer.nationalId && (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-mono">NID: {customer.nationalId}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {customer.age} {language === 'ar' ? 'سنة' : 'yrs'} ({customer.dob})
                  </span>
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Financial Mini-Dashboard */}
          {financialSummary && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 min-w-[240px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {language === 'ar' ? 'الملخص المالي للعميل' : 'Customer Account Balance'}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'ar' ? 'إجمالي الحجوزات:' : 'Total Billed:'}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {financialSummary.totalBilled?.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>{language === 'ar' ? 'المدفوعات المسددة:' : 'Total Paid:'}</span>
                  <span className="font-bold font-mono">
                    {financialSummary.totalPaid?.toLocaleString()} USD
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-sm">
                  <span className="text-slate-900 dark:text-white">{language === 'ar' ? 'الرصيد المتبقي:' : 'Balance Due:'}</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400">
                    {financialSummary.balance?.toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Sections: Passports, Bookings, Visas, Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passports List */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{t('passports')} ({customer.passports?.length || 0})</span>
            </h2>
            <button
              onClick={() => onNavigate('/passports')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addPassport')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {customer.passports?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا يوجد جوازات سفر مسجلة' : 'No passport records on file'}
              </div>
            ) : (
              customer.passports?.map((p: Passport) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {p.passportNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.nationality} · {t('expiryDate')}: <span className="font-mono">{p.expiryDate}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'valid'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : p.status === 'expiring_soon'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {t(p.status as any)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Travel Bookings List */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-500" />
              <span>{t('bookings')} ({customer.bookings?.length || 0})</span>
            </h2>
            <button
              onClick={() => onNavigate('/bookings')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createBooking')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {customer.bookings?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا توجد حجوزات مسجلة' : 'No bookings recorded'}
              </div>
            ) : (
              customer.bookings?.map((b: Booking) => (
                <div
                  key={b.id}
                  onClick={() => onNavigate(`/bookings/${b.id}`)}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">{b.bookingRef}</span>
                      <span className="font-medium text-xs text-slate-900 dark:text-white">{b.destination}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {b.departureDate} {b.returnDate ? `· ${b.returnDate}` : ''}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {b.totalPrice?.toLocaleString()} {b.currency}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {t(b.status as any)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Visa Applications */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-500" />
              <span>{t('visas')} ({customer.visas?.length || 0})</span>
            </h2>
            <button
              onClick={() => onNavigate('/visas')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createVisa')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {customer.visas?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا توجد طلبات تأشيرة' : 'No visa applications'}
              </div>
            ) : (
              customer.visas?.map((v: VisaApplication) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {v.destinationCountry} — {v.applicationRef}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {v.appointmentDate ? `${t('appointmentDate')}: ${v.appointmentDate}` : v.visaCategory}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    {t(v.status as any)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments History */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>{t('payments')} ({customer.payments?.length || 0})</span>
            </h2>
            <button
              onClick={() => onNavigate('/payments')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('recordPayment')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {customer.payments?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا توجد مدفوعات مسجلة' : 'No payments recorded'}
              </div>
            ) : (
              customer.payments?.map((p: Payment) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {p.paymentRef}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.date} · {p.paymentMethod.toUpperCase()}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    +{p.amount?.toLocaleString()} {p.currency}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
