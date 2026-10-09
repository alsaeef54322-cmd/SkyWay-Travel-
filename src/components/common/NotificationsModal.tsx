import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { NotificationItem } from '../../types/client.ts';
import { api } from '../../lib/api.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onUpdated?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onNavigate, onUpdated }) => {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.get<NotificationItem[]>('/api/notifications');
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleRead = async (id: string, targetUrl: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      if (onUpdated) onUpdated();
      onNavigate(targetUrl);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">{t('notifications')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium flex items-center gap-1 hover:underline"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('markAllRead')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">{t('loading')}</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              {t('noNotifications')}
            </div>
          )}

          {!loading &&
            notifications.map((n) => {
              const isExpiredType = n.type === 'passport_expiry';
              const isDeparture = n.type === 'upcoming_departure';
              const isPayment = n.type === 'unpaid_balance';

              return (
                <div
                  key={n.id}
                  onClick={() => markSingleRead(n.id, n.targetUrl)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    n.isRead
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-80'
                      : 'bg-white dark:bg-slate-800/80 border-sky-100 dark:border-sky-900/50 shadow-xs'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isExpiredType
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                        : isDeparture
                        ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400'
                        : isPayment
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isExpiredType && <AlertTriangle className="w-4 h-4" />}
                    {isDeparture && <Calendar className="w-4 h-4" />}
                    {isPayment && <CreditCard className="w-4 h-4" />}
                    {!isExpiredType && !isDeparture && !isPayment && <Clock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {language === 'ar' ? n.titleAr : n.titleEn}
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {language === 'ar' ? n.messageAr : n.messageEn}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
