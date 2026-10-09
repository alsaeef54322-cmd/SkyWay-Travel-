import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PrintProvider } from './context/PrintContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { Layout } from './components/layout/Layout.tsx';
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Customers } from './pages/Customers.tsx';
import { CustomerDetail } from './pages/CustomerDetail.tsx';
import { NationalIds } from './pages/NationalIds.tsx';
import { Passports } from './pages/Passports.tsx';
import { Bookings } from './pages/Bookings.tsx';
import { BookingDetail } from './pages/BookingDetail.tsx';
import { TravelCalendar } from './pages/TravelCalendar.tsx';
import { Visas } from './pages/Visas.tsx';
import { Suppliers } from './pages/Suppliers.tsx';
import { Payments } from './pages/Payments.tsx';
import { Expenses } from './pages/Expenses.tsx';
import { FinancialReports } from './pages/FinancialReports.tsx';
import { ExcelCenter } from './pages/ExcelCenter.tsx';
import { Documents } from './pages/Documents.tsx';
import { Employees } from './pages/Employees.tsx';
import { AuditLogs } from './pages/AuditLogs.tsx';
import { Settings } from './pages/Settings.tsx';
import { PrintCenter } from './pages/PrintCenter.tsx';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080E1C] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-sm">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>SkyWay Travel Initializing...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Routing render helper
  const renderRoute = () => {
    if (currentPath === '/' || currentPath === '') {
      return <Dashboard onNavigate={handleNavigate} />;
    }
    if (currentPath === '/customers') {
      return <Customers onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith('/customers/')) {
      const id = currentPath.replace('/customers/', '');
      return <CustomerDetail customerId={id} onNavigate={handleNavigate} />;
    }
    if (currentPath === '/national-ids') {
      return <NationalIds />;
    }
    if (currentPath === '/passports') {
      return <Passports onNavigate={handleNavigate} />;
    }
    if (currentPath === '/bookings') {
      return <Bookings onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith('/bookings/')) {
      const id = currentPath.replace('/bookings/', '');
      return <BookingDetail bookingId={id} onNavigate={handleNavigate} />;
    }
    if (currentPath === '/calendar') {
      return <TravelCalendar onNavigate={handleNavigate} />;
    }
    if (currentPath === '/visas') {
      return <Visas onNavigate={handleNavigate} />;
    }
    if (currentPath === '/suppliers') {
      return <Suppliers />;
    }
    if (currentPath === '/payments') {
      return <Payments />;
    }
    if (currentPath === '/expenses') {
      return <Expenses />;
    }
    if (currentPath === '/financial-reports') {
      return <FinancialReports />;
    }
    if (currentPath === '/excel-center') {
      return <ExcelCenter />;
    }
    if (currentPath === '/documents') {
      return <Documents />;
    }
    if (currentPath === '/employees') {
      return <Employees />;
    }
    if (currentPath === '/audit-logs') {
      return <AuditLogs />;
    }
    if (currentPath === '/settings' || currentPath === '/backup') {
      return <Settings />;
    }
    if (currentPath === '/print-center') {
      return <PrintCenter />;
    }

    // 404 fallback
    return (
      <div className="py-24 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">404</h2>
        <p className="text-sm text-slate-500 mt-2">The requested page does not exist.</p>
        <button
          onClick={() => handleNavigate('/')}
          className="mt-6 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  return (
    <Layout currentPath={currentPath} onNavigate={handleNavigate}>
      {renderRoute()}
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <PrintProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </PrintProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
