import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Plus,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  X,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { VisaApplication, Customer } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { downloadExcelFile } from '../lib/excelExport.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';

interface VisasProps {
  onNavigate: (path: string) => void;
}

export const Visas: React.FC<VisasProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { defaultCurrency } = useSettings();

  const [visas, setVisas] = useState<VisaApplication[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    travelerName: '',
    passportNumber: '',
    destinationCountry: 'France',
    visaCategory: 'tourist' as any,
    submissionDate: new Date().toISOString().split('T')[0],
    appointmentDate: '',
    fees: 500,
    currency: defaultCurrency || 'EGP',
    notes: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vData, cData]: [any, any] = await Promise.all([
        api.get(`/api/visas?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        api.get('/api/customers?limit=100'),
      ]);
      setVisas(vData || []);
      setCustomers(cData?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const firstC = customers[0];
    setFormData({
      customerId: firstC?.id || '',
      travelerName: firstC?.fullNameEn || '',
      passportNumber: '',
      destinationCountry: 'France',
      visaCategory: 'tourist',
      submissionDate: new Date().toISOString().split('T')[0],
      appointmentDate: '',
      fees: 650,
      currency: defaultCurrency || 'EGP',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleToggleChecklist = async (visaId: string, checkId: string) => {
    const target = visas.find((v) => v.id === visaId);
    if (!target) return;

    const updatedChecklist = target.checklist.map((item) =>
      item.id === checkId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    try {
      await api.put(`/api/visas/${visaId}`, {
        checklist: updatedChecklist,
      });
      setVisas((prev) =>
        prev.map((v) => (v.id === visaId ? { ...v, checklist: updatedChecklist } : v))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/visas/${editingId}`, formData);
      } else {
        await api.post('/api/visas', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save visa application');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/visas/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportNotice(language === 'ar' ? 'جارٍ تجهيز ملف التأشيرات...' : 'Generating visas Excel...');
    try {
      await downloadExcelFile('visas');
      setExportNotice(language === 'ar' ? 'تم تنزيل ملف الإكسل بنجاح!' : 'Visas Excel downloaded!');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-purple-500" />
            <span>{t('visas')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'متابعة ملفات استخراج التأشيرات، قوائم المستندات المطلوبة، ومواعيد السفارات'
              : 'Visa applications dossier preparation, checklist verification, and consular appointments'}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createVisa')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full h-9 ps-9 pe-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">{t('status')}:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">{t('all')}</option>
            <option value="preparing">{t('preparing')}</option>
            <option value="appointment_scheduled">{t('appointmentScheduled')}</option>
            <option value="under_review">{t('underReview')}</option>
            <option value="approved">{t('approved')}</option>
            <option value="rejected">{t('rejected')}</option>
          </select>
        </div>
      </div>

      {/* Visas Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">{t('loading')}</div>
        ) : visas.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">{t('noDataFound')}</div>
        ) : (
          visas.map((v) => {
            const completedCount = v.checklist?.filter((c) => c.isCompleted).length || 0;
            const totalCount = v.checklist?.length || 1;
            const pct = Math.round((completedCount / totalCount) * 100);

            return (
              <div
                key={v.id}
                className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                      {v.applicationRef}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      {t(v.status as any)}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                    {v.destinationCountry} — {v.travelerName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Passport: {v.passportNumber || '-'}
                  </div>

                  {v.appointmentDate && (
                    <div className="mt-3 p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>{t('appointmentDate')}: <strong className="font-mono">{v.appointmentDate}</strong></span>
                    </div>
                  )}

                  {/* Document Checklist Accordion / Items */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                      <span>{t('checklist')}</span>
                      <span className="font-mono">{completedCount}/{totalCount} ({pct}%)</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {v.checklist?.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleChecklist(v.id, item.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                        >
                          {item.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                          )}
                          <span className={item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                            {language === 'ar' ? item.nameAr : item.nameEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {v.fees?.toLocaleString()} {v.currency}
                  </div>
                  <div className="flex items-center gap-1">
                    {user?.permissions.canDeleteRecords && (
                      <button
                        onClick={() => setDeleteTargetId(v.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('createVisa')}
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
                  onChange={(e) => {
                    const c = customers.find((x) => x.id === e.target.value);
                    setFormData({
                      ...formData,
                      customerId: e.target.value,
                      travelerName: c?.fullNameEn || c?.fullNameAr || '',
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullNameAr} / {c.fullNameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('travelerName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.travelerName}
                    onChange={(e) => setFormData({ ...formData, travelerName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('passportNumber')}</label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('destinationCountry')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.destinationCountry}
                    onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('fees')} ({formData.currency})</label>
                  <input
                    type="number"
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('currency')}</label>
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
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('appointmentDate')}</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
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
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold"
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
