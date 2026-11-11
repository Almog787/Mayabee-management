import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  GraduationCap,
  Sparkles,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Share2,
  FileSpreadsheet,
  RotateCcw,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Utensils,
  Zap,
  Building,
  Briefcase,
  Layers,
  Wrench,
  BookOpen,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Printer,
  HeartHandshake,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';
import { DaycareSettings } from '../../types';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (settings: Partial<DaycareSettings>) => void;
}

// 7 Recognized Home Apartment Daycare Operating Expenses
interface OpexItem {
  id: string;
  name: string;
  amount: number;
  desc: string;
  recognizedPercent: number; // e.g. 100% for food, 25-30% for home utilities
  category: 'direct' | 'home-shared' | 'admin';
}

const DEFAULT_OPEX_ITEMS: OpexItem[] = [
  {
    id: 'food',
    name: 'הזנה ביתית טרייה',
    amount: 1250,
    desc: 'ארוחות בוקר, צהריים מבושלות, פירות, ירקות ונשנושים איכותיים (5 ילדים)',
    recognizedPercent: 100,
    category: 'direct',
  },
  {
    id: 'utilities',
    name: 'חשמל, מים וגז (חלק יחסי בדירה)',
    amount: 350,
    desc: 'הוצאות תשתית מוכרות בדירת המגורים (מזגן, חימום בחורף, שטיפות ידיים, בישול)',
    recognizedPercent: 25,
    category: 'home-shared',
  },
  {
    id: 'insurance',
    name: 'ביטוח אחריות מקצועית וצד ג׳',
    amount: 250,
    desc: 'פוליסת ביטוח ייעודית למשפחתון ביתי לכיסוי מלא לפעוטות ולדירה',
    recognizedPercent: 100,
    category: 'admin',
  },
  {
    id: 'accountant',
    name: 'רואה חשבון / דוח שנתי לעצמאי',
    amount: 350,
    desc: 'הנהלת חשבונות חודשית, דוח שנתי לרשות המסים וביטוח לאומי לעצמאית',
    recognizedPercent: 100,
    category: 'admin',
  },
  {
    id: 'arnona',
    name: 'ארנונה מוניציפלית (חלק יחסי בדירה)',
    amount: 200,
    desc: 'הכרה במס בחלק היחסי של חדר הפעילות בדירת המגורים (כ-25% מהדירה)',
    recognizedPercent: 25,
    category: 'home-shared',
  },
  {
    id: 'consumables',
    name: 'חומרי יצירה, היגיינה ומתכלה',
    amount: 250,
    desc: 'דפי ציור, צבעי ידיים, מגבונים, סבונים, חיתולים ומוצרי ניקוי ייעודיים',
    recognizedPercent: 100,
    category: 'direct',
  },
  {
    id: 'equipment',
    name: 'פחת ציוד, ספרות חינוכית ומשחקים',
    amount: 150,
    desc: 'צעצועי התפתחות, ספרים לגיל הרך, שולחנות וכיסאות פעוטות',
    recognizedPercent: 100,
    category: 'direct',
  },
];

// Baseline values for the home apartment daycare
const DEFAULT_MODEL_PARAMS = {
  childrenCount: 5, // Legal cap for single-caregiver home daycare
  monthlyTuition: 3500, // Monthly fee per child incl. VAT
  vatRatePercent: 18.0, // Israeli standard VAT
  isVatExempt: false, // עוסק מורשה (true = עוסק פטור)
  contingencyPercent: 10.0, // Reserve for vacations, holidays & unexpected home repairs
  backupStaffFund: 500, // Monthly substitute caregiver backup fund (illness/vacation)
};

const STORAGE_KEY_PARAMS = 'mayabee_home_apartment_params_v3';
const STORAGE_KEY_OPEX = 'mayabee_home_apartment_opex_v3';

export const QuickMasterPlannerModule: React.FC<QuickMasterPlannerProps> = ({ settings }) => {
  const [params, setParams] = useState<typeof DEFAULT_MODEL_PARAMS>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARAMS);
      if (saved) return { ...DEFAULT_MODEL_PARAMS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading params', e);
    }
    return DEFAULT_MODEL_PARAMS;
  });

  const [opexList, setOpexList] = useState<OpexItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OPEX);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading opex list', e);
    }
    return DEFAULT_OPEX_ITEMS;
  });

  const [newOpexName, setNewOpexName] = useState('');
  const [newOpexAmount, setNewOpexAmount] = useState<number>(100);
  const [isAddingOpex, setIsAddingOpex] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(params));
    } catch (e) {
      console.error('Error saving params', e);
    }
  }, [params]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OPEX, JSON.stringify(opexList));
    } catch (e) {
      console.error('Error saving opex list', e);
    }
  }, [opexList]);

  // Target Month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [monthName, year] = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return [date.toLocaleDateString('he-IL', { month: 'long' }), y];
  }, [selectedMonth]);
  const monthLabel = `${monthName} ${year}`;

  // =========================================================================
  // CORE FINANCIAL CALCULATIONS
  // =========================================================================
  const numChildren = Number(params.childrenCount) || 0;
  const tuition = Number(params.monthlyTuition) || 0;

  // 1. Revenue
  const monthlyGrossIncome = numChildren * tuition; // 5 × 3,500 = 17,500 ₪
  const effectiveVatDivisor = params.isVatExempt ? 1.0 : (1 + (params.vatRatePercent || 18.0) / 100);
  const monthlyNetIncome = params.isVatExempt ? monthlyGrossIncome : (monthlyGrossIncome / effectiveVatDivisor); // 14,830.51 ₪
  const monthlyVatAmount = params.isVatExempt ? 0 : (monthlyGrossIncome - monthlyNetIncome); // 2,669.49 ₪

  // 2. Recognized Operating Expenses of the Home Apartment
  const totalOperatingExpenses = useMemo(() => {
    return opexList.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [opexList]); // 2,800 ₪ default

  // 3. Backup & Reserves
  const backupFundCost = Number(params.backupStaffFund) || 0; // 500 ₪
  const contingencyAmount = (monthlyNetIncome * (Number(params.contingencyPercent) || 0)) / 100; // 1,483.05 ₪
  const totalDeductions = totalOperatingExpenses + backupFundCost + contingencyAmount; // 4,783.05 ₪

  // 4. Net Take-Home Salary for the Caregiver (Owner with B.Ed. in Education)
  const soleCaregiverTakeHomeSalary = Math.max(0, monthlyNetIncome - totalDeductions); // 10,047.46 ₪
  const profitMarginPercent = monthlyNetIncome > 0 ? (soleCaregiverTakeHomeSalary / monthlyNetIncome) * 100 : 0; // 67.75%
  const profitPerChild = numChildren > 0 ? (soleCaregiverTakeHomeSalary / numChildren) : 0; // 2,009.49 ₪

  // Ratios
  const opexRatio = monthlyNetIncome > 0 ? (totalOperatingExpenses / monthlyNetIncome) * 100 : 0;
  const backupRatio = monthlyNetIncome > 0 ? (backupFundCost / monthlyNetIncome) * 100 : 0;
  const contingencyRatio = monthlyNetIncome > 0 ? (contingencyAmount / monthlyNetIncome) * 100 : 0;

  // Sensitivity / Scenario Matrix (1 to 6 children)
  const scenarioMatrix = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((count) => {
      const gross = count * tuition;
      const net = params.isVatExempt ? gross : gross / effectiveVatDivisor;
      const vat = gross - net;
      const contingency = (net * (params.contingencyPercent || 10)) / 100;
      const totalExp = totalOperatingExpenses + backupFundCost + contingency;
      const caregiverNet = Math.max(0, net - totalExp);
      const isCurrent = count === numChildren;
      return {
        count,
        gross,
        net,
        vat,
        totalExp,
        caregiverNet,
        perChild: count > 0 ? caregiverNet / count : 0,
        margin: net > 0 ? (caregiverNet / net) * 100 : 0,
        isCurrent,
        isCapacityCap: count === 5,
        isOverCapacity: count > 5,
      };
    });
  }, [tuition, effectiveVatDivisor, params.isVatExempt, params.contingencyPercent, totalOperatingExpenses, backupFundCost, numChildren]);

  // Chart data
  const chartData = [
    { name: 'שכר נטו למטפלת (B.Ed)', value: Math.round(soleCaregiverTakeHomeSalary), color: '#0d9488' },
    { name: 'הוצאות תפעול דירה מוכרות', value: Math.round(totalOperatingExpenses), color: '#0284c7' },
    { name: 'רזרבת חופשה שנתית ובלת"ם', value: Math.round(contingencyAmount), color: '#d97706' },
    { name: 'קרן גיבוי / ממלאת מקום', value: Math.round(backupFundCost), color: '#8b5cf6' },
  ];

  // Reset to defaults
  const handleResetToDefaults = () => {
    setParams({ ...DEFAULT_MODEL_PARAMS });
    setOpexList([...DEFAULT_OPEX_ITEMS]);
  };

  // Add new expense
  const handleAddOpex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpexName.trim() || newOpexAmount <= 0) return;
    const newItem: OpexItem = {
      id: `custom_${Date.now()}`,
      name: newOpexName.trim(),
      amount: newOpexAmount,
      desc: 'הוצאה שוטפת נוספת בדירה',
      recognizedPercent: 100,
      category: 'direct',
    };
    setOpexList((prev) => [...prev, newItem]);
    setNewOpexName('');
    setNewOpexAmount(100);
    setIsAddingOpex(false);
  };

  const handleDeleteOpex = (id: string) => {
    setOpexList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateOpexAmount = (id: string, amount: number) => {
    setOpexList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: Math.max(0, amount) } : item))
    );
  };

  // WhatsApp share for personal/family use
  const handleShareWhatsApp = () => {
    const text = `🏡 *תקציב ומאזן משפחתון ביתי (אדם יחיד - בעלת תואר בחינוך)*
📍 *הדירה שלנו* | 📅 *חודש:* ${monthLabel}

📊 *הכנסות משכ"ל:*
• מספר ילדים בדירה: ${numChildren} (תקן חוקי: עד 5)
• שכר לימוד לילד: ₪${tuition.toLocaleString()} ${params.isVatExempt ? '(עוסק פטור)' : '(כולל מע"מ)'}
• סך הכנסה ברוטו: ₪${monthlyGrossIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
${!params.isVatExempt ? `• מע"מ (18%): ₪${monthlyVatAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}\n• הכנסה נטו (ללא מע"מ): ₪${monthlyNetIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}` : ''}

📦 *הוצאות תפעול הדירה והפרשות:*
• הוצאות מוכרות בדירה (7 סעיפים): ₪${totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• קרן גיבוי לממלאת מקום: ₪${backupFundCost.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• רזרבת חופשה שנתית ובלת"ם (10%): ₪${contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
• סה"כ ניכויים: ₪${totalDeductions.toLocaleString('he-IL', { minimumFractionDigits: 2 })}

💰 *שכר נטו נשאר ביד למטפלת (B.Ed.):*
• *₪${soleCaregiverTakeHomeSalary.toLocaleString('he-IL', { minimumFractionDigits: 2 })}* לחודש (${profitMarginPercent.toFixed(1)}% מהנטו)
• רווח נקי לכל ילד: ₪${profitPerChild.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Excel / Google Sheets export
  const handleExportExcel = () => {
    const dummyChildren = Array.from({ length: numChildren }, (_, i) => ({
      id: `child-${i + 1}`,
      idNumber: `00000000${i + 1}`,
      firstName: `ילד/ה ${i + 1}`,
      lastName: '',
      birthDate: '2024-03-01',
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

    const tableExpenses = [
      ...opexList.map((item, idx) => ({
        id: `opex-${idx + 1}`,
        categoryName: item.name,
        description: item.desc,
        expectedAmount: item.amount,
        isConfirmed: true,
      })),
      {
        id: 'backup-fund',
        categoryName: 'קרן גיבוי / ממלאת מקום',
        description: 'תקציב ימי מחלה/חופשה למטפלת',
        expectedAmount: backupFundCost,
        isConfirmed: true,
      },
      {
        id: 'contingency',
        categoryName: 'רזרבת חופשה ובלת״ם (10%)',
        description: 'חיסכון חודשי לחופשות שנתיות ואירועים חריגים',
        expectedAmount: contingencyAmount,
        isConfirmed: true,
      },
    ];

    const staffList = [
      {
        id: 'staff-sole-caregiver',
        fullName: 'מטפלת ומפעילה (B.Ed. בחינוך)',
        idNumber: '000000001',
        role: 'DIRECTOR' as const,
        phone: '052-0000000',
        email: '',
        hourlyRate: 0,
        standardDailyHours: 8.5,
        firstAidCertExpiryDate: '2027-01-01',
        policeClearanceDate: '2026-01-01',
        policeClearanceApproved: true,
        status: 'ACTIVE' as const,
        updatedAt: Date.now(),
        notes: `משפחתון ביתי פרטי בדירת מגורים | שכר נטו נשאר ביד: ₪${soleCaregiverTakeHomeSalary.toFixed(2)}`,
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
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12 print:p-0 print:space-y-4">
      {/* 1. TOP STATUS BAR & TARGET MONTH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center shrink-0 text-amber-800">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                מחשבון מאזן ותקציב משפחתון ביתי
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>מטפלת בעלת תואר בחינוך</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              העסק פועל בדירת המגורים שלנו · עסק של אדם יחיד ללא עובדים שכירים · תקן מקסימלי של 5 ילדים
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="ייצוא קובץ Excel / Google Sheets מפורט"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ייצוא לשייטס</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="שליחת סיכום תקציב לווטסאפ"
          >
            <Share2 className="w-4 h-4" />
            <span>שיתוף בוואטסאפ</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="הדפסת דוח מאזן"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>הדפסה</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="איפוס נתונים לברירת מחדל של המשפחתון"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 4 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Take-Home Salary */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 tracking-wide">
              שכר נטו נשאר ביד למטפלת 💰
            </span>
            <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-teal-950 font-mono tracking-tight">
              ₪{soleCaregiverTakeHomeSalary.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-teal-700">
              <span className="font-semibold">{profitMarginPercent.toFixed(1)}%</span>
              <span>מההכנסה נטו</span>
              <span>•</span>
              <span className="font-semibold font-mono">₪{profitPerChild.toFixed(0)}</span>
              <span>לילד</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-teal-200/60 text-[11px] text-teal-800 flex items-center gap-1 font-medium">
            <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
            <span>גמול השכלה: בעלת תואר ראשון בחינוך (B.Ed.)</span>
          </div>
        </div>

        {/* KPI 2: Gross & Net Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              הכנסה חודשית משכ״ל ({numChildren} פעוטות)
            </span>
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₪{monthlyGrossIncome.toLocaleString('he-IL', { minimumFractionDigits: 0 })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
              <span>{params.isVatExempt ? 'עוסק פטור (ללא מע"מ)' : `מע״מ (18%): ₪${monthlyVatAmount.toFixed(0)}`}</span>
              <span className="font-semibold text-slate-700">נטו: ₪{monthlyNetIncome.toFixed(0)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>שכ"ל לילד: ₪{tuition.toLocaleString()}</span>
            <span className="text-teal-700 font-medium">{numChildren}/5 תפוסה מלאה</span>
          </div>
        </div>

        {/* KPI 3: Recognized Home Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              הוצאות תפעול מוכרות בדירה
            </span>
            <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₪{totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span>7 סעיפי הוצאה מוכרים</span>
              <span className="font-semibold text-sky-700">{opexRatio.toFixed(1)}% מהנטו</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>כולל אוכל טרי, חשמל/מים ורו"ח</span>
            <span className="text-slate-700 font-mono">₪{(totalOperatingExpenses / numChildren).toFixed(0)} לילד</span>
          </div>
        </div>

        {/* KPI 4: Reserves & Backup */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              רזרבת חופשה וקרן גיבוי
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₪{(contingencyAmount + backupFundCost).toLocaleString('he-IL', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span>גיבוי מחלה: ₪{backupFundCost}</span>
              <span className="font-semibold text-amber-700">בלת"ם {params.contingencyPercent}%: ₪{contingencyAmount.toFixed(0)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>ביטחון תזרימי למטפלת בדירה</span>
            <span className="text-emerald-700 font-medium">מוגן לחופשות</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN INTERACTIVE CONTROLS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Primary Column: Sliders and Core Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  הגדרות ופרמטרים של המשפחתון בדירה
                </h3>
                <p className="text-xs text-slate-500">שנו את הסליידרים וצפו בהשפעה المיידית על השכר שנשאר ביד</p>
              </div>
            </div>
          </div>

          {/* Slider 1: Number of children in the apartment */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>מספר פעוטות בדירה (עד 5 לפי חוק הפיקוח)</span>
                {numChildren === 5 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    תפוסה מלאה מומלצת ✓
                  </span>
                )}
                {numChildren > 5 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                    מעל התקן ליחיד!
                  </span>
                )}
              </label>
              <span className="text-lg font-black text-slate-900 font-mono bg-white px-3 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {numChildren} ילדים
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={numChildren}
              onChange={(e) => setParams((p) => ({ ...p, childrenCount: Number(e.target.value) }))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>1 ילד</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span className="text-teal-700 font-bold">5 (תקן דירה)</span>
              <span>6 (חריג)</span>
            </div>
          </div>

          {/* Slider 2: Tuition per child */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                שכר לימוד חודשי לילד {params.isVatExempt ? '(ללא מע"מ)' : '(כולל מע"מ)'}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-900 font-mono bg-white px-3 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  ₪{tuition.toLocaleString()}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={2500}
              max={5500}
              step={50}
              value={tuition}
              onChange={(e) => setParams((p) => ({ ...p, monthlyTuition: Number(e.target.value) }))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>₪2,500</span>
              <span>₪3,000</span>
              <span className="text-teal-700 font-bold">₪3,500 (בסיס רותם ומאיה)</span>
              <span>₪4,200</span>
              <span>₪5,000+</span>
            </div>
          </div>

          {/* Tax Status & VAT Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">סוג עוסק ברשות המסים</span>
                <span className="text-[11px] text-slate-500">
                  {params.isVatExempt ? 'עוסק פטור' : 'עוסק מורשה (18% מע"מ)'}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setParams((p) => ({ ...p, isVatExempt: false }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    !params.isVatExempt
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  עוסק מורשה (18%)
                </button>
                <button
                  type="button"
                  onClick={() => setParams((p) => ({ ...p, isVatExempt: true }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    params.isVatExempt
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  עוסק פטור (0% מע"מ)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                {params.isVatExempt
                  ? 'מתאים למחזור שנתי מתחת לכ-120,000 ₪ (חוסך 18% מע"מ).'
                  : 'תקציב רותם ומאיה מחושב כעוסק מורשה לפי 18% מע"מ.'}
              </p>
            </div>

            {/* Contingency Reserve & Backup Fund */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">קרן גיבוי / ממלאת מקום</span>
                <span className="text-xs font-mono font-bold text-slate-800">₪{backupFundCost}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1500}
                step={50}
                value={backupFundCost}
                onChange={(e) => setParams((p) => ({ ...p, backupStaffFund: Number(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>לימי מחלה, סידורים או שעות חופש</span>
                <span className="font-mono">{backupRatio.toFixed(1)}% מהנטו</span>
              </div>
            </div>
          </div>

          {/* Contingency Slider */}
          <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>רזרבת חופשה שנתית ובלת״מים ({params.contingencyPercent}% מהנטו)</span>
                <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  לכיסוי חודש אוגוסט / חגים
                </span>
              </label>
              <span className="text-sm font-black text-amber-950 font-mono">
                ₪{contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={params.contingencyPercent}
              onChange={(e) => setParams((p) => ({ ...p, contingencyPercent: Number(e.target.value) }))}
              className="w-full h-2.5 bg-amber-200/80 rounded-lg appearance-none cursor-pointer accent-amber-700"
            />
            <div className="flex justify-between text-[11px] text-amber-800/80 font-mono">
              <span>0% (ללא חיסכון)</span>
              <span>5%</span>
              <span className="font-bold text-amber-900">10% (ברירת מחדל מומלצת)</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>
        </div>

        {/* Right / Secondary Column: Visual Chart & Caregiver Income Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    לאן הולך כל שקל מההכנסה נטו?
                  </h3>
                  <p className="text-xs text-slate-500">התפלגות תזרימית מדויקת בדירה</p>
                </div>
              </div>
              <PieChartIcon className="w-4 h-4 text-teal-600" />
            </div>

            {/* Recharts Pie Chart */}
            <div className="h-48 w-full mt-2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₪${Number(val || 0).toLocaleString()}`, 'סכום']}
                    contentStyle={{
                      direction: 'rtl',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 font-medium">רווח נטו</span>
                <span className="text-sm font-black text-teal-800 font-mono">
                  {profitMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Breakdown Legend */}
            <div className="space-y-2 text-xs pt-1">
              {chartData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">₪{item.value.toLocaleString()}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({monthlyNetIncome > 0 ? ((item.value / monthlyNetIncome) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Trust & Value Card */}
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-emerald-950 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>יתרון חינוכי מובהק: תואר ראשון בחינוך</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              הורים מעריכים ומעדיפים לשלם שכר לימוד מלא (3,500 ₪) בידיעה שהמטפלת בעלת תואר אקדמי בחינוך (B.Ed.), בסביבה ביתית אינטימית ובטוחה של 5 פעוטות בלבד.
            </p>
          </div>
        </div>
      </div>

      {/* 4. RECOGNIZED HOME EXPENSES OF THE APARTMENT (7 DETAILED ITEMS + CUSTOM ADDITION) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                פירוט הוצאות הדירה והמשפחתון המוכרות במס
              </h3>
              <p className="text-xs text-slate-500">
                הוצאות שוטפות המופחתות מההכנסה ומקטינות את חבות מס ההכנסה וביטוח לאומי
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs bg-sky-50 text-sky-800 border border-sky-200 font-mono font-bold px-3 py-1 rounded-xl">
              סה״כ הוצאות: ₪{totalOperatingExpenses.toLocaleString()} לחודש
            </div>
            {!isAddingOpex && (
              <button
                type="button"
                onClick={() => setIsAddingOpex(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף סעיף</span>
              </button>
            )}
          </div>
        </div>

        {/* Add new opex row */}
        {isAddingOpex && (
          <form
            onSubmit={handleAddOpex}
            className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3 animate-fadeIn"
          >
            <input
              type="text"
              placeholder="שם ההוצאה (למשל: אינטרנט ביתי / חומרי ניקוי)"
              value={newOpexName}
              onChange={(e) => setNewOpexName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">סכום חודשי:</span>
              <input
                type="number"
                min={1}
                value={newOpexAmount}
                onChange={(e) => setNewOpexAmount(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <span className="text-xs text-slate-500">₪</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                הוספה
              </button>
              <button
                type="button"
                onClick={() => setIsAddingOpex(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </form>
        )}

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                <th className="py-2.5 px-3">סעיף הוצאה בדירה</th>
                <th className="py-2.5 px-3">פירוט והכרה בדירת מגורים</th>
                <th className="py-2.5 px-3 text-center">הכרה מוערכת</th>
                <th className="py-2.5 px-3 text-center">סכום חודשי (₪)</th>
                <th className="py-2.5 px-3 text-center">% מהנטו</th>
                <th className="py-2.5 px-3 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opexList.map((item) => {
                const itemPercentOfNet = monthlyNetIncome > 0 ? (item.amount / monthlyNetIncome) * 100 : 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                      {item.id === 'food' && <Utensils className="w-3.5 h-3.5 text-amber-600" />}
                      {item.id === 'utilities' && <Zap className="w-3.5 h-3.5 text-sky-600" />}
                      {item.id === 'insurance' && <Shield className="w-3.5 h-3.5 text-emerald-600" />}
                      {item.id === 'accountant' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                      {item.id === 'arnona' && <Building className="w-3.5 h-3.5 text-purple-600" />}
                      {item.id === 'consumables' && <Layers className="w-3.5 h-3.5 text-rose-600" />}
                      {item.id === 'equipment' && <BookOpen className="w-3.5 h-3.5 text-teal-600" />}
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-md">{item.desc}</td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-600">
                      {item.recognizedPercent}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                        <span className="text-slate-400">₪</span>
                        <input
                          type="number"
                          min={0}
                          value={item.amount}
                          onChange={(e) => handleUpdateOpexAmount(item.id, Number(e.target.value))}
                          className="w-16 font-bold text-slate-900 text-center focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {itemPercentOfNet.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteOpex(item.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="מחיקת סעיף הוצאה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3 px-3">סה״כ הוצאות שוטפות בדירה</td>
                <td className="py-3 px-3 text-slate-600 font-normal">
                  כלל ההוצאות מוכרות להפחתת מס הכנסה וביטוח לאומי לעצמאית
                </td>
                <td className="py-3 px-3 text-center font-mono">—</td>
                <td className="py-3 px-3 text-center font-mono text-sm text-sky-800">
                  ₪{totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-center font-mono text-sky-800">
                  {opexRatio.toFixed(1)}%
                </td>
                <td className="py-3 px-3 text-center">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. CAPACITY SCENARIOS & SENSITIVITY MATRIX (1 TO 6 CHILDREN) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                מטריצת תרחישי תפוסה (1 עד 6 פעוטות בדירה)
              </h3>
              <p className="text-xs text-slate-500">
                כמה שכר נטו נשאר ביד למטפלת בכל מצב תפוסה בדירה לפי שכר הלימוד הנוכחי (₪{tuition.toLocaleString()})
              </p>
            </div>
          </div>
          <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-semibold">
            השורה המודגשת היא המצב הנוכחי שהזנתם
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/80">
                <th className="py-2.5 px-3">תרחיש תפוסה</th>
                <th className="py-2.5 px-3 text-center">הכנסה ברוטו (₪)</th>
                <th className="py-2.5 px-3 text-center">הכנסה נטו (₪)</th>
                <th className="py-2.5 px-3 text-center">סך הוצאות + רזרבה (₪)</th>
                <th className="py-2.5 px-3 text-center">שכר נטו למטפלת ביד (₪)</th>
                <th className="py-2.5 px-3 text-center">שכר נקי ממוצע לילד</th>
                <th className="py-2.5 px-3 text-center">שולי רווח מהנטו</th>
                <th className="py-2.5 px-3 text-center">בחירת תרחיש</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {scenarioMatrix.map((sc) => (
                <tr
                  key={sc.count}
                  className={`transition-colors ${
                    sc.isCurrent
                      ? 'bg-teal-50/80 font-bold border-r-4 border-r-teal-600 text-teal-950'
                      : 'hover:bg-slate-50/60 text-slate-700'
                  }`}
                >
                  <td className="py-3 px-3 font-sans font-bold flex items-center gap-2">
                    <span>{sc.count} פעוטות</span>
                    {sc.isCapacityCap && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        תקן מותר ✓
                      </span>
                    )}
                    {sc.isOverCapacity && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
                        חריג בדירה
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">₪{sc.gross.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center">₪{sc.net.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</td>
                  <td className="py-3 px-3 text-center text-slate-500">
                    ₪{sc.totalExp.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-sm text-teal-800">
                    ₪{sc.caregiverNet.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    ₪{sc.perChild.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    {sc.margin.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    {sc.isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-teal-700 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>נבחר כעת</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, childrenCount: sc.count }))}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer"
                      >
                        בחר {sc.count}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. COMPLETE FINANCIAL STATEMENT SUMMARY TABLE (PRINT-READY) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
              5
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                דוח מאזן חודשי מסכם · {monthLabel}
              </h3>
              <p className="text-xs text-slate-500">
                סיכום תמציתי ומדויק לשימוש פרטי, לרואה החשבון ולתכנון המשפחתי
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            תאריך הפקה: {new Date().toLocaleDateString('he-IL')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Revenue and Gross */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <span>הכנסות ומחזור</span>
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">מספר פעוטות בדירה:</span>
              <span className="font-mono font-bold text-slate-900">{numChildren} ילדים</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">שכר לימוד חודשי לפעוט:</span>
              <span className="font-mono font-bold text-slate-900">₪{tuition.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">סך מחזור ברוטו (כולל מע"מ):</span>
              <span className="font-mono font-bold text-slate-900">
                ₪{monthlyGrossIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">רכיב מע"מ (18%):</span>
              <span className="font-mono text-slate-700">
                ₪{monthlyVatAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1.5 bg-emerald-50 px-2 rounded-lg font-bold text-emerald-950">
              <span>הכנסה חודשית נטו (בסיס הפעילות):</span>
              <span className="font-mono">
                ₪{monthlyNetIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Deductions and Net Take-Home */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <span>הוצאות, רזרבות ושכר המטפלת</span>
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">הוצאות תפעול מוכרות בדירה:</span>
              <span className="font-mono text-slate-900 font-bold">
                ₪{totalOperatingExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">קרן גיבוי / ממלאת מקום לימי מחלה:</span>
              <span className="font-mono text-slate-700">
                ₪{backupFundCost.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">רזרבת חופשה שנתית ובלת״מים (10%):</span>
              <span className="font-mono text-amber-800 font-bold">
                ₪{contingencyAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">סה״כ ניכויים והוצאות בדירה:</span>
              <span className="font-mono font-bold text-slate-800">
                ₪{totalDeductions.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1.5 bg-teal-100/80 px-2 rounded-lg font-black text-teal-950 text-sm">
              <span>שכר נטו נשאר ביד למטפלת (B.Ed.):</span>
              <span className="font-mono">
                ₪{soleCaregiverTakeHomeSalary.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              הנתונים נשמרים באופן מקומי בדפדפן הפרטי שלך ואינם משותפים עם שום גורם חיצוני.
            </span>
          </div>
          <span className="font-semibold text-slate-700">מערכת פרטית לשימוש אישי</span>
        </div>
      </div>
    </div>
  );
};
