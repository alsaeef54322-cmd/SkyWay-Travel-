import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plane, Clock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Booking } from '../types/client.ts';
import { api } from '../lib/api.ts';

interface TravelCalendarProps {
  onNavigate: (path: string) => void;
}

export const TravelCalendar: React.FC<TravelCalendarProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<Booking[]>('/api/bookings');
        setBookings(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Sort upcoming departures chronologically
  const sortedDepartures = [...bookings]
    .filter((b) => b.status !== 'cancelled')
    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-500" />
            <span>{t('travelCalendar')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'متابعة مواعيد إقلاع الرحلات والمغادرات وعودة المسافرين'
              : 'Flight departures and arrivals schedule overview'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">
            {t('loading')}
          </div>
        ) : sortedDepartures.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">
            {t('noDataFound')}
          </div>
        ) : (
          sortedDepartures.map((b) => {
            const depDate = new Date(b.departureDate);
            const isSoon =
              (depDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7 &&
              depDate.getTime() >= Date.now();

            return (
              <div
                key={b.id}
                onClick={() => onNavigate(`/bookings/${b.id}`)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0B1730] hover:border-sky-300 dark:hover:border-sky-800 shadow-2xs ${
                  isSoon
                    ? 'border-sky-300 dark:border-sky-800/80 ring-1 ring-sky-400/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                    {b.bookingRef}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                    {t(b.serviceCategory as any)}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-sky-500" />
                    <span>{b.destination}</span>
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? b.customerNameAr : b.customerNameEn}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans">{t('departureDate')}</div>
                    <div className="font-bold text-slate-900 dark:text-white">{b.departureDate}</div>
                  </div>
                  {b.returnDate && (
                    <div className="text-end">
                      <div className="text-[10px] text-slate-400 uppercase font-sans">{t('returnDate')}</div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{b.returnDate}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
