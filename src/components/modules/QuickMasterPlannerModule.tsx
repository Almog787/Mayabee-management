import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  Users,
  RotateCcw,
  MessageCircle,
  PiggyBank,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Info,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DaycareSettings } from '../../types';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (updates: Partial<DaycareSettings>) => Promise<void>;
  onOpenSuggestions?: () => void;
}

const STORAGE_KEY = 'daycare_budget_rotem_maya_exact_table_v10';

/**
 * EXACT VALUES DIRECTLY FROM THE USER'S BUDGET TABLE:
 * ---------------------------------------------------
 * 1. מספר ילדים: 16 (פירוט: ניתן לשינוי בגיליון הנחות)
 * 2. שכר לימוד לילד: ₪3,500.00 כולל מע"מ 18%
 * 3. עלות כוח אדם: ₪32,761.12 (פירוט: כולל אומדן עלות מעסיק ונסיעות לכל חמש העובדות)
 * 4. הוצאות תפעול: ₪7,150.00 (פירוט: סך הוצאות תפעול)
 * 5. אחוז הפרשה לבלת"מים: 10% (פירוט: 10% מההכנסה ללא מע״מ)
 * 6. שיעור מע"מ: 18%
 */
const DEFAULT_TABLE_INPUTS = {
  childrenCount: 16,
  tuitionPerChild: 3500, // שכר לימוד כולל מע"מ
  vatRatePercent: 18, // 18% מע"מ
  staffCost: 32761.12, // כולל אומדן עלות מעסיק 1.3 ונסיעות לכל 5 העובדות
  operatingExpenses: 7150.00, // סך הוצאות תפעול
  contingencyPercent: 10, // 10% מההכנסה ללא מע"מ
};

/**
 * Eye-friendly Touch Slider Component
 */
const EyeFriendlySlider: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  sublabel?: string;
  accentColor?: string;
}> = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', sublabel, accentColor = 'accent-teal-500' }) => {
  const safeVal = Math.max(min, Math.min(max, isNaN(value) ? min : value));

  return (
    <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 shadow-xs hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-baseline gap-2">
        <div className="min-w-0">
          <label className="text-slate-100 font-bold text-xs tracking-tight block truncate">{label}</label>
          {sublabel && <span className="text-[11px] text-slate-300 font-normal block truncate mt-0.5">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-1 font-mono font-bold text-teal-300 text-sm shrink-0 tabular-nums bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
          <span>{prefix}</span>
          <span>{safeVal.toLocaleString('he-IL', { maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-300">{suffix}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeVal}
          onChange={(e) => {
            const num = Number(e.target.value);
            onChange(isNaN(num) ? min : Math.max(min, Math.min(max, num)));
          }}
          className={`flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${accentColor} touch-none`}
        />
      </div>
    </div>
  );
};

export const QuickMasterPlannerModule: React.FC<QuickMasterPlannerProps> = ({
  settings,
}) => {
  const [resetSuccessMessage, setResetSuccessMessage] = useState<boolean>(false);

  // Target Month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // State initialized with exact table values
  const [inputs, setInputs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_TABLE_INPUTS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load table inputs from storage', e);
    }
    return { ...DEFAULT_TABLE_INPUTS };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch (e) {
      console.error('Failed to save table inputs to storage', e);
    }
  }, [inputs]);

  const updateInput = (field: keyof typeof DEFAULT_TABLE_INPUTS, val: number) => {
    setInputs((prev: typeof DEFAULT_TABLE_INPUTS) => ({ ...prev, [field]: val }));
  };

  const handleResetToTableDefaults = () => {
    setInputs({ ...DEFAULT_TABLE_INPUTS });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TABLE_INPUTS));
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
    setResetSuccessMessage(true);
    setTimeout(() => setResetSuccessMessage(false), 2500);
  };

  const {
    childrenCount,
    tuitionPerChild,
    vatRatePercent,
    staffCost,
    operatingExpenses,
    contingencyPercent,
  } = inputs;

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // =========================================================================
  // EXACT CALCULATIONS DERIVED DIRECTLY FROM THE USER'S BUDGET TABLE:
  // =========================================================================
  // 1. מספר ילדים (ניתן לשינוי בגיליון הנחות)
  const numChildren = Math.max(1, Number(childrenCount) || 16);

  // 2. הכנסה חודשית כולל מע״מ = מספר ילדים × שכר לימוד
  const monthlyIncomeWithVat = numChildren * (Number(tuitionPerChild) || 3500);

  // 3. מע״מ מתוך ההכנסה = חישוב מע״מ מתוך מחיר כולל מע״מ (18%)
  const vatRate = (Number(vatRatePercent) || 18) / 100;
  const incomeWithoutVat = monthlyIncomeWithVat / (1 + vatRate);
  const vatFromIncome = monthlyIncomeWithVat - incomeWithoutVat;

  // 4. הכנסה ללא מע״מ = הכנסה פנויה לפני הוצאות
  const netDisposableIncome = incomeWithoutVat;

  // 5. עלות כוח אדם = כולל אומדן עלות מעסיק ונסיעות לכל חמש העובדות
  const currentStaffCost = Number(staffCost) || 32761.12;

  // 6. הוצאות תפעול = סך הוצאות תפעול
  const currentOperatingExpenses = Number(operatingExpenses) || 7150.00;

  // 7. הפרשה לבלת״מים = 10% מההכנסה ללא מע״מ
  const contingencyRatio = (Number(contingencyPercent) || 10) / 100;
  const contingencyAmount = netDisposableIncome * contingencyRatio;

  // 8. סה״כ הוצאות והפרשות = כוח אדם + תפעול + בלת״מים
  const totalExpensesAndContingency = currentStaffCost + currentOperatingExpenses + contingencyAmount;

  // 9. יתרה חודשית משוערת = לפני הוצאות ומסים שלא נכללו (הכנסה ללא מע"מ פחות סה"כ הוצאות והפרשות)
  const estimatedMonthlyBalance = netDisposableIncome - totalExpensesAndContingency;

  // 10. יתרה לכל ילד = יתרה חודשית חלקי מספר ילדים
  const balancePerChild = numChildren > 0 ? (estimatedMonthlyBalance / numChildren) : 0;

  // Chart Data: Exact allocation of Disposable Net Income
  const costDistributionData = useMemo(() => {
    return [
      { name: 'עלות כוח אדם', value: Math.round(currentStaffCost), fill: '#38bdf8' },
      { name: 'הוצאות תפעול', value: Math.round(currentOperatingExpenses), fill: '#34d399' },
      { name: 'הפרשה לבלת״מים', value: Math.round(contingencyAmount), fill: '#fbbf24' },
      ...(estimatedMonthlyBalance > 0
        ? [{ name: 'יתרה חודשית משוערת', value: Math.round(estimatedMonthlyBalance), fill: '#a78bfa' }]
        : []),
    ];
  }, [currentStaffCost, currentOperatingExpenses, contingencyAmount, estimatedMonthlyBalance]);

  // WhatsApp formatted share message with the exact table lines
  const handleShareWhatsAppBudget = () => {
    const text = `📊 *תקציב חודשי – הבית של רותם ומאיה*
📅 חודש: ${monthLabel}

📋 *נתוני התקציב:*
• מספר ילדים: ${numChildren} (שכר לימוד: ₪${Number(tuitionPerChild).toLocaleString()})
• הכנסה חודשית כולל מע״מ: ₪${monthlyIncomeWithVat.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• מע״מ מתוך ההכנסה: ₪${vatFromIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• הכנסה ללא מע״מ: ₪${netDisposableIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• עלות כוח אדם: ₪${currentStaffCost.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (5 עובדות ומקדם 1.3)
• הוצאות תפעול: ₪${currentOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• הפרשה לבלת״מים: ₪${contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (10% מההכנסה ללא מע״מ)
• סה״כ הוצאות והפרשות: ₪${totalExpensesAndContingency.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• יתרה חודשית משוערת: ₪${estimatedMonthlyBalance.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• יתרה לכל ילד: ₪${balancePerChild.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

📝 *הערת חישוב:*
ההכנסה חושבה בהנחה ששכר הלימוד 3,500 ₪ כולל מע״מ ושיעור המע״מ 18%. היתרה אינה רווח נקי: לא נכללו שכירות, ביטוחים, ניקיון, עובדות חולות , הבראה, עלות המעסיק היא אומדן אחיד של 1.3.

קישור למערכת: https://almog787.github.io/Mayabee-management/`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Export to Excel / Sheets strictly matching the table
  const handleExportGoogleSheets = () => {
    const dummyChildren = Array.from({ length: numChildren }, (_, i) => ({
      id: `child-${i + 1}`,
      idNumber: `0000000${i}`,
      firstName: `ילד/ה ${i + 1}`,
      lastName: '',
      birthDate: '2024-01-01',
      enrollmentDate: '2025-09-01',
      ageGroup: 'TODDLER' as const,
      allergies: [],
      parent1: { fullName: 'הורה', phone: '050-0000000', email: '', relation: 'משפחה' },
      monthlyTuition: Number(tuitionPerChild) || 3500,
      extraFees: undefined,
      tuitionStatus: 'PAID' as const,
      status: 'ACTIVE' as const,
      updatedAt: Date.now(),
    }));

    const tableExpenses = [
      { id: 'exp-1', categoryName: 'עלות כוח אדם', description: 'כולל אומדן עלות מעסיק ונסיעות לכל חמש העובדות', expectedAmount: currentStaffCost, isConfirmed: true },
      { id: 'exp-2', categoryName: 'הוצאות תפעול', description: 'סך הוצאות תפעול', expectedAmount: currentOperatingExpenses, isConfirmed: true },
      { id: 'exp-3', categoryName: 'הפרשה לבלת״מים', description: '10% מההכנסה ללא מע״מ', expectedAmount: contingencyAmount, isConfirmed: true },
    ];

    const tableStaff = Array.from({ length: 5 }, (_, i) => ({
      id: `staff-${i + 1}`,
      fullName: `עובדת צוות ${i + 1}`,
      idNumber: '000000000',
      role: (i === 0 ? 'DIRECTOR' : i === 1 ? 'LEAD_EDUCATOR' : 'ASSISTANT') as any,
      phone: '052-870-7056',
      email: '',
      hourlyRate: 36,
      standardDailyHours: 7,
      firstAidCertExpiryDate: '2027-01-01',
      policeClearanceDate: '2026-01-01',
      policeClearanceApproved: true,
      status: 'ACTIVE' as const,
      updatedAt: Date.now(),
    }));

    exportToGoogleSheetsXlsx({
      selectedMonth,
      monthLabel,
      activeChildren: dummyChildren as any,
      expectedExpenses: tableExpenses as any,
      staff: tableStaff as any,
      settings,
      completenessScore: 100,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 text-right">
          <div className="inline-flex items-center gap-2 text-teal-300 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>תקציב חודשי – הבית של רותם ומאיה</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            מחשבון תקציב חודשי ומאזן 📊
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            המחשבון כולו מבוסס במדויק על טבלת התקציב ונוסחאותיה (16 ילדים, 18% מע"מ, 5 עובדות, ₪7,150 תפעול, 10% בלת"ם).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">חודש יעד:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-teal-300 font-bold text-xs outline-none font-mono cursor-pointer"
            />
          </div>

          <button
            onClick={handleShareWhatsAppBudget}
            className="flex items-center gap-1.5 bg-emerald-700/30 hover:bg-emerald-700/40 text-emerald-200 border border-emerald-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>שיתוף בווטסאפ</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ייצוא Sheets / Excel</span>
          </button>
        </div>
      </div>

      {/* 2. THE EXACT BUDGET TABLE (תואם לטבלה במדויק) */}
      <div className="bg-slate-900 border border-teal-800/50 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-700/60 flex items-center justify-center text-teal-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>תקציב חודשי – הבית של רותם ומאיה</span>
              </h3>
              <p className="text-xs text-slate-300">
                כל הקטגוריות והחישובים מחושבים לפי הגדרות הטבלה במדויק:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resetSuccessMessage && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>הערכים שוחזרו לדיפולט הטבלה!</span>
              </span>
            )}
            <button
              onClick={handleResetToTableDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition cursor-pointer border border-slate-700"
              title="שחזור נתוני ברירת המחדל של הטבלה"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>איפוס לדיפולט הטבלה (16 ילדים)</span>
            </button>
          </div>
        </div>

        {/* Structured Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">סעיף</th>
                <th className="py-2.5 px-3 font-semibold font-mono">סכום (₪)</th>
                <th className="py-2.5 px-3 font-semibold">פירוט</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-bold text-slate-200 font-sans">מספר ילדים</td>
                <td className="py-3 px-3 text-base font-bold text-teal-300">{numChildren}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">ניתן לשינוי בגיליון הנחות</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition bg-slate-950/30">
                <td className="py-3 px-3 font-bold text-slate-200 font-sans">הכנסה חודשית כולל מע״מ</td>
                <td className="py-3 px-3 text-base font-bold text-emerald-400">₪{monthlyIncomeWithVat.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">מספר ילדים × שכר לימוד</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-bold text-amber-300 font-sans">מע״מ מתוך ההכנסה</td>
                <td className="py-3 px-3 text-base font-bold text-amber-300">₪{vatFromIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">חישוב מע״מ מתוך מחיר כולל מע״מ</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition bg-slate-950/50">
                <td className="py-3 px-3 font-bold text-teal-200 font-sans">הכנסה ללא מע״מ</td>
                <td className="py-3 px-3 text-base font-bold text-teal-200">₪{netDisposableIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">הכנסה פנויה לפני הוצאות</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-bold text-sky-300 font-sans">עלות כוח אדם</td>
                <td className="py-3 px-3 text-base font-bold text-sky-300">₪{currentStaffCost.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">כולל אומדן עלות מעסיק ונסיעות לכל חמש העובדות</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-bold text-slate-200 font-sans">הוצאות תפעול</td>
                <td className="py-3 px-3 text-base font-bold text-slate-200">₪{currentOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">סך הוצאות תפעול</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-bold text-amber-400 font-sans">הפרשה לבלת״מים</td>
                <td className="py-3 px-3 text-base font-bold text-amber-400">₪{contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">10% מההכנסה ללא מע״מ</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition bg-slate-950">
                <td className="py-3 px-3 font-bold text-rose-300 font-sans">סה״כ הוצאות והפרשות</td>
                <td className="py-3 px-3 text-base font-black text-rose-300">₪{totalExpensesAndContingency.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">כוח אדם + תפעול + בלת״מים</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition bg-teal-950/40 border-t-2 border-teal-500/50">
                <td className="py-3 px-3 font-black text-emerald-300 text-sm font-sans">יתרה חודשית משוערת</td>
                <td className={`py-3 px-3 text-lg font-black ${estimatedMonthlyBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  ₪{estimatedMonthlyBalance.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-slate-200 font-sans">לפני הוצאות ומסים שלא נכללו</td>
              </tr>

              <tr className="hover:bg-slate-800/40 transition bg-teal-950/20">
                <td className="py-3 px-3 font-bold text-teal-300 font-sans">יתרה לכל ילד</td>
                <td className="py-3 px-3 text-base font-black text-teal-300">₪{balancePerChild.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-slate-300 font-sans">יתרה חודשית חלקי מספר ילדים</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation note verbatim from user table */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">הערת חישוב: </span>
            <span>
              "ההכנסה חושבה בהנחה ששכר הלימוד 3,500 ₪ כולל מע״מ ושיעור המע״מ 18%. היתרה אינה רווח נקי: לא נכללו שכירות, ביטוחים, ניקיון, עובדות חולות , הבראה, עלות המעסיק היא אומדן אחיד של 1.3."
            </span>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY SCORECARDS (מדדי הטבלה בלבד) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Monthly Balance */}
        <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>יתרה חודשית משוערת</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${estimatedMonthlyBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              ₪{Math.round(estimatedMonthlyBalance).toLocaleString()}
            </span>
            <span className="text-[11px] font-mono text-slate-400">/ חודש</span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800 text-slate-300">
            <span>יתרה לכל ילד:</span>
            <span className="font-mono font-bold text-teal-300">₪{balancePerChild.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Income without VAT */}
        <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>הכנסה ללא מע"מ</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-teal-300 tabular-nums">
              ₪{Math.round(netDisposableIncome).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800 text-slate-300">
            <span>מע״מ מתוך ההכנסה ({vatRatePercent}%):</span>
            <span className="font-mono font-bold text-amber-300">₪{Math.round(vatFromIncome).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Staff Cost */}
        <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>עלות כוח אדם</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-300 tabular-nums">
              ₪{Math.round(currentStaffCost).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800 text-slate-300">
            <span>5 עובדות + מקדם מעסיק:</span>
            <span className="font-mono font-bold text-sky-400">1.3 אחיד ונסיעות</span>
          </div>
        </div>

        {/* Card 4: Contingency Buffer */}
        <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>הפרשה לבלת״מים</span>
            <PiggyBank className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 tabular-nums">
              ₪{Math.round(contingencyAmount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800 text-slate-300">
            <span>חישוב מהכנסה ללא מע"מ:</span>
            <span className="font-mono font-bold text-amber-400">{contingencyPercent}% בדיוק</span>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE INPUT CONTROLS (שדות המחשבון המותאמים לסעיפי הטבלה בלבד) */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
          <Sliders className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              התאמת משתני הטבלה (סימולטור חישובי)
            </h3>
            <p className="text-xs text-slate-300">
              שינוי כל אחד ממרכיבי הטבלה מעדכן מיידית את כל שורות התקציב למעלה:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* SLICE 1: Enrollment & Tuition */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-teal-300 block border-b border-slate-800 pb-2">
              1. ילדים ושכר לימוד
            </span>
            <EyeFriendlySlider
              label="מספר ילדים:"
              sublabel="בטבלה: 16 (ניתן לשינוי)"
              value={childrenCount}
              onChange={(val) => updateInput('childrenCount', val)}
              min={1}
              max={30}
              suffix="ילדים"
              accentColor="accent-teal-400"
            />
            <EyeFriendlySlider
              label="שכר לימוד כולל מע''מ לילד:"
              sublabel="בטבלה: ₪3,500 כולל מע''מ"
              value={tuitionPerChild}
              onChange={(val) => updateInput('tuitionPerChild', val)}
              min={2000}
              max={5500}
              step={50}
              prefix="₪"
              accentColor="accent-teal-400"
            />
            <EyeFriendlySlider
              label="שיעור מע''מ (%):"
              sublabel="בטבלה: 18% (חוק מע''מ עדכני)"
              value={vatRatePercent}
              onChange={(val) => updateInput('vatRatePercent', val)}
              min={0}
              max={25}
              step={0.5}
              suffix="%"
              accentColor="accent-teal-400"
            />
          </div>

          {/* SLICE 2: Staff & Operations */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-sky-300 block border-b border-slate-800 pb-2">
              2. כוח אדם והוצאות תפעול
            </span>
            <EyeFriendlySlider
              label="עלות כוח אדם (₪):"
              sublabel="כולל מקדם 1.3 ונסיעות ל-5 עובדות"
              value={staffCost}
              onChange={(val) => updateInput('staffCost', val)}
              min={10000}
              max={60000}
              step={50}
              prefix="₪"
              accentColor="accent-sky-400"
            />
            <EyeFriendlySlider
              label="הוצאות תפעול (₪):"
              sublabel="בטבלה: ₪7,150.00 סך הוצאות תפעול"
              value={operatingExpenses}
              onChange={(val) => updateInput('operatingExpenses', val)}
              min={1000}
              max={20000}
              step={50}
              prefix="₪"
              accentColor="accent-sky-400"
            />
          </div>

          {/* SLICE 3: Contingency Reserve */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-amber-300 block border-b border-slate-800 pb-2">
              3. הפרשה לבלת״מים
            </span>
            <EyeFriendlySlider
              label="אחוז הפרשה לבלת״מים (%):"
              sublabel="בטבלה: 10% מההכנסה ללא מע״מ"
              value={contingencyPercent}
              onChange={(val) => updateInput('contingencyPercent', val)}
              min={0}
              max={25}
              step={1}
              suffix="%"
              accentColor="accent-amber-400"
            />
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">סכום הפרשה חודשי:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">₪{Math.round(contingencyAmount).toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">סה״כ הוצאות והפרשות:</span>
              <span className="font-mono font-bold text-rose-300 text-sm">₪{Math.round(totalExpensesAndContingency).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. VISUAL DISTRIBUTION CHART (סעיפי הטבלה בלבד) */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">פילוח ההכנסה הפנויה ללא מע״מ (₪{Math.round(netDisposableIncome).toLocaleString()})</h3>
          </div>
          <span className="text-[11px] font-mono text-teal-300 font-bold">100% מסעיפי הטבלה</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} horizontal={false} />
              <XAxis type="number" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#f1f5f9' }} width={135} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                formatter={(val: any) => [`₪${Number(val).toLocaleString()}`, 'סכום']}
              />
              <Bar dataKey="value" name="סכום (₪)" radius={[0, 6, 6, 0]}>
                {costDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
