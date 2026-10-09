import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Clock, User, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AuditLog } from '../types/client.ts';
import { api } from '../lib/api.ts';

export const AuditLogs: React.FC = () => {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get<AuditLog[]>('/api/audit-logs');
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-sky-500" />
            <span>{t('auditLogs')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'سجل العمليات والرقابة الأمنية الصارمة لجميع العمليات المنفذة في النظام'
              : 'Security activity log and audit trail of user operations'}
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          <span className="text-xs text-slate-500 font-semibold">{t('actions')}:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-hidden"
          >
            <option value="all">{t('all')}</option>
            <option value="login">Login</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
            <option value="import">Import</option>
            <option value="backup">Backup</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold">
                <th className="py-3 px-4 text-start">{t('date')}</th>
                <th className="py-3 px-4 text-start">{t('employeeName')}</th>
                <th className="py-3 px-4 text-start">{t('actions')}</th>
                <th className="py-3 px-4 text-start">الكيان / السجل</th>
                <th className="py-3 px-4 text-start">التفاصيل</th>
                <th className="py-3 px-4 text-end">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">{t('loading')}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">{t('noDataFound')}</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {l.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          l.action === 'create'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : l.action === 'update'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : l.action === 'delete'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : l.action === 'login'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {l.entity} {l.entityId ? `(${l.entityId})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-sm truncate">
                      {l.details}
                    </td>
                    <td className="py-3 px-4 text-end font-mono text-slate-400 text-[11px]">
                      {l.ip || 'local'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
