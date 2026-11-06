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
  MessageCircle,
  Scale,
  HeartHandshake,
  ShieldAlert,
  PiggyBank,
  Target,
  Info,
} from 'lucide-react';
import { DaycareSettings } from '../../types';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';
import { calculateIsraeliTaxEstimate, EstimatedTaxResult } from '../../lib/taxEngine';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (updates: Partial<DaycareSettings>) => Promise<void>;
}

// Bumping storage key to ensure all users start in clean default state with 0 children (no anxiety / debts)
const STORAGE_KEY = 'daycare_planner_macro_v4';

type BusinessType = 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY';

const DEFAULT_PLANNER_DATA = {
  businessType: 'OSEK_PATUR' as BusinessType,
  // 40 Children capacity model - tiered by age groups (Defaults strictly to 0 for relaxed initial entry)
  infantsCount: 0, // תינוקייה (3 חודשים - 1.5 שנים, תקן יחס חוקי 1:6)
  infantsTuition: 3800, // שכר לימוד חודשי מומלץ לתינוק
  toddlersCount: 0, // פעוטון ובוגרים (1.5 - 3 שנים, תקן יחס חוקי 1:9)
  toddlersTuition: 3300, // שכר לימוד חודשי מומלץ לפעוט
  afternoonCareFee: 600, // הוצאות שונות / צהרון
  afternoonCareChildren: 0, // כמות ילדים בתוספת
  rentAndTax: 5000, // שכירות מבנה מעון מורחב באריאל + ארנונה
  insuranceCost: 1100, // ביטוח מעון מקיף (צד ג', חבות מעבידים, תאונות אישיות)
  accountantCost: 750, // רואה חשבון וייעוץ מס
  utilitiesCost: 1600, // חשמל, מים, אינטרנט, גז ותקשורת
  foodPerChild: 280, // תקציב מזון טרי לילד לחודש (~12.7 ₪ ליום)
  suppliesPerChild: 80, // חומרי יצירה, חיתולים, מגבונים, חיטוי וניקיון
  staffCount: 0, // כמות עובדות צוות בפועל (ברירת מחדל 0 כדי למנוע חובות מראש)
  avgStaffHourlyRate: 46, // שכר שעתי ברוטו לעובדת
  dailyHoursPerStaff: 8, // שעות עבודה יומיות
  socialOverheadPercent: 20, // תוספת עלות מעסיק סוציאלית (פנסיה, פיצויים, ביטוח לאומי, הבראה, חופשה)
  enrichmentClassesCost: 1200, // חוגי העשרה חיצוניים (מוזיקה, תנועה, בעלי חיים)
  maintenanceAndSafety: 600, // תחזוקה שוטפת, בדיקת בטיחות שנתית ואגרות
  // Partnership & Emergency Fund
  emergencyFundPercent: 10, // הפרשה לקרן חירום ופיתוח עסקית (10% כברירת מחדל)
  partner1SharePercent: 50, // שותף/ה א' (50%) מול שותף/ה ב' (50%)
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
  sublabel?: string;
}> = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', sublabel }) => {
  // Safe bounded value
  const safeVal = Math.max(min, Math.min(max, isNaN(value) ? min : value));

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <div>
          <label className="text-[#51443c] font-black text-xs uppercase tracking-wide block">{label}</label>
          {sublabel && <span className="text-[10px] text-slate-500 font-medium block">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-1 font-mono font-black text-[#7a4b29] text-base">
          <span>{prefix}</span>
          <span>{safeVal.toLocaleString()}</span>
          <span className="text-[10px] opacity-70">{suffix}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
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
          className="flex-1 h-2.5 bg-[#d6c3b8]/40 rounded-full appearance-none cursor-pointer accent-[#7a4b29] touch-none"
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

  // Load saved state or clean zero defaults
  const [plannerData, setPlannerData] = useState(() => {
    try {
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

  // Safe helper setter
  const updateField = (field: keyof typeof DEFAULT_PLANNER_DATA, value: any) => {
    setPlannerData((prev: typeof DEFAULT_PLANNER_DATA) => ({ ...prev, [field]: value }));
  };

  // Reset function - resets state and localStorage cleanly
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
    infantsCount,
    infantsTuition,
    toddlersCount,
    toddlersTuition,
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
    emergencyFundPercent,
    partner1SharePercent,
  } = plannerData;

  // Total Children & Breakdown
  const totalInfants = Math.max(0, Number(infantsCount) || 0);
  const totalToddlers = Math.max(0, Number(toddlersCount) || 0);
  const totalChildren = totalInfants + totalToddlers;
  const MAX_CAPACITY = 40; // מעון מלא: 40 ילדים

  // Detailed Breakdown Drawer Toggle
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(false);

  // Month Hebrew Label
  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Data Entry Check: Relaxed initial state (no scary debts or alarms shown when 0 children)
  const hasEnteredData = totalChildren > 0;

  // LIVE CALCULATIONS
  // Income Breakdown
  const infantsTuitionTotal = useMemo(() => totalInfants * (Number(infantsTuition) || 0), [totalInfants, infantsTuition]);
  const toddlersTuitionTotal = useMemo(() => totalToddlers * (Number(toddlersTuition) || 0), [totalToddlers, toddlersTuition]);
  const baseTuitionTotal = infantsTuitionTotal + toddlersTuitionTotal;
  const afternoonCareTotal = useMemo(
    () => Math.max(0, Number(afternoonCareChildren) || 0) * Math.max(0, Number(afternoonCareFee) || 0),
    [afternoonCareChildren, afternoonCareFee]
  );
  const totalIncome = baseTuitionTotal + afternoonCareTotal;

  // Weighted Average Tuition per child
  const weightedAvgTuition = totalChildren > 0
    ? Math.round(baseTuitionTotal / totalChildren)
    : Math.round(((Number(infantsTuition) || 3800) + (Number(toddlersTuition) || 3300)) / 2);

  // Staff Payroll Expenses
  const baseStaffWages = useMemo(
    () => Math.max(0, Number(staffCount) || 0) * Math.max(0, Number(avgStaffHourlyRate) || 0) * Math.max(0, Number(dailyHoursPerStaff) || 0) * 22,
    [staffCount, avgStaffHourlyRate, dailyHoursPerStaff]
  );
  const socialOverheadAmount = useMemo(
    () => baseStaffWages * ((Number(socialOverheadPercent) || 20) / 100),
    [baseStaffWages, socialOverheadPercent]
  );
  const staffPayrollTotal = baseStaffWages + socialOverheadAmount;

  // Staffing Ratio Compliance (חוק הפיקוח על מעונות יום / משרד החינוך)
  // תינוקייה: 1 מטפלת לכל 6 תינוקות
  // פעוטון: 1 מטפלת לכל 9 פעוטות
  const requiredInfantStaff = totalInfants > 0 ? Math.ceil(totalInfants / 6) : 0;
  const requiredToddlerStaff = totalToddlers > 0 ? Math.ceil(totalToddlers / 9) : 0;
  const totalRequiredStaff = totalChildren > 0 ? Math.max(1, requiredInfantStaff + requiredToddlerStaff) : 0;
  const isStaffCompliant = Number(staffCount) >= totalRequiredStaff && totalRequiredStaff > 0;
  const staffDiff = Number(staffCount) - totalRequiredStaff;

  // Variable Food & Supplies
  const variableCostPerChild = (Number(foodPerChild) || 0) + (Number(suppliesPerChild) || 0);
  const variableFoodSuppliesTotal = useMemo(
    () => totalChildren * variableCostPerChild,
    [totalChildren, variableCostPerChild]
  );

  // Fixed Operating Expenses
  const fixedExpensesTotal =
    (Number(rentAndTax) || 0) +
    (Number(insuranceCost) || 0) +
    (Number(accountantCost) || 0) +
    (Number(utilitiesCost) || 0) +
    (Number(enrichmentClassesCost) || 0) +
    (Number(maintenanceAndSafety) || 0);

  const totalFixedCosts = staffPayrollTotal + fixedExpensesTotal;
  const actualTotalExpenses = totalFixedCosts + variableFoodSuppliesTotal;
  const displayTotalExpenses = hasEnteredData ? actualTotalExpenses : 0;

  // Net Balance & Profit Margin
  const netBalance = hasEnteredData ? totalIncome - actualTotalExpenses : 0;
  const profitMarginPercent = hasEnteredData && totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // BREAK-EVEN ANALYSIS (נקודת איזון כלכלית)
  // Contribution Margin per Child = Average Revenue - Variable Cost
  const avgMiscPerChild = totalChildren > 0 ? afternoonCareTotal / totalChildren : 0;
  const effectiveAvgRevenuePerChild = weightedAvgTuition + avgMiscPerChild;
  const contributionMarginPerChild = Math.max(100, effectiveAvgRevenuePerChild - variableCostPerChild);

  const breakEvenChildren = totalFixedCosts > 0
    ? Math.min(MAX_CAPACITY + 10, Math.ceil(totalFixedCosts / contributionMarginPerChild))
    : 0;

  const breakEvenOccupancyPct = Math.min(100, Math.round((breakEvenChildren / MAX_CAPACITY) * 100));
  const currentOccupancyPct = Math.min(100, Math.round((totalChildren / MAX_CAPACITY) * 100));
  const isPastBreakEven = totalChildren >= breakEvenChildren && breakEvenChildren > 0;
  const childrenOverBreakEven = Math.max(0, totalChildren - breakEvenChildren);
  const childrenUnderBreakEven = Math.max(0, breakEvenChildren - totalChildren);

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
        explanationSummary: '💡 הזן כמות ילדים ושכר לימוד בטופס למעלה לקבלת ניתוח מס ורווח נטו שנשאר בכיס.',
      };
    }
    return calculateIsraeliTaxEstimate(totalIncome, actualTotalExpenses, businessType);
  }, [hasEnteredData, totalIncome, actualTotalExpenses, businessType]);

  // PARTNERSHIP SPLIT CALCULATIONS (חלוקת שותפות שקופה)
  const postTaxProfit = Math.max(0, taxEstimate.postTaxNetProfit);
  const emergencyFundPct = Math.max(0, Math.min(30, Number(emergencyFundPercent) || 10));
  const emergencyFundAmount = Math.round(postTaxProfit * (emergencyFundPct / 100));
  const distributableNetProfit = Math.max(0, postTaxProfit - emergencyFundAmount);

  const partner1Pct = Math.max(0, Math.min(100, Number(partner1SharePercent) || 50));
  const partner2Pct = 100 - partner1Pct;

  const partner1ShareAmount = Math.round(distributableNetProfit * (partner1Pct / 100));
  const partner2ShareAmount = Math.max(0, distributableNetProfit - partner1ShareAmount);

  // Export to Google Sheets
  const handleExportGoogleSheets = () => {
    const dummyChildren = [
      ...Array.from({ length: totalInfants }, (_, i) => ({
        id: `infant-${i + 1}`,
        idNumber: `0000000${i}`,
        firstName: `תינוק/ת ${i + 1}`,
        lastName: '',
        birthDate: '2025-01-01',
        enrollmentDate: '2025-09-01',
        ageGroup: 'INFANT' as const,
        allergies: [],
        parent1: { fullName: 'הורה', phone: '050-0000000', email: '', relation: 'משפחה' },
        monthlyTuition: Number(infantsTuition) || 3800,
        extraFees: i < Number(afternoonCareChildren) ? { afternoonCare: Number(afternoonCareFee) || 600, fridayCare: 0, activities: 0 } : undefined,
        tuitionStatus: 'PAID' as const,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
      })),
      ...Array.from({ length: totalToddlers }, (_, i) => ({
        id: `toddler-${i + 1}`,
        idNumber: `0000000${totalInfants + i}`,
        firstName: `פעוט/ה ${i + 1}`,
        lastName: '',
        birthDate: '2024-01-01',
        enrollmentDate: '2025-09-01',
        ageGroup: 'TODDLER' as const,
        allergies: [],
        parent1: { fullName: 'הורה', phone: '050-0000000', email: '', relation: 'משפחה' },
        monthlyTuition: Number(toddlersTuition) || 3300,
        extraFees: (totalInfants + i) < Number(afternoonCareChildren) ? { afternoonCare: Number(afternoonCareFee) || 600, fridayCare: 0, activities: 0 } : undefined,
        tuitionStatus: 'PAID' as const,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
      })),
    ];

    const macroExpenses = [
      { id: 'exp-1', categoryName: 'שכירות וארנונה', description: 'שכירות מבנה מעון באריאל (40 ילדים)', expectedAmount: Number(rentAndTax), isConfirmed: true },
      { id: 'exp-2', categoryName: 'ביטוח מקיף למעון', description: 'פרמיה חודשית לביטוח מעון וחבות מעבידים', expectedAmount: Number(insuranceCost), isConfirmed: true },
      { id: 'exp-3', categoryName: 'רואה חשבון וייעוץ מס', description: 'ריטיינר חודשי', expectedAmount: Number(accountantCost), isConfirmed: true },
      { id: 'exp-4', categoryName: 'חשמל, מים, אינטרנט וגז', description: 'חשבונות תפעול חודשיים', expectedAmount: Number(utilitiesCost), isConfirmed: true },
      { id: 'exp-5', categoryName: 'הזנה ומזון טרי (לכל הילדים)', description: `תקציב ₪${foodPerChild} לילד X ${totalChildren} ילדים`, expectedAmount: totalChildren * Number(foodPerChild), isConfirmed: true },
      { id: 'exp-6', categoryName: 'חומרי יצירה, היגיינה וניקיון', description: `תקציב ₪${suppliesPerChild} לילד X ${totalChildren} ילדים`, expectedAmount: totalChildren * Number(suppliesPerChild), isConfirmed: true },
      { id: 'exp-7', categoryName: 'חוגי העשרה חיצוניים', description: 'חוגי מוזיקה, תנועה וטבע', expectedAmount: Number(enrichmentClassesCost), isConfirmed: true },
      { id: 'exp-8', categoryName: 'תחזוקה שוטפת ובטיחות', description: 'בדיקות מהנדס בטיחות ואחזקת מבנה', expectedAmount: Number(maintenanceAndSafety), isConfirmed: true },
    ];

    const dummyStaff = Array.from({ length: Math.max(1, Number(staffCount)) }, (_, i) => ({
      id: `staff-${i + 1}`,
      fullName: `עובדת צוות ${i + 1}`,
      idNumber: '000000000',
      role: (i === 0 ? 'DIRECTOR' : i === 1 ? 'LEAD_EDUCATOR' : 'ASSISTANT') as any,
      phone: '050-0000000',
      email: '',
      hourlyRate: Number(avgStaffHourlyRate),
      standardDailyHours: Number(dailyHoursPerStaff),
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

  // WhatsApp formatted report share (no personal names)
  const handleShareWhatsApp = () => {
    const bTypeLabel =
      businessType === 'OSEK_PATUR' ? 'עוסק פטור' : businessType === 'OSEK_MURSHE' ? 'עוסק מורשה' : 'חברה בע"מ';

    const text = `📊 *דוח תכנון פיננסי ושותפות - מעון ילדים*
📅 *חודש יעד:* ${monthLabel}
💼 *סוג עסק:* ${bTypeLabel}

👶 *הרכב ילדים ותפוסה (תקן 40 ילדים):*
• תינוקייה (יחס 1:6): ${totalInfants} תינוקות (₪${Number(infantsTuition).toLocaleString()}/ילד)
• פעוטון (יחס 1:9): ${totalToddlers} פעוטות (₪${Number(toddlersTuition).toLocaleString()}/ילד)
• סה"כ רשומים: ${totalChildren} מתוך 40 (${currentOccupancyPct}% תפוסה)

🎯 *ניתוח נקודת איזון (Break-Even):*
• נקודת איזון נדרשת: ${breakEvenChildren} ילדים (${breakEvenOccupancyPct}% תפוסה)
• סטטוס נוכחי: ${!hasEnteredData ? 'ממתין להזנת נתונים' : isPastBreakEven ? `מעל נקודת האיזון ב-${childrenOverBreakEven} ילדים (רווח שולי ₪${Math.round(contributionMarginPerChild).toLocaleString()}/ילד) 🟢` : `חסרים ${childrenUnderBreakEven} ילדים לאיזון מלא 🟡`}

💰 *תקציב חודשי צפוי:*
• סה"כ הכנסות: ₪${totalIncome.toLocaleString()}
• סה"כ הוצאות: ₪${Math.round(displayTotalExpenses).toLocaleString()}
  (שכר ${staffCount} עובדות: ₪${Math.round(staffPayrollTotal).toLocaleString()} | תפעול ושכירות: ₪${Math.round(fixedExpensesTotal + variableFoodSuppliesTotal).toLocaleString()})

⚖️ *רווח ומיסים:*
• רווח נקי לפני מס: ₪${Math.round(taxEstimate.preTaxNetProfit).toLocaleString()}
• אומדן מיסים וביטוח לאומי: ₪${taxEstimate.totalTaxLiability.toLocaleString()}
• רווח נטו סופי בכיס: ₪${Math.round(postTaxProfit).toLocaleString()}

🤝 *חלוקת שותפות ועתודות:*
• קרן חירום ופיתוח (${emergencyFundPct}%): ₪${emergencyFundAmount.toLocaleString()}
• משיכת רווחים שותף/ה א' (${partner1Pct}%): ₪${partner1ShareAmount.toLocaleString()}
• משיכת רווחים שותף/ה ב' (${partner2Pct}%): ₪${partner2ShareAmount.toLocaleString()}

🔗 *קישור למחשבון האפליקציה:*
https://almog787.github.io/Mayabee-management/`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. EXECUTIVE CLEAN HEADER */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-9 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-[#d6c3b8]/30">
        <div className="space-y-2.5 max-w-2xl relative z-10 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#ffdeab] text-xs font-black tracking-wide uppercase">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>מודל שותפות מלא • מעון 40 ילדים • ניהול פיננסי ובקרה</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading leading-tight">
            מתכנן מאזן ותקציב מעון חכם 📊
          </h2>

          <p className="text-xs sm:text-sm text-[#ffedd5]/90 leading-relaxed font-medium">
            הזינו את נתוני הילדים וההוצאות בסליידרים למטה, והדשבורד יחשב עבורכם בזמן אמת את נקודת האיזון, חבות המס, וחלוקת רווחי השותפות לחודש <strong className="text-white underline decoration-[#ffdeab]/40 underline-offset-4">{monthLabel}</strong>.
          </p>
        </div>

        {/* Action Buttons & Month Selector */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 flex-shrink-0 min-w-[220px]">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-2xl shadow-lg transition-all text-xs sm:text-sm cursor-pointer border border-emerald-500 active:scale-95 justify-center"
            title="שתף דוח שותפות ונקודת איזון מעוצב בווטסאפ"
          >
            <MessageCircle className="w-4 h-4 text-emerald-100" />
            <span>שתף דוח שותפות בווטסאפ 💬</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-2 bg-[#ffdeab] hover:bg-white text-[#5f3414] font-black px-4 py-2.5 rounded-2xl shadow-lg transition-all text-xs sm:text-sm cursor-pointer border border-[#ffdeab] active:scale-95 justify-center"
            title="הורד קובץ גוגל שייטס / אקסל חכם מעוצב עם נוסחאות אוטומטיות"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#7a4b29]" />
            <span>ייצא לגוגל שייטס חכם 📊</span>
          </button>

          <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/30 flex items-center justify-between sm:justify-start gap-2.5 w-full">
            <span className="text-xs text-[#ffdeab] font-black tracking-wide">חודש יעד:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-[#5f3414] font-bold text-xs px-2.5 py-1 rounded-xl outline-none font-mono cursor-pointer shadow-inner"
            />
          </div>
        </div>

        {/* Soft background glow */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. DATA ENTRY INPUT FORM FIRST (קודם הזנת נתונים!) */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#efeeea] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#7a4b29]" />
              <h3 className="font-black text-xl text-[#5f3414] font-heading">
                שלב 1: הזנת נתוני מעון (סליידרים מהירים לטאץ')
              </h3>
            </div>
            <p className="text-xs text-[#51443c]">
              הזיזו את הסליידרים ללא צורך במקלדת. כל שינוי מעדכן מידית את דשבורד התוצאות, נקודת האיזון וחלוקת השותפות למטה.
            </p>
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
              title="איפוס שדות לברירת מחדל נקייה"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#7a4b29] ${resetSuccessMessage ? 'rotate-180 transition-transform duration-300' : ''}`} />
              <span>איפוס שדות לאפס</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* GROUP 1: CHILDREN & MULTI-AGE TUITION */}
          <div className="bg-[#faf8f5] p-5 sm:p-6 rounded-2xl border border-[#e4e2de] space-y-5">
            <div className="flex items-center justify-between border-b border-[#e4e2de] pb-3">
              <div className="flex items-center gap-2 text-[#5f3414] font-black text-sm uppercase tracking-wider">
                <Users className="w-5 h-5 text-[#7a4b29]" />
                <h4>1. ילדים ותמחור רב-גילאי</h4>
              </div>
              <span className="text-xs font-black text-[#7a4b29] bg-[#ffdeab] px-2 py-0.5 rounded-md">
                {totalChildren}/40 ילדים
              </span>
            </div>

            <div className="space-y-5">
              <MacroSlider
                label="כמות תינוקות (גיל 3 חוד' - 1.5):"
                sublabel="תקן חוקי: מטפלת 1 לכל 6 תינוקות"
                value={infantsCount}
                onChange={(val) => updateField('infantsCount', val)}
                min={0}
                max={20}
                suffix="תינוקות"
              />

              <MacroSlider
                label="שכר לימוד תינוקייה (₪):"
                sublabel="תמחור מומלץ: ₪3,700-₪4,200"
                value={infantsTuition}
                onChange={(val) => updateField('infantsTuition', val)}
                min={2000}
                max={5500}
                step={50}
                prefix="₪"
              />

              <MacroSlider
                label="כמות פעוטות ובוגרים (גיל 1.5 - 3):"
                sublabel="תקן חוקי: מטפלת 1 לכל 9 פעוטות"
                value={toddlersCount}
                onChange={(val) => updateField('toddlersCount', val)}
                min={0}
                max={30}
                suffix="פעוטות"
              />

              <MacroSlider
                label="שכר לימוד פעוטון ובוגרים (₪):"
                sublabel="תמחור מומלץ: ₪3,200-₪3,600"
                value={toddlersTuition}
                onChange={(val) => updateField('toddlersTuition', val)}
                min={2000}
                max={5000}
                step={50}
                prefix="₪"
              />

              <MacroSlider
                label="ילדים בתוספת / צהרון:"
                value={afternoonCareChildren}
                onChange={(val) => updateField('afternoonCareChildren', val)}
                min={0}
                max={Math.max(10, totalChildren)}
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
          <div className="bg-[#faf8f5] p-5 sm:p-6 rounded-2xl border border-[#e4e2de] space-y-5">
            <div className="flex items-center gap-2 text-[#5f3414] font-black text-sm border-b border-[#e4e2de] pb-3 uppercase tracking-wider">
              <Building className="w-5 h-5 text-[#7a4b29]" />
              <h4>2. שכירות ותפעול (מעון 40 ילדים)</h4>
            </div>

            <div className="space-y-5">
              <MacroSlider
                label="שכירות וארנונה באריאל (₪):"
                sublabel="עלות מבנה מעון תקני 150-250 מ''ר"
                value={rentAndTax}
                onChange={(val) => updateField('rentAndTax', val)}
                min={0}
                max={15000}
                step={100}
                prefix="₪"
              />

              <MacroSlider
                label="ביטוח מעון מקיף (₪):"
                sublabel="צד ג', חבות מעבידים ותאונות אישיות"
                value={insuranceCost}
                onChange={(val) => updateField('insuranceCost', val)}
                min={0}
                max={3000}
                step={50}
                prefix="₪"
              />

              <MacroSlider
                label="תקציב מזון טרי לילד לחודש (₪):"
                sublabel="3 ארוחות טריות ביום (~12.7 ₪ ליום)"
                value={foodPerChild}
                onChange={(val) => updateField('foodPerChild', val)}
                min={0}
                max={800}
                step={10}
                prefix="₪"
              />

              <MacroSlider
                label='רו"ח, חשמל, מים ותקשורת (₪):'
                value={accountantCost + utilitiesCost}
                onChange={(val) => {
                  updateField('accountantCost', Math.min(750, val));
                  updateField('utilitiesCost', Math.max(0, val - 750));
                }}
                min={0}
                max={6000}
                step={100}
                prefix="₪"
              />

              <MacroSlider
                label="חוגי העשרה חיצוניים (₪):"
                sublabel="מוזיקה, ריתמיקה ותנועה לגיל הרך"
                value={enrichmentClassesCost || 0}
                onChange={(val) => updateField('enrichmentClassesCost', val)}
                min={0}
                max={4000}
                step={100}
                prefix="₪"
              />

              <MacroSlider
                label="תחזוקה שוטפת ובטיחות (₪):"
                sublabel="אישורי בטיחות מהנדס, מטפים והדברה"
                value={maintenanceAndSafety || 0}
                onChange={(val) => updateField('maintenanceAndSafety', val)}
                min={0}
                max={3000}
                step={50}
                prefix="₪"
              />
            </div>
          </div>

          {/* GROUP 3: STAFF & WAGES */}
          <div className="bg-[#faf8f5] p-5 sm:p-6 rounded-2xl border border-[#e4e2de] space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#e4e2de] pb-3">
              <div className="flex items-center gap-2 text-[#5f3414] font-black text-sm uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5 text-[#7a4b29]" />
                <h4>3. צוות ושכר עבודה</h4>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isStaffCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                {totalChildren > 0 ? `תקן: ${staffCount}/${totalRequiredStaff} עובדות` : 'ממתין להזנה'}
              </span>
            </div>

            <div className="space-y-5">
              <MacroSlider
                label="כמות עובדות צוות בפועל:"
                sublabel={totalChildren > 0 ? `תקן מומלץ למעון זה: ${totalRequiredStaff} עובדות` : 'תקן חוקי יחושב לפי הילדים'}
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
                label="עלות מעסיק סוציאלית (%):"
                sublabel="פנסיה, פיצויים, ביטוח לאומי, הבראה וחופשה"
                value={socialOverheadPercent}
                onChange={(val) => updateField('socialOverheadPercent', val)}
                min={0}
                max={40}
                suffix="%"
              />

              <MacroSlider
                label="שעות עבודה ליום לכל עובדת:"
                value={dailyHoursPerStaff}
                onChange={(val) => updateField('dailyHoursPerStaff', val)}
                min={0}
                max={12}
                step={0.5}
                suffix="שעות"
              />

              <div className="pt-2">
                <div className="p-4 bg-white rounded-2xl border-2 border-[#7a4b29]/10 text-center shadow-inner">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    סה"כ חבות שכר מעסיק ({staffCount} עובדות X 22 ימים)
                  </span>
                  <strong className="font-mono text-[#7a4b29] font-black text-2xl">
                    ₪{Math.round(staffPayrollTotal).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RESULTS & DASHBOARD SECTION SECOND (אחר כך דשבורד הנתונים!) */}
      <div className="space-y-6">
        <div className="border-b border-[#e4e2de] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#7a4b29]" />
            <h3 className="font-black text-xl text-[#5f3414] font-heading">
              שלב 2: לוח תוצאות, נקודת איזון ושותפות
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {hasEnteredData ? `מחושב עבור ${totalChildren} ילדים` : 'מצב פתיחה ראשוני (0 ילדים)'}
          </span>
        </div>

        {/* 3 Main KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Expected Income Card */}
          <div className="bg-white p-6 sm:p-7 rounded-[32px] border border-[#e4e2de] shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-widest bg-[#faf8f5] px-2.5 py-1 rounded-lg">הכנסות חודשיות צפויות</span>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono tabular-nums leading-none">
                ₪{totalIncome.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#51443c] opacity-75">
                {hasEnteredData ? `(${totalChildren} מתוך ${MAX_CAPACITY} ילדים • ${currentOccupancyPct}% תפוסה)` : '(טרם הוזנו ילדים בטופס)'}
              </span>
            </div>

            <div className="text-sm text-[#51443c] pt-4 border-t border-[#efeeea] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-500">תינוקייה ({totalInfants} תינוקות):</span>
                <strong className="font-mono text-[#5f3414] text-sm">₪{infantsTuitionTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-500">פעוטון ({totalToddlers} פעוטות):</span>
                <strong className="font-mono text-[#5f3414] text-sm">₪{toddlersTuitionTotal.toLocaleString()}</strong>
              </div>
              {afternoonCareTotal > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-500">תוספות והוצאות שונות:</span>
                  <strong className="font-mono text-[#5f3414] text-sm">₪{afternoonCareTotal.toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Expected Expenses Card */}
          <div className="bg-white p-6 sm:p-7 rounded-[32px] border border-[#e4e2de] shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-widest bg-[#faf8f5] px-2.5 py-1 rounded-lg">הוצאות חודשיות צפויות</span>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner ${hasEnteredData ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-400'}`}>
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className={`text-3xl sm:text-4xl font-black font-mono tabular-nums leading-none ${hasEnteredData ? 'text-rose-800' : 'text-gray-300'}`}>
                ₪{Math.round(displayTotalExpenses).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#51443c] opacity-75">
                {hasEnteredData ? '(שכר צוות + תפעול קבוע ומשתנה)' : '(ממתין להזנת נתוני ילדים)'}
              </span>
            </div>

            <div className="text-sm text-[#51443c] pt-4 border-t border-[#efeeea] space-y-2">
              {hasEnteredData ? (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">שכר צוות ({staffCount} עובדות):</span>
                    <strong className="font-mono text-rose-700 text-sm">₪{Math.round(staffPayrollTotal).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">שכירות וארנונה באריאל:</span>
                    <strong className="font-mono text-[#5f3414] text-sm">₪{Number(rentAndTax).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">הזנה, ביטוח ותפעול:</span>
                    <strong className="font-mono text-[#5f3414] text-sm">₪{Math.round(fixedExpensesTotal - Number(rentAndTax) + variableFoodSuppliesTotal).toLocaleString()}</strong>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#7a4b29] bg-[#faf8f5] p-2.5 rounded-xl border border-[#ebd7c5] font-bold leading-relaxed">
                  💡 הזינו כמות ילדים בסליידרים שלמעלה לצפייה בניתוח הוצאות מפורט.
                </p>
              )}
            </div>
          </div>

          {/* Expected Net Balance Card */}
          <div
            className={`p-6 sm:p-7 rounded-[32px] border shadow-sm space-y-4 transition-all hover:shadow-md ${
              !hasEnteredData
                ? 'bg-[#fffdfa] border-[#e4e2de]'
                : netBalance >= 0
                ? 'bg-[#fffdfa] border-[#ffdeab] ring-4 ring-[#ffdeab]/10'
                : 'bg-rose-50 border-rose-300 ring-4 ring-rose-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-widest bg-[#faf8f5] px-2.5 py-1 rounded-lg">רווח נקי לפני מס</span>
              <div className="w-11 h-11 rounded-2xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span
                className={`text-3xl sm:text-4xl font-black font-mono tabular-nums leading-none ${
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
                {!hasEnteredData ? 'ממתין להזנת נתונים 💡' : netBalance >= 0 ? 'רווח חיובי לפני מס ✓' : 'גרעון תפעולי במאזן! ⚠️'}
              </span>
            </div>

            <div className="text-sm text-[#51443c] pt-4 border-t border-[#efeeea] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-500">שיעור רווחיות צפוי:</span>
                <strong className="font-mono text-[#7a4b29] text-sm">{profitMarginPercent.toFixed(1)}%</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-500">סטטוס יציבות תקציבית:</span>
                <strong className={`text-xs ${!hasEnteredData ? 'text-gray-400' : netBalance >= 15000 ? 'text-emerald-700' : netBalance >= 0 ? 'text-amber-700' : 'text-rose-700'} font-black`}>
                  {!hasEnteredData ? 'ממתין להזנה ⚪' : netBalance >= 15000 ? 'איתן ומאוזן מאוד 🟢' : netBalance >= 0 ? 'מאוזן 🟡' : 'דרוש צמצום הוצאות 🔴'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* BREAK-EVEN ANALYSIS CARD */}
        <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#efeeea] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#7a4b29]" />
                <h3 className="font-black text-lg text-[#5f3414] font-heading">
                  ניתוח נקודת איזון (Break-Even Analysis) ותקן כוח אדם
                </h3>
              </div>
              <p className="text-xs text-[#51443c] mt-0.5">
                חישוב כמות הילדים המינימלית הנדרשת לכיסוי 100% מההוצאות (קבועות ומשתנות), ותאימות תקן חוק הפיקוח למעון של 40 ילדים.
              </p>
            </div>

            {/* Compliance Status Badge */}
            <div className="flex items-center gap-2">
              {totalChildren > 0 ? (
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${isStaffCompliant ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                  {isStaffCompliant ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-amber-600" />}
                  <span>
                    {isStaffCompliant
                      ? `תקן חוקי מאויש (${staffCount}/${totalRequiredStaff} עובדות) ✓`
                      : `חסרות ${Math.abs(staffDiff)} עובדות לתקן חוקי (${staffCount}/${totalRequiredStaff})`}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-bold">
                  התקן יחושב בהזנת הילדים
                </span>
              )}
            </div>
          </div>

          {/* Visual Progress Bar to Break-Even and Full Capacity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-black text-[#51443c]">
              <span>מצב תפוסה נוכחי: {totalChildren} ילדים ({currentOccupancyPct}% מתוך {MAX_CAPACITY})</span>
              <span>נקודת איזון: {breakEvenChildren} ילדים ({breakEvenOccupancyPct}% תפוסה)</span>
            </div>

            <div className="relative w-full h-5 bg-[#efeeea] rounded-full overflow-hidden border border-[#d6c3b8]/50">
              {/* Break-even marker line */}
              {breakEvenChildren > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-amber-600 z-10"
                  style={{ left: `${Math.min(98, Math.max(2, breakEvenOccupancyPct))}%` }}
                  title={`נקודת איזון: ${breakEvenChildren} ילדים`}
                />
              )}

              {/* Current Occupancy Fill */}
              <div
                className={`h-full transition-all duration-500 rounded-full ${isPastBreakEven ? 'bg-gradient-to-l from-emerald-500 to-emerald-600' : 'bg-gradient-to-l from-amber-500 to-amber-600'}`}
                style={{ width: `${Math.min(100, currentOccupancyPct)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
              <span>0 ילדים</span>
              <span className="font-bold text-amber-800">▲ נקודת איזון: {breakEvenChildren} ילדים</span>
              <span>תפוסה מלאה: {MAX_CAPACITY} ילדים</span>
            </div>
          </div>

          {/* Break-Even 3-Column Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Box 1: Required Break-Even */}
            <div className="p-5 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
              <span className="text-[11px] font-black text-[#51443c] uppercase tracking-wide block">1. נקודת איזון מחושבת</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[#5f3414]">
                  {breakEvenChildren}
                </span>
                <span className="text-xs font-bold text-[#51443c]">ילדים (מתוך 40)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                {!hasEnteredData
                  ? 'הזינו כמות ילדים בטופס למעלה לבדיקת מצב האיזון.'
                  : isPastBreakEven
                  ? `מעל נקודת האיזון ב-${childrenOverBreakEven} ילדים! המעון נמצא ברווחיות תפעולית.`
                  : `חסרים עוד ${childrenUnderBreakEven} ילדים כדי לכסות 100% מההוצאות הקבועות.`}
              </p>
            </div>

            {/* Box 2: Marginal Contribution */}
            <div className="p-5 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
              <span className="text-[11px] font-black text-[#51443c] uppercase tracking-wide block">2. תרומה שולית ממוצעת לילד</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-emerald-700">
                  ₪{Math.round(contributionMarginPerChild).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">/ילד</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                שכ"ל משוקלל (₪{weightedAvgTuition.toLocaleString()}) בניכוי עלות מזון וחומרים (₪{variableCostPerChild}). כל ילד נוסף מעבר לאיזון מגדיל את הרווח בסכום זה.
              </p>
            </div>

            {/* Box 3: Staffing Standard */}
            <div className="p-5 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
              <span className="text-[11px] font-black text-[#51443c] uppercase tracking-wide block">3. תקן צוות חוקי (חוק הפיקוח)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[#7a4b29]">
                  {totalRequiredStaff}
                </span>
                <span className="text-xs font-bold text-[#51443c]">מטפלות נדרשות</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                {totalChildren > 0
                  ? `לפי יחס 1:6 ל-${totalInfants} תינוקות (${requiredInfantStaff} עובדות) ויחס 1:9 ל-${totalToddlers} פעוטות (${requiredToddlerStaff} עובדות).`
                  : 'התקן יחושב אוטומטית ביחס 1:6 לתינוקות ו-1:9 לפעוטות בהזנת ילדים.'}
              </p>
            </div>
          </div>
        </div>

        {/* ISRAELI TAX ESTIMATE CARD */}
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
                בחרו את סוג הישות העסקית ברשות המיסים לקבלת חישוב מדויק של חבות המס והרווח הנטו שנשאר בכיס.
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

            {/* Box 3: Post-Tax Net Profit */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 ring-4 ring-emerald-500/5">
              <span className="text-[11px] font-black text-emerald-900 block uppercase tracking-wide">3. רווח נטו סופי בכיס</span>
              <span className="text-4xl font-black font-mono text-emerald-700 block tabular-nums">
                ₪{Math.round(taxEstimate.postTaxNetProfit).toLocaleString()}
              </span>
              <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                הסכום הריאלי שנשאר לבעלי המעון לאחר כל תשלומי המיסים החודשיים.
              </p>
            </div>
          </div>

          {/* Tax Rules Explanation */}
          <div className="p-3.5 bg-[#fef3c7]/50 rounded-2xl border border-[#fef3c7] text-xs text-[#7a4b29] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0" />
            <span>{taxEstimate.explanationSummary}</span>
          </div>
        </div>

        {/* PARTNERSHIP SPLIT & EMERGENCY FUND */}
        <div className="bg-gradient-to-br from-[#fffdfa] to-[#faf6f0] rounded-3xl border-2 border-[#ffdeab] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebd7c5] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-[#7a4b29]" />
                <h3 className="font-black text-xl text-[#5f3414] font-heading">
                  מודל חלוקת רווחי שותפות (שותף/ה א' & שותף/ה ב')
                </h3>
              </div>
              <p className="text-xs text-[#51443c] mt-1">
                חלוקה שקופה ומדויקת של הרווח הנקי לאחר ניכוי מיסים והפרשה לקרן חירום עסקית עבור בלאי, קיץ ורזרבות.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-[#d6c3b8]/60 shadow-2xs">
              <PiggyBank className="w-4 h-4 text-[#7a4b29]" />
              <span className="text-xs font-black text-[#5f3414]">רווח נטו לחלוקה: ₪{distributableNetProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Partnership Sliders (Emergency Fund & Split Ratio) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-[#ebd7c5]">
            <MacroSlider
              label="הפרשה לקרן חירום ופיתוח עסקית (%):"
              sublabel="רזרבה לבלאי מתקנים, מזגנים, חודשי קיץ ופיתוח"
              value={emergencyFundPercent}
              onChange={(val) => updateField('emergencyFundPercent', val)}
              min={0}
              max={25}
              step={1}
              suffix="%"
            />

            <MacroSlider
              label={`יחס חלוקת שותפות (שותף/ה א' ${partner1Pct}% / שותף/ה ב' ${partner2Pct}%):`}
              sublabel="קביעת חלוקת הרווח הנקי בין שני השותפים"
              value={partner1SharePercent}
              onChange={(val) => updateField('partner1SharePercent', val)}
              min={10}
              max={90}
              step={5}
              suffix={`% לשותף/ה א'`}
            />
          </div>

          {/* Transparent Distribution 3-Card Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Box 1: Emergency Fund */}
            <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">1. קרן חירום ופיתוח</span>
                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                  {emergencyFundPct}% נשמר בעסק
                </span>
              </div>
              <span className="text-3xl font-black font-mono text-amber-900 block tabular-nums">
                ₪{emergencyFundAmount.toLocaleString()}
              </span>
              <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                סכום חודשי מצטבר הנשמר בחשבון העסק עבור הוצאות בלתי צפויות, תיקוני ציוד, רזרבת חודש אוגוסט ושדרוגים.
              </p>
            </div>

            {/* Box 2: Partner 1 */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#7a4b29]/30 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#5f3414] uppercase tracking-wide">2. משיכת רווחים: שותף/ה א'</span>
                <span className="text-[10px] font-black bg-[#ffdeab] text-[#5f3414] px-2 py-0.5 rounded-md">
                  {partner1Pct}% חלק בשותפות
                </span>
              </div>
              <span className="text-3xl font-black font-mono text-[#7a4b29] block tabular-nums">
                ₪{partner1ShareAmount.toLocaleString()}
              </span>
              <p className="text-[11px] text-[#51443c] leading-relaxed font-medium">
                הסכום הנטו המועבר עבור שותף/ה א' בסוף החודש לאחר כל המיסים וההפרשה לקרן החירום.
              </p>
            </div>

            {/* Box 3: Partner 2 */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#7a4b29]/30 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#5f3414] uppercase tracking-wide">3. משיכת רווחים: שותף/ה ב'</span>
                <span className="text-[10px] font-black bg-[#ffdeab] text-[#5f3414] px-2 py-0.5 rounded-md">
                  {partner2Pct}% חלק בשותפות
                </span>
              </div>
              <span className="text-3xl font-black font-mono text-[#7a4b29] block tabular-nums">
                ₪{partner2ShareAmount.toLocaleString()}
              </span>
              <p className="text-[11px] text-[#51443c] leading-relaxed font-medium">
                הסכום הנטו המועבר עבור שותף/ה ב' בסוף החודש לאחר כל המיסים וההפרשה לקרן החירום.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OPTIONAL DRILLDOWN DRAWER */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-5 shadow-2xs">
        <button
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          className="flex items-center justify-between w-full text-xs font-bold text-[#7a4b29] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>צפו בפירוט סעיפי הוצאה והכנסה מורחבים (אופציונלי)</span>
          </div>
          {showDetailedBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetailedBreakdown && (
          <div className="mt-4 pt-4 border-t border-[#efeeea] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h5 className="font-bold text-[#5f3414]">סיכום הכנסות</h5>
              <ul className="space-y-1 text-[#51443c] bg-[#faf8f5] p-3 rounded-xl border border-[#e4e2de]">
                <li>• שכ"ל תינוקייה ({totalInfants} תינוקות): ₪{infantsTuitionTotal.toLocaleString()}</li>
                <li>• שכ"ל פעוטון ({totalToddlers} פעוטות): ₪{toddlersTuitionTotal.toLocaleString()}</li>
                <li>• הוצאות שונות ותוספות: ₪{afternoonCareTotal.toLocaleString()}</li>
                <li className="font-bold text-emerald-700 pt-1 border-t border-[#e4e2de]">
                  סה"כ הכנסות: ₪{totalIncome.toLocaleString()}
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-[#5f3414]">סיכום הוצאות</h5>
              <ul className="space-y-1 text-[#51443c] bg-[#faf8f5] p-3 rounded-xl border border-[#e4e2de]">
                <li>• שכירות וארנונה: ₪{Number(rentAndTax).toLocaleString()}</li>
                <li>• ביטוח מקיף למעון: ₪{Number(insuranceCost).toLocaleString()}</li>
                <li>• שכר צוות כולל מעסיק: ₪{Math.round(staffPayrollTotal).toLocaleString()}</li>
                <li>• מזון וציוד היגיינה ({totalChildren} ילדים): ₪{variableFoodSuppliesTotal.toLocaleString()}</li>
                <li>• רו"ח, חשמל, מים ותקשורת: ₪{(Number(accountantCost) + Number(utilitiesCost)).toLocaleString()}</li>
                <li>• חוגים ותחזוקת בטיחות: ₪{(Number(enrichmentClassesCost) + Number(maintenanceAndSafety)).toLocaleString()}</li>
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
