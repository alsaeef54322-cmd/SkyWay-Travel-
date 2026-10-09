import React, { useState, useEffect } from 'react';
import { Search, X, User, Plane, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { api } from '../../lib/api.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    customers: any[];
    bookings: any[];
    passports: any[];
    visas: any[];
  }>({ customers: [], bookings: [], passports: [], visas: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ customers: [], bookings: [], passports: [], visas: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [custRes, bkRes, passRes, visaRes] = await Promise.all([
          api.get<any>(`/api/customers?search=${encodeURIComponent(query)}&limit=5`),
          api.get<any[]>(`/api/bookings?search=${encodeURIComponent(query)}`),
          api.get<any[]>(`/api/passports?search=${encodeURIComponent(query)}`),
          api.get<any[]>(`/api/visas?search=${encodeURIComponent(query)}`),
        ]);

        setResults({
          customers: custRes?.data || [],
          bookings: (bkRes || []).slice(0, 5),
          passports: (passRes || []).slice(0, 5),
          visas: (visaRes || []).slice(0, 5),
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.customers.length + results.bookings.length + results.passports.length + results.visas.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('globalSearchPlaceholder')}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden text-base font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              {t('loading')}
            </div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              {t('noDataFound')}
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{t('customers')} ({results.customers.length})</span>
              </div>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate(`/customers/${c.id}`);
                      onClose();
                    }}
                    className="w-full text-start p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white">
                        {language === 'ar' ? c.fullNameAr : c.fullNameEn}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {c.phone} · {c.email} {c.nationalId ? `· ID: ${c.nationalId}` : ''}
                      </div>
                    </div>
                    {direction === 'rtl' ? (
                      <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bookings */}
          {results.bookings.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" />
                <span>{t('bookings')} ({results.bookings.length})</span>
              </div>
              <div className="space-y-1">
                {results.bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onNavigate(`/bookings/${b.id}`);
                      onClose();
                    }}
                    className="w-full text-start p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{b.bookingRef}</span>
                        <span>{b.destination}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {language === 'ar' ? b.customerNameAr : b.customerNameEn} · {b.departureDate}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {b.totalPrice?.toLocaleString()} {b.currency}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Passports */}
          {results.passports.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>{t('passports')} ({results.passports.length})</span>
              </div>
              <div className="space-y-1">
                {results.passports.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate(`/passports`);
                      onClose();
                    }}
                    className="w-full text-start p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white font-mono">
                        {p.passportNumber} — {language === 'ar' ? p.holderNameAr : p.holderNameEn}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.nationality} · {t('expiryDate')}: {p.expiryDate}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'valid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : p.status === 'expiring_soon'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}
                    >
                      {t(p.status as any)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
