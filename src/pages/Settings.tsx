import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Save,
  Download,
  RefreshCw,
  CheckCircle,
  Building2,
  Image as ImageIcon,
  Upload,
  Trash2,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Logo } from '../components/common/Logo.tsx';
import { AppSettings } from '../types/client.ts';
import { api } from '../lib/api.ts';

export const Settings: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { settings: globalSettings, updateSettings, uploadLogo } = useSettings();
  const { success, error, info } = useToast();

  const [formData, setFormData] = useState<AppSettings>(globalSettings);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when globalSettings load or change
  useEffect(() => {
    setFormData(globalSettings);
  }, [globalSettings]);

  const fetchBackups = async () => {
    try {
      const bks: any = await api.get('/api/backups');
      setBackups(bks || []);
    } catch (e) {
      console.warn('Failed to fetch backups:', e);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error(language === 'ar' ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      error(language === 'ar' ? 'حجم الصورة كبير جداً، أقصى حجم 8 ميجابايت' : 'Image too large, maximum 8MB allowed');
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadedUrl = await uploadLogo(file);
      if (uploadedUrl) {
        setFormData((prev) => ({
          ...prev,
          logoUrl: uploadedUrl,
          logoType: 'custom',
        }));
        success(language === 'ar' ? 'تم رفع وحفظ شعار الشركة بنجاح!' : 'Company logo uploaded and updated successfully!');
      } else {
        error(language === 'ar' ? 'فشل رفع الشعار' : 'Failed to upload logo');
      }
    } catch (err: any) {
      error(err.message || 'Logo upload error');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (presetKey: string) => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: presetKey,
      logoType: 'preset',
    }));
    info(language === 'ar' ? 'تم اختيار الأيقونة، اضغط حفظ لتطبيقها' : 'Preset crest selected. Click save to apply.');
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
      logoType: 'default',
    }));
    info(language === 'ar' ? 'تمت العودة للشعار الافتراضي، اضغط حفظ لتأكيد التغيير' : 'Reset to default crest. Click save to apply.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const ok = await updateSettings(formData);
      if (ok) {
        setSaveSuccess(true);
        success(
          language === 'ar'
            ? 'تم حفظ وتحديث بيانات وشعار الشركة والعملة بنجاح!'
            : 'Company settings, logo, and currency updated successfully!'
        );
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        error(language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await api.post('/api/backup');
      success(language === 'ar' ? 'تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح!' : 'Database snapshot created successfully!');
      fetchBackups();
    } catch (e: any) {
      error(e.message || 'Failed to create backup');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    const confirmMsg = language === 'ar'
      ? 'هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية بالكامل.'
      : 'Are you sure you want to restore this backup? Current data will be replaced.';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post('/api/restore', { backupFilename: filename });
      success(language === 'ar' ? 'تمت استعادة قاعدة البيانات بنجاح! جاري التحديث...' : 'Database restored successfully! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e: any) {
      error(e.message || 'Failed to restore');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-sky-500" />
            <span>{t('settings')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'تخصيص هوية وشعار الوكالة، الاسم التجاري، العملة الرسمية (جنيه مصري)، والتراخيص'
              : 'Customize company name, logo, Egyptian Pound & currency preferences, and licensing'}
          </p>
        </div>
      </div>

      {/* Live Brand Preview Header Card */}
      <div className="p-6 bg-gradient-to-r from-sky-500/10 via-sky-600/5 to-transparent dark:from-sky-950/40 dark:via-[#0B1730] dark:to-transparent border border-sky-200 dark:border-sky-800/60 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Logo size="lg" customName={language === 'ar' ? formData.companyNameAr : formData.companyNameEn} customLogoUrl={formData.logoUrl} />
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 font-bold">
              {formData.defaultCurrency === 'EGP' ? 'العملة: جنيه مصري (ج.م)' : `Currency: ${formData.defaultCurrency}`}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              {formData.iataCode || 'IATA-EG'}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold">
              {language === 'ar' ? 'معاينة حية للهوية' : 'Live Brand Preview'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* SECTION 1: Brand & Logo Customization */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'هوية وشعار الشركة (Branding & Logo)' : 'Company Name & Logo'}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {language === 'ar' ? 'يظهر في القوائم والترويسة والمستندات والطباعة' : 'Shown across Sidebar, Header & Invoices'}
            </span>
          </div>

          {/* Logo Upload & Preview Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left: Current Logo Display Box */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center p-2 mb-3 overflow-hidden">
                {formData.logoUrl && !formData.logoUrl.startsWith('preset:') ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="scale-125">
                    <Logo size="md" showSubtitle={false} customLogoUrl={formData.logoUrl} />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {formData.logoUrl ? (formData.logoUrl.startsWith('preset:') ? 'رمز شعار مخصص' : 'صورة مخصصة') : 'الشعار الافتراضي'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'يتم تطبيق الشعار على كل النظام فوراً' : 'Applied across entire app immediately'}
              </span>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
                </button>
              )}
            </div>

            {/* Middle & Right: Upload Actions & Preset Crests */}
            <div className="md:col-span-2 space-y-4">
              {/* File Upload Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ar' ? 'رفع ملف شعار جديد (PNG, JPG, SVG, WebP)' : 'Upload New Logo File (PNG, JPG, SVG)'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 cursor-pointer ${
                      uploadingLogo ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploadingLogo ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (language === 'ar' ? 'اختيار صورة الشعار' : 'Choose Logo Image')}</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {language === 'ar' ? 'الأبعاد المثالية: 400×400 أو شعار مستطيل مفرغ' : 'Recommended: 400x400 transparent PNG'}
                  </span>
                </div>
              </div>

              {/* Or Direct Logo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'أو رابط مباشر لشعار خارجي (Logo URL)' : 'Or Logo Direct Web URL'}
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl && !formData.logoUrl.startsWith('preset:') && !formData.logoUrl.startsWith('/uploads') ? formData.logoUrl : ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value, logoType: 'custom' })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden font-mono"
                />
              </div>

              {/* Preset crest choices if no file ready */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'ar' ? 'أو اختر من تصاميم الشعار الجاهزة للسفريات:' : 'Or Select a Built-in Crest Style:'}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      !formData.logoUrl || formData.logoUrl === ''
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">✈️</span>
                    <span>سكاي واي الطيران</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('preset:pyramids')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      formData.logoUrl === 'preset:pyramids'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">🏛️</span>
                    <span>الأهرامات والنيل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('preset:wings')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      formData.logoUrl === 'preset:wings'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">🪽</span>
                    <span>الأجنحة الملكية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('preset:globe')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      formData.logoUrl === 'preset:globe'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">🌍</span>
                    <span>البوصلة والكرة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Company Names & Slogans Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('companyNameArSetting')} *
              </label>
              <input
                type="text"
                required
                value={formData.companyNameAr}
                onChange={(e) => setFormData({ ...formData, companyNameAr: e.target.value })}
                placeholder="مثال: سكاي واي للسفريات - مصر"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">يظهر في الواجهة العربية وكافة الفواتير والسندات</p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('companyNameEnSetting')} *
              </label>
              <input
                type="text"
                required
                value={formData.companyNameEn}
                onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                placeholder="e.g. SkyWay Travel Egypt"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">Shown in English interface and international vouchers</p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'الشعار اللفظي للوكالة (العربية)' : 'Tagline / Slogan (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.taglineAr || ''}
                onChange={(e) => setFormData({ ...formData, taglineAr: e.target.value })}
                placeholder="نظام إدارة وكالات السفر والسياحة المتكامل"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'الشعار اللفظي للوكالة (الإنجليزية)' : 'Tagline / Slogan (English)'}
              </label>
              <input
                type="text"
                value={formData.taglineEn || ''}
                onChange={(e) => setFormData({ ...formData, taglineEn: e.target.value })}
                placeholder="Enterprise Travel Agency Management Platform"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Operational & Currency Settings */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ar' ? 'الخيارات المالية والعملة الرسمية' : 'Currency & Financial Preferences'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Default Currency Selector with prominent EGP */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('defaultCurrency')} *
              </label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden font-bold text-emerald-600 dark:text-emerald-400"
              >
                <option value="EGP">🇪🇬 EGP - الجنيه المصري (ج.م) [الافتراضي]</option>
                <option value="USD">🇺🇸 USD - الدولار الأمريكي ($)</option>
                <option value="SAR">🇸🇦 SAR - الريال السعودي (ر.س)</option>
                <option value="EUR">🇪🇺 EUR - اليورو الأوروبي (€)</option>
                <option value="AED">🇦🇪 AED - الدرهم الإماراتي (د.إ)</option>
                <option value="KWD">🇰🇼 KWD - الدينار الكويتي (د.ك)</option>
                <option value="QAR">🇶🇦 QAR - الريال القطري (ر.ق)</option>
                <option value="GBP">🇬🇧 GBP - الجنيه الإسترليني (£)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'ar'
                  ? 'العملة الأساسية المستخدمة لتقارير الأرباح وكشوف الحساب والفواتير'
                  : 'Main accounting currency for reports, ledgers and client statements'}
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('passportWarningDaysSetting')}
              </label>
              <input
                type="number"
                value={formData.passportWarningDays}
                onChange={(e) => setFormData({ ...formData, passportWarningDays: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'ar' ? 'عدد الأيام للتنبيه قبل انتهاء الجواز (الموصى به: 180 يوم)' : 'Alert days before passport expiry (180 days)'}
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'بادئة كود الحجوزات (Booking Ref Prefix)' : 'Booking Reference Prefix'}
              </label>
              <input
                type="text"
                value={formData.bookingRefPrefix}
                onChange={(e) => setFormData({ ...formData, bookingRefPrefix: e.target.value })}
                placeholder="SKW"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono uppercase focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Official Licensing & Contact Details */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ar' ? 'بيانات التراخيص والتواصل للطباعة' : 'Licensing & Document Footers'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('crNumber')}
              </label>
              <input
                type="text"
                value={formData.commercialReg}
                onChange={(e) => setFormData({ ...formData, commercialReg: e.target.value })}
                placeholder="س.ت: 10492850 - القاهرة"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('iataNumber')}
              </label>
              <input
                type="text"
                value={formData.iataCode}
                onChange={(e) => setFormData({ ...formData, iataCode: e.target.value })}
                placeholder="IATA-96248-EG"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('phone')}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 2 2450 8899 / +20 100 234 5678"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@skyway-travel.com"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('address')} (العنوان بالعربية)
              </label>
              <input
                type="text"
                value={formData.addressAr}
                onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                placeholder="18 شارع الطيران، مدينة نصر، القاهرة، جمهورية مصر العربية"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                تذييل الفواتير وسندات السفر (عربي)
              </label>
              <input
                type="text"
                value={formData.invoiceFooterAr}
                onChange={(e) => setFormData({ ...formData, invoiceFooterAr: e.target.value })}
                placeholder="شكراً لتعاملكم معنا - نتمنى لكم رحلة ممتعة وآمنة يا فندم"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-4 h-4" />
                <span>{language === 'ar' ? 'تم حفظ وتطبيق التعديلات بنجاح!' : 'Settings successfully saved!'}</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (language === 'ar' ? 'جاري الحفظ والتطبيق...' : 'Saving...') : (language === 'ar' ? 'حفظ كافة الإعدادات والشعار' : 'Save All Settings & Logo')}</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Disaster Recovery */}
      <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-500" />
              <span>{t('backup')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'إنشاء نسخ احتياطية واسترجاع قاعدة البيانات في أي وقت'
                : 'Automated database snapshots, offline export, and disaster recovery'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateBackup}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إنشاء نسخة احتياطية الآن' : 'Create Snapshot'}</span>
          </button>
        </div>

        <div className="space-y-2 pt-2">
          {backups.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              {language === 'ar' ? 'لا توجد نسخ احتياطية مسجلة' : 'No backups created yet'}
            </div>
          ) : (
            backups.map((b) => (
              <div
                key={b.filename}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {b.filename}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(b.createdAt).toLocaleString()} · {Math.round(b.size / 1024)} KB
                  </div>
                </div>

                <div className="flex items-center gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => handleRestoreBackup(b.filename)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-amber-600 font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                  >
                    {language === 'ar' ? 'استعادة' : 'Restore'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
