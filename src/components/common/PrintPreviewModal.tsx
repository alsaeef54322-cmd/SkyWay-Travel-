import React from 'react';
import { Printer, Download, X, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { printHtmlViaHiddenIframe } from '../../lib/pdf.ts';

interface PrintPreviewModalProps {
  isOpen: boolean;
  title: string;
  htmlContent: string;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  title,
  htmlContent,
  onClose,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => {
    // Print directly using the hidden iframe (bypasses popup blockers and iframe sandboxes)
    printHtmlViaHiddenIframe(htmlContent);
  };

  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0F172A;
      background: #ffffff;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print-modal-backdrop">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] print-modal-content">
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 no-print">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'حفظ نسخة (HTML)' : 'Save HTML'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'طباعة الآن' : 'Print Now'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-document"
            className="w-full max-w-[800px] bg-white text-slate-900 p-4 sm:p-8 rounded-2xl shadow-lg border border-slate-200 print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
};
