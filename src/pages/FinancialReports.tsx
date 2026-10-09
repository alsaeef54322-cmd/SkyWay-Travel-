import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Calendar,
  User,
  Search,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { usePrint } from '../context/PrintContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { api } from '../lib/api.ts';
import { triggerPrint } from '../lib/pdf.ts';

export const FinancialReports: React.FC = () => {
  const { t, language } = useLanguage();
  const { openPrintPreview } = usePrint();
  const { settings, defaultCurrency } = useSettings();
  const [data, setData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerStatement, setCustomerStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = '/api/financial-reports?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;

      const [repData, custData]: [any, any] = await Promise.all([
        api.get(url),
        api.get('/api/customers?limit=100'),
      ]);
      setData(repData);
      setCustomers(custData?.data || []);
      if (custData?.data?.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custData.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    async function fetchStatement() {
      try {
        const stmt = await api.get(`/api/financial-reports/statement/${selectedCustomerId}`);
        setCustomerStatement(stmt);
      } catch (e) {
        console.error(e);
      }
    }
    fetchStatement();
  }, [selectedCustomerId]);

  const summary = data?.summary;
  const currency = summary?.currency || defaultCurrency || 'EGP';

  const handlePrintReport = () => {
    if (!data?.summary) {
      triggerPrint();
      return;
    }

    const { summary } = data;
    const reportHtml = `
      <div style="max-width: 800px; margin: 0 auto; padding: 24px; font-family: 'Cairo', sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B1730; padding-bottom: 16px;">
          <div>
            <h1 style="margin: 0; font-size: 22px; color: #0B1730; font-weight: 800;">${settings.companyNameAr} | ${settings.companyNameEn}</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #38A7E8;">التقرير المالي وقائمة الأرباح والخسائر (${currency})</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748B;">
            <div>تاريخ التقرير: ${new Date().toISOString().split('T')[0]}</div>
            <div>الفترة: ${startDate || 'البداية'} إلى ${endDate || 'الآن'}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 24px 0;">
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 8px;">
            <div style="font-size: 11px; color: #64748B;">إجمالي المبيعات والحجوزات</div>
            <div style="font-size: 18px; font-weight: bold; color: #0B1730; margin-top: 4px;">${summary.totalBookingsValue.toLocaleString()} ${summary.currency}</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 8px;">
            <div style="font-size: 11px; color: #64748B;">المقبوضات المحصلة</div>
            <div style="font-size: 18px; font-weight: bold; color: #16A34A; margin-top: 4px;">${summary.totalPaymentsReceived.toLocaleString()} ${summary.currency}</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 8px;">
            <div style="font-size: 11px; color: #64748B;">صافي الأرباح</div>
            <div style="font-size: 18px; font-weight: bold; color: ${summary.netProfit >= 0 ? '#16A34A' : '#DC2626'}; margin-top: 4px;">${summary.netProfit.toLocaleString()} ${summary.currency}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
          <thead>
            <tr style="background: #0B1730; color: #ffffff;">
              <th style="padding: 10px; text-align: right;">البند المالي</th>
              <th style="padding: 10px; text-align: left;">المبلغ (${summary.currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px;">إجمالي إيرادات الحجوزات</td>
              <td style="padding: 10px; font-weight: bold;">${summary.totalBookingsValue.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px;">تكاليف الموردين ومزودي الخدمة</td>
              <td style="padding: 10px; color: #DC2626;">-${summary.totalSupplierCost.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #CBD5E1; background: #F1F5F9;">
              <td style="padding: 10px; font-weight: bold;">إجمالي هامش الربح التشغيلي</td>
              <td style="padding: 10px; font-weight: bold; color: #0284C7;">${summary.grossMargin.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 10px;">المصروفات العامة والتشغيلية</td>
              <td style="padding: 10px; color: #DC2626;">-${summary.totalOperatingExpenses.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 2px solid #0B1730; background: #ECFDF5;">
              <td style="padding: 12px; font-weight: 800; font-size: 15px;">صافي الربح النهائي (Net Profit)</td>
              <td style="padding: 12px; font-weight: 800; font-size: 16px; color: #16A34A;">${summary.netProfit.toLocaleString()} ${summary.currency}</td>
            </tr>
          </tbody>
        </table>

        <div style="border-top: 1px solid #CBD5E1; padding-top: 16px; font-size: 11px; color: #64748B; text-align: center;">
          تم استخراج هذا التقرير تلقائياً من نظام إدارة سكاي واي للسفريات · معتمد ومطابق للقيود المالية
        </div>
      </div>
    `;

    openPrintPreview(language === 'ar' ? 'التقرير المالي وقائمة الأرباح' : 'Financial Statement', reportHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-500" />
            <span>{t('financialReports')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'قوائم الدخل والأرباح الصافية وكشوفات حسابات العملاء'
              : 'Profit & Loss statements, gross margin analysis, and customer ledger accounts'}
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{language === 'ar' ? 'معاينة وطباعة التقرير' : t('print')}</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 shadow-2xs">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{language === 'ar' ? 'فترة التقرير:' : 'Period Range:'}</span>
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
          />
          <span className="text-xs text-slate-400">إلى</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-hidden"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-rose-500 font-semibold hover:underline"
          >
            {t('cancel')}
          </button>
        )}
      </div>

      {/* Top Level Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bookings Volume */}
        <div className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">
            {language === 'ar' ? 'إجمالي قيمة الحجوزات' : 'Gross Bookings Value'}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {summary?.totalBookingsValue?.toLocaleString()} {currency}
          </div>
        </div>

        {/* Payments Collected */}
        <div className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>{language === 'ar' ? 'المقبوضات المحصلة' : 'Revenue Collected'}</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {summary?.totalPaymentsReceived?.toLocaleString()} {currency}
          </div>
        </div>

        {/* Supplier Costs */}
        <div className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">
            {language === 'ar' ? 'تكاليف الموردين والطيران' : 'Cost of Goods (Suppliers)'}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {summary?.totalSupplierCost?.toLocaleString()} {currency}
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="p-5 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center justify-between">
            <span>{language === 'ar' ? 'صافي أرباح العمليات' : 'Net Operating Profit'}</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-2">
            {summary?.netProfit?.toLocaleString()} {currency}
          </div>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Breakdown */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'توزيع المصروفات حسب البند' : 'Expenses by Category'}
          </h2>
          <div className="space-y-3 pt-2">
            {data?.expenseByCategory &&
              Object.entries(data.expenseByCategory).map(([cat, amt]: [string, any]) => {
                const total = summary?.totalOperatingExpenses || 1;
                const pct = Math.round((amt / total) * 100);

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {t(cat as any) || cat}
                      </span>
                      <span className="font-mono text-slate-500">
                        {amt?.toLocaleString()} {currency} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Revenue by Method */}
        <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? 'المقبوضات حسب وسيلة الدفع' : 'Revenue by Payment Method'}
          </h2>
          <div className="space-y-3 pt-2">
            {data?.revenueByMethod &&
              Object.entries(data.revenueByMethod).map(([method, amt]: [string, any]) => {
                const total = summary?.totalPaymentsReceived || 1;
                const pct = Math.round((amt / total) * 100);

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 uppercase">
                        {t(method as any) || method}
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {amt?.toLocaleString()} {currency} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Customer Statement of Account Generator */}
      <div className="p-6 bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" />
              <span>{t('statementOfAccount')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'استخراج كشف حساب مالي تفصيلي لحركات وفواتير ومقبوضات العميل'
                : 'Customer statement ledger of invoices, receipts, and outstanding balance'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-hidden"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullNameAr} / {c.fullNameEn} ({c.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {customerStatement && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">{t('customers')}:</span>
                <strong className="text-slate-900 dark:text-white text-sm">
                  {language === 'ar' ? customerStatement.customer?.fullNameAr : customerStatement.customer?.fullNameEn}
                </strong>
                <span className="text-slate-500 block font-mono">{customerStatement.customer?.phone}</span>
              </div>
              <div className="text-end">
                <span className="text-slate-400 block">{t('remainingAmount')}:</span>
                <strong className="text-sky-600 dark:text-sky-400 text-base font-mono">
                  {customerStatement.currentBalance?.toLocaleString()} {currency}
                </strong>
              </div>
            </div>

            {/* Invoices on this Statement */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-bold">
                    <th className="py-2.5 text-start">{t('bookingRef')}</th>
                    <th className="py-2.5 text-start">{t('destination')}</th>
                    <th className="py-2.5 text-start">{t('date')}</th>
                    <th className="py-2.5 text-end">{t('totalPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerStatement.bookings?.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2 font-mono font-bold text-sky-600 dark:text-sky-400">{b.bookingRef}</td>
                      <td className="py-2">{b.destination}</td>
                      <td className="py-2 font-mono text-slate-500">{b.departureDate}</td>
                      <td className="py-2 text-end font-mono font-bold">
                        {b.totalPrice?.toLocaleString()} {b.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
