import React, { useState, useEffect } from 'react';
import { Search, Globe, Sun, Moon, Bell, LogOut, Menu, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Logo } from '../common/Logo.tsx';
import { GlobalSearchModal } from '../common/GlobalSearchModal.tsx';
import { NotificationsModal } from '../common/NotificationsModal.tsx';
import { api } from '../../lib/api.ts';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get<any[]>('/api/notifications');
      if (Array.isArray(data)) {
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 px-4 md:px-6 bg-white dark:bg-[#0B1730] border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 flex items-center justify-between gap-4 transition-colors">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="cursor-pointer" onClick={() => onNavigate('/')}>
            <Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Center: Global Search Trigger Button */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full h-10 px-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-between text-xs transition-all hover:border-sky-300 dark:hover:border-sky-700"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>{t('globalSearchPlaceholder')}</span>
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions (Language, Theme, Notifications, Profile, Logout) */}
        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-semibold transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
          </button>

          {/* Notifications with badge */}
          <button
            onClick={() => setIsNotifOpen(true)}
            title={t('notifications')}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Employee User Avatar & Info */}
          {user && (
            <div className="flex items-center gap-2 pl-2 rtl:pr-2 border-s border-slate-200 dark:border-slate-800">
              <div className="hidden lg:flex flex-col text-end rtl:text-start leading-tight">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 capitalize font-medium flex items-center gap-1 justify-end rtl:justify-start">
                  <Shield className="w-2.5 h-2.5" />
                  {t(user.role as any) || user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title={t('logout')}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={onNavigate}
        onUpdated={fetchUnreadCount}
      />
    </>
  );
};
