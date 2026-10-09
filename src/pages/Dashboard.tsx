import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Plane,
  AlertTriangle,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Compass,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { api } from '../lib/api.ts';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const { companyName, defaultCurrency } = useSettings();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | '30d' | '7d' | 'all'>('month');
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'passports' | 'visas'>('all');
  const [isDeadlinesExpanded, setIsDeadlinesExpanded] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>(`/api/dashboard/stats?period=${period}`);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  const currency = stats?.currency || 'EGP';
  const currencyDisplay = language === 'ar' ? 'ج.م' : currency;

  // Compute alert lists
  const expiringPassportsList = stats?.expiringPassportsList || [];
  const urgentVisasList = stats?.urgentVisasList || [];
  const urgentDeadlinesCount =
    stats?.urgentDeadlinesCount ?? (expiringPassportsList.length + urgentVisasList.length);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('dashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? `مؤشرات الأداء التشغيلي والمالي لوكالة ${companyName}`
              : `${companyName} Operational & Financial Performance`}
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-900/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === '7d'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === '30d'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'month'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'ar' ? 'هذا الشهر' : 'This Month'}
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </button>
          </div>

          <button
            onClick={fetchStats}
            title={t('refresh')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1730] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="p-3 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2 overflow-x-auto shadow-2xs">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
          {t('quickActions')}:
        </span>
        <button
          onClick={() => onNavigate('/customers')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('addCustomer')}</span>
        </button>
        <button
          onClick={() => onNavigate('/bookings')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <Plane className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('createBooking')}</span>
        </button>
        <button
          onClick={() => onNavigate('/passports')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('addPassport')}</span>
        </button>
        <button
          onClick={() => onNavigate('/payments')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('recordPayment')}</span>
        </button>
        <button
          onClick={() => onNavigate('/visas')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <Compass className="w-3.5 h-3.5 text-purple-500" />
          <span>{t('createVisa')}</span>
        </button>
        <button
          onClick={() => onNavigate('/excel-center')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('excelCenter')}</span>
        </button>
        <button
          onClick={() => onNavigate('/print-center')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('printCenter')}</span>
        </button>
      </div>

      {/* Real-time Expiry & Deadline Notification Badge System */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-purple-950/30 border border-amber-300/60 dark:border-amber-700/50 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md flex items-center justify-center">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'نظام شارات التنبيهات ومواعيد التجديد' : 'Expiry Alerts & Deadlines Center'}
                </h2>
                {urgentDeadlinesCount > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs font-mono">
                    {urgentDeadlinesCount} {language === 'ar' ? 'تنبيه عاجل' : 'Urgent'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
                    {language === 'ar' ? 'كل المواعيد سارية' : 'All Clear'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'رصد فوري لتواريخ انتهاء جوازات السفر ومواعيد بصمة ومقابلات التأشيرات بالسفارات'
                  : 'Real-time tracking for expiring passports and embassy visa deadlines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setDeadlineFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  deadlineFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'ar' ? `الكل (${urgentDeadlinesCount})` : `All (${urgentDeadlinesCount})`}
              </button>
              <button
                onClick={() => setDeadlineFilter('passports')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  deadlineFilter === 'passports'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                }`}
              >
                {language === 'ar' ? `جوازات السفر (${expiringPassportsList.length})` : `Passports (${expiringPassportsList.length})`}
              </button>
              <button
                onClick={() => setDeadlineFilter('visas')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  deadlineFilter === 'visas'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
                }`}
              >
                {language === 'ar' ? `التأشيرات (${urgentVisasList.length})` : `Visas (${urgentVisasList.length})`}
              </button>
            </div>

            <button
              onClick={() => setIsDeadlinesExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white transition-colors cursor-pointer"
              title={isDeadlinesExpanded ? 'طي التنبيهات' : 'عرض تفاصيل التنبيهات'}
            >
              {isDeadlinesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Actionable Cards Grid */}
        {isDeadlinesExpanded && (
          <div className="pt-2">
            {urgentDeadlinesCount === 0 ? (
              <div className="p-6 bg-white/90 dark:bg-[#0B1730]/90 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>
                  {language === 'ar'
                    ? 'ممتاز يا فندم! لا توجد أي جوازات سفر منتهية ولا تأشيرات متأخرة في الوقت الحالي.'
                    : 'All clear! No expired passports or overdue visa deadlines.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Expiring Passports Cards */}
                {(deadlineFilter === 'all' || deadlineFilter === 'passports') &&
                  expiringPassportsList.map((p: any) => {
                    const isExpired = p.daysRemaining <= 0;
                    return (
                      <div
                        key={`pass-${p.id}`}
                        className={`p-4 rounded-2xl bg-white dark:bg-[#0B1730] border transition-all shadow-xs flex flex-col justify-between gap-3 ${
                          isExpired
                            ? 'border-rose-400 dark:border-rose-800/80 ring-1 ring-rose-400/20'
                            : 'border-amber-300 dark:border-amber-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1.5 rounded-lg text-white ${
                                isExpired ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[160px]">
                                {language === 'ar' ? p.holderNameAr || p.holderNameEn : p.holderNameEn || p.holderNameAr}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {p.passportNumber}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isExpired
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isExpired
                              ? language === 'ar' ? 'منتهي الصلاحية' : 'Expired'
                              : `${p.daysRemaining} ${language === 'ar' ? 'يوم متبقي' : 'days left'}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <span className="text-slate-500">
                            {language === 'ar' ? 'تاريخ الانتهاء:' : 'Expiry:'}{' '}
                            <strong className="font-mono text-slate-700 dark:text-slate-300">
                              {p.expiryDate}
                            </strong>
                          </span>
                          <button
                            onClick={() => onNavigate('/passports')}
                            className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            <span>{language === 'ar' ? 'فحص وتجديد' : 'Renew'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {/* Urgent Visas Cards */}
                {(deadlineFilter === 'all' || deadlineFilter === 'visas') &&
                  urgentVisasList.map((v: any) => {
                    return (
                      <div
                        key={`visa-${v.id}`}
                        className="p-4 rounded-2xl bg-white dark:bg-[#0B1730] border border-purple-300 dark:border-purple-800/60 transition-all shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-purple-500 text-white">
                              <Compass className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[160px]">
                                {v.travelerName}
                              </div>
                              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                {v.destinationCountry} • {t(v.visaCategory as any) || v.visaCategory}
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            {t(v.status as any) || v.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <span className="text-slate-500">
                            {v.appointmentDate ? (
                              <>
                                {language === 'ar' ? 'موعد البصمة:' : 'Appointment:'}{' '}
                                <strong className="font-mono text-purple-700 dark:text-purple-300">
                                  {v.appointmentDate}
                                </strong>
                              </>
                            ) : (
                              <>
                                {language === 'ar' ? 'كود المرجع:' : 'Ref:'}{' '}
                                <strong className="font-mono text-slate-700 dark:text-slate-300">
                                  {v.applicationRef}
                                </strong>
                              </>
                            )}
                          </span>
                          <button
                            onClick={() => onNavigate('/visas')}
                            className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                          >
                            <span>{language === 'ar' ? 'متابعة التأشيرة' : 'Track'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary KPI Grid (Top Row: Operations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => onNavigate('/customers')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('totalCustomers')}</span>
            <Users className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats?.totalCustomers || 0}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              +{stats?.newCustomers || 0} {language === 'ar' ? 'جديد' : 'new'}
            </div>
          </div>
        </div>

        {/* Passports & Expiry Warning */}
        <div
          onClick={() => onNavigate('/passports')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('totalPassports')}</span>
            <div className="flex items-center gap-1.5">
              {(stats?.expiringPassports > 0 || stats?.expiredPassports > 0) && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
              <FileText className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats?.totalPassports || 0}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{stats?.expiringPassports || 0} {language === 'ar' ? 'ينتهي قريباً' : 'expiring'}</span>
            </div>
          </div>
        </div>

        {/* Active Bookings & Upcoming Departures */}
        <div
          onClick={() => onNavigate('/bookings')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('activeBookings')}</span>
            <Plane className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats?.activeBookings || 0}
            </div>
            <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold font-mono">
              {stats?.upcomingDepartures || 0} {language === 'ar' ? 'إقلاع قادم' : 'departures'}
            </div>
          </div>
        </div>

        {/* Pending Visas */}
        <div
          onClick={() => onNavigate('/visas')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('pendingVisas')}</span>
            <div className="flex items-center gap-1.5">
              {stats?.pendingVisas > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
              <Compass className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats?.pendingVisas || 0}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              {language === 'ar' ? 'قيد المتابعة' : 'In Process'}
            </div>
          </div>
        </div>
      </div>

      {/* Authoritative Financial KPI Grid (Second Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payments Collected */}
        <div
          onClick={() => onNavigate('/payments')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('totalPaymentsReceived')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats?.totalPaymentsReceived?.toLocaleString()} {currencyDisplay}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'ar' ? 'إجمالي المحصل الفعلي' : 'Actual Cash Inflow'}
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div
          onClick={() => onNavigate('/payments')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('outstandingBalances')}</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {stats?.outstandingBalances?.toLocaleString()} {currencyDisplay}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'ar' ? 'مستحقات غير محصلة' : 'Receivables Pending'}
            </div>
          </div>
        </div>

        {/* Total Expenses & Supplier Cost */}
        <div
          onClick={() => onNavigate('/expenses')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('totalExpenses')}</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats?.totalExpenses?.toLocaleString()} {currencyDisplay}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'ar' ? 'تكاليف ومصروفات تشغيل' : 'Operating Outflow'}
            </div>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div
          onClick={() => onNavigate('/financial-reports')}
          className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('netProfit')}</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                (stats?.netProfit || 0) >= 0
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats?.netProfit?.toLocaleString()} {currencyDisplay}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'ar' ? 'صافي الإيرادات بعد المصاريف' : 'Net Cash Position'}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Financial Chart & Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Cards */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('monthlyRevenueTrend')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'مقارنة الإيرادات والمصروفات وصافي الأرباح' : 'Revenue, Expenses & Profit Breakdown'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('/financial-reports')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>{t('view')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {stats?.monthlyData?.map((m: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="text-xs font-bold text-slate-500 uppercase">{m.month}</div>
                <div className="my-2 space-y-1">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    +{m.revenue?.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-rose-500 font-mono">
                    -{m.expenses?.toLocaleString()}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white">
                  {m.profit?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Category Breakdown */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('serviceDistribution')}
          </h2>

          <div className="space-y-3 pt-2">
            {stats?.serviceDistribution &&
              Object.entries(stats.serviceDistribution).map(([cat, count]: [string, any]) => {
                const total = stats.activeBookings || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {t(cat as any) || cat}
                      </span>
                      <span className="font-mono text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Bookings & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('recentBookings')}
            </h2>
            <button
              onClick={() => onNavigate('/bookings')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>{t('all')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[11px]">
                  <th className="pb-3 text-start">{t('bookingRef')}</th>
                  <th className="pb-3 text-start">{t('customers')}</th>
                  <th className="pb-3 text-start">{t('destination')}</th>
                  <th className="pb-3 text-start">{t('departureDate')}</th>
                  <th className="pb-3 text-end">{t('totalPrice')}</th>
                  <th className="pb-3 text-end">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {stats?.latestBookings?.map((b: any) => (
                  <tr
                    key={b.id}
                    onClick={() => onNavigate(`/bookings/${b.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {b.bookingRef}
                    </td>
                    <td className="py-3 font-medium text-slate-900 dark:text-white">
                      {language === 'ar' ? b.customerNameAr : b.customerNameEn}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {b.destination}
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
                      {b.departureDate}
                    </td>
                    <td className="py-3 text-end font-mono font-bold text-slate-900 dark:text-white">
                      {b.totalPrice?.toLocaleString()} {b.currency === 'EGP' && language === 'ar' ? 'ج.م' : (b.currency || currencyDisplay)}
                    </td>
                    <td className="py-3 text-end">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Audit Feed */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('recentActivities')}
            </h2>
            <button
              onClick={() => onNavigate('/audit-logs')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>{t('all')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {stats?.recentActivities?.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 text-xs">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 leading-snug">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {a.userName}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {a.details}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
