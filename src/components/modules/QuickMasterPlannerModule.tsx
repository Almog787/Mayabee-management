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
  Activity,
  Info,
  Clock,
  Building,
  TrendingUp,
  Percent,
  Check,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DaycareSettings } from '../../types';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (updates: Partial<DaycareSettings>) => Promise<void>;
  onOpenSuggestions?: () => void;
}

const STORAGE_KEY = 'daycare_budget_rotem_maya_full_model_v12_light';

/**
 * 1. הנחות יסוד ופרמטרים של המודל (Model Assumptions & Variables)
 * -------------------------------------------------------------
 * • מספר ילדים במעון: 16 ילדים
 * • שכר לימוד חודשי לילד (כולל מע"מ): 3,500 ₪
 * • שיעור מע"מ: 18.0%
 * • שיעור עלות מעביד משוערת: 17.0% משכר הברוטו
 * • שכר שעתי לבסיס עובדות הוראה/עזרה: 45 ₪ ברוטו לשעה
 * • מקדם שעות חודשי לממוצע שבועי: 4.33333 (52 שבועות / 12 חודשים)
 * • הפרשה לבלת"מים (רזרבה): 10.0% מההכנסה נטו (ללא מע"מ)
 * • השתתפות בנסיעות: מקסימום 200 ₪ חודשי לעובדת (64 ₪ לעובדת ג' יום בשבוע)
 * • ימי פעילות המעון: ראשון–חמישי (7:30–16:00), שישי (7:20–12:00)
 */
export const DEFAULT_MODEL_PARAMS = {
  // Model Parameters
  childrenCount: 16,
  tuitionPerChild: 3500,
  vatRatePercent: 18.0,
  employerOverheadPercent: 17.0,
  hourlyWage: 45.0,
  weeklyToMonthlyMultiplier: 52 / 12, // 4.33333
  contingencyPercent: 10.0,
  maxTravelMonthly: 200.0,

  // Operating Expenses breakdown (₪7,150.00 total)
  opex_food: 4000.0, // הזנה - מזון וארוחות חודשיות
  opex_accountant: 1000.0, // רואה חשבון ותלושי שכר
  opex_utilities: 800.0, // חשמל ומים
  opex_arnona: 500.0, // ארנונה
  opex_consumables: 350.0, // רכש מתכלה
  opex_maintenance: 300.0, // תחזוקה
  opex_fixedEquipment: 200.0, // רכש קבע / ציוד

  // Labor breakdown parameters
  staff_directorGross: 8000.0,
  staff_directorTravel: 200.0,
  staff_certifiedGross: 10000.0,
  staff_certifiedTravel: 200.0,
  staff_workerAWeeklyHours: 17.0,
  staff_workerATravel: 200.0,
  staff_workerBWeeklyHours: 22.0,
  staff_workerBTravel: 200.0,
  staff_workerCWeeklyHours: 8.5,
  staff_workerCTravel: 64.0,
};

/**
 * Eye-friendly Touch Slider Component (Light Theme)
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
}> = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', sublabel, accentColor = 'accent-teal-600' }) => {
  const safeVal = Math.max(min, Math.min(max, isNaN(value) ? min : value));

  return (
    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-baseline gap-2">
        <div className="min-w-0">
          <label className="text-slate-800 font-bold text-xs tracking-tight block truncate">{label}</label>
          {sublabel && <span className="text-[11px] text-slate-500 font-normal block truncate mt-0.5">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-1 font-mono font-bold text-teal-800 text-sm shrink-0 tabular-nums bg-teal-50/70 px-2.5 py-0.5 rounded-md border border-teal-200">
          <span>{prefix}</span>
          <span>{safeVal.toLocaleString('he-IL', { maximumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-teal-700">{suffix}</span>
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
          className={`flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${accentColor} touch-none`}
        />
      </div>
    </div>
  );
};

export const QuickMasterPlannerModule: React.FC<QuickMasterPlannerProps> = ({
  settings,
}) => {
  const [resetSuccessMessage, setResetSuccessMessage] = useState<boolean>(false);
  const [activeSectionTab, setActiveSectionTab] = useState<'all' | 'summary' | 'staff' | 'opex' | 'simulator'>('all');
  const [showDetailedFormulas, setShowDetailedFormulas] = useState<boolean>(true);

  // Target Month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // State initialized with exact table values
  const [params, setParams] = useState<typeof DEFAULT_MODEL_PARAMS>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_MODEL_PARAMS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load table inputs from storage', e);
    }
    return { ...DEFAULT_MODEL_PARAMS };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch (e) {
      console.error('Failed to save table inputs to storage', e);
    }
  }, [params]);

  const updateParam = (field: keyof typeof DEFAULT_MODEL_PARAMS, val: number) => {
    setParams((prev) => ({ ...prev, [field]: val }));
  };

  const handleResetToTableDefaults = () => {
    setParams({ ...DEFAULT_MODEL_PARAMS });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MODEL_PARAMS));
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
    setResetSuccessMessage(true);
    setTimeout(() => setResetSuccessMessage(false), 2500);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // =========================================================================
  // 2. מפתח הכנסות והפרדת מע"מ (Revenue & Tax Breakdown)
  // =========================================================================
  const numChildren = Math.max(1, Number(params.childrenCount) || 16);
  const tuition = Number(params.tuitionPerChild) || 3500;
  const vatRate = (Number(params.vatRatePercent) || 18) / 100;

  // הכנסה חודשית ברוטו (כולל מע"מ) = מספר ילדים × שכר לימוד
  const monthlyGrossIncome = numChildren * tuition; // ₪56,000.00
  // הכנסה חודשית נטו (ללא מע"מ) = הכנסה ברוטו / 1.18
  const monthlyNetIncome = monthlyGrossIncome / (1 + vatRate); // ₪47,457.63 (47,457.60)
  // רכיב מע"מ (18%) = הכנסה ברוטו - הכנסה נטו
  const monthlyVatAmount = monthlyGrossIncome - monthlyNetIncome; // ₪8,542.37
  const vatPercentOfNet = monthlyNetIncome > 0 ? (monthlyVatAmount / monthlyNetIncome) * 100 : 18.0;

  // =========================================================================
  // 3. פירוט עלויות כוח אדם (Labor Cost Calculations)
  // =========================================================================
  const multiplier = params.weeklyToMonthlyMultiplier || 4.333333333333333; // 52 / 12
  const employerRate = (params.employerOverheadPercent || 17) / 100;
  const wagePerHour = params.hourlyWage || 45.0;

  // עובדת 1: מנהלת
  const staff1_gross = params.staff_directorGross || 8000.0;
  const staff1_employer = staff1_gross * employerRate; // 1,360.00
  const staff1_travel = params.staff_directorTravel || 200.0;
  const staff1_total = staff1_gross + staff1_employer + staff1_travel; // 9,560.00

  // עובדת 2: מטפלת מוסמכת
  const staff2_gross = params.staff_certifiedGross || 10000.0;
  const staff2_employer = staff2_gross * employerRate; // 1,700.00
  const staff2_travel = params.staff_certifiedTravel || 200.0;
  const staff2_total = staff2_gross + staff2_employer + staff2_travel; // 11,900.00

  // עובדת 3: עובדת א' (ראשון, רביעי - 17 ש"ש)
  const staff3_weeklyHours = params.staff_workerAWeeklyHours || 17.0;
  const staff3_monthlyHours = staff3_weeklyHours * multiplier; // 73.6667 (73.67)
  const staff3_gross = staff3_monthlyHours * wagePerHour; // 3,315.00
  const staff3_employer = staff3_gross * employerRate; // 563.55
  const staff3_travel = params.staff_workerATravel || 200.0;
  const staff3_total = staff3_gross + staff3_employer + staff3_travel; // 4,078.55

  // עובדת 4: עובדת ב' (ראשון, חמישי, שישי - 22 ש"ש)
  const staff4_weeklyHours = params.staff_workerBWeeklyHours || 22.0;
  const staff4_monthlyHours = staff4_weeklyHours * multiplier; // 95.3333 (95.33)
  const staff4_gross = staff4_monthlyHours * wagePerHour; // 4,290.00
  const staff4_employer = staff4_gross * employerRate; // 729.30
  const staff4_travel = params.staff_workerBTravel || 200.0;
  const staff4_total = staff4_gross + staff4_employer + staff4_travel; // 5,219.30

  // עובדת 5: עובדת ג' (שלישי בלבד - 8.5 ש"ש)
  const staff5_weeklyHours = params.staff_workerCWeeklyHours || 8.5;
  const staff5_monthlyHours = staff5_weeklyHours * multiplier; // 36.8333 (36.83)
  const staff5_gross = staff5_monthlyHours * wagePerHour; // 1,657.50
  const staff5_employer = staff5_gross * employerRate; // 281.78
  const staff5_travel = params.staff_workerCTravel || 64.0;
  const staff5_total = staff5_gross + staff5_employer + staff5_travel; // 2,003.28 (2,003.27)

  // סה"כ כוח אדם
  const totalWeeklyHourlyHours = staff3_weeklyHours + staff4_weeklyHours + staff5_weeklyHours; // 47.5 ש"ש
  const totalMonthlyHourlyHours = staff3_monthlyHours + staff4_monthlyHours + staff5_monthlyHours; // 205.83 שעות
  const totalStaffGross = staff1_gross + staff2_gross + staff3_gross + staff4_gross + staff5_gross; // 27,262.50
  const totalStaffEmployer = staff1_employer + staff2_employer + staff3_employer + staff4_employer + staff5_employer; // 4,634.63
  const totalStaffTravel = staff1_travel + staff2_travel + staff3_travel + staff4_travel + staff5_travel; // 864.00
  const totalLaborCost = staff1_total + staff2_total + staff3_total + staff4_total + staff5_total; // 32,761.12 ₪

  // =========================================================================
  // 4. פירוט הוצאות תפעול שוטפות (Operating Expenses)
  // =========================================================================
  const opexItems = useMemo(() => [
    { id: 'food', name: 'הזנה', amount: params.opex_food || 4000.0, desc: 'מזון וארוחות חודשיות' },
    { id: 'accountant', name: 'רואה חשבון ותלושי שכר', amount: params.opex_accountant || 1000.0, desc: 'הנהלת חשבונות והפקת תלושים' },
    { id: 'utilities', name: 'חשמל ומים', amount: params.opex_utilities || 800.0, desc: 'תשלומי עירייה/חברות תשתית' },
    { id: 'arnona', name: 'ארנונה', amount: params.opex_arnona || 500.0, desc: 'מס מוניציפלי' },
    { id: 'consumables', name: 'רכש מתכלה', amount: params.opex_consumables || 350.0, desc: 'דפים, צבעים, חומרי יצירה וניקיון' },
    { id: 'maintenance', name: 'תחזוקה', amount: params.opex_maintenance || 300.0, desc: 'תיקונים ושוטף' },
    { id: 'fixedEquipment', name: 'רכש קבע / ציוד', amount: params.opex_fixedEquipment || 200.0, desc: 'פחת ציוד (מדפסת, מוצרי חשמל, כיסא מחשב)' },
  ], [params]);

  const totalOperatingExpenses = useMemo(() => {
    return opexItems.reduce((acc, item) => acc + item.amount, 0); // ₪7,150.00
  }, [opexItems]);

  // =========================================================================
  // 5. סיכום התקציב החודשי והיחסים הפיננסיים (Financial Overview & Summary)
  // =========================================================================
  // הפרשה לבלת"מים (10% מההכנסה ללא מע"מ)
  const contingencyRate = (params.contingencyPercent || 10) / 100;
  const contingencyAmount = monthlyNetIncome * contingencyRate; // ₪4,745.76

  // סה"כ הוצאות והפרשות
  const totalExpensesAndContingency = totalLaborCost + totalOperatingExpenses + contingencyAmount; // ₪44,656.88 (44,656.90)

  // יתרה חודשית משוערת (רווח)
  const estimatedMonthlyBalance = monthlyNetIncome - totalExpensesAndContingency; // ₪2,800.75 (2,800.74)
  const balancePerChild = numChildren > 0 ? (estimatedMonthlyBalance / numChildren) : 0; // ₪175.05

  // =========================================================================
  // 6. יחסים ומדדים מרכזיים להצגה באתר (KPIs)
  // =========================================================================
  const netProfitMarginPercent = monthlyNetIncome > 0 ? (estimatedMonthlyBalance / monthlyNetIncome) * 100 : 5.90; // 5.90%
  const laborRatioPercent = monthlyNetIncome > 0 ? (totalLaborCost / monthlyNetIncome) * 100 : 69.03; // 69.03%
  const opexRatioPercent = monthlyNetIncome > 0 ? (totalOperatingExpenses / monthlyNetIncome) * 100 : 15.07; // 15.07%
  const contingencyRatioPercent = params.contingencyPercent || 10.0; // 10.00%
  const totalExpensesRatioPercent = monthlyNetIncome > 0 ? (totalExpensesAndContingency / monthlyNetIncome) * 100 : 94.10; // 94.10%

  // Visual Chart Data
  const costDistributionData = useMemo(() => {
    return [
      { name: 'עלות כוח אדם', value: Math.round(totalLaborCost), fill: '#0284c7', percent: `${laborRatioPercent.toFixed(1)}%` },
      { name: 'הוצאות תפעול', value: Math.round(totalOperatingExpenses), fill: '#0d9488', percent: `${opexRatioPercent.toFixed(1)}%` },
      { name: 'הפרשה לבלת״מים', value: Math.round(contingencyAmount), fill: '#d97706', percent: `${contingencyRatioPercent.toFixed(1)}%` },
      ...(estimatedMonthlyBalance > 0
        ? [{ name: 'יתרה חודשית משוערת', value: Math.round(estimatedMonthlyBalance), fill: '#16a34a', percent: `${netProfitMarginPercent.toFixed(1)}%` }]
        : []),
    ];
  }, [totalLaborCost, totalOperatingExpenses, contingencyAmount, estimatedMonthlyBalance, laborRatioPercent, opexRatioPercent, contingencyRatioPercent, netProfitMarginPercent]);

  // WhatsApp formatted share message with the exact table lines
  const handleShareWhatsAppBudget = () => {
    const text = `📊 *תקציב ומודל חודשי – הבית של רותם ומאיה*
📅 חודש: ${monthLabel}

1️⃣ *הנחות יסוד:*
• תפוסה: ${numChildren} ילדים (שכ"ל: ₪${tuition.toLocaleString()} כולל מע"מ)
• מע"מ: ${params.vatRatePercent}% | מעביד: ${params.employerOverheadPercent}% | שכר שעתי: ₪${wagePerHour}
• שעות מעון: א'-ה' 7:30–16:00, ו' 7:20–12:00

2️⃣ *הכנסות:*
• הכנסה ברוטו (כולל מע"מ): ₪${monthlyGrossIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• מע"מ (18%): ₪${monthlyVatAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• הכנסה נטו (ללא מע"מ): ₪${monthlyNetIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}

3️⃣ *כוח אדם (5 עובדות, 47.5 ש"ש סייעות, 205.83 שעות):*
• מנהלת: ₪${staff1_total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• מטפלת מוסמכת: ₪${staff2_total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• עובדת א' (א', ד'): ₪${staff3_total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• עובדת ב' (א', ה', ו'): ₪${staff4_total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• עובדת ג' (ג' בלבד): ₪${staff5_total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• סה"כ כוח אדם: ₪${totalLaborCost.toLocaleString('he-IL', { minimumFractionDigits: 2 })} (${laborRatioPercent.toFixed(2)}% מהנטו)

4️⃣ *הוצאות תפעול (7 סעיפים):*
• סה"כ תפעול: ₪${totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })} (${opexRatioPercent.toFixed(2)}% מהנטו)

5️⃣ *סיכום ומאזן:*
• הפרשה לבלת"ם (10%): ₪${contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• סה"כ הוצאות והפרשות: ₪${totalExpensesAndContingency.toLocaleString('he-IL', { minimumFractionDigits: 2 })} (${totalExpensesRatioPercent.toFixed(2)}%)
• יתרה חודשית (רווח משוער): ₪${estimatedMonthlyBalance.toLocaleString('he-IL', { minimumFractionDigits: 2 })} (${netProfitMarginPercent.toFixed(2)}%)
• יתרה לכל ילד: ₪${balancePerChild.toLocaleString('he-IL', { minimumFractionDigits: 2 })}

קישור למערכת: https://almog787.github.io/Mayabee-management/`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Export to Excel / Sheets matching the full model
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
      monthlyTuition: tuition,
      extraFees: undefined,
      tuitionStatus: 'PAID' as const,
      status: 'ACTIVE' as const,
      updatedAt: Date.now(),
    }));

    // Operating expenses list
    const tableExpenses = [
      ...opexItems.map((item, idx) => ({
        id: `opex-${idx + 1}`,
        categoryName: item.name,
        description: item.desc,
        expectedAmount: item.amount,
        isConfirmed: true,
      })),
      {
        id: 'contingency',
        categoryName: 'הפרשה לבלת״מים',
        description: `${params.contingencyPercent}% מההכנסה ללא מע״מ`,
        expectedAmount: contingencyAmount,
        isConfirmed: true,
      },
    ];

    // Staff list with 5 detailed staff members
    const staffList = [
      {
        id: 'staff-1',
        fullName: 'מנהלת',
        idNumber: '000000001',
        role: 'DIRECTOR' as any,
        phone: '052-870-7056',
        email: '',
        hourlyRate: 0,
        standardDailyHours: 8,
        firstAidCertExpiryDate: '2027-01-01',
        policeClearanceDate: '2026-01-01',
        policeClearanceApproved: true,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
        notes: `גלובלי ₪${staff1_gross} + מעסיק ${params.employerOverheadPercent}% + נסיעות ₪${staff1_travel} = ₪${staff1_total.toFixed(2)}`,
      },
      {
        id: 'staff-2',
        fullName: 'מטפלת מוסמכת',
        idNumber: '000000002',
        role: 'LEAD_EDUCATOR' as any,
        phone: '052-870-7056',
        email: '',
        hourlyRate: 0,
        standardDailyHours: 8,
        firstAidCertExpiryDate: '2027-01-01',
        policeClearanceDate: '2026-01-01',
        policeClearanceApproved: true,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
        notes: `א'-ו' (שלישי 1 ל-3 בלימודים) | גלובלי ₪${staff2_gross} + מעסיק + נסיעות = ₪${staff2_total.toFixed(2)}`,
      },
      {
        id: 'staff-3',
        fullName: 'עובדת א\'',
        idNumber: '000000003',
        role: 'ASSISTANT' as any,
        phone: '052-870-7056',
        email: '',
        hourlyRate: wagePerHour,
        standardDailyHours: 8.5,
        firstAidCertExpiryDate: '2027-01-01',
        policeClearanceDate: '2026-01-01',
        policeClearanceApproved: true,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
        notes: `ראשון, רביעי (17 ש"ש, ${staff3_monthlyHours.toFixed(2)} חודשי) | סה"כ ₪${staff3_total.toFixed(2)}`,
      },
      {
        id: 'staff-4',
        fullName: 'עובדת ב\'',
        idNumber: '000000004',
        role: 'ASSISTANT' as any,
        phone: '052-870-7056',
        email: '',
        hourlyRate: wagePerHour,
        standardDailyHours: 7.33,
        firstAidCertExpiryDate: '2027-01-01',
        policeClearanceDate: '2026-01-01',
        policeClearanceApproved: true,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
        notes: `ראשון, חמישי, שישי (22 ש"ש, ${staff4_monthlyHours.toFixed(2)} חודשי) | סה"כ ₪${staff4_total.toFixed(2)}`,
      },
      {
        id: 'staff-5',
        fullName: 'עובדת ג\'',
        idNumber: '000000005',
        role: 'ASSISTANT' as any,
        phone: '052-870-7056',
        email: '',
        hourlyRate: wagePerHour,
        standardDailyHours: 8.5,
        firstAidCertExpiryDate: '2027-01-01',
        policeClearanceDate: '2026-01-01',
        policeClearanceApproved: true,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
        notes: `שלישי בלבד (8.5 ש"ש, ${staff5_monthlyHours.toFixed(2)} חודשי) | נסיעות ₪${staff5_travel} | סה"כ ₪${staff5_total.toFixed(2)}`,
      },
    ];

    exportToGoogleSheetsXlsx({
      selectedMonth,
      monthLabel,
      activeChildren: dummyChildren as any,
      expectedExpenses: tableExpenses as any,
      staff: staffList as any,
      settings,
      completenessScore: 100,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <div className="inline-flex items-center gap-2 text-teal-700 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>המודל התקציבי החודשי – הבית של רותם ומאיה 🐝</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            מחשבון תקציב מלא, מאזן ו-KPIs 📊
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            מודל תקציבי מקיף על בסיס 16 ילדים, 18% מע"מ, עלות מעביד 17%, שכר שעתי ₪45, 5 עובדות, ₪7,150 תפעול, 10% בלת"ם.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">חודש יעד:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-teal-800 font-bold text-xs outline-none font-mono cursor-pointer"
            />
          </div>

          <button
            onClick={handleShareWhatsAppBudget}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            title="שיתוף דוח תקציב מלא בווטסאפ"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>שיתוף בווטסאפ</span>
          </button>

          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-xs"
            title="ייצוא קובץ Excel / Google Sheets מלא"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ייצוא Sheets / Excel</span>
          </button>
        </div>
      </div>

      {/* SECTION NAV / FILTER TABS */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto p-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSectionTab('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeSectionTab === 'all'
                ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            כל הסעיפים והמודל (1-6)
          </button>
          <button
            onClick={() => setActiveSectionTab('summary')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeSectionTab === 'summary'
                ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            מאזן והכנסות (סעיפים 2, 5)
          </button>
          <button
            onClick={() => setActiveSectionTab('staff')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeSectionTab === 'staff'
                ? 'bg-white text-sky-800 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            כוח אדם (סעיף 3)
          </button>
          <button
            onClick={() => setActiveSectionTab('opex')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeSectionTab === 'opex'
                ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            הוצאות תפעול (סעיף 4)
          </button>
          <button
            onClick={() => setActiveSectionTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
              activeSectionTab === 'simulator'
                ? 'bg-white text-amber-800 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            הנחות וסימולטור (סעיף 1)
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {resetSuccessMessage && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>הנתונים שוחזרו לדיפולט 16 ילדים!</span>
            </span>
          )}
          <button
            onClick={handleResetToTableDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shadow-2xs"
            title="שחזור נתוני ברירת המחדל של הטבלה (16 ילדים)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span>איפוס לדיפולט (16 ילדים)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 6: מדדים מרכזיים (Key Performance Indicators - KPIs)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: שיעור רווח נקי */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">שיעור רווח נקי (נטו)</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold font-mono ${netProfitMarginPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {netProfitMarginPercent.toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">₪{estimatedMonthlyBalance.toLocaleString('he-IL', { maximumFractionDigits: 0 })} רווח חודשי</span>
        </div>

        {/* KPI 2: משקל כוח אדם */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">משקל כוח אדם מהנטו</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-sky-700">{laborRatioPercent.toFixed(2)}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">₪{totalLaborCost.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ל-5 עובדות</span>
        </div>

        {/* KPI 3: משקל הוצאות תפעול */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">משקל הוצאות תפעול</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-teal-700">{opexRatioPercent.toFixed(2)}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">₪{totalOperatingExpenses.toLocaleString('he-IL', { maximumFractionDigits: 0 })} סך 7 סעיפים</span>
        </div>

        {/* KPI 4: שיעור הרזרבה (בלת"מ) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">שיעור רזרבה (בלת"מ)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-amber-700">{contingencyRatioPercent.toFixed(2)}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">₪{contingencyAmount.toLocaleString('he-IL', { maximumFractionDigits: 0 })} מההכנסה נטו</span>
        </div>

        {/* KPI 5: יתרה ממוצעת לילד */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">יתרה ממוצעת לילד</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-800">₪{balancePerChild.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">לפי {numChildren} ילדים</span>
        </div>

        {/* KPI 6: שעות שבועיות סייעות */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">ש"ש סייעות / חודשי</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-purple-700">{totalWeeklyHourlyHours.toFixed(1)}</span>
            <span className="text-[10px] text-purple-600 font-sans">ש"ש</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">{totalMonthlyHourlyHours.toFixed(1)} שעות/חודש</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: הנחות יסוד ופרמטרים של המודל (Model Assumptions)
         ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'simulator') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>1. הנחות יסוד ופרמטרים של המודל (Model Assumptions & Variables)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  כללי הבסיס עליהם בנוי המודל הפיננסי (שעות פעילות, מקדמים ושיעורי מס):
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailedFormulas(!showDetailedFormulas)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetailedFormulas ? 'הסתר פירוט נוסחאות' : 'הצג פירוט נוסחאות'}</span>
              {showDetailedFormulas ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Info Grid for Model Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">ימי ושעות פעילות המעון:</span>
              <p className="font-bold text-slate-800">ראשון–חמישי: 7:30–16:00</p>
              <p className="font-bold text-slate-800">שישי: 7:20–12:00</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">מקדם שעות שבועיות לחודש:</span>
              <p className="font-bold text-slate-800 font-mono text-sm">4.33333</p>
              <span className="text-[11px] text-slate-500">נוסחה: (52 שבועות ÷ 12 חודשים)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">עלות מעביד משוערת:</span>
              <p className="font-bold text-teal-800 font-mono text-sm">{params.employerOverheadPercent}%</p>
              <span className="text-[11px] text-slate-500">הפרשות סוציאליות, פנסיה וביטוח לאומי</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">שכר שעתי והשתתפות נסיעות:</span>
              <p className="font-bold text-slate-800 font-mono text-sm">₪{wagePerHour} לשעה ברוטו</p>
              <span className="text-[11px] text-slate-500">נסיעות: מקס' ₪200/חודש (₪64 לעובדת ג')</span>
            </div>
          </div>

          {/* Interactive Sliders to adjust Model Parameters in real-time */}
          <div className="pt-2 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">סימולטור אינטראקטיבי – התאמת משתני המודל בזמן אמת:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EyeFriendlySlider
                label="מספר ילדים במעון:"
                sublabel="במודל: 16 ילדים"
                value={numChildren}
                onChange={(val) => updateParam('childrenCount', val)}
                min={1}
                max={30}
                suffix="ילדים"
                accentColor="accent-teal-600"
              />
              <EyeFriendlySlider
                label="שכר לימוד לילד (כולל מע''מ):"
                sublabel="במודל: ₪3,500 לחודש"
                value={tuition}
                onChange={(val) => updateParam('tuitionPerChild', val)}
                min={2000}
                max={5500}
                step={50}
                prefix="₪"
                accentColor="accent-teal-600"
              />
              <EyeFriendlySlider
                label="שיעור מע''מ (%):"
                sublabel="במודל: 18.0% (תקנות מס)"
                value={params.vatRatePercent}
                onChange={(val) => updateParam('vatRatePercent', val)}
                min={0}
                max={25}
                step={0.5}
                suffix="%"
                accentColor="accent-teal-600"
              />
              <EyeFriendlySlider
                label="שכר שעתי לבסיס עובדות הוראה/עזרה:"
                sublabel="במודל: ₪45.00 ברוטו לשעה"
                value={wagePerHour}
                onChange={(val) => updateParam('hourlyWage', val)}
                min={30}
                max={80}
                step={1}
                prefix="₪"
                accentColor="accent-sky-600"
              />
              <EyeFriendlySlider
                label="שיעור עלות מעביד משוערת (%):"
                sublabel="במודל: 17.0% משכר הברוטו"
                value={params.employerOverheadPercent}
                onChange={(val) => updateParam('employerOverheadPercent', val)}
                min={10}
                max={35}
                step={0.5}
                suffix="%"
                accentColor="accent-sky-600"
              />
              <EyeFriendlySlider
                label="הפרשה לבלת''מים (רזרבה %):"
                sublabel="במודל: 10.0% מההכנסה נטו"
                value={params.contingencyPercent}
                onChange={(val) => updateParam('contingencyPercent', val)}
                min={0}
                max={25}
                step={1}
                suffix="%"
                accentColor="accent-amber-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: מפתח הכנסות והפרדת מע"מ (Revenue & Tax Breakdown)
         ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'summary') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. מפתח הכנסות והפרדת מע"מ (Revenue & Tax Breakdown)
              </h3>
              <p className="text-xs text-slate-500">
                הפרדה מדויקת בין הכנסה ברוטו, חבות מע"מ (18%) והכנסה תפעולית נטו:
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-bold">סעיף</th>
                  <th className="py-3 px-3.5 font-bold font-mono">סכום חודשי (₪)</th>
                  <th className="py-3 px-3.5 font-bold">נוסחה / יחס חישובי</th>
                  <th className="py-3 px-3.5 font-bold font-mono">אחוז מההכנסה נטו</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3.5 font-bold text-slate-800 font-sans">הכנסה חודשית ברוטו (כולל מע"מ)</td>
                  <td className="py-3 px-3.5 text-base font-bold text-slate-900">₪{monthlyGrossIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">מספר ילדים ({numChildren}) × שכר לימוד (₪{tuition.toLocaleString()})</td>
                  <td className="py-3 px-3.5 text-slate-400 font-sans">—</td>
                </tr>
                <tr className="hover:bg-amber-50/40 transition bg-amber-50/20">
                  <td className="py-3 px-3.5 font-bold text-amber-900 font-sans">רכיב מע"מ ({params.vatRatePercent}%)</td>
                  <td className="py-3 px-3.5 text-base font-bold text-amber-700">₪{monthlyVatAmount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">הכנסה ברוטו - (הכנסה ברוטו ÷ 1.18)</td>
                  <td className="py-3 px-3.5 text-amber-800 font-bold">{vatPercentOfNet.toFixed(2)}% מתוך הנטו</td>
                </tr>
                <tr className="hover:bg-teal-50/50 transition bg-teal-50/30 border-t border-teal-200 font-sans">
                  <td className="py-3 px-3.5 font-black text-teal-950">הכנסה חודשית נטו (ללא מע"מ)</td>
                  <td className="py-3 px-3.5 text-base font-black text-teal-800 font-mono">₪{monthlyNetIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-teal-900 font-medium">הכנסה ברוטו ÷ 1.18 (בסיס התקציב)</td>
                  <td className="py-3 px-3.5 text-teal-800 font-black font-mono">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: פירוט עלויות כוח אדם (Labor Cost Calculations)
         ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'staff') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  3. פירוט עלויות כוח אדם (Labor Cost Calculations)
                </h3>
                <p className="text-xs text-slate-500">
                  טבלת שכר מפורטת ל-5 עובדות צוות: שעות, ברוטו, עלות מעסיק ({params.employerOverheadPercent}%) ונסיעות:
                </p>
              </div>
            </div>

            <div className="text-left text-xs bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
              <span className="text-slate-600">סה"כ שכר ומעסיק: </span>
              <span className="font-bold font-mono text-sky-800 text-sm">₪{totalLaborCost.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Formulas summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">נוסחאות חישוב לקראת עלות כוללת:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-600 font-mono">
              <div>• שעות חודשיות = שעות שבועיות × 4.33333</div>
              <div>• ברוטו שעתי = שעות חודשיות × ₪{wagePerHour}</div>
              <div>• עלות מעסיק = ברוטו חודשי × {params.employerOverheadPercent}%</div>
              <div>• עלות כוללת = ברוטו + עלות מעסיק + נסיעות</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 font-bold">תפקיד / עובד</th>
                  <th className="py-3 px-3 font-bold">ימי עבודה</th>
                  <th className="py-3 px-3 font-bold font-mono">שעות שבועיות</th>
                  <th className="py-3 px-3 font-bold font-mono">שעות חודשיות</th>
                  <th className="py-3 px-3 font-bold font-mono">ברוטו חודשי (₪)</th>
                  <th className="py-3 px-3 font-bold font-mono">עלות מעסיק {params.employerOverheadPercent}% (₪)</th>
                  <th className="py-3 px-3 font-bold font-mono">נסיעות (₪)</th>
                  <th className="py-3 px-3 font-bold font-mono text-sky-900 bg-sky-50/60">סה"כ עלות מעסיק (₪)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* 1. מנהלת */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">מנהלת</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">לפי סידור המעון</td>
                  <td className="py-3 px-3 text-slate-400 font-sans">—</td>
                  <td className="py-3 px-3 text-slate-400 font-sans">—</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₪{staff1_gross.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff1_employer.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff1_travel.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 font-bold text-sky-900 bg-sky-50/40">₪{staff1_total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* 2. מטפלת מוסמכת */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">מטפלת מוסמכת</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">א'–ו' (שלישי 1 ל-3 בלימודים)</td>
                  <td className="py-3 px-3 text-slate-400 font-sans">—</td>
                  <td className="py-3 px-3 text-slate-400 font-sans">—</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₪{staff2_gross.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff2_employer.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff2_travel.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 font-bold text-sky-900 bg-sky-50/40">₪{staff2_total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* 3. עובדת א' */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">עובדת א'</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">ראשון, רביעי</td>
                  <td className="py-3 px-3 text-slate-700">{staff3_weeklyHours.toFixed(1)}</td>
                  <td className="py-3 px-3 text-slate-700">{staff3_monthlyHours.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₪{staff3_gross.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff3_employer.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff3_travel.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 font-bold text-sky-900 bg-sky-50/40">₪{staff3_total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* 4. עובדת ב' */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">עובדת ב'</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">ראשון, חמישי, שישי</td>
                  <td className="py-3 px-3 text-slate-700">{staff4_weeklyHours.toFixed(1)}</td>
                  <td className="py-3 px-3 text-slate-700">{staff4_monthlyHours.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₪{staff4_gross.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff4_employer.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff4_travel.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 font-bold text-sky-900 bg-sky-50/40">₪{staff4_total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* 5. עובדת ג' */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">עובדת ג'</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">שלישי בלבד</td>
                  <td className="py-3 px-3 text-slate-700">{staff5_weeklyHours.toFixed(1)}</td>
                  <td className="py-3 px-3 text-slate-700">{staff5_monthlyHours.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">₪{staff5_gross.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff5_employer.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-slate-700">₪{staff5_travel.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 font-bold text-sky-900 bg-sky-50/40">₪{staff5_total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* TOTAL STAFF ROW */}
                <tr className="bg-sky-50/80 font-bold border-t-2 border-sky-300">
                  <td className="py-3.5 px-3 font-black text-sky-950 font-sans">סה"כ כוח אדם</td>
                  <td className="py-3.5 px-3 text-slate-600 font-sans">—</td>
                  <td className="py-3.5 px-3 text-sky-900">{totalWeeklyHourlyHours.toFixed(1)} ש"ש</td>
                  <td className="py-3.5 px-3 text-sky-900">{totalMonthlyHourlyHours.toFixed(2)} שעות</td>
                  <td className="py-3.5 px-3 text-sky-900">₪{totalStaffGross.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-3 text-sky-900">₪{totalStaffEmployer.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-3 text-sky-900">₪{totalStaffTravel.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-3 text-base font-black text-sky-950 bg-sky-100/70">₪{totalLaborCost.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: פירוט הוצאות תפעול שוטפות (Operating Expenses)
         ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'opex') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  4. פירוט הוצאות תפעול שוטפות (Operating Expenses)
                </h3>
                <p className="text-xs text-slate-500">
                  חלוקה מפורטת של 7 סעיפי התפעול החודשיים ואחוזיהם מההכנסה נטו:
                </p>
              </div>
            </div>

            <div className="text-left text-xs bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <span className="text-slate-600">סה"כ הוצאות תפעול: </span>
              <span className="font-bold font-mono text-teal-800 text-sm">₪{totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-bold">סעיף הוצאה</th>
                  <th className="py-3 px-3.5 font-bold font-mono">סכום חודשי (₪)</th>
                  <th className="py-3 px-3.5 font-bold">פירוט / הערות</th>
                  <th className="py-3 px-3.5 font-bold font-mono">אחוז מההכנסה נטו</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {opexItems.map((item, idx) => {
                  const percentOfNet = monthlyNetIncome > 0 ? (item.amount / monthlyNetIncome) * 100 : 0;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="py-3 px-3.5 font-bold text-slate-900 font-sans">{item.name}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-800">₪{item.amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3.5 text-slate-600 font-sans">{item.desc}</td>
                      <td className="py-3 px-3.5 text-teal-800 font-medium">{percentOfNet.toFixed(2)}%</td>
                    </tr>
                  );
                })}

                {/* TOTAL OPEX ROW */}
                <tr className="bg-teal-50/80 font-bold border-t-2 border-teal-300">
                  <td className="py-3.5 px-3.5 font-black text-teal-950 font-sans">סה"כ הוצאות תפעול</td>
                  <td className="py-3.5 px-3.5 text-base font-black text-teal-900">₪{totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3.5 px-3.5 text-teal-900 font-sans">סיכום הוצאות תפעוליות שוטפות</td>
                  <td className="py-3.5 px-3.5 text-base font-black text-teal-950">{opexRatioPercent.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 5: סיכום התקציב החודשי והיחסים הפיננסיים (Financial Overview)
         ========================================================================= */}
      {(activeSectionTab === 'all' || activeSectionTab === 'summary') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  5. סיכום התקציב החודשי והיחסים הפיננסיים (Financial Overview & Key Ratios)
                </h3>
                <p className="text-xs text-slate-500">
                  מאזן חודשי כולל: הכנסות, כוח אדם, תפעול, בלת"ם ויתרת רווח:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
                יתרה לילד: ₪{balancePerChild.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-bold">סעיף בתקציב</th>
                  <th className="py-3 px-3.5 font-bold font-mono">סכום חודשי (₪)</th>
                  <th className="py-3 px-3.5 font-bold">נוסחה / חישוב</th>
                  <th className="py-3 px-3.5 font-bold font-mono">אחוז מההכנסה נטו</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-teal-50/30 transition bg-teal-50/20">
                  <td className="py-3 px-3.5 font-bold text-teal-950 font-sans">הכנסה נטו (ללא מע"מ)</td>
                  <td className="py-3 px-3.5 text-base font-black text-teal-800">₪{monthlyNetIncome.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">בסיס התקציב התפעולי</td>
                  <td className="py-3 px-3.5 font-bold text-teal-800">100.00%</td>
                </tr>

                <tr className="hover:bg-sky-50/30 transition">
                  <td className="py-3 px-3.5 font-bold text-sky-900 font-sans">עלות כוח אדם</td>
                  <td className="py-3 px-3.5 text-base font-bold text-sky-700">₪{totalLaborCost.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">סך עלויות השכר והמעסיק (5 עובדות)</td>
                  <td className="py-3 px-3.5 font-bold text-sky-700">{laborRatioPercent.toFixed(2)}%</td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3.5 font-bold text-slate-800 font-sans">הוצאות תפעול</td>
                  <td className="py-3 px-3.5 text-base font-bold text-slate-700">₪{totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">סך הוצאות תפעוליות שוטפות</td>
                  <td className="py-3 px-3.5 font-bold text-slate-700">{opexRatioPercent.toFixed(2)}%</td>
                </tr>

                <tr className="hover:bg-amber-50/30 transition">
                  <td className="py-3 px-3.5 font-bold text-amber-900 font-sans">הפרשה לבלת״מים ({params.contingencyPercent}%)</td>
                  <td className="py-3 px-3.5 text-base font-bold text-amber-700">₪{contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">₪{monthlyNetIncome.toLocaleString('he-IL', { maximumFractionDigits: 0 })} × {params.contingencyPercent}%</td>
                  <td className="py-3 px-3.5 font-bold text-amber-700">{contingencyRatioPercent.toFixed(2)}%</td>
                </tr>

                <tr className="hover:bg-rose-50/30 transition bg-rose-50/20 border-t border-rose-200">
                  <td className="py-3 px-3.5 font-black text-rose-900 font-sans">סה״כ הוצאות והפרשות</td>
                  <td className="py-3 px-3.5 text-base font-black text-rose-700">₪{totalExpensesAndContingency.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">כוח אדם + תפעול + בלת״מים</td>
                  <td className="py-3 px-3.5 font-black text-rose-700">{totalExpensesRatioPercent.toFixed(2)}%</td>
                </tr>

                <tr className="hover:bg-emerald-50/50 transition bg-emerald-50/80 border-t-2 border-emerald-500">
                  <td className="py-3.5 px-3.5 font-black text-emerald-950 text-sm font-sans">יתרה חודשית משוערת (רווח)</td>
                  <td className={`py-3.5 px-3.5 text-lg font-black ${estimatedMonthlyBalance >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
                    ₪{estimatedMonthlyBalance.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3.5 text-emerald-900 font-sans font-medium">הכנסה נטו - סה"כ הוצאות והפרשות</td>
                  <td className="py-3.5 px-3.5 text-base font-black text-emerald-900">{netProfitMarginPercent.toFixed(2)}%</td>
                </tr>

                <tr className="hover:bg-emerald-50/30 transition bg-emerald-50/30">
                  <td className="py-3 px-3.5 font-bold text-emerald-900 font-sans">יתרה ממוצעת לכל ילד</td>
                  <td className="py-3 px-3.5 text-base font-black text-emerald-900">₪{balancePerChild.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3.5 text-slate-600 font-sans">יתרה חודשית חלקי מספר ילדים ({numChildren})</td>
                  <td className="py-3 px-3.5 text-slate-400 font-sans">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes and Disclaimers */}
          <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">הערת חישוב ותקנות מס: </span>
              <span>
                "ההכנסה חושבה בהנחה ששכר הלימוד 3,500 ₪ כולל מע״מ ושיעור המע״מ 18%. היתרה אינה רווח נקי חשבונאי סופי: לא נכללו שכירות, ביטוחים, ניקיון, עובדות חולות, הבראה. עלות המעביד היא אומדן של {params.employerOverheadPercent}%."
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VISUAL DISTRIBUTION BAR CHART */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">פילוח ההכנסה נטו (₪{Math.round(monthlyNetIncome).toLocaleString()}) לפי סעיפי המודל</h3>
          </div>
          <span className="text-[11px] font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">100% מהמחזור הנטו</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#334155' }} width={145} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any, name: any, item: any) => [`₪${Number(val).toLocaleString()} (${item.payload.percent})`, 'סכום ואחוז']}
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
