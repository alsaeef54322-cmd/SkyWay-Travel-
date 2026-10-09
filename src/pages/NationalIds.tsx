import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Plus, Trash2, Edit, ShieldCheck, Eye, EyeOff, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { NationalIdRecord, Customer } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';

export const NationalIds: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [records, setRecords] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMasked, setShowMasked] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    idNumber: '',
    issueDate: '',
    expiryDate: '',
    verificationStatus: 'verified' as 'verified' | 'pending' | 'rejected',
    notes: '',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recData, custData]: [any, any] = await Promise.all([
        api.get('/api/national-ids'),
        api.get('/api/customers?limit=100'),
      ]);
      setRecords(recData || []);
      setCustomers(custData?.data || []);
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
    setEditingId(null);
    setFormData({
      customerId: customers[0]?.id || '',
      idNumber: '',
      issueDate: '',
      expiryDate: '',
      verificationStatus: 'verified',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setEditingId(rec.id);
    setFormData({
      customerId: rec.customerId,
      idNumber: rec.idNumber,
      issueDate: rec.issueDate || '',
      expiryDate: rec.expiryDate || '',
      verificationStatus: rec.verificationStatus,
      notes: rec.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/national-ids/${editingId}`, formData);
      } else {
        await api.post('/api/national-ids', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save record');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/national-ids/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const filtered = records.filter(
    (r) =>
      r.idNumber.includes(search) ||
      (r.customerNameAr && r.customerNameAr.includes(search)) ||
      (r.customerNameEn && r.customerNameEn.toLowerCase().includes(search.toLowerCase())) ||
      r.customerId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-sky-500" />
            <span>{t('nationalIds')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'سجلات الهوية الوطنية والإقامات وبطاقات الأحوال المدنية'
              : 'National ID and Civil Registration records linked to customers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMasked(!showMasked)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0B1730] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            {showMasked ? <Eye className="w-4 h-4 text-sky-500" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
            <span>{showMasked ? (language === 'ar' ? 'إظهار الأرقام' : 'Reveal IDs') : (language === 'ar' ? 'إخفاء الأرقام' : 'Mask IDs')}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add')}</span>
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
            className="w-full h-9 ps-9 pe-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold">
                <th className="py-3 px-4 text-start">{t('nationalId')}</th>
                <th className="py-3 px-4 text-start">{t('customers')}</th>
                <th className="py-3 px-4 text-start">{t('issueDate')}</th>
                <th className="py-3 px-4 text-start">{t('expiryDate')}</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('noDataFound')}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const displayId = showMasked
                    ? r.idNumber.replace(/.(?=.{4})/g, '•')
                    : r.idNumber;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 tracking-wider">
                        {displayId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {language === 'ar' ? r.customerNameAr : r.customerNameEn}
                        <span className="text-[11px] text-slate-400 block font-mono">{r.customerId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {r.issueDate || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {r.expiryDate || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{r.verificationStatus}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            title={t('edit')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user?.permissions.canDeleteRecords && (
                            <button
                              onClick={() => setDeleteTargetId(r.id)}
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
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingId ? t('edit') : t('add')}
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
                <label className="block font-semibold mb-1">{t('nationalId')} *</label>
                <input
                  type="text"
                  required
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('issueDate')}</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('expiryDate')}</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
                  />
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
