import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Printer,
  DollarSign,
  Calendar,
  X,
  User,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { usePrint } from '../context/PrintContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { Payment, Customer, Booking, AppSettings } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { generatePaymentReceiptHtml } from '../lib/pdf.ts';
import { downloadExcelFile } from '../lib/excelExport.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';

export const Payments: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { openPrintPreview } = usePrint();
  const { defaultCurrency, settings } = useSettings();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Add Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    bookingId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 1000,
    currency: defaultCurrency || 'EGP',
    paymentMethod: 'bank_transfer' as any,
    transactionRef: '',
    notes: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payData, custData, bkData]: [any, any, any] = await Promise.all([
        api.get('/api/payments'),
        api.get('/api/customers?limit=100'),
        api.get('/api/bookings'),
      ]);
      setPayments(payData || []);
      setCustomers(custData?.data || []);
      setBookings(bkData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      customerId: customers[0]?.id || '',
      bookingId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 1500,
      currency: defaultCurrency || 'EGP',
      paymentMethod: 'bank_transfer',
      transactionRef: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/payments', formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save payment');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/payments/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handlePrintReceipt = (p: Payment) => {
    const cust = customers.find((c) => c.id === p.customerId);
    const html = generatePaymentReceiptHtml(p, cust, settings || undefined);
    openPrintPreview(language === 'ar' ? `سند قبض: ${p.paymentRef}` : `Receipt: ${p.paymentRef}`, html);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportNotice(language === 'ar' ? 'جارٍ تجهيز ملف سندات القبض...' : 'Generating payments Excel...');
    try {
      await downloadExcelFile('payments');
      setExportNotice(language === 'ar' ? 'تم تنزيل ملف الإكسل بنجاح!' : 'Payments Excel downloaded!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      setExportNotice(err.message || 'Export failed');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = payments.filter(
    (p) =>
      p.paymentRef.toLowerCase().includes(search.toLowerCase()) ||
      (p.customerNameAr && p.customerNameAr.includes(search)) ||
      (p.customerNameEn && p.customerNameEn.toLowerCase().includes(search.toLowerCase())) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollected = filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            <span>{t('payments')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? `سندات القبض المالية والمقبوضات المحصلة (الإجمالي: ${totalCollected.toLocaleString()} USD)`
              : `Payment receipts and collections ledger (Total: ${totalCollected.toLocaleString()} USD)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B1730] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
          >
            <FileSpreadsheet className={`w-4 h-4 text-emerald-600 ${isExporting ? 'animate-spin' : ''}`} />
            <span>{isExporting ? (language === 'ar' ? 'جارٍ التصدير...' : 'Exporting...') : t('exportExcel')}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('recordPayment')}</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-2xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full h-9 ps-9 pe-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold">
                <th className="py-3 px-4 text-start">{t('paymentRef')}</th>
                <th className="py-3 px-4 text-start">{t('customers')}</th>
                <th className="py-3 px-4 text-start">{t('date')}</th>
                <th className="py-3 px-4 text-start">{t('paymentMethod')}</th>
                <th className="py-3 px-4 text-end">{t('amount')}</th>
                <th className="py-3 px-4 text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">{t('loading')}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">{t('noDataFound')}</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {p.paymentRef}
                      {p.bookingRef && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          BK: {p.bookingRef}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {language === 'ar' ? p.customerNameAr : p.customerNameEn}
                      <span className="text-[10px] text-slate-400 block font-mono">{p.customerId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {p.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {t(p.paymentMethod as any) || p.paymentMethod}
                      </span>
                      {p.transactionRef && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Ref: {p.transactionRef}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      +{p.amount?.toLocaleString()} {p.currency}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          title="Print Receipt"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {user?.permissions.canManageFinances && (
                          <button
                            onClick={() => setDeleteTargetId(p.id)}
                            title={t('delete')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>{t('recordPayment')}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t('customers')} *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullNameAr} / {c.fullNameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('bookings')} (Optional)</label>
                <select
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                >
                  <option value="">None / General Deposit</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingRef} — {b.destination} ({b.totalPrice} {b.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('amount')} *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('currency')} *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold focus:outline-hidden text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="EGP">EGP (جنيه مصري - ج.م)</option>
                    <option value="USD">USD ($ - دولار)</option>
                    <option value="SAR">SAR (ر.س - ريال)</option>
                    <option value="EUR">EUR (€ - يورو)</option>
                    <option value="AED">AED (د.إ - درهم)</option>
                    <option value="KWD">KWD (د.ك - دينار)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('paymentMethod')}</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                  >
                    <option value="bank_transfer">{t('bankTransfer')}</option>
                    <option value="cash">{t('cash')}</option>
                    <option value="credit_card">{t('creditCard')}</option>
                    <option value="pos">{t('pos')}</option>
                    <option value="cheque">{t('cheque')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('transactionRef')}</label>
                  <input
                    type="text"
                    value={formData.transactionRef}
                    onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                    placeholder="Bank Auth / Ref"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Receipt explanation..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
