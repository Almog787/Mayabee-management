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
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MessageCircle,
  HeartHandshake,
  ShieldAlert,
  PiggyBank,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowRight,
  Scale,
  Sparkle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  ReferenceLine,
} from 'recharts';
import { DaycareSettings } from '../../types';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';
import { calculateIsraeliTaxEstimate, EstimatedTaxResult } from '../../lib/taxEngine';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (updates: Partial<DaycareSettings>) => Promise<void>;
  onOpenSuggestions?: () => void;
}

const STORAGE_KEY = 'daycare_planner_macro_v6_reordered';

type BusinessType = 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY';

const DEFAULT_PLANNER_DATA = {
  businessType: 'OSEK_PATUR' as BusinessType,
  infantsCount: 0,
  infantsTuition: 3800,
  toddlersCount: 0,
  toddlersTuition: 3300,
  afternoonCareFee: 600,
  afternoonCareChildren: 0,
  rentAndTax: 5000,
  insuranceCost: 1100,
  accountantCost: 750,
  utilitiesCost: 1600,
  foodPerChild: 280,
  suppliesPerChild: 80,
  staffCount: 0,
  avgStaffHourlyRate: 46,
  dailyHoursPerStaff: 8,
  socialOverheadPercent: 20,
  enrichmentClassesCost: 1200,
  maintenanceAndSafety: 600,
  emergencyFundPercent: 10,
  partner1SharePercent: 50,
};

/**
 * Eye-friendly Touch Slider Component
 * Optimized for readability, gentle contrast, and clean numeric alignment
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
          <span>{safeVal.toLocaleString()}</span>
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
  onOpenSuggestions,
}) => {
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

  const updateField = (field: keyof typeof DEFAULT_PLANNER_DATA, value: any) => {
    setPlannerData((prev: typeof DEFAULT_PLANNER_DATA) => ({ ...prev, [field]: value }));
  };

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

  const totalInfants = Math.max(0, Number(infantsCount) || 0);
  const totalToddlers = Math.max(0, Number(toddlersCount) || 0);
  const totalChildren = totalInfants + totalToddlers;
  const MAX_CAPACITY = 40;

  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(false);

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const hasEnteredData = totalChildren > 0;

  // Revenue calculations
  const infantsTuitionTotal = useMemo(() => totalInfants * (Number(infantsTuition) || 0), [totalInfants, infantsTuition]);
  const toddlersTuitionTotal = useMemo(() => totalToddlers * (Number(toddlersTuition) || 0), [totalToddlers, toddlersTuition]);
  const baseTuitionTotal = infantsTuitionTotal + toddlersTuitionTotal;
  const afternoonCareTotal = useMemo(
    () => Math.max(0, Number(afternoonCareChildren) || 0) * Math.max(0, Number(afternoonCareFee) || 0),
    [afternoonCareChildren, afternoonCareFee]
  );
  const totalIncome = baseTuitionTotal + afternoonCareTotal;

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

  // Staffing Ratio Compliance (חוק הפיקוח על מעונות יום)
  // תינוקייה: 1 מטפלת לכל 6 תינוקות (1:6)
  // פעוטון: 1 מטפלת לכל 9 פעוטות (1:9)
  const requiredInfantStaff = totalInfants > 0 ? Math.ceil(totalInfants / 6) : 0;
  const requiredToddlerStaff = totalToddlers > 0 ? Math.ceil(totalToddlers / 9) : 0;
  const totalRequiredStaff = totalChildren > 0 ? Math.max(1, requiredInfantStaff + requiredToddlerStaff) : 0;
  const isStaffCompliant = Number(staffCount) >= totalRequiredStaff && totalRequiredStaff > 0;
  const staffDiff = Number(staffCount) - totalRequiredStaff;

  // Variable Costs
  const variableCostPerChild = (Number(foodPerChild) || 0) + (Number(suppliesPerChild) || 0);
  const variableFoodSuppliesTotal = useMemo(
    () => totalChildren * variableCostPerChild,
    [totalChildren, variableCostPerChild]
  );

  // Fixed Operating Costs
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

  // Break-even
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
        explanationSummary: 'הזינו כמות ילדים ושכר לימוד בסליידרים למעלה לקבלת חישוב מס ורווח נטו בכיס.',
      };
    }
    return calculateIsraeliTaxEstimate(totalIncome, actualTotalExpenses, businessType);
  }, [hasEnteredData, totalIncome, actualTotalExpenses, businessType]);

  // Partnership & Emergency Fund
  const postTaxProfit = Math.max(0, taxEstimate.postTaxNetProfit);
  const emergencyFundPct = Math.max(0, Math.min(30, Number(emergencyFundPercent) || 10));
  const emergencyFundAmount = Math.round(postTaxProfit * (emergencyFundPct / 100));
  const distributableNetProfit = Math.max(0, postTaxProfit - emergencyFundAmount);

  const partner1Pct = Math.max(0, Math.min(100, Number(partner1SharePercent) || 50));
  const partner2Pct = 100 - partner1Pct;

  const partner1ShareAmount = Math.round(distributableNetProfit * (partner1Pct / 100));
  const partner2ShareAmount = Math.max(0, distributableNetProfit - partner1ShareAmount);

  // 1. Break-Even Trajectory Area Chart Data
  const breakEvenChartData = useMemo(() => {
    const points = [];
    const step = 5;
    for (let c = 0; c <= MAX_CAPACITY; c += step) {
      const rev = c * effectiveAvgRevenuePerChild;
      const exp = totalFixedCosts + (c * variableCostPerChild);
      points.push({
        children: c,
        revenue: Math.round(rev),
        totalExpenses: Math.round(exp),
        fixedCosts: Math.round(totalFixedCosts),
        profit: Math.round(rev - exp),
      });
    }
    return points;
  }, [effectiveAvgRevenuePerChild, totalFixedCosts, variableCostPerChild]);

  // 2. OPEX Cost Breakdown Bar Chart
  const expenseBreakdownData = useMemo(() => {
    return [
      { category: 'שכר צוות', amount: Math.round(staffPayrollTotal), fill: '#38bdf8' },
      { category: 'שכירות וארנונה', amount: Number(rentAndTax), fill: '#818cf8' },
      { category: 'הזנה ומזון טרי', amount: Math.round(totalChildren * Number(foodPerChild)), fill: '#34d399' },
      { category: 'ציוד וחומרי ניקוי', amount: Math.round(totalChildren * Number(suppliesPerChild)), fill: '#fbbf24' },
      { category: 'ביטוח מעון', amount: Number(insuranceCost), fill: '#f472b6' },
      { category: 'רו"ח ותקשורת', amount: Number(accountantCost) + Number(utilitiesCost), fill: '#a78bfa' },
      { category: 'חוגים ובטיחות', amount: Number(enrichmentClassesCost) + Number(maintenanceAndSafety), fill: '#2dd4bf' },
    ].filter(item => item.amount > 0);
  }, [staffPayrollTotal, rentAndTax, totalChildren, foodPerChild, suppliesPerChild, insuranceCost, accountantCost, utilitiesCost, enrichmentClassesCost, maintenanceAndSafety]);

  // 3. Profit & Fund Allocation Donut Data
  const profitDistributionData = useMemo(() => {
    if (distributableNetProfit <= 0 && emergencyFundAmount <= 0) {
      return [{ name: 'אין רווח לחלוקה', value: 1, fill: '#475569' }];
    }
    return [
      { name: `שותף/ה א' (${partner1Pct}%)`, value: partner1ShareAmount, fill: '#38bdf8' },
      { name: `שותף/ה ב' (${partner2Pct}%)`, value: partner2ShareAmount, fill: '#818cf8' },
      { name: `קרן חירום (${emergencyFundPct}%)`, value: emergencyFundAmount, fill: '#fbbf24' },
    ];
  }, [partner1Pct, partner2Pct, emergencyFundPct, partner1ShareAmount, partner2ShareAmount, emergencyFundAmount, distributableNetProfit]);

  // WhatsApp formatted report share
  const handleShareWhatsApp = () => {
    const bTypeLabel =
      businessType === 'OSEK_PATUR' ? 'עוסק פטור' : businessType === 'OSEK_MURSHE' ? 'עוסק מורשה' : 'חברה בע"מ';

    const text = `📊 *דוח תכנון פיננסי ו-BI - מערכת ניהול מעון ילדים*
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
      selectedMonth,
      monthLabel,
      activeChildren: dummyChildren as any,
      expectedExpenses: macroExpenses as any,
      staff: dummyStaff as any,
      settings,
      completenessScore: totalChildren > 0 ? 98 : 40,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & MONTH CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 text-right">
          <div className="inline-flex items-center gap-2 text-teal-300 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>מערכת BI למעון ילדים · תקן 40 ילדים · אריאל</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight font-heading">
            מתכנן מאזן, סימולציה וניתוח נתונים 📊
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            שלב 1: הזינו את נתוני הילדים וההוצאות בסליידרים מיד למטה. שלב 2: צפו מיד בתוצאות, ניתוחי המאזן, עמידה בתקנות מס ונקודת האיזון.
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
            onClick={handleShareWhatsApp}
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

      {/* Suggestion Callout if available */}
      {onOpenSuggestions && (
        <div className="bg-slate-900/90 rounded-xl border border-teal-800/40 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-right">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-slate-200">
              רוצים לבקש אוטומציה נוספת או לשלוח משוב על המערכת? השתמשו בתיבת ההצעות הייעודית.
            </span>
          </div>
          <button
            onClick={onOpenSuggestions}
            className="text-teal-300 hover:text-teal-200 font-bold underline underline-offset-2 shrink-0 cursor-pointer"
          >
            לתיבת ההצעות ←
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STEP 1: INPUT DATA CONTROLS FIRST (קודם כל הזנת נתונים בסליידרים!)   */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                שלב 1: הזנת נתוני מעון (סליידרים נוחים למסכי טאץ')
              </h3>
              <p className="text-xs text-slate-300">
                גררו את הסליידרים ללא צורך במקלדת. כל שינוי מעדכן מידית את לוח המחוונים והגרפים למטה.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resetSuccessMessage && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>הפרמטרים אופסו בהצלחה!</span>
              </span>
            )}
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-600"
              title="איפוס שדות"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              <span>איפוס פרמטרים</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* SLICE 1: Enrollment & Tuition */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-teal-300 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-400" />
                <span>1. רישום ילדים ושכ"ל</span>
              </span>
              <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">{totalChildren}/40 ילדים</span>
            </div>
            <EyeFriendlySlider
              label="תינוקות (3 חוד' - 1.5 שנים):"
              sublabel="תקן חוקי: 1 מטפלת ל-6 תינוקות"
              value={infantsCount}
              onChange={(val) => updateField('infantsCount', val)}
              min={0}
              max={20}
              suffix="תינוקות"
              accentColor="accent-teal-400"
            />
            <EyeFriendlySlider
              label="שכ''ל תינוקייה לחודש:"
              sublabel="טווח מומלץ באריאל: ₪3,700-₪4,200"
              value={infantsTuition}
              onChange={(val) => updateField('infantsTuition', val)}
              min={2000}
              max={5500}
              step={50}
              prefix="₪"
              accentColor="accent-teal-400"
            />
            <EyeFriendlySlider
              label="פעוטות (1.5 - 3 שנים):"
              sublabel="תקן חוקי: 1 מטפלת ל-9 פעוטות"
              value={toddlersCount}
              onChange={(val) => updateField('toddlersCount', val)}
              min={0}
              max={30}
              suffix="פעוטות"
              accentColor="accent-teal-400"
            />
            <EyeFriendlySlider
              label="שכ''ל פעוטון לחודש:"
              sublabel="טווח מומלץ באריאל: ₪3,200-₪3,600"
              value={toddlersTuition}
              onChange={(val) => updateField('toddlersTuition', val)}
              min={2000}
              max={5000}
              step={50}
              prefix="₪"
              accentColor="accent-teal-400"
            />
            <EyeFriendlySlider
              label="הוצאות שונות / צהרון לילד:"
              value={afternoonCareFee}
              onChange={(val) => updateField('afternoonCareFee', val)}
              min={0}
              max={1500}
              step={50}
              prefix="₪"
              accentColor="accent-teal-400"
            />
          </div>

          {/* SLICE 2: Staff & Wages */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-sky-300 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>2. כוח אדם ושכר מעסיק</span>
              </span>
              <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">{staffCount} עובדות</span>
            </div>
            <EyeFriendlySlider
              label="כמות עובדות צוות בפועל:"
              sublabel={totalChildren > 0 ? `תקן מומלץ לפי הילדים: ${totalRequiredStaff} עובדות` : 'תקן חוקי יחושב בהזנת ילדים'}
              value={staffCount}
              onChange={(val) => updateField('staffCount', val)}
              min={0}
              max={12}
              suffix="עובדות"
              accentColor="accent-sky-400"
            />
            <EyeFriendlySlider
              label="שכר שעתי ברוטו לעובדת:"
              value={avgStaffHourlyRate}
              onChange={(val) => updateField('avgStaffHourlyRate', val)}
              min={35}
              max={100}
              step={1}
              prefix="₪"
              accentColor="accent-sky-400"
            />
            <EyeFriendlySlider
              label="עלות מעסיק סוציאלית (%):"
              sublabel="פנסיה, פיצויים, ביטוח לאומי והבראה"
              value={socialOverheadPercent}
              onChange={(val) => updateField('socialOverheadPercent', val)}
              min={10}
              max={35}
              suffix="%"
              accentColor="accent-sky-400"
            />
            <EyeFriendlySlider
              label="שעות עבודה יומיות לעובדת:"
              value={dailyHoursPerStaff}
              onChange={(val) => updateField('dailyHoursPerStaff', val)}
              min={4}
              max={10}
              step={0.5}
              suffix="שעות"
              accentColor="accent-sky-400"
            />
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">חבות שכר חודשית:</span>
              <span className="font-mono font-bold text-sky-300 text-sm">₪{Math.round(staffPayrollTotal).toLocaleString()}</span>
            </div>
          </div>

          {/* SLICE 3: Facility & OPEX */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>3. שכירות ותפעול שוטף</span>
              </span>
              <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">אריאל</span>
            </div>
            <EyeFriendlySlider
              label="שכירות מבנה מעון וארנונה באריאל:"
              value={rentAndTax}
              onChange={(val) => updateField('rentAndTax', val)}
              min={1000}
              max={15000}
              step={100}
              prefix="₪"
              accentColor="accent-emerald-400"
            />
            <EyeFriendlySlider
              label="מזון טרי לילד לחודש:"
              sublabel="3 ארוחות טריות ביום (~12.7 ₪ ליום)"
              value={foodPerChild}
              onChange={(val) => updateField('foodPerChild', val)}
              min={100}
              max={600}
              step={10}
              prefix="₪"
              accentColor="accent-emerald-400"
            />
            <EyeFriendlySlider
              label="ביטוח מעון מקיף וחבות מעבידים:"
              value={insuranceCost}
              onChange={(val) => updateField('insuranceCost', val)}
              min={300}
              max={2500}
              step={50}
              prefix="₪"
              accentColor="accent-emerald-400"
            />
            <EyeFriendlySlider
              label="רו''ח, חשמל, מים ותקשורת:"
              value={accountantCost + utilitiesCost}
              onChange={(val) => {
                updateField('accountantCost', Math.min(750, val));
                updateField('utilitiesCost', Math.max(0, val - 750));
              }}
              min={500}
              max={5000}
              step={100}
              prefix="₪"
              accentColor="accent-emerald-400"
            />
            <EyeFriendlySlider
              label="חוגי העשרה ותחזוקת בטיחות:"
              value={(enrichmentClassesCost || 0) + (maintenanceAndSafety || 0)}
              onChange={(val) => {
                updateField('enrichmentClassesCost', Math.round(val * 0.65));
                updateField('maintenanceAndSafety', Math.round(val * 0.35));
              }}
              min={0}
              max={4000}
              step={100}
              prefix="₪"
              accentColor="accent-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STEP 2: RESULTS DASHBOARD & SCORECARDS (אחר כך דשבורד הנתונים!)        */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              שלב 2: לוח תוצאות, עמידה בתקנות ומדדי ביצוע (KPIs)
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            {hasEnteredData ? `מחושב עבור ${totalChildren} ילדים` : 'מצב פתיחה (0 ילדים)'}
          </span>
        </div>

        {/* 4 Primary Metric Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Net Profit */}
          <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>רווח נקי לפני מס</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${!hasEnteredData ? 'text-slate-500' : netBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                ₪{Math.round(netBalance).toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>🎯 יעד רווחיות: 20%</span>
                <span className="font-mono text-slate-200 font-bold">{profitMarginPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${profitMarginPercent >= 20 ? 'bg-emerald-400' : profitMarginPercent > 0 ? 'bg-teal-400' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, profitMarginPercent * 5))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Occupancy Rate */}
          <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>תפוסת ילדים רשומה</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {totalChildren}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 40 ילדים</span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>🎯 יעד תפוסה: 85%</span>
                <span className="font-mono text-teal-300 font-bold">{currentOccupancyPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${currentOccupancyPct >= 85 ? 'bg-emerald-400' : 'bg-sky-400'}`}
                  style={{ width: `${currentOccupancyPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Break-Even Children */}
          <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>נקודת איזון מחושבת</span>
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 tabular-nums">
                {breakEvenChildren}
              </span>
              <span className="text-xs text-slate-400">ילדים</span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>סטטוס כיסוי OPEX:</span>
                <span className={`font-bold ${!hasEnteredData ? 'text-slate-400' : isPastBreakEven ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {!hasEnteredData ? 'ממתין לנתונים' : isPastBreakEven ? `+${childrenOverBreakEven} מעל האיזון` : `חסרים ${childrenUnderBreakEven}`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isPastBreakEven ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min(100, Math.round((totalChildren / Math.max(1, breakEvenChildren)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Legal Staff Ratio */}
          <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>תאימות חוק הפיקוח (תקן)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {staffCount}
              </span>
              <span className="text-xs font-mono text-slate-400">/ {totalRequiredStaff} נדרשות</span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>חוק הפיקוח (1:6 ו-1:9):</span>
                <span className={`font-bold ${totalChildren === 0 ? 'text-slate-400' : isStaffCompliant ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {totalChildren === 0 ? 'טרם הוזנו ילדים' : isStaffCompliant ? 'תקן מאושר ✓' : `חסרות ${Math.abs(staffDiff)} עובדות ⚠️`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isStaffCompliant ? 'bg-emerald-400' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.round((Number(staffCount) / Math.max(1, totalRequiredStaff)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUALIZATION GALLERY: RECHARTS                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Break-Even Trajectory Area Chart */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">גרף נקודת איזון: הכנסות מול סך הוצאות</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-300">0 עד 40 ילדים</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={breakEvenChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                <XAxis dataKey="children" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit=" י'" />
                <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`₪${Number(val).toLocaleString()}`, '']}
                  labelFormatter={(lbl) => `${lbl} ילדים רשומים`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {breakEvenChildren > 0 && (
                  <ReferenceLine x={breakEvenChildren} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: `איזון: ${breakEvenChildren}`, fill: '#fbbf24', fontSize: 10, position: 'top' }} />
                )}
                <Area type="monotone" dataKey="revenue" name="הכנסות חודשיות" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="totalExpenses" name="סך הוצאות כולל" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-300">
            האזור הירוק שמעבר לקו המקווקו מייצג את הרווח הנקי התפעולי. נקודת האיזון הנוכחית היא ב-{breakEvenChildren} ילדים.
          </p>
        </div>

        {/* CHART 2: OPEX Breakdown Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">פילוח סעיפי תקציב והוצאות OPEX</h3>
            </div>
            <span className="text-[11px] font-mono text-teal-300 font-bold">₪{Math.round(displayTotalExpenses).toLocaleString()} סה"כ</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseBreakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} horizontal={false} />
                <XAxis type="number" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#cbd5e1' }} tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`} />
                <YAxis dataKey="category" type="category" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#f1f5f9' }} width={105} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`₪${Number(val).toLocaleString()}`, 'סכום']}
                />
                <Bar dataKey="amount" name="עלות חודשית" radius={[0, 6, 6, 0]}>
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-300">
            השוואת עומסי התקציב: שכר עובדות מהווה לרוב 50%–65% מעלויות ההפעלה בגיל הרך.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ISRAELI TAX REGULATIONS & PARTNERSHIP ALLOCATION SLICE                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Regulations Compliance Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">עמידה בתקנות מס בישראל</h3>
            </div>
            {/* Entity selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700 text-[10px] font-bold">
              <button
                onClick={() => updateField('businessType', 'OSEK_PATUR')}
                className={`px-2 py-0.5 rounded cursor-pointer ${businessType === 'OSEK_PATUR' ? 'bg-teal-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                פטור
              </button>
              <button
                onClick={() => updateField('businessType', 'OSEK_MURSHE')}
                className={`px-2 py-0.5 rounded cursor-pointer ${businessType === 'OSEK_MURSHE' ? 'bg-teal-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                מורשה
              </button>
              <button
                onClick={() => updateField('businessType', 'COMPANY')}
                className={`px-2 py-0.5 rounded cursor-pointer ${businessType === 'COMPANY' ? 'bg-teal-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
              >
                בע"מ
              </button>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>רווח נקי לפני מס:</span>
              <span className="font-mono font-bold text-white">₪{Math.round(taxEstimate.preTaxNetProfit).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span>סך חבות מס וביטוח לאומי:</span>
              <span className="font-mono font-bold">-₪{taxEstimate.totalTaxLiability.toLocaleString()}</span>
            </div>
            {taxEstimate.netVatAmount > 0 && (
              <div className="flex justify-between items-center text-amber-200 text-[11px]">
                <span>מתוכו מע"מ 17%:</span>
                <span className="font-mono font-bold">₪{taxEstimate.netVatAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-emerald-300 pt-2 border-t border-slate-800 text-sm">
              <span className="font-bold">רווח נטו סופי בכיס:</span>
              <span className="font-mono font-black text-base">₪{Math.round(postTaxProfit).toLocaleString()}</span>
            </div>
          </div>

          {/* Osek Patur threshold notice */}
          {businessType === 'OSEK_PATUR' && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>תקרת עוסק פטור לשנת 2026:</span>
                <span className="font-mono font-bold text-teal-300">₪122,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>מחזור הכנסות שנתי צפוי:</span>
                <span className="font-mono font-bold text-slate-200">₪{(totalIncome * 12).toLocaleString()}</span>
              </div>
              {(totalIncome * 12) > 122000 && (
                <p className="text-amber-300 text-[10px] font-bold pt-1 border-t border-slate-800">
                  ⚠️ שים לב: מחזור ההכנסות חוצה את תקרת עוסק פטור! יש להיערך למעבר לעוסק מורשה.
                </p>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-300 leading-tight bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            {taxEstimate.explanationSummary}
          </p>
        </div>

        {/* Partnership Split & Emergency Fund Donut */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">מודל שותפות מלאה וקרן חירום עסקית</h3>
            </div>
            <span className="text-xs font-mono text-teal-300 font-bold">נטו לחלוקה: ₪{distributableNetProfit.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Visual Progress & Allocation Bars (Super clear & legible) */}
            <div className="space-y-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-sky-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                    <span>שותף/ה א' ({partner1Pct}%):</span>
                  </span>
                  <span className="font-mono font-bold text-white tabular-nums">₪{partner1ShareAmount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-sky-400 to-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${distributableNetProfit > 0 ? (partner1ShareAmount / Math.max(1, postTaxProfit)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-indigo-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                    <span>שותף/ה ב' ({partner2Pct}%):</span>
                  </span>
                  <span className="font-mono font-bold text-white tabular-nums">₪{partner2ShareAmount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-indigo-400 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${distributableNetProfit > 0 ? (partner2ShareAmount / Math.max(1, postTaxProfit)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span>קרן חירום עסקית ({emergencyFundPct}%):</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">₪{emergencyFundAmount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${postTaxProfit > 0 ? (emergencyFundAmount / postTaxProfit) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Allocation breakdown */}
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sky-300 font-semibold">שותף/ה א' ({partner1Pct}%):</span>
                  <span className="font-mono font-bold text-white">₪{partner1ShareAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-300 font-semibold">שותף/ה ב' ({partner2Pct}%):</span>
                  <span className="font-mono font-bold text-white">₪{partner2ShareAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800 text-amber-300">
                  <span>הפרשה לקרן חירום ({emergencyFundPct}%):</span>
                  <span className="font-mono font-bold">₪{emergencyFundAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Sliders for split and emergency */}
              <div className="space-y-2">
                <EyeFriendlySlider
                  label="יחס שותפות (שותף/ה א'):"
                  value={partner1SharePercent}
                  onChange={(val) => updateField('partner1SharePercent', val)}
                  min={10}
                  max={90}
                  step={5}
                  suffix="%"
                  accentColor="accent-sky-400"
                />
                <EyeFriendlySlider
                  label="הפרשה לקרן חירום עסקית:"
                  value={emergencyFundPercent}
                  onChange={(val) => updateField('emergencyFundPercent', val)}
                  min={0}
                  max={25}
                  step={1}
                  suffix="%"
                  accentColor="accent-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. EXPANDABLE TECHNICAL DRILLDOWN MATRIX                                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-xs">
        <button
          onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          className="flex items-center justify-between w-full text-xs font-semibold text-teal-300 hover:text-teal-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>פירוט נתונים מורחב וטבלאות גולמיות (Drilldown Matrix)</span>
          </div>
          {showDetailedBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetailedBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h5 className="font-bold text-emerald-300">פירוט הכנסות</h5>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between"><span>שכ"ל תינוקייה ({totalInfants}):</span><span>₪{infantsTuitionTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>שכ"ל פעוטון ({totalToddlers}):</span><span>₪{toddlersTuitionTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>תוספות וצהרון:</span><span>₪{afternoonCareTotal.toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-emerald-300">
                  <span>סה"כ הכנסות:</span><span>₪{totalIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h5 className="font-bold text-rose-300">פירוט הוצאות</h5>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between"><span>שכר צוות ברוטו + סוציאליות:</span><span>₪{Math.round(staffPayrollTotal).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>שכירות וארנונה:</span><span>₪{Number(rentAndTax).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>הזנה וציוד ({totalChildren} ילדים):</span><span>₪{variableFoodSuppliesTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>ביטוח, רו"ח ותפעול:</span><span>₪{(Number(insuranceCost) + Number(accountantCost) + Number(utilitiesCost)).toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-rose-300">
                  <span>סה"כ הוצאות:</span><span>₪{Math.round(displayTotalExpenses).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
