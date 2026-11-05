import React, { useRef } from 'react';
import { FinancialTransaction, DaycareSettings, Child } from '../../types';
import { X, Printer, Shield, CheckCircle, FileText } from 'lucide-react';

interface ReceiptModalProps {
  transaction: FinancialTransaction | null;
  child?: Child;
  settings: DaycareSettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  child,
  settings,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const isOsekPatur = settings?.businessType === 'OSEK_PATUR';
  const formattedDate = new Date(transaction.date).toLocaleDateString('he-IL');

  const paymentMethodLabel = {
    CASH: 'מזומן (בהתאם לחוק לצמצום במזומן)',
    CHECK: 'המחאה (צ\'ק)',
    BANK_TRANSFER: 'העברה בנקאית',
    CREDIT_CARD: 'כרטיס אשראי',
    BIT: 'אפליקציית תשלומים (Bit / PayBox)',
  }[transaction.paymentMethod];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right">
        {/* Modal Toolbar (hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-[#5f3414] text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#ffdeab]" />
            <h2 className="text-base font-bold">
              {isOsekPatur ? 'קבלה לתיעוד פנימי (עוסק פטור) • הבית של מאיה' : 'שובר קבלה / תיעוד תקבול'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#7a4b29] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#8c532d] transition cursor-pointer border border-[#ffdeab]/30"
            >
              <Printer className="w-4 h-4" />
              <span>הדפסה / שמירה כ-PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#ffdeab] hover:text-white hover:bg-[#451a03] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={printRef} className="p-8 space-y-6 text-[#1b1c1a] bg-white">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-6 border-[#e4e2de]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐝</span>
                <h1 className="text-2xl font-black text-[#5f3414]">
                  {settings?.daycareName || 'הבית של מאיה - בהנהלת רותם עירון'}
                </h1>
              </div>
              <p className="text-sm text-[#51443c] mt-1 font-medium">
                {settings?.daycareAddress || 'אריאל, שומרון'}
              </p>
              <div className="mt-2 text-xs text-[#51443c] space-y-0.5">
                <p>
                  <strong>ח.פ / ע.מ:</strong> {settings?.businessTaxId || '028912345'} |{' '}
                  <span className="font-semibold text-[#7a4b29]">
                    {isOsekPatur ? 'עוסק פטור' : 'עוסק מורשה'}
                  </span>
                </p>
                <p>
                  <strong>מנהלת הגן:</strong> רותם עירון | <strong>טלפון:</strong> {settings?.directorPhone || '052-870-7056'}
                </p>
                {settings?.licenseNumber && (
                  <p>
                    <strong>רישיון מסגרת לגיל הרך:</strong> {settings.licenseNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="text-left">
              <div className="inline-block bg-[#fff9f3] border border-[#ffdcc6] rounded-xl px-4 py-2">
                <span className="text-xs text-[#7a4b29] font-bold block">מספר מסמך פנימי</span>
                <span className="text-lg font-mono font-bold text-[#5f3414]">
                  {transaction.referenceNumber || `REC-${transaction.id.substring(0, 8)}`}
                </span>
              </div>
              <p className="text-xs text-[#51443c] mt-2">
                <strong>תאריך הפקה:</strong> {formattedDate}
              </p>
              {transaction.manualReceiptNumber && (
                <p className="text-xs text-[#c2410c] mt-0.5 font-bold">
                  <strong>מס' קבלה ידנית בפנקס:</strong> {transaction.manualReceiptNumber}
                </p>
              )}
            </div>
          </div>

          {/* Customer / Parent Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">לכבוד (הורי הפעוט/ה):</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {child?.parent1.fullName || transaction.childName || 'הורי המעון'}
              </p>
              {child?.parent1.phone && (
                <p className="text-xs text-slate-600 mt-0.5">טלפון: {child.parent1.phone}</p>
              )}
              {child?.parent1.email && (
                <p className="text-xs text-slate-600">דוא"ל: {child.parent1.email}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500">עבור הפעוט/ה:</p>
              <p className="font-bold text-teal-800 mt-0.5">
                {child ? `${child.firstName} ${child.lastName}` : transaction.childName || '-'}
              </p>
              {child?.idNumber && (
                <p className="text-xs text-slate-600 mt-0.5">ת.ז. ילד/ה: {child.idNumber}</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">פירוט תשלום</th>
                  <th className="py-3 px-4">אמצעי תשלום</th>
                  <th className="py-3 px-4 text-left">סכום (₪)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-900">{transaction.description}</p>
                    <p className="text-xs text-slate-500">חודש שירות שוטף לגיל הרך</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">
                    {paymentMethodLabel}
                  </td>
                  <td className="py-3.5 px-4 text-left font-bold text-slate-900 font-mono text-base">
                    ₪{transaction.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Check Details Section if Paid by Check */}
          {transaction.paymentMethod === 'CHECK' && transaction.checkDetails && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <CheckCircle className="w-3.5 h-3.5" />
                תיעוד פרטי המחאה (בהתאם להוראות ניהול ספרים):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono">
                <div>
                  <span className="text-slate-500">מספר צ'ק:</span>{' '}
                  <span className="font-bold">{transaction.checkDetails.checkNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">בנק:</span>{' '}
                  <span className="font-bold">
                    {transaction.checkDetails.bankName} ({transaction.checkDetails.bankNumber})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">סניף / חשבון:</span>{' '}
                  <span className="font-bold">
                    {transaction.checkDetails.branchNumber} / {transaction.checkDetails.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">ת. פירעון:</span>{' '}
                  <span className="font-bold">{transaction.checkDetails.dueDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Totals */}
          <div className="flex flex-col items-end gap-1 text-sm border-t pt-4 border-slate-200">
            {isOsekPatur ? (
              <div className="text-xs text-slate-500 font-medium">
                * עוסק פטור אינו רשאי לגבות מע"מ (סעיף 31 לחוק מע"מ)
              </div>
            ) : (
              <>
                <div className="flex justify-between w-64 text-slate-600 text-xs">
                  <span>סכום לפני מע"מ:</span>
                  <span>₪{(transaction.amount - transaction.vatAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600 text-xs">
                  <span>מע"מ ({((transaction.vatRate || 0.17) * 100).toFixed(0)}%):</span>
                  <span>₪{transaction.vatAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between w-64 text-lg font-black text-[#5f3414] pt-2 border-t border-[#d6c3b8]">
              <span>סה"כ התקבול:</span>
              <span className="font-mono">₪{transaction.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Legal Compliance Footer */}
          <div className="pt-4 border-t border-[#e4e2de] text-[11px] text-[#51443c] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#5f3414]">
              <Shield className="w-3.5 h-3.5 text-[#7a4b29]" />
              <span>
                מסמך זה הופק באמצעות מערכת הניהול של 'הבית של מאיה' לתיעוד פנימי ודיווח לרואה חשבון
              </span>
            </div>
            <span>חתימת רותם עירון: _________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
