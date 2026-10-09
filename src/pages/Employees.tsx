import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Plus, Shield, Phone, Mail, Lock, Check, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';

export const Employees: React.FC = () => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'employee' | 'accountant',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    permissions: {
      canManageCustomers: true,
      canManagePassports: true,
      canManageBookings: true,
      canManageVisas: true,
      canManageFinances: false,
      canDeleteRecords: false,
      canExportExcel: true,
      canManageEmployees: false,
      canManageSettings: false,
      canViewAuditLogs: false,
    },
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/api/employees');
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      phone: '',
      status: 'active',
      permissions: {
        canManageCustomers: true,
        canManagePassports: true,
        canManageBookings: true,
        canManageVisas: true,
        canManageFinances: false,
        canDeleteRecords: false,
        canExportExcel: true,
        canManageEmployees: false,
        canManageSettings: false,
        canViewAuditLogs: false,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      phone: emp.phone || '',
      status: emp.status,
      permissions: emp.permissions || {
        canManageCustomers: true,
        canManagePassports: true,
        canManageBookings: true,
        canManageVisas: true,
        canManageFinances: false,
        canDeleteRecords: false,
        canExportExcel: true,
        canManageEmployees: false,
        canManageSettings: false,
        canViewAuditLogs: false,
      },
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/employees/${editingId}`, formData);
      } else {
        await api.post('/api/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to save employee account');
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.phone && e.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-500" />
            <span>{t('employees')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'إدارة حسابات موظفي الوكالة، الصلاحيات الدقيقة، ومستويات الدخول'
              : 'Manage employee accounts, role-based access control, and permissions'}
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة موظف جديد' : 'New Employee'}</span>
          </button>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 py-16 text-center text-slate-400 text-xs">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-4 py-16 text-center text-slate-400 text-xs">{t('noDataFound')}</div>
        ) : (
          filtered.map((emp) => (
            <div
              key={emp.id}
              className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400 font-bold">{emp.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      emp.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {t(emp.status as any)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center shrink-0">
                    {emp.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {emp.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 capitalize">
                      {t(emp.role as any) || emp.role}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {emp.lastLogin ? `Login: ${new Date(emp.lastLogin).toLocaleDateString()}` : 'No login yet'}
                </span>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-200"
                  >
                    {t('edit')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingId ? t('edit') : 'New Employee Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t('employeeName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('loginEmail')} *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingId}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {editingId ? 'Change Password (Optional)' : `${t('loginPassword')} *`}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('role')} *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
                  >
                    <option value="admin">{t('admin')}</option>
                    <option value="manager">{t('manager')}</option>
                    <option value="employee">{t('employeeRole')}</option>
                    <option value="accountant">{t('accountant')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('phone')}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
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
    </div>
  );
};
