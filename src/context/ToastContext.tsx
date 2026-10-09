import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from './LanguageContext.tsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { direction, language } = useLanguage();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      const defaultTitle = language === 'ar' ? 'تمت العملية بنجاح' : 'Success';
      showToast({ type: 'success', message, title: title || defaultTitle });
    },
    [showToast, language]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      const defaultTitle = language === 'ar' ? 'حدث خطأ' : 'Error';
      showToast({ type: 'error', message, title: title || defaultTitle, duration: 6000 });
    },
    [showToast, language]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      const defaultTitle = language === 'ar' ? 'تنبيه هام' : 'Warning';
      showToast({ type: 'warning', message, title: title || defaultTitle, duration: 5000 });
    },
    [showToast, language]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      const defaultTitle = language === 'ar' ? 'معلومة' : 'Info';
      showToast({ type: 'info', message, title: title || defaultTitle });
    },
    [showToast, language]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        className={`fixed top-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 ${
          direction === 'rtl' ? 'left-4 items-start' : 'right-4 items-end'
        }`}
        style={{ zIndex: 9999 }}
      >
        {toasts.map((toast) => {
          let bgClass = 'bg-white dark:bg-[#0E1C38] border-slate-200 dark:border-slate-800';
          let icon = <Info className="w-5 h-5 text-sky-500 shrink-0" />;

          if (toast.type === 'success') {
            bgClass = 'bg-white dark:bg-[#0B1E28] border-emerald-500/40 shadow-emerald-500/10';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-white dark:bg-[#201018] border-rose-500/40 shadow-rose-500/10';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-white dark:bg-[#241C12] border-amber-500/40 shadow-amber-500/10';
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 w-full p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${bgClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0 text-start">
                {toast.title && (
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words font-medium">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
