import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Download,
  FileText,
  FileCheck,
  Plane,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CustomerDocument, Customer } from '../types/client.ts';
import { api } from '../lib/api.ts';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';

export const Documents: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Upload modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<CustomerDocument['documentType']>('passport_scan');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docData, custData]: [any, any] = await Promise.all([
        api.get('/api/documents'),
        api.get('/api/customers?limit=100'),
      ]);
      setDocuments(docData || []);
      setCustomers(custData?.data || []);
      if (custData?.data?.length > 0 && !customerId) {
        setCustomerId(custData.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !title || !customerId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('customerId', customerId);
    formData.append('title', title);
    formData.append('documentType', docType);

    try {
      await api.post('/api/documents/upload', formData);
      setIsModalOpen(false);
      setTitle('');
      setFileToUpload(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/documents/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (d.customerNameAr && d.customerNameAr.includes(search)) ||
      (d.customerNameEn && d.customerNameEn.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === 'all' || d.documentType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-sky-500" />
            <span>{t('documents')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'الأرشيف الآمن لوثائق وصور جوازات السفر وتذاكر وفواتير العملاء'
              : 'Secure customer documents repository for passports, tickets, and vouchers'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('uploadDocument')}</span>
        </button>
      </div>

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

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">{t('documentType')}:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-hidden"
          >
            <option value="all">{t('all')}</option>
            <option value="passport_scan">{t('passportScan')}</option>
            <option value="national_id_scan">{t('nationalIdScan')}</option>
            <option value="ticket">{t('ticketDoc')}</option>
            <option value="voucher">{t('voucherDoc')}</option>
            <option value="receipt">{t('receiptDoc')}</option>
            <option value="other">{t('other')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">{t('noDataFound')}</div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                    {t(d.documentType as any) || d.documentType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round(d.fileSize / 1024)} KB
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 leading-snug">
                  {d.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  {language === 'ar' ? d.customerNameAr : d.customerNameEn}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  {d.fileName}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(d.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={d.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                    title={t('download')}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {user?.permissions.canDeleteRecords && (
                    <button
                      onClick={() => setDeleteTargetId(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('uploadDocument')}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t('customers')} *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
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
                <label className="block font-semibold mb-1">{t('documentTitle')} *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Passport Copy - Full Color Scan"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('documentType')}</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                >
                  <option value="passport_scan">{t('passportScan')}</option>
                  <option value="national_id_scan">{t('nationalIdScan')}</option>
                  <option value="ticket">{t('ticketDoc')}</option>
                  <option value="voucher">{t('voucherDoc')}</option>
                  <option value="receipt">{t('receiptDoc')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">File (PDF, JPG, PNG) *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileToUpload(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
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
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold"
                >
                  {uploading ? 'Uploading...' : t('save')}
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
