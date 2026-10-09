import React, { useState } from 'react';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface LayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPath, onNavigate, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { direction, t } = useLanguage();

  // Compute breadcrumbs
  const pathSegments = currentPath.split('/').filter(Boolean);

  const getSegmentName = (seg: string) => {
    switch (seg) {
      case 'customers':
        return t('customers');
      case 'national-ids':
        return t('nationalIds');
      case 'passports':
        return t('passports');
      case 'bookings':
        return t('bookings');
      case 'calendar':
        return t('travelCalendar');
      case 'visas':
        return t('visas');
      case 'suppliers':
        return t('suppliers');
      case 'documents':
        return t('documents');
      case 'payments':
        return t('payments');
      case 'expenses':
        return t('expenses');
      case 'financial-reports':
        return t('financialReports');
      case 'excel-center':
        return t('excelCenter');
      case 'print-center':
        return t('printCenter');
      case 'employees':
        return t('employees');
      case 'audit-logs':
        return t('auditLogs');
      case 'settings':
        return t('settings');
      case 'backup':
        return t('backup');
      default:
        return seg;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080E1C] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 flex w-full relative">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-10 bg-black/40 backdrop-blur-2xs"
          />
        )}

        <Sidebar
          currentPath={currentPath}
          onNavigate={(p) => {
            onNavigate(p);
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 flex flex-col min-w-0">
          {/* Breadcrumb Header Bar */}
          <div className="mb-6 flex items-center justify-between gap-4 no-print">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto py-1">
              <button
                onClick={() => onNavigate('/')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t('dashboard')}
              </button>
              {pathSegments.map((seg, idx) => {
                const isLast = idx === pathSegments.length - 1;
                const pathSoFar = '/' + pathSegments.slice(0, idx + 1).join('/');
                return (
                  <React.Fragment key={seg}>
                    {direction === 'rtl' ? (
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    {isLast ? (
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {getSegmentName(seg)}
                      </span>
                    ) : (
                      <button
                        onClick={() => onNavigate(pathSoFar)}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {getSegmentName(seg)}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Child Page Content */}
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
};
