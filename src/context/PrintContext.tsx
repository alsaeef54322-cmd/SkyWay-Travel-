import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrintPreviewModal } from '../components/common/PrintPreviewModal.tsx';
import { printHtmlViaHiddenIframe } from '../lib/pdf.ts';

interface PrintContextType {
  openPrintPreview: (title: string, htmlContent: string) => void;
  printDirect: (htmlContent: string) => void;
  closePrintModal: () => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalHtml, setModalHtml] = useState('');

  const openPrintPreview = (title: string, htmlContent: string) => {
    setModalTitle(title);
    setModalHtml(htmlContent);
    setIsOpen(true);
  };

  const closePrintModal = () => {
    setIsOpen(false);
    setModalTitle('');
    setModalHtml('');
  };

  const printDirect = (htmlContent: string) => {
    printHtmlViaHiddenIframe(htmlContent);
  };

  // Listen to custom events dispatched anywhere in the app
  useEffect(() => {
    const handleCustomPrint = (e: any) => {
      if (e.detail?.title && e.detail?.htmlContent) {
        setModalTitle(e.detail.title);
        setModalHtml(e.detail.htmlContent);
        setIsOpen(true);
      }
    };

    window.addEventListener('skyway:open-print-preview', handleCustomPrint);
    return () => {
      window.removeEventListener('skyway:open-print-preview', handleCustomPrint);
    };
  }, []);

  return (
    <PrintContext.Provider value={{ openPrintPreview, printDirect, closePrintModal }}>
      {children}
      <PrintPreviewModal
        isOpen={isOpen}
        title={modalTitle}
        htmlContent={modalHtml}
        onClose={closePrintModal}
      />
    </PrintContext.Provider>
  );
};

export function usePrint(): PrintContextType {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
}
