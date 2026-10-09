import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Passport, Customer } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { downloadExcelFile } from '../lib/excelExport.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';

interface PassportsProps {
  onNavigate: (path: string) => void;
}

export const Passports: React.FC<PassportsProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [passports, setPassports] = useState<Passport[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMasked, setShowMasked] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    passportNumber: '',
    holderNameAr: '',
    holderNameEn: '',
    nationality: 'Saudi Arabia',
    dob: '1990-01-01',
    gender: 'male' as 'male' | 'female',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: 'جوازات الرياض',
    passportType: 'regular' as 'regular' | 'diplomatic' | 'special',
    notes: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [passData, custData]: [any, any] = await Promise.all([
        api.get(`/api/passports?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        api.get('/api/customers?limit=100'),
      ]);
      setPassports(passData || []);
      setCustomers(custData?.data || []);
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
    const firstCust = customers[0];
    setFormData({
      customerId: firstCust?.id || '',
      passportNumber: '',
      holderNameAr: firstCust?.fullNameAr || '',
      holderNameEn: firstCust?.fullNameEn || '',
      nationality: firstCust?.nationality || 'Saudi Arabia',
      dob: firstCust?.dob || '1990-01-01',
      gender: firstCust?.gender === 'female' ? 'female' : 'male',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      issuingAuthority: 'جوازات الرياض',
      passportType: 'regular',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCustomerSelectChange = (custVal: string) => {
    const found = customers.find((c) => c.id === custVal);
    setFormData((prev) => ({
      ...prev,
      customerId: custVal,
      holderNameAr: found ? found.fullNameAr : prev.holderNameAr,
      holderNameEn: found ? found.fullNameEn : prev.holderNameEn,
      nationality: found ? found.nationality : prev.nationality,
      dob: found ? found.dob : prev.dob,
    }));
  };

  const handleOpenEdit = (p: Passport) => {
    setEditingId(p.id);
    setFormData({
      customerId: p.customerId,
      passportNumber: p.passportNumber,
      holderNameAr: p.holderNameAr,
      holderNameEn: p.holderNameEn,
      nationality: p.nationality,
      dob: p.dob || '1990-01-01',
      gender: p.gender === 'female' ? 'female' : 'male',
      issueDate: p.issueDate,
      expiryDate: p.expiryDate,
      issuingAuthority: p.issuingAuthority,
      passportType: p.passportType,
      notes: p.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/passports/${editingId}`, formData);
      } else {
        await api.post('/api/passports', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save passport');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/passports/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportNotice(language === 'ar' ? 'جارٍ تجهيز ملف جوازات السفر...' : 'Generating passports Excel...');
    try {
      await downloadExcelFile('passports');
      setExportNotice(language === 'ar' ? 'تم تنزيل ملف الإكسل بنجاح!' : 'Passports Excel downloaded!');
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
            <FileText className="w-6 h-6 text-amber-500" />
            <span>{t('passports')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'متابعة صلاحية جوازات السفر الدولية والتنبيه المبكر لتواريخ الانتهاء'
              : 'International passport validity tracking and early expiry warnings'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMasked(!showMasked)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B1730] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            {showMasked ? <Eye className="w-4 h-4 text-sky-500" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
            <span>{showMasked ? (language === 'ar' ? 'إظهار الأرقام' : 'Reveal') : (language === 'ar' ? 'إخفاء' : 'Mask')}</span>
          </button>
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addPassport')}</span>
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
            className="w-full h-9 ps-9 pe-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
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
            <option value="valid">{t('valid')}</option>
            <option value="expiring_soon">{t('expiringSoon')}</option>
            <option value="expired">{t('expired')}</option>
          </select>
        </div>
      </div>

      {/* Passports Table */}
      <div className="bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold">
                <th className="py-3 px-4 text-start">{t('passportNumber')}</th>
                <th className="py-3 px-4 text-start">{t('holderNameAr')} / {t('holderNameEn')}</th>
                <th className="py-3 px-4 text-start">{t('nationality')}</th>
                <th className="py-3 px-4 text-start">{t('issueDate')} & {t('expiryDate')}</th>
                <th className="py-3 px-4 text-start">{t('status')}</th>
                <th className="py-3 px-4 text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('loading')}
                  </td>
                </tr>
              ) : passports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('noDataFound')}
                  </td>
                </tr>
              ) : (
                passports.map((p) => {
                  const displayPassNum = showMasked
                    ? p.passportNumber.replace(/.(?=.{3})/g, '•')
                    : p.passportNumber;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                        {displayPassNum}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{language === 'ar' ? p.holderNameAr || p.holderNameEn : p.holderNameEn || p.holderNameAr}</span>
                          <button
                            onClick={() => onNavigate(`/customers/${p.customerId}`)}
                            title="View Customer"
                            className="text-slate-400 hover:text-sky-500"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {p.customerId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {p.nationality}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        <div>{t('expiryDate')}: <span className="font-bold text-slate-900 dark:text-white">{p.expiryDate}</span></div>
                        <div className="text-[10px] text-slate-400">{t('issueDate')}: {p.issueDate}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                            p.status === 'valid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : p.status === 'expiring_soon'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {p.status === 'valid' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status === 'expiring_soon' && <AlertTriangle className="w-3 h-3" />}
                          {p.status === 'expired' && <XCircle className="w-3 h-3" />}
                          <span>{t(p.status as any)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title={t('edit')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user?.permissions.canDeleteRecords && (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>{editingId ? t('edit') : t('addPassport')}</span>
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
                    onChange={(e) => handleCustomerSelectChange(e.target.value)}
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
                  <label className="block font-semibold mb-1">{t('passportNumber')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    placeholder="e.g. K4891024"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('holderNameAr')}</label>
                  <input
                    type="text"
                    value={formData.holderNameAr}
                    onChange={(e) => setFormData({ ...formData, holderNameAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('holderNameEn')}</label>
                  <input
                    type="text"
                    value={formData.holderNameEn}
                    onChange={(e) => setFormData({ ...formData, holderNameEn: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('nationality')}</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('issueDate')} *</label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('expiryDate')} *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('issuingAuthority')}</label>
                  <input
                    type="text"
                    value={formData.issuingAuthority}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('passportType')}</label>
                  <select
                    value={formData.passportType}
                    onChange={(e) => setFormData({ ...formData, passportType: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
                  >
                    <option value="regular">{t('regular')}</option>
                    <option value="diplomatic">{t('diplomatic')}</option>
                    <option value="special">{t('special')}</option>
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
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
