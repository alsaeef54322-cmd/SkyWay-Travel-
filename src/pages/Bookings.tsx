import React, { useState, useEffect } from 'react';
import {
  Plane,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit,
  Eye,
  Calendar,
  CreditCard,
  DollarSign,
  X,
  Compass,
  Building,
  Car,
  Briefcase,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { Booking, Customer, Supplier, ServiceCategory } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { downloadExcelFile } from '../lib/excelExport.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';

interface BookingsProps {
  onNavigate: (path: string) => void;
}

export const Bookings: React.FC<BookingsProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { settings, defaultCurrency } = useSettings();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    serviceCategory: 'flight' as ServiceCategory,
    destination: '',
    origin: '',
    departureDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    airline: '',
    flightNumber: '',
    ticketNumber: '',
    hotelDetails: '',
    supplierId: '',
    totalPrice: 1000,
    supplierCost: 800,
    currency: 'EGP',
    internalNotes: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bkData, custData, suppData]: [any, any, any] = await Promise.all([
        api.get(`/api/bookings?status=${statusFilter}&serviceCategory=${categoryFilter}&search=${encodeURIComponent(search)}`),
        api.get('/api/customers?limit=100'),
        api.get('/api/suppliers'),
      ]);
      setBookings(bkData || []);
      setCustomers(custData?.data || []);
      setSuppliers(suppData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      customerId: customers[0]?.id || '',
      serviceCategory: 'flight',
      destination: '',
      origin: 'Riyadh (RUH)',
      departureDate: today,
      returnDate: '',
      airline: 'Saudia Airlines',
      flightNumber: '',
      ticketNumber: '',
      hotelDetails: '',
      supplierId: suppliers[0]?.id || '',
      totalPrice: 1500,
      supplierCost: 1200,
      currency: defaultCurrency || 'EGP',
      internalNotes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Booking) => {
    setEditingId(b.id);
    setFormData({
      customerId: b.customerId,
      serviceCategory: b.serviceCategory,
      destination: b.destination,
      origin: b.origin || '',
      departureDate: b.departureDate,
      returnDate: b.returnDate || '',
      airline: b.airline || '',
      flightNumber: b.flightNumber || '',
      ticketNumber: b.ticketNumber || '',
      hotelDetails: b.hotelDetails || '',
      supplierId: b.supplierId || '',
      totalPrice: b.totalPrice,
      supplierCost: b.supplierCost,
      currency: b.currency,
      internalNotes: b.internalNotes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/bookings/${editingId}`, formData);
      } else {
        await api.post('/api/bookings', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save booking');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/bookings/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportNotice(language === 'ar' ? 'جارٍ تجهيز ملف الحجوزات...' : 'Generating bookings Excel...');
    try {
      await downloadExcelFile('bookings');
      setExportNotice(language === 'ar' ? 'تم تنزيل ملف الإكسل بنجاح!' : 'Bookings Excel downloaded!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      setExportNotice(err.message || 'Export failed');
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Plane className="w-6 h-6 text-sky-500" />
            <span>{t('bookings')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'إدارة حجوزات الطيران، البكجات، الفنادق، ومتابعة سندات القبض والتكاليف'
              : 'Travel bookings, ticketing, tour packages, hotel reservations, and supplier costs'}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createBooking')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full h-9 ps-9 pe-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">{t('serviceCategory')}:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">{t('all')}</option>
              <option value="flight">{t('flight')}</option>
              <option value="package">{t('package')}</option>
              <option value="visa">{t('visa')}</option>
              <option value="hotel">{t('hotel')}</option>
              <option value="transfer">{t('transfer')}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">{t('status')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">{t('all')}</option>
              <option value="confirmed">{t('bookingConfirmed')}</option>
              <option value="pending">{t('bookingPending')}</option>
              <option value="completed">{t('bookingCompleted')}</option>
              <option value="cancelled">{t('bookingCancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold">
                <th className="py-3 px-4 text-start">{t('bookingRef')}</th>
                <th className="py-3 px-4 text-start">{t('customers')}</th>
                <th className="py-3 px-4 text-start">{t('serviceCategory')} & {t('destination')}</th>
                <th className="py-3 px-4 text-start">{t('departureDate')}</th>
                <th className="py-3 px-4 text-end">{t('totalPrice')}</th>
                <th className="py-3 px-4 text-end">{t('remainingAmount')}</th>
                <th className="py-3 px-4 text-end">{t('status')}</th>
                <th className="py-3 px-4 text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {t('loading')}
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {t('noDataFound')}
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {b.bookingRef}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {language === 'ar' ? b.customerNameAr : b.customerNameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {b.customerPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="capitalize">{t(b.serviceCategory as any) || b.serviceCategory}</span>
                        <span>·</span>
                        <span>{b.destination}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {b.airline} {b.flightNumber ? `(${b.flightNumber})` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div>{b.departureDate}</div>
                      {b.returnDate && (
                        <div className="text-[10px] text-slate-400">Return: {b.returnDate}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono font-bold text-slate-900 dark:text-white">
                      {b.totalPrice?.toLocaleString()} {b.currency}
                      <div className="text-[10px] text-slate-400 font-normal">
                        Cost: {b.supplierCost?.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono">
                      <div
                        className={`font-bold ${
                          (b.remainingBalance || 0) > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {(b.remainingBalance || 0)?.toLocaleString()} {b.currency}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {t(b.paymentStatus as any)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : b.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t(b.status as any)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`/bookings/${b.id}`)}
                          title={t('view')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(b)}
                          title={t('edit')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user?.permissions.canDeleteRecords && (
                          <button
                            onClick={() => setDeleteTargetId(b.id)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-500" />
                <span>{editingId ? t('edit') : t('createBooking')}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('customers')} *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullNameAr} / {c.fullNameEn} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('serviceCategory')} *</label>
                  <select
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  >
                    <option value="flight">{t('flight')}</option>
                    <option value="package">{t('package')}</option>
                    <option value="visa">{t('visa')}</option>
                    <option value="hotel">{t('hotel')}</option>
                    <option value="transfer">{t('transfer')}</option>
                    <option value="custom">{t('custom')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('destination')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. London Heathrow (LHR)"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('origin')}</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g. Riyadh King Khalid (RUH)"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('departureDate')} *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('returnDate')}</label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('airline')}</label>
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    placeholder="e.g. Saudia, Emirates"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('flightNumber')}</label>
                  <input
                    type="text"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                    placeholder="SV 115"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('ticketNumber')}</label>
                  <input
                    type="text"
                    value={formData.ticketNumber}
                    onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
                    placeholder="065-XXXXXXXX"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('totalPrice')} *</label>
                  <input
                    type="number"
                    required
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('supplierCost')} *</label>
                  <input
                    type="number"
                    required
                    value={formData.supplierCost}
                    onChange={(e) => setFormData({ ...formData, supplierCost: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('currency')} *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-hidden text-emerald-600 dark:text-emerald-400"
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
                  <label className="block font-semibold mb-1">{t('suppliers')}</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  >
                    <option value="">None</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('notes')}</label>
                <textarea
                  rows={2}
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
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
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold"
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
