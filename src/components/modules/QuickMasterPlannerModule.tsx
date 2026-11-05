import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Users,
  ShieldCheck,
  Building,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { DaycareSettings } from '../../types';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';
import { calculateIsraeliTaxEstimate, EstimatedTaxResult } from '../../lib/taxEngine';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (updates: Partial<DaycareSettings>) => Promise<void>;
}

const STORAGE_KEY = 'mayabee_planner_macro_v2';

type BusinessType = 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY';

const DEFAULT_PLANNER_DATA = {
  businessType: 'OSEK_PATUR' as BusinessType,
  childrenCount: 0,
  tuitionPerChild: 0,
  afternoonCareFee: 600,
  afternoonCareChildren: 0,
  rentAndTax: 3800,
  insuranceCost: 850,
  accountantCost: 650,
  utilitiesCost: 1200,
  foodPerChild: 280, // ~12.7 ₪ ליום לילד (3 ארוחות ביום: בוקר, צהריים בשרית, מנחה)
  suppliesPerChild: 80, // חומרי יצירה, חיתולים, מגבונים וחומרי חיטוי לילד
  staffCount: 2,
  avgStaffHourlyRate: 45,
  dailyHoursPerStaff: 8,
  socialOverheadPercent: 20, // תוספת עלות מעסיק סוציאלית 20% (פנסיה, פיצויים, ביטוח לאומי מעסיק, הבראה, חופשה ונסיעות)
  enrichmentClassesCost: 1000, // חוגי העשרה חיצוניים (מוזיקה / תנועה)
  maintenanceAndSafety: 500, // תחזוקה שוטפת, בדיקת בטיחות מתקנים ואגרות
};

/**
 * Custom Styled Slider Component for Touch-First Data Entry
 */
const MacroSlider: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  showInput?: boolean;
}> = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', showInput = true }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <label className="text-[#51443c] font-black text-xs uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-1 font-mono font-black text-[#7a4b29] text-base">
          <span>{prefix}</span>
          <span>{value.toLocaleString()}</span>
          <span className="text-[10px] opacity-70">{suffix}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-[#d6c3b8]/40 rounded-full appearance-none cursor-pointer accent-[#7a4b29] touch-none"
        />
      </div>
    </div>
  );
};

export const QuickMasterPlannerModule: React.FC<QuickMasterPlannerProps> = ({ settings }) => {
  const [resetSuccessMessage, setResetSuccessMessage] = useState<boolean>(false);

  // Target Month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Load saved state or defaults
  const [plannerData, setPlannerData] = useState(() => {
    try {
      // Clear legacy storage v1 if it contains old 10 / 3300 defaults
      localStorage.removeItem('mayabee_planner_macro_v1');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PLANNER_DATA, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load saved planner data', e);
    }
    return { ...DEFAULT_PLANNER_DATA };
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerData));
    } catch (e) {
      console.error('Failed to save planner data', e);
    }
  }, [plannerData]);

  // Helper setter
  const updateField = (field: keyof typeof DEFAULT_PLANNER_DATA, value: any) => {
    setPlannerData((prev: typeof DEFAULT_PLANNER_DATA) => ({ ...prev, [field]: value }));
  };

  // Reset function - direct and reliable, updates state and clears localStorage
  const handleResetDefaults = () => {
    const freshDefaults = { ...DEFAULT_PLANNER_DATA };
    setPlannerData(freshDefaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshDefaults));
    } catch (e) {
      console.error('Failed to reset planner storage', e);
    }
    setResetSuccessMessage(true);
    setTimeout(() => setResetSuccessMessage(false), 2500);
  };

  const {
    businessType,
    childrenCount,
    tuitionPerChild,
    afternoonCareFee,
    afternoonCareChildren,
    rentAndTax,
    insuranceCost,
    accountantCost,
    utilitiesCost,
    foodPerChild,
    suppliesPerChild,
    staffCount,
    avgStaffHourlyRate,
    dailyHoursPerStaff,
    socialOverheadPercent,
    enrichmentClassesCost,
    maintenanceAndSafety,
  } = plannerData;

  // Detailed Breakdown Drawer Toggle
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(false);

  // Month Hebrew Label
  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Data Entry Check: Hide scary expenses & deficits until Rotem/Maya input initial data
  const hasEnteredData = childrenCount > 0 && tuitionPerChild > 0;

  // LIVE CALCULATIONS
  // Income
  const baseTuitionTotal = useMemo(() => childrenCount * tuitionPerChild, [childrenCount, tuitionPerChild]);
  const afternoonCareTotal = useMemo(() => afternoonCareChildren * afternoonCareFee, [afternoonCareChildren, afternoonCareFee]);
  const totalIncome = baseTuitionTotal + afternoonCareTotal;

  // Expenses
  const baseStaffWages = useMemo(
    () => staffCount * avgStaffHourlyRate * dailyHoursPerStaff * 22,
    [staffCount, avgStaffHourlyRate, dailyHoursPerStaff]
  );
  const socialOverheadAmount = useMemo(
    () => baseStaffWages * ((socialOverheadPercent || 20) / 100),
    [baseStaffWages, socialOverheadPercent]
  );
  const staffPayrollTotal = baseStaffWages + socialOverheadAmount;

  const variableFoodSuppliesTotal = useMemo(
    () => childrenCount * (foodPerChild + suppliesPerChild),
    [childrenCount, foodPerChild, suppliesPerChild]
  );
  const fixedExpensesTotal =
    rentAndTax + insuranceCost + accountantCost + utilitiesCost + (enrichmentClassesCost || 0) + (maintenanceAndSafety || 0);
  const actualTotalExpenses = staffPayrollTotal + variableFoodSuppliesTotal + fixedExpensesTotal;
  const displayTotalExpenses = hasEnteredData ? actualTotalExpenses : 0;

  // Net Balance & Pre-Tax / Post-Tax Calculation
  const netBalance = hasEnteredData ? totalIncome - actualTotalExpenses : 0;
  const profitMarginPercent = hasEnteredData && totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Israeli Tax Estimate Calculation
  const taxEstimate: EstimatedTaxResult = useMemo(() => {
    if (!hasEnteredData) {
      return {
        businessType,
        grossIncome: 0,
        grossExpenses: 0,
        preTaxNetProfit: 0,
        postTaxNetProfit: 0,
        totalTaxLiability: 0,
        incomeTaxAmount: 0,
        nationalInsuranceAmount: 0,
        netVatAmount: 0,
        effectiveTaxRatePercent: 0,
        explanationSummary: '💡 הזן כמות ילדים ושכר לימוד בטופס למטה לקבלת ניתוח מס ורווח נטו שנשאר בכיס.',
      };
    }
    return calculateIsraeliTaxEstimate(totalIncome, actualTotalExpenses, businessType);
  }, [hasEnteredData, totalIncome, actualTotalExpenses, businessType]);

  // Export to Google Sheets
  const handleExportGoogleSheets = () => {
    // Generate dummy items for exporter based on macro inputs
    const dummyChildren = Array.from({ length: childrenCount }, (_, i) => ({
      id: `child-${i + 1}`,
      idNumber: `0000000${i}`,
      firstName: `ילד/ה ${i + 1}`,
      lastName: '',
      birthDate: '2024-01-01',
      enrollmentDate: '2025-09-01',
      ageGroup: (i % 3 === 0 ? 'INFANT' : i % 3 === 1 ? 'TODDLER' : 'PRESCHOOL') as any,
      allergies: [],
      parent1: { fullName: 'הורה', phone: '050-0000000', email: '', relation: 'אמא' },
      monthlyTuition: tuitionPerChild,
      extraFees: i < afternoonCareChildren ? { afternoonCare: afternoonCareFee, fridayCare: 0, activities: 0 } : undefined,
      tuitionStatus: 'PAID' as const,
      status: 'ACTIVE' as const,
      updatedAt: Date.now(),
    }));

    const macroExpenses = [
      { id: 'exp-1', categoryName: 'שכירות וארנונה', description: 'דמי שכירות מבנה המעון באריאל', expectedAmount: rentAndTax, isConfirmed: true },
      { id: 'exp-2', categoryName: 'ביטוח צד ג\' ותאונות', description: 'פרמיה חודשית לביטוח מעון', expectedAmount: insuranceCost, isConfirmed: true },
      { id: 'exp-3', categoryName: 'רואה חשבון וייעוץ מס', description: 'ריטיינר חודשי', expectedAmount: accountantCost, isConfirmed: true },
      { id: 'exp-4', categoryName: 'חשמל, מים ואינטרנט', description: 'חשבונות תפעול חודשיים', expectedAmount: utilitiesCost, isConfirmed: true },
      { id: 'exp-5', categoryName: 'מזון וטריות (לכל הילדים)', description: `תקציב ₪${foodPerChild} לילד X ${childrenCount} ילדים`, expectedAmount: childrenCount * foodPerChild, isConfirmed: true },
      { id: 'exp-6', categoryName: 'חומרי יצירה וניקיון', description: `תקציב ₪${suppliesPerChild} לילד X ${childrenCount} ילדים`, expectedAmount: childrenCount * suppliesPerChild, isConfirmed: true },
    ];

    const dummyStaff = Array.from({ length: staffCount }, (_, i) => ({
      id: `staff-${i + 1}`,
      fullName: `עובדת צוות ${i + 1}`,
      idNumber: '000000000',
      role: (i === 0 ? 'DIRECTOR' : i === 1 ? 'LEAD_EDUCATOR' : 'ASSISTANT') as any,
      phone: '050-0000000',
      email: '',
      hourlyRate: avgStaffHourlyRate,
      standardDailyHours: dailyHoursPerStaff,
      firstAidCertExpiryDate: '2027-01-01',
      policeClearanceDate: '2026-01-01',
      policeClearanceApproved: true,
      status: 'ACTIVE' as const,
      updatedAt: Date.now(),
    }));

    exportToGoogleSheetsXlsx({
      monthLabel,
      selectedMonth,
      activeChildren: dummyChildren,
      expectedExpenses: macroExpenses,
      staff: dummyStaff,
      settings,
      completenessScore: 100,
    });
  };

  // WhatsApp formatted report share
  const handleShareWhatsApp = () => {
    const bTypeLabel =
      businessType === 'OSEK_PATUR' ? 'עוסק פטור' : businessType === 'OSEK_MURSHE' ? 'עוסק מורשה' : 'חברה בע"מ';

    const text = `📊 *סיכום תכנון מאזן חודשי - הבית של מאיה*
📅 *חודש יעד:* ${monthLabel}
💼 *סוג עסק:* ${bTypeLabel}

🔹 *נתוני יסוד שהוזנו:*
• כמות ילדים במעון: ${childrenCount}
• שכר לימוד חודשי: ₪${tuitionPerChild.toLocaleString()}
• צהרון: ${afternoonCareChildren} ילדים (₪${afternoonCareFee}/ילד)

💰 *הכנסות חודשיות צפויות:* ₪${totalIncome.toLocaleString()}

🔻 *הוצאות חודשיות צפויות:* ₪${Math.round(displayTotalExpenses).toLocaleString()}
• שכירות וארנונה: ₪${rentAndTax.toLocaleString()}
• ביטוח מעון: ₪${insuranceCost.toLocaleString()}
• חבות שכר צוות (${staffCount} עובדות): ₪${Math.round(staffPayrollTotal).toLocaleString()}
• מזון וציוד היגיינה: ₪${variableFoodSuppliesTotal.toLocaleString()}
• רו"ח ותפעול: ₪${(accountantCost + utilitiesCost).toLocaleString()}

🟢 *רווח נקי לפני מס:* ₪${Math.round(taxEstimate.preTaxNetProfit).toLocaleString()}
⚖️ *אומדן מיסים וביטוח לאומי:* ₪${taxEstimate.totalTaxLiability.toLocaleString()}
✨ *רווח נטו בכיס (אחרי מס):* ₪${Math.round(taxEstimate.postTaxNetProfit).toLocaleString()}

🔗 *פתח ועדכן במחשבון:*
https://almog787.github.io/Mayabee-management/`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-[#1b1c1a] space-y-6 max-w-7xl mx-auto">
      {/* Executive Clean Header */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden border border-[#d6c3b8]/30">
        <div className="space-y-3 max-w-2xl relative z-10 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#ffdeab] text-xs font-black tracking-wide uppercase">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>דשבורד תכנון מאזן • הבית של מאיה</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-heading leading-tight">
            מתכנן מאזן חודשי צפוי 📊
          </h2>

          <p className="text-sm sm:text-base text-[#ffedd5]/90 leading-relaxed font-medium">
            הזן נתונים עיקריים וקבל תחזית רווח נקי ויציבות תקציבית לחודש <strong className="text-white underline decoration-[#ffdeab]/40 underline-offset-4">{monthLabel}</strong>.
          </p>
        </div>

        {/* Action buttons & Month Picker */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 flex-shrink-0 min-w-[220px]">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-2xl shadow-lg transition-all text-sm sm:text-base cursor-pointer border border-emerald-500 active:scale-95 justify-center"
            title="שתף הודעה מעוצבת בווטסאפ עם תוצאות החישוב והנתונים"
          >
            <MessageCircle className="w-5 h-5 text-emerald-100" />
            <span>שתף תוצאות בווטסאפ 💬</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-2 bg-[#ffdeab] hover:bg-white text-[#5f3414] font-black px-5 py-3 rounded-2xl shadow-lg transition-all text-sm sm:text-base cursor-pointer border border-[#ffdeab] active:scale-95 justify-center"
            title="הורד קובץ גוגל שייטס / אקסל חכם מעוצב עם נוסחאות אוטומטיות"
          >
            <FileSpreadsheet className="w-5 h-5 text-[#7a4b29]" />
            <span>ייצא לגוגל שייטס חכם 📊</span>
          </button>

          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/30 flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs text-[#ffdeab] font-black tracking-wide">חודש יעד:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-[#5f3414] font-bold text-sm px-3 py-1.5 rounded-xl outline-none font-mono cursor-pointer shadow-inner"
            />
          </div>
        </div>

        {/* Soft background glow */}
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* LIVE MASTER KPI DASHBOARD (תצוגה ראשית חדה וברורה) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Expected Income Card */}
        <div className="bg-white p-7 rounded-[32px] border border-[#e4e2de] shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-widest bg-[#faf8f5] px-2.5 py-1 rounded-lg">הכנסות חודשיות</span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-4xl sm:text-5xl font-black text-emerald-800 font-mono tabular-nums leading-none">
              ₪{totalIncome.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#51443c] opacity-75">({childrenCount} ילדים במעון)</span>
          </div>

          <div className="text-sm text-[#51443c] pt-4 border-t border-[#efeeea] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">שכ"ל בסיסי:</span>
              <strong className="font-mono text-[#5f3414] text-base">₪{baseTuitionTotal.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">צהרון ותוספות:</span>
              <strong className="font-mono text-[#5f3414] text-base">₪{afternoonCareTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Expected Expenses Card */}
        <div className="bg-white p-7 rounded-[32px] border border-[#e4e2de] shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-widest bg-[#faf8f5] px-2.5 py-1 rounded-lg">הוצאות חודשיות</span>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner ${hasEnteredData ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-400'}`}>
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className={`text-4xl sm:text-5xl font-black font-mono tabular-nums leading-none ${hasEnteredData ? 'text-rose-800' : 'text-gray-300'}`}>
              ₪{Math.round(displayTotalExpenses).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#51443c] opacity-75">{hasEnteredData ? '(תפעול + שכר)' : '(ממתין להזנת נתונים)'}</span>
          </div>

          <div className="text-sm text-[#51443c] pt-4 border-t border-[#efeeea] space-y-2">
            {hasEnteredData ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">שכר צוות:</span>
                  <strong className="font-mono text-rose-700 text-base">₪{Math.round(staffPayrollTotal).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">תפעול וציוד:</span>
                  <strong className="font-mono text-[#5f3414] text-base">₪{(fixedExpensesTotal + variableFoodSuppliesTotal).toLocaleString()}</strong>
                </div>
              </>
            ) : (
              <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/50 font-bold leading-relaxed">
                💡 הזן כמות ילדים ושכר לימוד בטופס למטה לצפייה בניתוח הוצאות.
              </p>
            )}
          </div>
        </div>

        {/* Expected Net Balance (Surplus/Deficit) Card */}
        <div
          className={`p-7 rounded-[32px] border shadow-sm space-y-4 transition-all hover:shadow-md ${
            !hasEnteredData
              ? 'bg-[#fffdfa] border-[#e4e2de]'
              : netBalance >= 0
              ? 'bg-[#fffdfa] border-[#ffdeab] ring-4 ring-[#ffdeab]/10'
              : 'bg-rose-50 border-rose-300 ring-4 ring-rose-500/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-widest bg-[#faf8f5] px-2.5 py-1 rounded-lg">רווח נקי (לפני מס)</span>
            <div className="w-11 h-11 rounded-2xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center shadow-inner">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span
              className={`text-4xl sm:text-5xl font-black font-mono tabular-nums leading-none ${
                !hasEnteredData
                  ? 'text-gray-300'
                  : netBalance >= 0
                  ? 'text-[#7a4b29]'
                  : 'text-rose-800'
              }`}
            >
              ₪{Math.round(netBalance).toLocaleString()}
            </span>
            <span className="text-xs font-black text-[#5f3414]">
              {!hasEnteredData ? 'ממתין להזנה 💡' : netBalance >= 0 ? 'רווח חיובי ✓' : 'גרעון במאזן! ⚠️'}
            </span>
          </div>

          <div className="text-sm text-[#51443c] pt-4 border-t border-[#efeeea] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">שיעור רווחיות:</span>
              <strong className="font-mono text-[#7a4b29] text-base">{profitMarginPercent.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">סטטוס יציבות:</span>
              <strong className={`text-sm ${!hasEnteredData ? 'text-gray-400' : netBalance >= 10000 ? 'text-emerald-700' : netBalance >= 0 ? 'text-amber-700' : 'text-rose-700'} font-black`}>
                {!hasEnteredData ? 'ממתין ⚪' : netBalance >= 10000 ? 'איתן מאוד 🟢' : netBalance >= 0 ? 'מאוזן 🟡' : 'דרוש צמצום 🔴'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ISRAELI TAX ESTIMATE & PRE-TAX VS POST-TAX COMPARISON CARD */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#efeeea] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d97706]" />
              <h3 className="font-black text-lg text-[#5f3414] font-heading">
                מחשבון מס מוערך ברשות המיסים (לפני ואחרי מס)
              </h3>
            </div>
            <p className="text-xs text-[#51443c] mt-0.5">
              בחר את סוג הישות העסקית ברשות המיסים לקבלת חישוב מדויק של חבות המס והרווח הנטו שנשאר בכיס.
            </p>
          </div>

          {/* Business Type Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#efeeea] rounded-2xl border border-[#e4e2de] text-xs font-bold">
            <button
              onClick={() => updateField('businessType', 'OSEK_PATUR')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                businessType === 'OSEK_PATUR'
                  ? 'bg-[#7a4b29] text-white shadow-xs'
                  : 'text-[#5f3414] hover:bg-white/50'
              }`}
            >
              עוסק פטור
            </button>
            <button
              onClick={() => updateField('businessType', 'OSEK_MURSHE')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                businessType === 'OSEK_MURSHE'
                  ? 'bg-[#7a4b29] text-white shadow-xs'
                  : 'text-[#5f3414] hover:bg-white/50'
              }`}
            >
              עוסק מורשה
            </button>
            <button
              onClick={() => updateField('businessType', 'COMPANY')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                businessType === 'COMPANY'
                  ? 'bg-[#7a4b29] text-white shadow-xs'
                  : 'text-[#5f3414] hover:bg-white/50'
              }`}
            >
              חברה בע"מ
            </button>
          </div>
        </div>

        {/* Side-by-Side Pre-Tax vs Post-Tax Comparison Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Box 1: Pre-Tax Surplus */}
          <div className="p-5 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2.5">
            <span className="text-[11px] font-black text-[#51443c] block uppercase tracking-wide">1. רווח נקי לפני מס</span>
            <span className="text-3xl font-black font-mono text-[#5f3414] block tabular-nums">
              ₪{Math.round(taxEstimate.preTaxNetProfit).toLocaleString()}
            </span>
            <p className="text-[10px] font-bold text-slate-500 leading-tight">
              הכנסות (₪{totalIncome.toLocaleString()}) פחות הוצאות (₪{Math.round(displayTotalExpenses).toLocaleString()})
            </p>
          </div>

          {/* Box 2: Estimated Tax & National Insurance */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-amber-900 block uppercase tracking-wide">2. מיסים וביטוח לאומי</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-black">
                {taxEstimate.effectiveTaxRatePercent}% מס אפקטיבי
              </span>
            </div>
            <span className="text-3xl font-black font-mono text-amber-800 block tabular-nums">
              -₪{taxEstimate.totalTaxLiability.toLocaleString()}
            </span>
            <div className="text-[11px] font-medium text-amber-900 space-y-1.5 border-t border-amber-200 pt-2">
              <div className="flex justify-between">
                <span>מס הכנסה:</span>
                <strong className="font-mono">₪{taxEstimate.incomeTaxAmount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>ביטוח לאומי:</span>
                <strong className="font-mono">₪{taxEstimate.nationalInsuranceAmount.toLocaleString()}</strong>
              </div>
              {taxEstimate.netVatAmount > 0 && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>מע"מ נטו (17%):</span>
                  <strong className="font-mono">₪{taxEstimate.netVatAmount.toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Box 3: Post-Tax Net Profit (בכיס אחרי מס) */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 ring-4 ring-emerald-500/5">
            <span className="text-[11px] font-black text-emerald-900 block uppercase tracking-wide">3. רווח נטו סופי בכיס</span>
            <span className="text-4xl font-black font-mono text-emerald-700 block tabular-nums">
              ₪{Math.round(taxEstimate.postTaxNetProfit).toLocaleString()}
            </span>
            <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
              הסכום הריאלי שנשאר לבעלת המעון לאחר כל תשלומי המיסים החודשיים.
            </p>
          </div>
        </div>

        {/* Tax Rules Explanation */}
        <div className="p-3.5 bg-[#fef3c7]/50 rounded-2xl border border-[#fef3c7] text-xs text-[#7a4b29] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0" />
          <span>{taxEstimate.explanationSummary}</span>
        </div>
      </div>

      {/* INPUT FORM SECTION (הזנת נתונים נקייה ללא סרבול) */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#efeeea] pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7a4b29]" />
            <h3 className="font-black text-lg text-[#5f3414] font-heading">
              טופס הזנת נתונים ראשי (הנתונים נשמרים בדפדפן באופן אוטומטי)
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {resetSuccessMessage && (
              <span className="text-xs font-bold text-emerald-700 animate-fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>השדות אופסו בהצלחה!</span>
              </span>
            )}
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#efeeea] hover:bg-[#ffdeab] active:scale-95 text-[#5f3414] text-xs font-bold transition cursor-pointer border border-[#e4e2de]"
              title="איפוס שדות לערכי ברירת מחדל"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#7a4b29] ${resetSuccessMessage ? 'rotate-180 transition-transform duration-300' : ''}`} />
              <span>איפוס שדות</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* GROUP 1: CHILDREN & TUITION */}
          <div className="bg-[#faf8f5] p-6 rounded-2xl border border-[#e4e2de] space-y-5">
            <div className="flex items-center gap-2 text-[#5f3414] font-black text-sm border-b border-[#e4e2de] pb-3 uppercase tracking-wider">
              <Users className="w-5 h-5 text-[#7a4b29]" />
              <h4>1. ילדים ושכר לימוד</h4>
            </div>

            <div className="space-y-6">
              <MacroSlider
                label="כמות ילדים במעון:"
                value={childrenCount}
                onChange={(val) => updateField('childrenCount', val)}
                min={0}
                max={50}
                suffix="ילדים"
              />

              <MacroSlider
                label="שכר לימוד חודשי (₪):"
                value={tuitionPerChild}
                onChange={(val) => updateField('tuitionPerChild', val)}
                min={0}
                max={6000}
                step={50}
                prefix="₪"
              />

              <MacroSlider
                label="ילדים בצהרון / תוספת:"
                value={afternoonCareChildren}
                onChange={(val) => updateField('afternoonCareChildren', val)}
                min={0}
                max={Math.max(10, childrenCount)}
                suffix="ילדים"
              />

              <MacroSlider
                label="הוצאות שונות (₪):"
                value={afternoonCareFee}
                onChange={(val) => updateField('afternoonCareFee', val)}
                min={0}
                max={1500}
                step={50}
                prefix="₪"
              />
            </div>
          </div>

          {/* GROUP 2: FIXED EXPENSES & INSURANCE */}
          <div className="bg-[#faf8f5] p-6 rounded-2xl border border-[#e4e2de] space-y-5">
            <div className="flex items-center gap-2 text-[#5f3414] font-black text-sm border-b border-[#e4e2de] pb-3 uppercase tracking-wider">
              <Building className="w-5 h-5 text-[#7a4b29]" />
              <h4>2. שכירות ותפעול</h4>
            </div>

            <div className="space-y-6">
              <MacroSlider
                label="שכירות וארנונה (₪):"
                value={rentAndTax}
                onChange={(val) => updateField('rentAndTax', val)}
                min={0}
                max={15000}
                step={100}
                prefix="₪"
              />

              <MacroSlider
                label="ביטוח מעון חודשי (₪):"
                value={insuranceCost}
                onChange={(val) => updateField('insuranceCost', val)}
                min={0}
                max={3000}
                step={50}
                prefix="₪"
              />

              <MacroSlider
                label="תקציב מזון לילד (₪):"
                value={foodPerChild}
                onChange={(val) => updateField('foodPerChild', val)}
                min={0}
                max={800}
                step={10}
                prefix="₪"
              />

              <MacroSlider
                label='רו"ח וחשבונות (₪):'
                value={accountantCost + utilitiesCost}
                onChange={(val) => {
                  updateField('accountantCost', Math.min(650, val));
                  updateField('utilitiesCost', Math.max(0, val - 650));
                }}
                min={0}
                max={5000}
                step={100}
                prefix="₪"
              />

              <div className="grid grid-cols-1 gap-6">
                <MacroSlider
                  label="חוגי העשרה (₪):"
                  value={enrichmentClassesCost || 0}
                  onChange={(val) => updateField('enrichmentClassesCost', val)}
                  min={0}
                  max={4000}
                  step={100}
                  prefix="₪"
                />
                <MacroSlider
                  label="תחזוקה ובטיחות (₪):"
                  value={maintenanceAndSafety || 0}
                  onChange={(val) => updateField('maintenanceAndSafety', val)}
                  min={0}
                  max={3000}
                  step={50}
                  prefix="₪"
                />
              </div>
            </div>
          </div>

          {/* GROUP 3: STAFF & WAGES */}
          <div className="bg-[#faf8f5] p-6 rounded-2xl border border-[#e4e2de] space-y-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#5f3414] font-black text-sm border-b border-[#e4e2de] pb-3 uppercase tracking-wider">
              <ShieldCheck className="w-5 h-5 text-[#7a4b29]" />
              <h4>3. צוות ושכר עבודה</h4>
            </div>

            <div className="space-y-6">
              <MacroSlider
                label="כמות מטפלות:"
                value={staffCount}
                onChange={(val) => updateField('staffCount', val)}
                min={0}
                max={15}
                suffix="עובדות"
              />

              <MacroSlider
                label="שכר שעתי ברוטו (₪):"
                value={avgStaffHourlyRate}
                onChange={(val) => updateField('avgStaffHourlyRate', val)}
                min={30}
                max={150}
                prefix="₪"
              />

              <MacroSlider
                label="עלות סוציאלית (%):"
                value={socialOverheadPercent}
                onChange={(val) => updateField('socialOverheadPercent', val)}
                min={0}
                max={40}
                suffix="%"
              />

              <MacroSlider
                label="שעות עבודה ליום:"
                value={dailyHoursPerStaff}
                onChange={(val) => updateField('dailyHoursPerStaff', val)}
                min={0}
                max={12}
                step={0.5}
                suffix="שעות"
              />

              <div className="pt-2">
                <div className="p-4 bg-white rounded-2xl border-2 border-[#7a4b29]/10 text-center shadow-inner">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">סה"כ חבות שכר</span>
                  <strong className="font-mono text-[#7a4b29] font-black text-2xl">
                    ₪{Math.round(staffPayrollTotal).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OPTIONAL DRILLDOWN DRAWER */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-5 shadow-2xs">
        <button
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          className="flex items-center justify-between w-full text-xs font-bold text-[#7a4b29] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>צפה בפירוט סעיפי הוצאה והכנסה מורחבים (אופציונלי)</span>
          </div>
          {showDetailedBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetailedBreakdown && (
          <div className="mt-4 pt-4 border-t border-[#efeeea] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h5 className="font-bold text-[#5f3414]">סיכום הכנסות</h5>
              <ul className="space-y-1 text-[#51443c] bg-[#faf8f5] p-3 rounded-xl border border-[#e4e2de]">
                <li>• שכ"ל בסיסי: ₪{baseTuitionTotal.toLocaleString()}</li>
                <li>• צהרונים: ₪{afternoonCareTotal.toLocaleString()}</li>
                <li className="font-bold text-emerald-700 pt-1 border-t border-[#e4e2de]">
                  סה"כ הכנסות: ₪{totalIncome.toLocaleString()}
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-[#5f3414]">סיכום הוצאות</h5>
              <ul className="space-y-1 text-[#51443c] bg-[#faf8f5] p-3 rounded-xl border border-[#e4e2de]">
                <li>• שכירות וארנונה: ₪{rentAndTax.toLocaleString()}</li>
                <li>• ביטוח מעון: ₪{insuranceCost.toLocaleString()}</li>
                <li>• שכר עובדות: ₪{Math.round(staffPayrollTotal).toLocaleString()}</li>
                <li>• מזון וציוד: ₪{variableFoodSuppliesTotal.toLocaleString()}</li>
                <li>• רו"ח ותחשובת: ₪{(accountantCost + utilitiesCost).toLocaleString()}</li>
                <li className="font-bold text-rose-700 pt-1 border-t border-[#e4e2de]">
                  סה"כ הוצאות: ₪{Math.round(displayTotalExpenses).toLocaleString()}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
