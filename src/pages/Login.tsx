import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { Logo } from '../components/common/Logo.tsx';
import { Globe, Sun, Moon, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { language, toggleLanguage, direction } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { companyName, tagline } = useSettings();

  const [email, setEmail] = useState('admin@skyway.com');
  const [password, setPassword] = useState('SkyWay@2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('SkyWay@2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080E1C] flex flex-col justify-between p-4 sm:p-6 transition-colors font-sans">
      {/* Top bar with quick language and theme toggles */}
      <div className="w-full flex items-center justify-between max-w-6xl mx-auto">
        <Logo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
          </button>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showSubtitle={false} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === 'ar' ? `تسجيل الدخول - ${companyName}` : `Sign In to ${companyName}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {tagline}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@skyway.com"
                  className="w-full h-11 ps-10 pe-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 ps-10 pe-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#0B1730] via-[#123B67] to-[#38A7E8] text-white font-bold text-xs shadow-lg hover:shadow-sky-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? (language === 'ar' ? 'جاري التحقق...' : 'Signing In...') : (language === 'ar' ? 'دخول إلى النظام' : 'Sign In')}</span>
              {direction === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              {language === 'ar' ? 'حسابات تجريبية سريعة' : 'Quick Demo Accounts'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@skyway.com')}
                className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-start transition-colors"
              >
                <div className="font-bold text-[11px] text-sky-600 dark:text-sky-400">Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@skyway.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('sarah.ops@skyway.com')}
                className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-start transition-colors"
              >
                <div className="font-bold text-[11px] text-sky-600 dark:text-sky-400">Operations</div>
                <div className="text-[10px] text-slate-400 truncate">sarah.ops@skyway.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('omar.accounts@skyway.com')}
                className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-start transition-colors"
              >
                <div className="font-bold text-[11px] text-sky-600 dark:text-sky-400">Accountant</div>
                <div className="text-[10px] text-slate-400 truncate">omar.accounts@skyway.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('layla.agent@skyway.com')}
                className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-start transition-colors"
              >
                <div className="font-bold text-[11px] text-sky-600 dark:text-sky-400">Agent</div>
                <div className="text-[10px] text-slate-400 truncate">layla.agent@skyway.com</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
              Password: SkyWay@2026
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[11px] text-slate-400 mt-6">
        SkyWay Travel Enterprise System © 2026 · Confidential Business Management
      </div>
    </div>
  );
};
