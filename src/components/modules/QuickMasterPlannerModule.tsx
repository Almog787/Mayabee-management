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
  const totalExpenses = staffPayrollTotal + variableFoodSuppliesTotal + fixedExpensesTotal;

  // Net Balance & Pre-Tax / Post-Tax Calculation
  const netBalance = totalIncome - totalExpenses;
  const profitMarginPercent = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Israeli Tax Estimate Calculation
  const taxEstimate: EstimatedTaxResult = useMemo(() => {
    return calculateIsraeliTaxEstimate(totalIncome, totalExpenses, businessType);
  }, [totalIncome, totalExpenses, businessType]);

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

  return (
    <div className="space-[#1b1c1a] space-y-6 max-w-7xl mx-auto">
      {/* Executive Clean Header */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-[#d6c3b8]/30">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdeab]/20 border border-[#ffdeab]/30 text-[#ffdeab] text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-[#ffdeab]" />
            <span>דשבורד תכנון מאזן נקי ומהיר • הבית של מאיה (רותם)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
            מתכנן מאזן חודשי צפוי 📊
          </h2>

          <p className="text-xs sm:text-sm text-[#ffedd5]/90 leading-relaxed font-sans">
            הזן בקלות את הנתונים העיקריים (כמות ילדים, שכירות, ביטוח ושכר עובדים) וקבל תוצאה מיידית של רווח נקי ויציבות תקציבית לחודש <strong>{monthLabel}</strong>.
          </p>
        </div>

        {/* Action button & Month Picker */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 flex-shrink-0">
          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-2 bg-[#ffdeab] hover:bg-white text-[#5f3414] font-black px-4 py-2.5 rounded-2xl shadow-md transition text-xs sm:text-sm cursor-pointer border border-[#ffdeab] active:scale-95"
            title="הורד קובץ גוגל שייטס / אקסל חכם מעוצב עם נוסחאות אוטומטיות"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#7a4b29]" />
            <span>ייצא לגוגל שייטס חכם (עם נוסחאות) 📊</span>
          </button>

          <div className="bg-white/10 backdrop-blur px-3 py-2 rounded-2xl border border-white/20 text-left flex items-center gap-2">
            <span className="text-[11px] text-[#ffdeab] font-bold">חודש יעד:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-[#5f3414] font-bold text-xs px-2.5 py-1 rounded-xl outline-none font-mono cursor-pointer"
            />
          </div>
        </div>

        {/* Soft background glow */}
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* LIVE MASTER KPI DASHBOARD (תצוגה ראשית חדה וברורה) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Expected Income Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#e4e2de] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5f3414] uppercase tracking-wide">הכנסות חודשיות צפויות</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tabular-nums">
              ₪{totalIncome.toLocaleString()}
            </span>
            <span className="text-xs text-[#51443c]">({childrenCount} ילדים במעון)</span>
          </div>

          <div className="text-xs text-[#51443c] pt-3 border-t border-[#efeeea] space-y-1">
            <div className="flex justify-between">
              <span>שכ"ל בסיסי ({childrenCount} X ₪{tuitionPerChild.toLocaleString()}):</span>
              <strong className="font-mono text-[#5f3414]">₪{baseTuitionTotal.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>צהרון ותוספות ({afternoonCareChildren} ילדים):</span>
              <strong className="font-mono text-[#5f3414]">₪{afternoonCareTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Expected Expenses Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#e4e2de] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5f3414] uppercase tracking-wide">הוצאות חודשיות צפויות</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-rose-700 font-mono tabular-nums">
              ₪{Math.round(totalExpenses).toLocaleString()}
            </span>
            <span className="text-xs text-[#51443c]">(תפעול + שכר)</span>
          </div>

          <div className="text-xs text-[#51443c] pt-3 border-t border-[#efeeea] space-y-1">
            <div className="flex justify-between">
              <span>חבות שכר צוות ({staffCount} עובדות):</span>
              <strong className="font-mono text-rose-700">₪{Math.round(staffPayrollTotal).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>שכירות, ביטוח ותפעול:</span>
              <strong className="font-mono text-[#5f3414]">₪{(fixedExpensesTotal + variableFoodSuppliesTotal).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Expected Net Balance (Surplus/Deficit) Card */}
        <div
          className={`p-6 rounded-3xl border shadow-2xs space-y-3 transition ${
            netBalance >= 0
              ? 'bg-[#fffdfa] border-[#ffdeab]'
              : 'bg-rose-50/90 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5f3414] uppercase tracking-wide">מאזן חודשי נקי (רווח לפני מס)</span>
            <div className="w-9 h-9 rounded-2xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono tabular-nums ${
                netBalance >= 0 ? 'text-[#7a4b29]' : 'text-rose-700'
              }`}
            >
              ₪{Math.round(netBalance).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#5f3414]">
              {netBalance >= 0 ? 'לפני מס ✓' : 'גרעון במאזן!'}
            </span>
          </div>

          <div className="text-xs text-[#51443c] pt-3 border-t border-[#efeeea] space-y-1">
            <div className="flex justify-between">
              <span>שיעור רווחיות צפוי:</span>
              <strong className="font-mono text-[#7a4b29]">{profitMarginPercent.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between">
              <span>סטטוס יציבות:</span>
              <strong className={netBalance >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {netBalance >= 10000 ? 'איתן ומאוזן מאוד 🟢' : netBalance >= 0 ? 'מאוזן 🟡' : 'דרוש צמצום הוצאות 🔴'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Box 1: Pre-Tax Surplus */}
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
            <span className="text-[11px] font-bold text-[#51443c] block">1. רווח נקי לפני מס (ברוטו)</span>
            <span className="text-2xl font-black font-mono text-[#5f3414] block tabular-nums">
              ₪{Math.round(taxEstimate.preTaxNetProfit).toLocaleString()}
            </span>
            <span className="text-[11px] text-[#51443c] block">
              הכנסות (₪{totalIncome.toLocaleString()}) פחות הוצאות (₪{Math.round(totalExpenses).toLocaleString()})
            </span>
          </div>

          {/* Box 2: Estimated Tax & National Insurance */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-amber-900 block">2. חבות מס וביטוח לאומי</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-bold">
                {taxEstimate.effectiveTaxRatePercent}% מס אפקטיבי
              </span>
            </div>
            <span className="text-2xl font-black font-mono text-amber-800 block tabular-nums">
              -₪{taxEstimate.totalTaxLiability.toLocaleString()}
            </span>
            <div className="text-[11px] text-amber-900 space-y-0.5 border-t border-amber-200/80 pt-1.5">
              <div className="flex justify-between">
                <span>מס הכנסה משוער:</span>
                <strong className="font-mono">₪{taxEstimate.incomeTaxAmount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>ביטוח לאומי ובריאות:</span>
                <strong className="font-mono">₪{taxEstimate.nationalInsuranceAmount.toLocaleString()}</strong>
              </div>
              {taxEstimate.netVatAmount > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>מע"מ נטו (17%):</span>
                  <strong className="font-mono">₪{taxEstimate.netVatAmount.toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Box 3: Post-Tax Net Profit (בכיס אחרי מס) */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2">
            <span className="text-[11px] font-bold text-emerald-900 block">3. רווח נטו נשאר בכיס (אחרי מס)</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 block tabular-nums">
              ₪{Math.round(taxEstimate.postTaxNetProfit).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-800 block leading-tight">
              הסכום הנטו הריאלי שנשאר לבעלת המעון בסוף החודש לאחר ניכוי מיסים
            </span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* GROUP 1: CHILDREN & TUITION */}
          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#e4e2de] space-y-4">
            <div className="flex items-center gap-2 text-[#5f3414] font-bold text-sm border-b border-[#e4e2de] pb-2">
              <Users className="w-4 h-4 text-[#7a4b29]" />
              <h4>1. ילדים ושכר לימוד</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#51443c] font-bold mb-1">כמות ילדים במעון:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={childrenCount === 0 ? '' : childrenCount}
                    placeholder="הזן כמות ילדים..."
                    onChange={(e) => updateField('childrenCount', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                  />
                  <span className="text-[#51443c] font-bold">ילדים</span>
                </div>
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">שכר לימוד חודשי לילד (₪):</label>
                <input
                  type="number"
                  step="50"
                  value={tuitionPerChild === 0 ? '' : tuitionPerChild}
                  placeholder="הזן שכר לימוד חודשי..."
                  onChange={(e) => updateField('tuitionPerChild', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">מספר ילדים בצהרון / תוספת:</label>
                <input
                  type="number"
                  min="0"
                  max={childrenCount}
                  value={afternoonCareChildren}
                  onChange={(e) => updateField('afternoonCareChildren', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">מחיר צהרון חודשי לילד (₪):</label>
                <input
                  type="number"
                  step="50"
                  value={afternoonCareFee}
                  onChange={(e) => updateField('afternoonCareFee', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>
            </div>
          </div>

          {/* GROUP 2: FIXED EXPENSES & INSURANCE */}
          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#e4e2de] space-y-4">
            <div className="flex items-center gap-2 text-[#5f3414] font-bold text-sm border-b border-[#e4e2de] pb-2">
              <Building className="w-4 h-4 text-[#7a4b29]" />
              <h4>2. שכירות, ביטוח והוצאות תפעול</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#51443c] font-bold mb-1">עלות שכירות וארנונה (₪):</label>
                <input
                  type="number"
                  step="100"
                  value={rentAndTax}
                  onChange={(e) => updateField('rentAndTax', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">עלות ביטוח מעון חודשית (₪):</label>
                <input
                  type="number"
                  step="50"
                  value={insuranceCost}
                  onChange={(e) => updateField('insuranceCost', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">תקציב מזון חודשי לילד (₪):</label>
                <input
                  type="number"
                  step="10"
                  value={foodPerChild}
                  onChange={(e) => updateField('foodPerChild', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">רואה חשבון + חשמליות/מים (₪):</label>
                <input
                  type="number"
                  step="100"
                  value={accountantCost + utilitiesCost}
                  onChange={(e) => {
                    const total = Number(e.target.value);
                    updateField('accountantCost', 650);
                    updateField('utilitiesCost', Math.max(0, total - 650));
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">חוגי העשרה חיצוניים (₪):</label>
                <input
                  type="number"
                  step="100"
                  value={enrichmentClassesCost || 1000}
                  onChange={(e) => updateField('enrichmentClassesCost', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">תחזוקה שוטפת ובטיחות (₪):</label>
                <input
                  type="number"
                  step="50"
                  value={maintenanceAndSafety || 500}
                  onChange={(e) => updateField('maintenanceAndSafety', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>
            </div>
          </div>

          {/* GROUP 3: STAFF & WAGES */}
          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#e4e2de] space-y-4">
            <div className="flex items-center gap-2 text-[#5f3414] font-bold text-sm border-b border-[#e4e2de] pb-2">
              <ShieldCheck className="w-4 h-4 text-[#7a4b29]" />
              <h4>3. צוות ושכר עבודה (כולל תוספת מעסיק)</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#51443c] font-bold mb-1">כמות אנשי צוות / מטפלות:</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={staffCount}
                  onChange={(e) => updateField('staffCount', Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">שכר שעתי ברוטו לצוות (₪/שעה):</label>
                <input
                  type="number"
                  step="1"
                  value={avgStaffHourlyRate}
                  onChange={(e) => updateField('avgStaffHourlyRate', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">תוספת עלות מעסיק סוציאלית (%):</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="40"
                  value={socialOverheadPercent || 20}
                  onChange={(e) => updateField('socialOverheadPercent', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                  title="פנסיה (6.5%), פיצויים (6%), ביטוח לאומי מעסיק, הבראה, חופשה מחלה ונסיעות"
                />
                <span className="text-[10px] text-[#51443c] mt-0.5 block">פנסיה, פיצויים, הבראה, חופשה ונסיעות</span>
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">שעות עבודה יומיות לכל עובדת:</label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyHoursPerStaff}
                  onChange={(e) => updateField('dailyHoursPerStaff', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div className="pt-2">
                <div className="p-3 bg-[#f5efe6] rounded-xl border border-[#e4e2de] text-[11px] text-[#51443c]">
                  <span>עלות מעסיק כוללת (22 ימי עבודה + תוספת סוציאלית): </span>
                  <strong className="font-mono text-[#7a4b29] font-bold block text-xs mt-0.5">
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
                  סה"כ הוצאות: ₪{Math.round(totalExpenses).toLocaleString()}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
