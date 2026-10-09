import React, { useState, useEffect } from 'react';
import {
  Plane,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  Printer,
  ArrowLeft,
  ArrowRight,
  Plus,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { usePrint } from '../context/PrintContext.tsx';
import { Booking, Payment } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { generateBookingItineraryHtml } from '../lib/pdf.ts';

interface BookingDetailProps {
  bookingId: string;
  onNavigate: (path: string) => void;
}

export const BookingDetail: React.FC<BookingDetailProps> = ({ bookingId, onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const { user } = useAuth();
  const { openPrintPreview } = usePrint();

  const [booking, setBooking] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick record payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'credit_card' | 'pos'>('bank_transfer');
  const [payNotes, setPayNotes] = useState('');

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const [bkData, setts]: [any, any] = await Promise.all([
        api.get(`/api/bookings/${bookingId}`),
        api.get('/api/settings'),
      ]);
      setBooking(bkData);
      setSettings(setts);
      if (bkData?.remainingBalance) {
        setPayAmount(bkData.remainingBalance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0) return;

    try {
      await api.post('/api/payments', {
        customerId: booking.customerId,
        bookingId: booking.id,
        amount: payAmount,
        currency: booking.currency,
        paymentMethod: payMethod,
        notes: payNotes || `Payment for booking ${booking.bookingRef}`,
      });
      setIsPaymentModalOpen(false);
      fetchBooking();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handlePrintItinerary = () => {
    if (!booking) return;
    const html = generateBookingItineraryHtml(booking, booking.customer, settings);
    openPrintPreview(language === 'ar' ? `تأكيد حجز: ${booking.bookingRef}` : `Itinerary: ${booking.bookingRef}`, html);
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">{t('loading')}</div>;
  }

  if (!booking) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Booking not found</h3>
        <button
          onClick={() => onNavigate('/bookings')}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate('/bookings')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {direction === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{language === 'ar' ? 'العودة لقائمة الحجوزات' : 'Back to Bookings'}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintItinerary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة خط سير الرحلة والتأكيد' : 'Print Itinerary Voucher'}</span>
          </button>
        </div>
      </div>

      {/* Main Booking Summary Card */}
      <div className="p-6 md:p-8 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800">
                {booking.bookingRef}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  booking.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {t(booking.status as any)}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
              {booking.destination}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <span
                onClick={() => onNavigate(`/customers/${booking.customerId}`)}
                className="flex items-center gap-1.5 hover:text-sky-500 cursor-pointer font-bold"
              >
                <User className="w-4 h-4 text-sky-500" />
                <span>{language === 'ar' ? booking.customer?.fullNameAr : booking.customer?.fullNameEn}</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{booking.departureDate} {booking.returnDate ? `— ${booking.returnDate}` : ''}</span>
              </span>
              {booking.airline && (
                <span className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-slate-400" />
                  <span>{booking.airline} {booking.flightNumber ? `(${booking.flightNumber})` : ''}</span>
                </span>
              )}
              {booking.supplier && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{booking.supplier?.name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Financial Balance Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 min-w-[260px] space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'الحساب المالي للحجز' : 'Financial Breakdown'}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{t('totalPrice')}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {booking.totalPrice?.toLocaleString()} {booking.currency}
              </span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>{language === 'ar' ? 'المبلغ المسدد:' : 'Paid:'}</span>
              <span className="font-mono font-bold">
                {booking.paidAmount?.toLocaleString()} {booking.currency}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{t('supplierCost')}:</span>
              <span className="font-mono">{booking.supplierCost?.toLocaleString()} {booking.currency}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('remainingAmount')}:</span>
                <span className="text-[10px] text-slate-400 capitalize">{t(booking.paymentStatus as any)}</span>
              </div>
              <span className="text-base font-bold font-mono text-sky-600 dark:text-sky-400">
                {booking.remainingBalance?.toLocaleString()} {booking.currency}
              </span>
            </div>

            {booking.remainingBalance > 0 && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                {t('recordPayment')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Travelers & Payments History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Travelers Section */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-sky-500" />
            <span>{t('travelers')} ({booking.travelers?.length || 1})</span>
          </h2>

          <div className="space-y-2">
            {booking.travelers?.length > 0 ? (
              booking.travelers.map((tr: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {language === 'ar' ? tr.nameAr || tr.nameEn : tr.nameEn || tr.nameAr}
                    </div>
                    {tr.passportNumber && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Passport: {tr.passportNumber}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    {tr.type || 'adult'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {language === 'ar' ? booking.customer?.fullNameAr : booking.customer?.fullNameEn}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Phone: {booking.customer?.phone}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payments on this Booking */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>{t('payments')} ({booking.payments?.length || 0})</span>
            </h2>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('recordPayment')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {booking.payments?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لم يتم تسجيل دفعات لهذا الحجز حتى الآن' : 'No payments recorded for this booking'}
              </div>
            ) : (
              booking.payments?.map((p: Payment) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {p.paymentRef}
                    </div>
                    <div className="text-[11px] text-slate-500">
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              {t('recordPayment')} — {booking.bookingRef}
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t('amount')} ({booking.currency}) *</label>
                <input
                  type="number"
                  required
                  max={booking.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">{t('paymentMethod')}</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                >
                  <option value="bank_transfer">{t('bankTransfer')}</option>
                  <option value="cash">{t('cash')}</option>
                  <option value="credit_card">{t('creditCard')}</option>
                  <option value="pos">{t('pos')}</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Receipt notes..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 dark:text-slate-400"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
