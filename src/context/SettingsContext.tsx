import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types/client.ts';
import { useLanguage } from './LanguageContext.tsx';
import { api } from '../lib/api.ts';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  companyName: string;
  tagline: string;
  defaultCurrency: string;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<string | null>;
  reloadSettings: () => Promise<void>;
  formatCurrency: (amount: number | string | undefined | null, curr?: string) => string;
}

const defaultSettingsFallback: AppSettings = {
  companyNameAr: 'سكاي واي للسفريات - مصر',
  companyNameEn: 'SkyWay Travel Egypt',
  commercialReg: 'س.ت: 10492850 - القاهرة',
  iataCode: 'IATA-96248-EG',
  phone: '+20 2 2450 8899 / +20 100 234 5678',
  email: 'cairo@skyway-travel.com',
  addressAr: '18 شارع الطيران، مدينة نصر، القاهرة، جمهورية مصر العربية',
  addressEn: '18 El-Tayaran St, Nasr City, Cairo, Egypt',
  defaultCurrency: 'EGP',
  currencies: ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'KWD'],
  passportWarningDays: 180,
  bookingRefPrefix: 'SKW',
  invoiceFooterAr: 'شكراً لتعاملكم مع سكاي واي للسفريات بمصر - نتمنى لكم رحلة ممتعة وآمنة يا فندم',
  invoiceFooterEn: 'Thank you for choosing SkyWay Travel Egypt - Wishing you a pleasant journey',
  logoUrl: '',
  logoType: 'default',
  taglineAr: 'نظام إدارة وكالات السفر والسياحة المتكامل',
  taglineEn: 'Enterprise Travel Agency Management Platform',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Check cached settings in localStorage for immediate rendering
    try {
      const cached = localStorage.getItem('skyway_settings');
      if (cached) return { ...defaultSettingsFallback, ...JSON.parse(cached) };
    } catch {
      // ignore
    }
    return defaultSettingsFallback;
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.get<AppSettings>('/api/settings');
      if (data && typeof data === 'object') {
        const merged: AppSettings = {
          ...defaultSettingsFallback,
          ...data,
          defaultCurrency: data.defaultCurrency || 'EGP',
        };
        setSettings(merged);
        localStorage.setItem('skyway_settings', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Failed to fetch settings from server:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      const updated = { ...settings, ...newSettings };
      const saved = await api.put<AppSettings>('/api/settings', updated);
      const merged: AppSettings = { ...defaultSettingsFallback, ...saved };
      setSettings(merged);
      localStorage.setItem('skyway_settings', JSON.stringify(merged));

      // Trigger custom event so any non-React listeners can update
      window.dispatchEvent(new CustomEvent('skyway:settings-updated', { detail: merged }));
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return false;
    }
  }, [settings]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post<{ success: boolean; logoUrl: string; settings: AppSettings }>(
        '/api/settings/logo',
        formData
      );
      if (res.logoUrl) {
        const merged: AppSettings = {
          ...settings,
          ...res.settings,
          logoUrl: res.logoUrl,
          logoType: 'custom',
        };
        setSettings(merged);
        localStorage.setItem('skyway_settings', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('skyway:settings-updated', { detail: merged }));
        return res.logoUrl;
      }
      return null;
    } catch (err) {
      console.error('Failed to upload logo:', err);
      return null;
    }
  }, [settings]);

  const companyName = language === 'ar'
    ? (settings.companyNameAr || 'سكاي واي للسفريات')
    : (settings.companyNameEn || 'SkyWay Travel');

  const tagline = language === 'ar'
    ? (settings.taglineAr || 'نظام إدارة وكالات السفر والسياحة')
    : (settings.taglineEn || 'Travel Agency Management Platform');

  const defaultCurrency = settings.defaultCurrency || 'EGP';

  const formatCurrency = useCallback((amount: number | string | undefined | null, curr?: string) => {
    const num = Number(amount) || 0;
    const c = curr || defaultCurrency;
    const formattedNum = num.toLocaleString('en-US');

    if (language === 'ar') {
      if (c === 'EGP') return `${formattedNum} ج.م`;
      if (c === 'SAR') return `${formattedNum} ر.س`;
      if (c === 'AED') return `${formattedNum} د.إ`;
      if (c === 'KWD') return `${formattedNum} د.ك`;
      if (c === 'USD') return `$${formattedNum}`;
      if (c === 'EUR') return `€${formattedNum}`;
      return `${formattedNum} ${c}`;
    }

    if (c === 'USD') return `$${formattedNum}`;
    if (c === 'EUR') return `€${formattedNum}`;
    return `${formattedNum} ${c}`;
  }, [defaultCurrency, language]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        companyName,
        tagline,
        defaultCurrency,
        updateSettings,
        uploadLogo,
        reloadSettings: fetchSettings,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
