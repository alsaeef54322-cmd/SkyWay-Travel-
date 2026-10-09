import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Plane,
  Calendar,
  Compass,
  Building2,
  FolderOpen,
  Receipt,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  Printer,
  UserCheck,
  ShieldAlert,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isOpen, onToggle }) => {
  const { t, direction } = useLanguage();
  const { user } = useAuth();

  interface NavItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
    managerOrAdmin?: boolean;
  }

  interface NavGroup {
    titleAr: string;
    titleEn: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      titleAr: 'الرئيسية والعملاء',
      titleEn: 'Core & CRM',
      items: [
        { path: '/', label: t('dashboard'), icon: LayoutDashboard },
        { path: '/customers', label: t('customers'), icon: Users },
        { path: '/national-ids', label: t('nationalIds'), icon: CreditCard },
        { path: '/passports', label: t('passports'), icon: FileText },
      ],
    },
    {
      titleAr: 'عمليات السفر والرحلات',
      titleEn: 'Travel & Bookings',
      items: [
        { path: '/bookings', label: t('bookings'), icon: Plane },
        { path: '/calendar', label: t('travelCalendar'), icon: Calendar },
        { path: '/visas', label: t('visas'), icon: Compass },
        { path: '/suppliers', label: t('suppliers'), icon: Building2 },
      ],
    },
    {
      titleAr: 'المالية والمحاسبة',
      titleEn: 'Finance & Accounts',
      items: [
        { path: '/payments', label: t('payments'), icon: Receipt },
        { path: '/expenses', label: t('expenses'), icon: Wallet },
        { path: '/financial-reports', label: t('financialReports'), icon: BarChart3 },
      ],
    },
    {
      titleAr: 'المستندات والتقارير',
      titleEn: 'Documents & Reports',
      items: [
        { path: '/documents', label: t('documents'), icon: FolderOpen },
        { path: '/excel-center', label: t('excelCenter'), icon: FileSpreadsheet },
        { path: '/print-center', label: t('printCenter'), icon: Printer },
      ],
    },
    {
      titleAr: 'الإدارة والرقابة',
      titleEn: 'Administration',
      items: [
        { path: '/employees', label: t('employees'), icon: UserCheck, adminOnly: true },
        { path: '/audit-logs', label: t('auditLogs'), icon: ShieldAlert, managerOrAdmin: true },
        { path: '/settings', label: t('settings'), icon: Settings, adminOnly: true },
        { path: '/backup', label: t('backup'), icon: Database, adminOnly: true },
      ],
    },
  ];

  return (
    <aside
      className={`fixed md:sticky top-16 z-20 h-[calc(100vh-4rem)] bg-white dark:bg-[#0B1730] border-e border-slate-200 dark:border-slate-800 transition-all duration-200 flex flex-col ${
        isOpen ? 'w-64' : 'w-0 md:w-20 -translate-x-full md:translate-x-0'
      } overflow-hidden`}
    >
      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, gIdx) => {
          // Filter items based on permissions
          const visibleItems = group.items.filter((item) => {
            if (item.adminOnly && user?.role !== 'admin') return false;
            if (item.managerOrAdmin && user?.role !== 'admin' && user?.role !== 'manager') return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {isOpen && (
                <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {direction === 'rtl' ? group.titleAr : group.titleEn}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    title={!isOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shadow-xs border border-sky-200/60 dark:border-sky-800/60'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse Footer Toggle (Desktop) */}
      <div className="hidden md:flex p-3 border-t border-slate-200 dark:border-slate-800 justify-end">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {direction === 'rtl' ? (
            isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          ) : isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
