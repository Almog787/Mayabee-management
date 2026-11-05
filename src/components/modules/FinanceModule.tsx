import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  FileDown,
  TrendingUp,
  AlertTriangle,
  Receipt,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Building,
  CheckCircle2,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Printer,
} from 'lucide-react';
import {
  FinancialTransaction,
  DaycareSettings,
  Child,
  TransactionType,
  TransactionCategory,
  PaymentMethod,
} from '../../types';
import { TaxStatusReport, validateCashTransaction, CASH_LEGAL_LIMIT } from '../../lib/taxEngine';
import { exportTransactionsToCsv } from '../../lib/exportImport';

interface FinanceModuleProps {
  transactions: FinancialTransaction[];
  children: Child[];
  settings: DaycareSettings | null;
  taxStatus: TaxStatusReport;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'updatedAt'>) => Promise<FinancialTransaction>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateSettings: (updates: Partial<DaycareSettings>) => Promise<void>;
  onOpenReceipt: (tx: FinancialTransaction) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  transactions,
  children,
  settings,
  taxStatus,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateSettings,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'TUITION' | 'TAX_VAT' | 'GREEN_INVOICE'>('LEDGER');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');

  // Green Invoice simulator state
  const [mockSyncStatus, setMockSyncStatus] = useState<string | null>(null);

  const businessType = settings?.businessType || 'OSEK_PATUR';
  const isOsekPatur = businessType === 'OSEK_PATUR';

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  const filteredTransactions = transactions.filter(
    (t) => filterType === 'ALL' || t.type === filterType
  );

  const handleExportCsv = () => {
    exportTransactionsToCsv(transactions);
  };

  const handleToggleBusinessType = async (type: 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY') => {
    await onUpdateSettings({ businessType: type });
  };

  const handleSimulateGreenInvoice = (provider: string) => {
    setMockSyncStatus(`מתחבר ל-API של ${provider}...`);
    setTimeout(() => {
      setMockSyncStatus(`סנכרון תקין! ${provider} מוכן להפקת חשבוניות מס/קבלה דיגיטליות חתומות עם שליחה אוטומטית להורים בוואטסאפ.`);
      setTimeout(() => setMockSyncStatus(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#5f3414] flex items-center gap-2 font-heading">
              <CreditCard className="w-5 h-5 text-[#7a4b29]" />
              <span>כספים, הנהלת חשבונות ומיסוי ישראלי • הבית של מאיה</span>
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ffdeab] text-[#5f3414] border border-[#f9b98e]">
              {isOsekPatur ? 'עוסק פטור' : 'עוסק מורשה / חברה'}
            </span>
          </div>
          <p className="text-xs text-[#51443c] mt-0.5">
            מעקב תקרת פטור 2026, אכיפת חוק המזומן (עד 6,000 ₪), מעקב שכר לימוד ודוחות לרו"ח באריאל
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#5f3414] font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer border border-[#e4e2de]"
            title="ייצוא קובץ CSV לרואה חשבון או יועץ מס"
          >
            <FileDown className="w-4 h-4 text-[#7a4b29]" />
            <span>ייצוא דוח לרו"ח (CSV)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs border border-[#ffdeab]/30 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#ffdeab]" />
            <span>רישום תקבול / הוצאה</span>
          </button>
        </div>
      </div>

      {/* Israeli Tax & Cash Flow KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs">
          <div className="flex items-center justify-between text-[#51443c] mb-2">
            <span className="text-xs font-semibold">סה"כ הכנסות (שכ"ל ותקבולים)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            ₪{totalIncome.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#51443c] mt-1">מתוך תקבולי השנה השוטפת</p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs">
          <div className="flex items-center justify-between text-[#51443c] mb-2">
            <span className="text-xs font-semibold">סה"כ הוצאות מוכרות</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 font-mono">
            ₪{totalExpenses.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#51443c] mt-1">מזון, ציוד, שכר, ביטוח, ארנונה באריאל</p>
        </div>

        {/* Net Cashflow Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs">
          <div className="flex items-center justify-between text-[#51443c] mb-2">
            <span className="text-xs font-semibold">תזרים נקי (רווח תפעולי)</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffdeab]/60 text-[#7a4b29] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#5f3414] font-mono">
            ₪{netProfit.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#51443c] mt-1">לפני מס הכנסה וביטוח לאומי</p>
        </div>

        {/* Osek Patur or VAT Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs">
          <div className="flex items-center justify-between text-[#51443c] mb-2">
            <span className="text-xs font-semibold">
              {isOsekPatur ? 'תקרת עוסק פטור 2026' : 'מע"מ לתשלום (דו-חודשי)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {isOsekPatur ? (
            <>
              <p className="text-2xl font-black text-[#5f3414] font-mono">
                {taxStatus.percentageUsed.toFixed(1)}%
              </p>
              <div className="w-full bg-[#efeeea] rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full ${
                    taxStatus.percentageUsed >= 90
                      ? 'bg-rose-500'
                      : taxStatus.percentageUsed >= 80
                      ? 'bg-amber-500'
                      : 'bg-[#7a4b29]'
                  }`}
                  style={{ width: `${Math.min(100, taxStatus.percentageUsed)}%` }}
                />
              </div>
              <p className="text-[11px] text-[#51443c] mt-1">
                נותרו: ₪{taxStatus.remainingAmount.toLocaleString()} לתקרה
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-[#5f3414] font-mono">
                ₪{taxStatus.netVatPayable.toFixed(2)}
              </p>
              <p className="text-[11px] text-[#51443c] mt-1">
                עסקאות: ₪{taxStatus.totalVatCollected.toFixed(0)} | תשומות: ₪{taxStatus.totalVatDeductible.toFixed(0)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Proactive Tax Warnings Banner */}
      {taxStatus.warningMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-semibold ${
            taxStatus.status === 'EXCEEDED'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : taxStatus.status === 'CRITICAL_90'
              ? 'bg-orange-50 border-orange-300 text-orange-950'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{taxStatus.warningMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#e4e2de] gap-4 text-xs font-bold text-[#51443c] overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'LEDGER'
              ? 'border-[#7a4b29] text-[#7a4b29] font-black'
              : 'border-transparent hover:text-[#1b1c1a]'
          }`}
        >
          ספר תנועות פיננסיות (הכנסות והוצאות)
        </button>
        <button
          onClick={() => setActiveTab('TUITION')}
          className={`pb-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'TUITION'
              ? 'border-[#7a4b29] text-[#7a4b29] font-black'
              : 'border-transparent hover:text-[#1b1c1a]'
          }`}
        >
          מעקב גביית שכר לימוד ({children.length} ילדים)
        </button>
        <button
          onClick={() => setActiveTab('TAX_VAT')}
          className={`pb-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'TAX_VAT'
              ? 'border-[#7a4b29] text-[#7a4b29] font-black'
              : 'border-transparent hover:text-[#1b1c1a]'
          }`}
        >
          הגדרות ישות משפטית ומיסוי
        </button>
        <button
          onClick={() => setActiveTab('GREEN_INVOICE')}
          className={`pb-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'GREEN_INVOICE'
              ? 'border-[#7a4b29] text-[#7a4b29] font-black'
              : 'border-transparent hover:text-[#1b1c1a]'
          }`}
        >
          אינטגרציה לחשבוניות ירוקות (Morning / iCount)
        </button>
      </div>

      {/* Tab 1: Financial Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#efeeea] flex flex-wrap items-center justify-between gap-3 text-xs bg-[#faf8f5]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#51443c] font-medium">סינון:</span>
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'ALL' ? 'bg-[#7a4b29] text-white shadow-2xs' : 'bg-[#efeeea] text-[#51443c]'
                }`}
              >
                הכל ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('INCOME')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'INCOME' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-[#efeeea] text-[#51443c]'
                }`}
              >
                הכנסות בלבד
              </button>
              <button
                onClick={() => setFilterType('EXPENSE')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'EXPENSE' ? 'bg-rose-700 text-white shadow-2xs' : 'bg-[#efeeea] text-[#51443c]'
                }`}
              >
                הוצאות בלבד
              </button>
            </div>
            <span className="text-[#51443c]">
              * קבלות פנימיות ושוברים זמינים להדפסה בלחיצה
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#efeeea] text-[#5f3414] font-bold border-b border-[#e4e2de]">
                <tr>
                  <th className="py-3 px-4">תאריך</th>
                  <th className="py-3 px-4">סוג וקטגוריה</th>
                  <th className="py-3 px-4">תיאור</th>
                  <th className="py-3 px-4">אמצעי תשלום ואסמכתא</th>
                  <th className="py-3 px-4 text-left">סכום</th>
                  <th className="py-3 px-4 text-center">מסמך / קבלה</th>
                  <th className="py-3 px-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeeea]">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';

                  return (
                    <tr key={tx.id} className="hover:bg-[#fff9f3]/60 transition">
                      <td className="py-3 px-4 font-mono text-[#51443c]">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isIncome ? 'הכנסה' : 'הוצאה'}: {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1b1c1a]">
                        {tx.description}
                        {tx.childName && (
                          <span className="block text-[11px] text-[#7a4b29] font-semibold">עבור: {tx.childName}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#51443c]">
                        <div className="flex flex-col">
                          <span>{tx.paymentMethod}</span>
                          <span className="text-[10px] text-[#51443c]/80 font-mono">
                            {tx.referenceNumber}
                            {tx.checkDetails && ` (צ'ק: ${tx.checkDetails.checkNumber})`}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 text-left font-bold font-mono text-sm ${
                          isIncome ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIncome ? '+' : '-'}₪{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenReceipt(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ffdeab] text-[#5f3414] hover:bg-[#f9b98e] border border-[#f9b98e] text-[11px] font-bold transition cursor-pointer"
                          title="צפה והדפס קבלה פנימית"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>קבלה</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-[#51443c]/50 hover:text-rose-600 transition cursor-pointer"
                          title="מחק רשומה"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Tuition Collection Dashboard */}
      {activeTab === 'TUITION' && (
        <div className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#5f3414] text-sm font-heading">מעקב גביית שכר לימוד לכלל ילדי המעון</h3>
            <span className="text-xs text-[#51443c]">חודש נובמבר 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {children.map((child) => {
              const status = child.tuitionStatus || 'PAID';
              const statusColor = {
                PAID: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                PARTIAL: 'bg-amber-50 text-amber-800 border-amber-300',
                UNPAID: 'bg-rose-50 text-rose-800 border-rose-300',
              }[status];

              const statusText = {
                PAID: 'שולם במלואו 🟢',
                PARTIAL: 'תשלום חלקי 🟡',
                UNPAID: 'בפיגור / לא שולם 🔴',
              }[status];

              return (
                <div
                  key={child.id}
                  className="p-4 rounded-2xl border border-[#e4e2de] bg-[#fff9f3]/40 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#1b1c1a] text-sm">
                        {child.firstName} {child.lastName}
                      </h4>
                      <p className="text-[#51443c] text-[11px]">
                        הורה: {child.parent1.fullName} ({child.parent1.phone})
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#efeeea]">
                    <span className="text-[#51443c]">שכ"ל חודשי:</span>
                    <span className="font-black text-[#5f3414] font-mono text-sm">
                      ₪{child.monthlyTuition.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsAddModalOpen(true);
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl bg-[#efeeea] hover:bg-[#ffdeab] text-[#5f3414] font-bold text-center border border-[#e4e2de] transition cursor-pointer"
                  >
                    רישום תשלום והפקת קבלה
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Business Entity & Tax Settings */}
      {activeTab === 'TAX_VAT' && (
        <div className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-[#5f3414] text-base font-heading">הגדרת הישות המשפטית ומיסוי</h3>
            <p className="text-xs text-[#51443c] mt-1">
              בחר/י את מבנה העסק שלך. המערכת תתאים את חישובי המע"מ, התראות התקרה והקבלות בהתאם.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => handleToggleBusinessType('OSEK_PATUR')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                isOsekPatur
                  ? 'border-[#7a4b29] bg-[#fff9f3]'
                  : 'border-[#e4e2de] hover:border-[#d97706]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#5f3414]">עוסק פטור (מומלץ בשלב ראשוני)</h4>
                {isOsekPatur && <CheckCircle2 className="w-5 h-5 text-[#7a4b29]" />}
              </div>
              <p className="text-xs text-[#51443c] leading-relaxed">
                פטור מדיווח ותשלום מע"מ עסקאות. קבלות מופקות ללא רכיב מע"מ.
                המערכת מתריעה כשהמחזור מגיע ל-80% ו-90% מתקרת הפטור השנתית (122,000 ₪ ל-2026).
              </p>
            </div>

            <div
              onClick={() => handleToggleBusinessType('OSEK_MURSHE')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                !isOsekPatur
                  ? 'border-[#7a4b29] bg-[#fff9f3]'
                  : 'border-[#e4e2de] hover:border-[#d97706]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#5f3414]">עוסק מורשה / חברה בע"מ</h4>
                {!isOsekPatur && <CheckCircle2 className="w-5 h-5 text-[#7a4b29]" />}
              </div>
              <p className="text-xs text-[#51443c] leading-relaxed">
                חישוב אוטומטי של מע"מ עסקאות (17%) מכל תקבול, קיזוז מע"מ תשומות על הוצאות מוכרות (ציוד, מזון, חומרי יצירה ושכירות יחסית), והפקת דוח דו-חודשי מרוכז.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Green Invoice (Morning / iCount) Integration Simulator */}
      {activeTab === 'GREEN_INVOICE' && (
        <div className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-[#5f3414] text-base font-heading">
                שלב ב' / Scale: אינטגרציה למערכות חשבוניות ירוקות ישראליות מורשות
              </h3>
              <p className="text-xs text-[#51443c] mt-1 max-w-2xl leading-relaxed">
                בהתאם להוראות מס הכנסה (ניהול פנקסי חשבונות), חיבור API מאפשר הפקת חשבוניות מס/קבלה דיגיטליות חוקיות בעלות חתימה אלקטרונית מאושרת שנשלחות אוטומטית להורי המעון ישירות למייל או בוואטסאפ.
              </p>
            </div>
            <span className="px-3 py-1 bg-[#ffdeab] text-[#5f3414] border border-[#f9b98e] rounded-full font-bold text-xs">
              מוכן לאינטגרציה (Phase 2 Ready)
            </span>
          </div>

          {mockSyncStatus && (
            <div className="bg-[#fff9f3] border border-[#ffdcc6] rounded-xl p-3 text-xs text-[#7a4b29] font-bold animate-pulse">
              {mockSyncStatus}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Morning */}
            <div className="border border-[#e4e2de] rounded-2xl p-4 space-y-3 bg-[#faf8f5]">
              <h4 className="font-bold text-[#5f3414] text-sm">Morning (חשבונית ירוקה)</h4>
              <p className="text-[#51443c]">
                סנכרון תקבולי שכר לימוד, יצירת קבלה חתומה דיגיטלית ושליחה אוטומטית בוואטסאפ.
              </p>
              <button
                onClick={() => handleSimulateGreenInvoice('Morning')}
                className="w-full py-2 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                בדוק חיבור API של Morning
              </button>
            </div>

            {/* iCount */}
            <div className="border border-[#e4e2de] rounded-2xl p-4 space-y-3 bg-[#faf8f5]">
              <h4 className="font-bold text-[#5f3414] text-sm">iCount (אייקאונט)</h4>
              <p className="text-[#51443c]">
                הפקת מסמכים חוקיים וסליקת הוראות קבע ואשראי מרוכזת לשכר לימוד.
              </p>
              <button
                onClick={() => handleSimulateGreenInvoice('iCount')}
                className="w-full py-2 bg-[#d97706] hover:bg-[#b45309] text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                בדוק חיבור API של iCount
              </button>
            </div>

            {/* Manual Receipt Book */}
            <div className="border border-[#e4e2de] rounded-2xl p-4 space-y-3 bg-[#faf8f5]">
              <h4 className="font-bold text-[#5f3414] text-sm">פנקס קבלות ידני (Phase 1)</h4>
              <p className="text-[#51443c]">
                תיעוד מספר קבלה ידנית מתוך פנקס מודפס לתיעוד מסודר לצד שובר המערכת.
              </p>
              <span className="block text-center font-bold text-[#5f3414] bg-[#ffdeab]/60 border border-[#f9b98e] py-2 rounded-xl">
                פעיל ומגובה מקומית
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal with Strict Cash Reduction Law Validator */}
      {isAddModalOpen && (
        <TransactionFormModal
          children={children}
          isOsekPatur={isOsekPatur}
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (txData) => {
            await onAddTransaction(txData as any);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Add Transaction Modal with Cash Reduction Law Enforcement
const TransactionFormModal: React.FC<{
  children: Child[];
  isOsekPatur: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ children, isOsekPatur, onClose, onSave }) => {
  const [type, setType] = useState<TransactionType>('INCOME');
  const [category, setCategory] = useState<TransactionCategory>('TUITION');
  const [description, setDescription] = useState('שכר לימוד חודשי');
  const [amount, setAmount] = useState<number>(4200);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');

  // Check details
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('בנק הפועלים');
  const [bankNumber, setBankNumber] = useState('12');
  const [branchNumber, setBranchNumber] = useState('614');
  const [accountNumber, setAccountNumber] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Cash law warning
  const cashValidation = validateCashTransaction(amount, paymentMethod);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cashValidation.isValid) {
      alert(cashValidation.errorMessage);
      return;
    }

    const selectedChild = children.find((c) => c.id === selectedChildId);
    const vatRate = isOsekPatur ? 0 : 0.17;
    const vatAmount = isOsekPatur ? 0 : (amount * vatRate) / (1 + vatRate);

    const checkDetails =
      paymentMethod === 'CHECK'
        ? {
            checkNumber,
            bankName,
            bankNumber,
            branchNumber,
            accountNumber,
            dueDate,
          }
        : undefined;

    onSave({
      type,
      category,
      description,
      amount: Number(amount),
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatRate,
      date,
      paymentMethod,
      childId: selectedChildId || undefined,
      childName: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : undefined,
      referenceNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
      manualReceiptNumber: manualReceiptNumber || undefined,
      checkDetails,
      isReportedToAccountant: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#e4e2de] overflow-hidden text-right">
        <div className="bg-[#7a4b29] text-white p-5 flex items-center justify-between border-b border-[#ffdeab]/20">
          <h3 className="font-black text-base font-heading">רישום תקבול / הוצאה עסקית • הבית של מאיה</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-[#efeeea] p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategory('TUITION');
                setDescription('שכר לימוד חודשי');
              }}
              className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                type === 'INCOME' ? 'bg-[#7a4b29] text-white shadow-xs' : 'text-[#51443c] hover:text-[#1b1c1a]'
              }`}
            >
              הכנסה / תקבול (שכ"ל)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategory('FOOD');
                setDescription('רכש מזון שבועי');
              }}
              className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                type === 'EXPENSE' ? 'bg-rose-700 text-white shadow-xs' : 'text-[#51443c] hover:text-[#1b1c1a]'
              }`}
            >
              הוצאה מוכרת למעון
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">סכום כולל (₪):</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] text-sm font-black font-mono focus:outline-[#d97706]"
              />
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">תאריך:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[#51443c] font-bold mb-1">אמצעי תשלום:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
            >
              <option value="BANK_TRANSFER">העברה בנקאית</option>
              <option value="CHECK">המחאה (צ'ק) - דורש פרטים מלאים</option>
              <option value="BIT">ביט / פייבוקס</option>
              <option value="CREDIT_CARD">כרטיס אשראי</option>
              <option value="CASH">מזומן (בכפוף לחוק המזומן עד 6,000 ₪)</option>
            </select>
          </div>

          {/* Strict Cash Reduction Law Enforcement Warning */}
          {!cashValidation.isValid && (
            <div className="bg-rose-100 border border-rose-300 p-3 rounded-xl text-rose-900 font-bold flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{cashValidation.errorMessage}</span>
            </div>
          )}

          {/* Check Details Fields if Check Selected */}
          {paymentMethod === 'CHECK' && (
            <div className="bg-[#fff9f3] p-3.5 rounded-2xl border border-[#ffdcc6] space-y-2">
              <span className="font-bold text-[#5f3414] block">
                חובת תיעוד פרטי צ'ק (חוק ניהול ספרים בישראל):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="מספר צ'ק"
                  required
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white focus:outline-[#d97706]"
                />
                <input
                  type="text"
                  placeholder="שם הבנק"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white focus:outline-[#d97706]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="מספר בנק"
                  value={bankNumber}
                  onChange={(e) => setBankNumber(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white focus:outline-[#d97706]"
                />
                <input
                  type="text"
                  placeholder="מספר סניף"
                  value={branchNumber}
                  onChange={(e) => setBranchNumber(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white focus:outline-[#d97706]"
                />
                <input
                  type="text"
                  placeholder="מספר חשבון"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white focus:outline-[#d97706]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#51443c] mb-0.5">תאריך פירעון:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white focus:outline-[#d97706]"
                />
              </div>
            </div>
          )}

          {/* Child Selection for Tuition */}
          {type === 'INCOME' && (
            <div>
              <label className="block text-[#51443c] font-bold mb-1">עבור ילד/ה (אופציונלי):</label>
              <select
                value={selectedChildId}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  const child = children.find((c) => c.id === e.target.value);
                  if (child) {
                    setDescription(`שכר לימוד חודשי - ${child.firstName} ${child.lastName}`);
                    setAmount(child.monthlyTuition);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              >
                <option value="">בחר ילד/ה מהרשימה...</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} (₪{c.monthlyTuition})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description & Manual Receipt Book Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">תיאור התנועה:</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">
                מס' קבלה ידנית בפנקס:
              </label>
              <input
                type="text"
                placeholder="למשל: פנקס-1043"
                value={manualReceiptNumber}
                onChange={(e) => setManualReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#efeeea]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#efeeea] text-[#51443c] font-bold hover:bg-[#e4e2de] cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!cashValidation.isValid}
              className="px-5 py-2 rounded-xl bg-[#7a4b29] text-white font-bold hover:bg-[#5f3414] shadow-xs disabled:opacity-50 cursor-pointer transition border border-[#ffdeab]/30"
            >
              שמור תנועה והפק קבלה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
