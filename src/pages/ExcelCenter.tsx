import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Users,
  CreditCard,
  Plane,
  Compass,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { api } from '../lib/api.ts';
import { downloadExcelFile, downloadTemplateFile } from '../lib/excelExport.ts';

export const ExcelCenter: React.FC = () => {
  const { t, language } = useLanguage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleDownload = async (key: string) => {
    setDownloadingKey(key);
    setExportNotice(language === 'ar' ? 'جارٍ توليد وتنزيل ملف الإكسل...' : 'Generating Excel download...');
    try {
      await downloadExcelFile(key);
      setExportNotice(language === 'ar' ? 'تم تنزيل ملف الإكسل بنجاح!' : 'Excel file downloaded successfully!');
      setTimeout(() => setExportNotice(null), 4500);
    } catch (e: any) {
      console.error(e);
      setExportNotice(e.message || (language === 'ar' ? 'فشل تصدير الملف' : 'Export failed'));
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDownloadTemplate = async () => {
    setExportNotice(language === 'ar' ? 'جارٍ تنزيل قالب الإكسل...' : 'Downloading Excel template...');
    try {
      await downloadTemplateFile('customers');
      setExportNotice(language === 'ar' ? 'تم تنزيل قالب الاستيراد بنجاح!' : 'Template downloaded successfully!');
      setTimeout(() => setExportNotice(null), 4500);
    } catch (e: any) {
      console.error(e);
      setExportNotice(language === 'ar' ? 'فشل تنزيل القالب' : 'Template download failed');
      setTimeout(() => setExportNotice(null), 5000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleUploadImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/api/excel/import/customers', formData);
      setImportResult(res);
      setSelectedFile(null);
    } catch (err: any) {
      setImportResult({
        error: err.message || 'Import failed',
        errors: [{ row: 0, error: err.message || 'Failed to parse file' }],
      });
    } finally {
      setImporting(false);
    }
  };

  const exportEntities = [
    { key: 'customers', labelAr: 'تصدير قائمة العملاء', labelEn: 'Export Customers List', icon: Users },
    { key: 'passports', labelAr: 'تصدير سجلات الجوازات', labelEn: 'Export Passports Records', icon: FileCheck },
    { key: 'bookings', labelAr: 'تصدير جدول الحجوزات', labelEn: 'Export Travel Bookings', icon: Plane },
    { key: 'visas', labelAr: 'تصدير طلبات التأشيرات', labelEn: 'Export Visa Applications', icon: Compass },
    { key: 'payments', labelAr: 'تصدير سندات القبض', labelEn: 'Export Payments Ledger', icon: CreditCard },
    { key: 'expenses', labelAr: 'تصدير سندات الصرف', labelEn: 'Export Expenses Ledger', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          <span>{t('excelCenter')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {language === 'ar'
            ? 'تصدير واستيراد قواعد البيانات بصيغة Microsoft Excel مع التوافق الكامل للنصوص العربية'
            : 'Excel import and export center with native Arabic typography and row validation'}
        </p>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Center Cards */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-500" />
              <span>{language === 'ar' ? 'تصدير البيانات إلى ملفات Excel' : 'Export Data to Excel'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'تحميل كشوفات جداول البيانات بتنسيق احترافي وأعمدة محسوبة وتوافق مع الحروف العربية'
                : 'Download styled spreadsheets with auto-width columns and formatted values'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {exportEntities.map((ent) => {
              const Icon = ent.icon;
              const isDownloading = downloadingKey === ent.key;
              return (
                <button
                  key={ent.key}
                  type="button"
                  onClick={() => handleDownload(ent.key)}
                  disabled={isDownloading}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between group cursor-pointer text-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 shadow-2xs">
                      {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? ent.labelAr : ent.labelEn}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Import Center & Template Download */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-500" />
              <span>{language === 'ar' ? 'استيراد العملاء من Excel' : 'Import Customers from Excel'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'رفع ملف Excel وتدقيق البيانات تلقائياً واكتشاف التكرارات وتسجيل العملاء'
                : 'Upload an Excel file to validate and import customer records in bulk'}
            </p>
          </div>

          {/* Download Sample Template */}
          <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-sky-900 dark:text-sky-200">
                {language === 'ar' ? 'نموذج إكسل المعتمد للاستيراد' : 'Standard Customers Template'}
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">
                {language === 'ar' ? 'قم بتحميل وتعبئة النموذج لضمان صحة البيانات' : 'Download sample template with verified headers'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              {language === 'ar' ? 'تحميل النموذج' : 'Download'}
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                id="excelFileInput"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="excelFileInput" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedFile ? selectedFile.name : (language === 'ar' ? 'اختر ملف Excel (.xlsx)' : 'Choose Excel file (.xlsx)')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {language === 'ar' ? 'انقر لاختيار ملف من جهازك' : 'Click to select file from your computer'}
                </div>
              </label>
            </div>

            {selectedFile && (
              <button
                onClick={handleUploadImport}
                disabled={importing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {importing && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{importing ? (language === 'ar' ? 'جاري الفحص والاستيراد...' : 'Processing...') : (language === 'ar' ? 'بدء الاستيراد والتدقيق' : 'Validate & Import')}</span>
              </button>
            )}

            {/* Import Summary Results */}
            {importResult && (
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 text-xs space-y-2">
                {importResult.importedCount > 0 && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? `تم استيراد ${importResult.importedCount} عميل بنجاح`
                        : `Successfully imported ${importResult.importedCount} customers`}
                    </span>
                  </div>
                )}

                {importResult.errors?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-rose-600 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>{language === 'ar' ? 'ملاحظات وتنبيهات التدقيق:' : 'Row Validation Notes:'}</span>
                    </div>
                    {importResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-slate-500 font-mono text-[11px]">
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
