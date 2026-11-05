import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Copy,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Building,
  Users,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Child,
  FinancialTransaction,
  StaffMember,
  StaffShift,
  DaycareSettings,
} from '../../types';
import { TaxStatusReport } from '../../lib/taxEngine';

import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';

interface MonthlyBalancePlannerProps {
  children: Child[];
  transactions: FinancialTransaction[];
  staff: StaffMember[];
  shifts: StaffShift[];
  settings: DaycareSettings | null;
  taxStatus: TaxStatusReport;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'updatedAt'>) => Promise<FinancialTransaction>;
  onUpdateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  onUpdateSettings: (updates: Partial<DaycareSettings>) => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export interface ExpectedExpenseItem {
  id: string;
  categoryName: string;
  description: string;
  expectedAmount: number;
  isConfirmed: boolean;
  notes?: string;
}

export const MonthlyBalancePlannerModule: React.FC<MonthlyBalancePlannerProps> = ({
  children,
  transactions,
  staff,
  shifts,
  settings,
  taxStatus,
  onAddTransaction,
  onUpdateChild,
  onUpdateSettings,
  onNavigateTab,
}) => {
  // Target Forecast Month State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Custom expected operational expenses (e.g. utilities, rent, food, supplies)
  const [customExpectedExpenses, setCustomExpectedExpenses] = useState<ExpectedExpenseItem[]>([
    { id: 'exp-1', categoryName: 'שכירות וארנונה יחסית', description: 'דמי שכירות מבנה המעון באריאל', expectedAmount: 3800, isConfirmed: true },
    { id: 'exp-2', categoryName: 'ביטוח צד ג\' ותאונות', description: 'פרמיה חודשית לביטוח מעון', expectedAmount: 850, isConfirmed: true },
    { id: 'exp-3', categoryName: 'רואה חשבון וייעוץ מס', description: 'ריטיינר חודשי לניהול ספרים', expectedAmount: 650, isConfirmed: true },
    { id: 'exp-4', categoryName: 'חשמל, מים ואינטרנט', description: 'חשבונות תפעול חודשיים', expectedAmount: 1200, isConfirmed: false, notes: 'טרם התקבלה הערכת חברת חשמל' },
    { id: 'exp-5', categoryName: 'מזון וטריות (בשרי/ירקות)', description: 'קניית מוצרי מזון מבושלים יומיום', expectedAmount: 2200, isConfirmed: false, notes: 'תלוי במספר ימי הפעילות בחודש' },
    { id: 'exp-6', categoryName: 'חומרי יצירה, ניקיון והיגיינה', description: 'חיתולים, מגבונים, צבעים וחומרי חיטוי', expectedAmount: 950, isConfirmed: true },
  ]);

  // Modals & Inline Quick-Fix state
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newExpCategory, setNewExpCategory] = useState('הוצאה תפעולית');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpConfirmed, setNewExpConfirmed] = useState(true);

  // Scenario Simulator Controls State
  const [simChildrenDelta, setSimChildrenDelta] = useState<number>(0);
  const [simFoodInflationPercent, setSimFoodInflationPercent] = useState<number>(0);
  const [simExtraStaffHours, setSimExtraStaffHours] = useState<number>(0);

  // Copy missing list state
  const [copiedMissingList, setCopiedMissingList] = useState(false);

  // Inline Editing State for Expenses
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpAmount, setEditExpAmount] = useState<number>(0);
  const [editExpDesc, setEditExpDesc] = useState<string>('');

  // Inline Editing State for Children Tuition
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editTuitionVal, setEditTuitionVal] = useState<number>(4200);

  // Settings Edit Modal State
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [editDirectorName, setEditDirectorName] = useState(settings?.directorName || 'רותם עירון');
  const [editDaycareName, setEditDaycareName] = useState(settings?.daycareName || 'הבית של מאיה');
  const [editPhone, setEditPhone] = useState(settings?.directorPhone || '052-870-7056');
  const [editAddress, setEditAddress] = useState(settings?.daycareAddress || 'אריאל, שומרון');

  // Export handler
  const handleExportGoogleSheets = () => {
    exportToGoogleSheetsXlsx({
      monthLabel,
      selectedMonth,
      activeChildren,
      expectedExpenses: customExpectedExpenses,
      staff,
      settings,
      completenessScore,
    });
  };

  // Start Editing Expense
  const handleStartEditExpense = (exp: ExpectedExpenseItem) => {
    setEditingExpenseId(exp.id);
    setEditExpAmount(exp.expectedAmount);
    setEditExpDesc(exp.description);
  };

  // Save Expense Edit
  const handleSaveExpenseEdit = (id: string) => {
    setCustomExpectedExpenses((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, expectedAmount: editExpAmount, description: editExpDesc } : item
      )
    );
    setEditingExpenseId(null);
  };

  // Start Editing Child Tuition
  const handleStartEditTuition = (child: Child) => {
    setEditingChildId(child.id);
    setEditTuitionVal(child.monthlyTuition || 4200);
  };

  // Save Child Tuition Edit
  const handleSaveChildTuition = async (childId: string) => {
    await onUpdateChild(childId, { monthlyTuition: editTuitionVal });
    setEditingChildId(null);
  };

  // Save Settings Edit
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      directorName: editDirectorName,
      daycareName: editDaycareName,
      directorPhone: editPhone,
      daycareAddress: editAddress,
    });
    setIsEditSettingsOpen(false);
  };

  // Month label in Hebrew
  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Active children for tuition calculations
  const activeChildren = useMemo(() => children.filter((c) => c.status === 'ACTIVE'), [children]);

  // 1. EXPECTED INCOME CALCULATIONS
  const baseTuitionIncome = useMemo(() => {
    const adjustedCount = Math.max(0, activeChildren.length + simChildrenDelta);
    return adjustedCount * 4200; // 4,200 ₪ per child standard monthly tuition
  }, [activeChildren, simChildrenDelta]);

  const extraFeesIncome = useMemo(() => {
    return activeChildren.reduce((sum, c) => {
      const extra = c.extraFees
        ? (c.extraFees.afternoonCare || 0) + (c.extraFees.fridayCare || 0) + (c.extraFees.activities || 0)
        : 0;
      return sum + extra;
    }, 0);
  }, [activeChildren]);

  const totalExpectedIncome = baseTuitionIncome + extraFeesIncome;

  // 2. EXPECTED EXPENSE CALCULATIONS
  const staffWageLiabilities = useMemo(() => {
    // Estimated staff wages based on hourly rates
    const baseWages = staff
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.hourlyRate * (s.standardDailyHours || 8) * 22, 0); // 22 working days
    const extraHoursPay = simExtraStaffHours * 45; // avg hourly rate for assistant
    return baseWages + extraHoursPay;
  }, [staff, simExtraStaffHours]);

  const fixedAndVariableExpenses = useMemo(() => {
    return customExpectedExpenses.reduce((sum, e) => {
      if (e.categoryName.includes('מזון')) {
        return sum + e.expectedAmount * (1 + simFoodInflationPercent / 100);
      }
      return sum + e.expectedAmount;
    }, 0);
  }, [customExpectedExpenses, simFoodInflationPercent]);

  const totalExpectedExpenses = staffWageLiabilities + fixedAndVariableExpenses;

  // 3. EXPECTED NET BALANCE (SURPLUS / DEFICIT)
  const expectedNetBalance = totalExpectedIncome - totalExpectedExpenses;

  // 4. MISSING INFORMATION & GAP ANALYSIS DETECTOR (גלאי מידע חסר)
  const missingDataGaps = useMemo(() => {
    const gaps: {
      id: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      description: string;
      category: 'INCOME' | 'EXPENSE' | 'STAFF' | 'REGULATORY';
      entityId?: string;
      actionLabel: string;
      onFix?: () => void;
    }[] = [];

    // Check children missing payment method or unconfirmed tuition status
    activeChildren.forEach((child) => {
      if (!child.tuitionStatus || child.tuitionStatus === 'UNPAID') {
        gaps.push({
          id: `gap-child-tuition-${child.id}`,
          severity: 'CRITICAL',
          title: `טרם הוסדר/אושר תשלום שכ"ל עבור ${child.firstName} ${child.lastName}`,
          description: `שכר לימוד בסך ₪${child.monthlyTuition.toLocaleString()} אינו מתועד כמשולם לחודש זה.`,
          category: 'INCOME',
          entityId: child.id,
          actionLabel: 'הגדר כמשולם / עדכן אמצעי תשלום',
        });
      }
    });

    // Check expenses that are not confirmed
    customExpectedExpenses.forEach((exp) => {
      if (!exp.isConfirmed) {
        gaps.push({
          id: `gap-exp-${exp.id}`,
          severity: 'WARNING',
          title: `חסרה הערכה סופית עבור: ${exp.categoryName}`,
          description: exp.notes || `סכום משוער ₪${exp.expectedAmount.toLocaleString()} טרם אושר בחשבונית ספק.`,
          category: 'EXPENSE',
          entityId: exp.id,
          actionLabel: 'אשר סכום סופי',
        });
      }
    });

    // Check staff shifts / hourly confirmation
    const activeStaffWithoutRate = staff.filter((s) => s.status === 'ACTIVE' && (!s.hourlyRate || s.hourlyRate <= 0));
    activeStaffWithoutRate.forEach((s) => {
      gaps.push({
        id: `gap-staff-rate-${s.id}`,
        severity: 'CRITICAL',
        title: `חסר תעריף שכר שעתי עבור ${s.fullName}`,
        description: 'לא ניתן לחשב את חבות השכר המדויקת ללא הגדרת שכר שעתי במערכת.',
        category: 'STAFF',
        entityId: s.id,
        actionLabel: 'עדכן שכר שעתי בתיק עובדת',
      });
    });

    // Check Osek Patur threshold
    if (taxStatus.status === 'WARNING_80' || taxStatus.status === 'CRITICAL_90') {
      gaps.push({
        id: 'gap-tax-threshold',
        severity: 'WARNING',
        title: 'קרבה לתקרת עוסק פטור (122,000 ₪)',
        description: `הכנסות מצטברות עומדות על ₪${taxStatus.totalAnnualIncome.toLocaleString()} (${taxStatus.percentageUsed.toFixed(0)}%). חסרה תוכנית מעבר לעוסק מורשה.`,
        category: 'REGULATORY',
        actionLabel: 'צפה בדוח מיסוי ישראלי',
      });
    }

    return gaps;
  }, [activeChildren, customExpectedExpenses, staff, taxStatus]);

  // Completeness Score Calculation (0-100%)
  const completenessScore = useMemo(() => {
    const totalCheckpoints = activeChildren.length + customExpectedExpenses.length + staff.length;
    if (totalCheckpoints === 0) return 100;
    const unresolvedGapsCount = missingDataGaps.length;
    const score = Math.max(0, Math.round(((totalCheckpoints - unresolvedGapsCount) / totalCheckpoints) * 100));
    return score;
  }, [activeChildren, customExpectedExpenses, staff, missingDataGaps]);

  // Quick confirm expense item
  const handleConfirmExpenseItem = (id: string) => {
    setCustomExpectedExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isConfirmed: true, notes: 'אושר וקויים' } : item))
    );
  };

  // Quick Add Expected Expense
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc || !newExpAmount) return;

    const newItem: ExpectedExpenseItem = {
      id: `exp-${Date.now()}`,
      categoryName: newExpCategory,
      description: newExpDesc,
      expectedAmount: Number(newExpAmount) || 0,
      isConfirmed: newExpConfirmed,
    };

    setCustomExpectedExpenses((prev) => [...prev, newItem]);
    setIsAddExpenseModalOpen(false);
    setNewExpDesc('');
    setNewExpAmount('');
  };

  // Delete Expected Expense Item
  const handleDeleteExpenseItem = (id: string) => {
    setCustomExpectedExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Copy missing list to clipboard
  const handleCopyMissingList = () => {
    const lines = [
      `🐝 הבית של מאיה - דוח מידע חסר ופערים במאזן לחודש ${monthLabel}:`,
      `מדד שלמות המאזן: ${completenessScore}% (קיימים ${missingDataGaps.length} פערים לטיפול)`,
      '',
      ...missingDataGaps.map((g, i) => `${i + 1}. [${g.severity === 'CRITICAL' ? 'קריטי' : 'אזהרה'}] ${g.title}: ${g.description}`),
      '',
      `מאזן חודשי צפוי נוכחי: ₪${expectedNetBalance.toLocaleString()} (הכנסות: ₪${totalExpectedIncome.toLocaleString()} | הוצאות: ₪${totalExpectedExpenses.toLocaleString()})`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedMissingList(true);
    setTimeout(() => setCopiedMissingList(false), 2500);
  };

  // Quick mark child tuition as paid
  const handleQuickMarkChildPaid = async (childId: string) => {
    await onUpdateChild(childId, { tuitionStatus: 'PAID' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Forecast Purpose Header */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-[#d6c3b8]/30">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdeab]/20 border border-[#ffdeab]/30 text-[#ffdeab] text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-[#ffdeab]" />
            <span>מנבא מאזן חודשי צפוי ומאתר חסרים במידע • הבית של מאיה</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
            תכנון מאזן חודשי ואיתור פרטים חסרים 📊
          </h2>

          <p className="text-xs sm:text-sm text-[#ffedd5]/90 leading-relaxed font-sans">
            מערכת חיזוי פיננסי חכמה המציגה את התזרים הצפוי לחודש <strong>{monthLabel}</strong>, מזהה אוטומטית אילו נתונים ותקבולים חסרים, ומאפשרת לך להגיע לוודאות מלאה.
          </p>
        </div>

        {/* Month Selector, Google Sheets Export & Completeness Gauge */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 flex-shrink-0">
          <button
            onClick={handleExportGoogleSheets}
            className="flex items-center gap-2 bg-[#ffdeab] hover:bg-white text-[#5f3414] font-black px-4 py-2.5 rounded-2xl shadow-md transition text-xs sm:text-sm cursor-pointer border border-[#ffdeab] active:scale-95"
            title="הורד קובץ אקסל / גוגל שייטס מעוצב הכולל דשבורד ונוסחאות אוטומטיות"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#7a4b29]" />
            <span>ייצא לגוגל שייטס מעוצב (עם נוסחאות) 📊</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur p-2.5 rounded-2xl border border-white/20 text-left">
              <span className="text-[10px] text-[#ffdeab] font-bold block">חודש יעד:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white text-[#5f3414] font-bold text-xs px-2.5 py-1 rounded-xl outline-none shadow-xs font-mono cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-2.5 rounded-2xl border border-white/20 text-xs">
              <span className="text-[#ffdeab] font-bold">שלמות:</span>
              <span
                className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                  completenessScore >= 90
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : completenessScore >= 70
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                    : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                }`}
              >
                {completenessScore}%
              </span>
            </div>

            <button
              onClick={() => setIsEditSettingsOpen(true)}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-[#ffdeab] border border-white/20 transition cursor-pointer"
              title="ערוך פרטי מעון (רותם ומאיה)"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Honey decorative blur */}
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main KPI Summary Bar: Total Expected Income vs Total Expected Expenses = Net Surplus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expected Income Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#51443c]">
            <span className="text-xs font-bold text-[#5f3414]">הכנסות חודשיות צפויות</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 font-mono tabular-nums">
              ₪{totalExpectedIncome.toLocaleString()}
            </span>
            <span className="text-xs text-[#51443c]">({activeChildren.length + simChildrenDelta} ילדים)</span>
          </div>
          <div className="text-[11px] text-[#51443c] pt-2 border-t border-[#efeeea] flex justify-between">
            <span>שכ"ל בסיסי: ₪{baseTuitionIncome.toLocaleString()}</span>
            <span>צהרונים/תוספות: ₪{extraFeesIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Expected Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#51443c]">
            <span className="text-xs font-bold text-[#5f3414]">הוצאות חודשיות צפויות</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700 font-mono tabular-nums">
              ₪{Math.round(totalExpectedExpenses).toLocaleString()}
            </span>
            <span className="text-xs text-[#51443c]">({customExpectedExpenses.length} סעיפי תפעול)</span>
          </div>
          <div className="text-[11px] text-[#51443c] pt-2 border-t border-[#efeeea] flex justify-between">
            <span>חבות שכר צוות: ₪{Math.round(staffWageLiabilities).toLocaleString()}</span>
            <span>הוצאות תפעול: ₪{Math.round(fixedAndVariableExpenses).toLocaleString()}</span>
          </div>
        </div>

        {/* Expected Net Surplus / Deficit Card */}
        <div
          className={`p-5 rounded-2xl border shadow-2xs space-y-2 transition ${
            expectedNetBalance >= 0
              ? 'bg-[#fffdfa] border-[#ffdeab]'
              : 'bg-rose-50/80 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-[#51443c]">
            <span className="text-xs font-bold text-[#5f3414]">מאזן חודשי צפוי (רווח נקי)</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono tabular-nums ${
                expectedNetBalance >= 0 ? 'text-[#7a4b29]' : 'text-rose-700'
              }`}
            >
              ₪{Math.round(expectedNetBalance).toLocaleString()}
            </span>
            <span className="text-xs text-[#51443c]">
              {expectedNetBalance >= 0 ? 'עודף תקציבי צפוי' : 'חור במאזן!'}
            </span>
          </div>
          <div className="text-[11px] text-[#51443c] pt-2 border-t border-[#efeeea] flex justify-between">
            <span>אחוז רווחיות צפוי: <strong>{totalExpectedIncome > 0 ? ((expectedNetBalance / totalExpectedIncome) * 100).toFixed(1) : 0}%</strong></span>
            <span>פערים פתוחים: <strong className="text-rose-700">{missingDataGaps.length}</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 1: MISSING INFORMATION & GAP AUDITOR (גלאי פרטים חסרים בולט) */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-black text-lg text-[#5f3414] font-heading">
                איתור פרטים ומידע חסר במאזן החודשי ({missingDataGaps.length} חסרים לטיפול)
              </h3>
            </div>
            <p className="text-xs text-[#51443c] mt-0.5">
              הרשימה הבאה מציגה במדויק איזה מידע חסר כדי להגיע לחיזוי מאזן של 100%. לחץ על כפתור הטיפול המהיר להשלמת הפרט.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMissingList}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#faf8f5] hover:bg-[#ffdeab]/40 border border-[#d6c3b8] text-xs font-bold text-[#5f3414] transition cursor-pointer"
            >
              {copiedMissingList ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#7a4b29]" />}
              <span>{copiedMissingList ? 'הועתק ללוח!' : 'העתק רשימת חסרים לשליחה'}</span>
            </button>
          </div>
        </div>

        {/* Missing Gaps Items List */}
        {missingDataGaps.length === 0 ? (
          <div className="bg-[#f0fdf4] border border-emerald-300 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-950">
              כל הנתונים למאזן החודשי של {monthLabel} מולאו ואושרו במלואם! 🎉
            </h4>
            <p className="text-xs text-emerald-800">
              תשלומי שכר הלימוד מתועדים, הוצאות התפעול מאושרות, ושכר הצוות מחושב במלואו ללא פערים.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missingDataGaps.map((gap) => (
              <div
                key={gap.id}
                className={`p-4 rounded-2xl border transition shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  gap.severity === 'CRITICAL'
                    ? 'bg-rose-50/80 border-rose-300'
                    : 'bg-amber-50/80 border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl text-white flex-shrink-0 mt-0.5 ${
                      gap.severity === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-500'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#5f3414]">{gap.title}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          gap.severity === 'CRITICAL'
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {gap.severity === 'CRITICAL' ? 'חסר קריטי במאזן' : 'הערכה לא סופית'}
                      </span>
                    </div>
                    <p className="text-xs text-[#51443c] leading-relaxed">{gap.description}</p>
                  </div>
                </div>

                {/* Inline Quick Fix Action */}
                <div className="self-end md:self-auto flex-shrink-0">
                  {gap.category === 'INCOME' && gap.entityId && (
                    <button
                      onClick={() => handleQuickMarkChildPaid(gap.entityId!)}
                      className="px-3.5 py-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer border border-[#ffdeab]/30 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#ffdeab]" />
                      <span>{gap.actionLabel}</span>
                    </button>
                  )}

                  {gap.category === 'EXPENSE' && gap.entityId && (
                    <button
                      onClick={() => handleConfirmExpenseItem(gap.entityId!)}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-200" />
                      <span>{gap.actionLabel}</span>
                    </button>
                  )}

                  {gap.category === 'STAFF' && (
                    <button
                      onClick={() => onNavigateTab('staff')}
                      className="px-3.5 py-1.5 bg-[#51443c] hover:bg-[#1b1c1a] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <span>{gap.actionLabel}</span>
                    </button>
                  )}

                  {gap.category === 'REGULATORY' && (
                    <button
                      onClick={() => onNavigateTab('finance')}
                      className="px-3.5 py-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <span>{gap.actionLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: EXPECTED BALANCE BREAKDOWN TABLES (הכנסות והוצאות מפורטות) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Forecast Table */}
        <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#efeeea] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#5f3414] font-heading">
                פירוט הכנסות צפויות ({monthLabel})
              </h3>
            </div>
            <span className="text-sm font-black text-emerald-700 font-mono">
              ₪{totalExpectedIncome.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {activeChildren.map((child) => (
              <div
                key={child.id}
                className="p-3 rounded-xl bg-[#faf8f5] border border-[#e4e2de] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-[#5f3414] block">
                    {child.firstName} {child.lastName}
                  </span>
                  <span className="text-[11px] text-[#51443c]">
                    שכ"ל בסיסי: ₪{(child.monthlyTuition || 4200).toLocaleString()}
                    {child.extraFees?.afternoonCare ? ' + צהרון' : ''}
                  </span>
                </div>

                <div className="text-left flex items-center gap-2">
                  {editingChildId === child.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editTuitionVal}
                        onChange={(e) => setEditTuitionVal(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-[#7a4b29] rounded-lg text-xs font-mono font-bold"
                      />
                      <button
                        onClick={() => handleSaveChildTuition(child.id)}
                        className="p-1 bg-[#7a4b29] text-white rounded-lg hover:bg-[#5f3414]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-mono font-bold text-[#7a4b29]">
                        ₪{((child.monthlyTuition || 4200) + (child.extraFees?.afternoonCare || 0)).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleStartEditTuition(child)}
                        className="p-1 text-gray-400 hover:text-[#7a4b29] transition cursor-pointer"
                        title="ערוך שכר לימוד"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() =>
                      onUpdateChild(child.id, {
                        tuitionStatus: child.tuitionStatus === 'PAID' ? 'UNPAID' : 'PAID',
                      })
                    }
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer transition ${
                      child.tuitionStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                        : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800'
                    }`}
                    title="לחץ לשינוי סטטוס תשלום"
                  >
                    {child.tuitionStatus === 'PAID' ? 'מאושר ✓' : 'טרם אושר ⚡'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Forecast Table */}
        <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#efeeea] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#5f3414] font-heading">
                פירוט הוצאות צפויות ({monthLabel})
              </h3>
            </div>

            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#7a4b29] hover:bg-[#ffdeab]/40 px-3 py-1.5 rounded-xl border border-[#d6c3b8] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף סעיף הוצאה</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* Staff wages item */}
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#5f3414] block">חבות שכר צוות ומטפלות</span>
                <span className="text-[11px] text-[#51443c]">
                  {staff.length} עובדות פעילות (כולל שעות תקן וסיוע)
                </span>
              </div>
              <span className="font-mono font-bold text-rose-700">
                ₪{Math.round(staffWageLiabilities).toLocaleString()}
              </span>
            </div>

            {/* Custom operating expenses */}
            {customExpectedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl bg-[#faf8f5] border border-[#e4e2de] flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
              >
                {editingExpenseId === exp.id ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <input
                      type="text"
                      value={editExpDesc}
                      onChange={(e) => setEditExpDesc(e.target.value)}
                      className="px-2 py-1 bg-white border border-[#7a4b29] rounded-lg text-xs flex-1"
                      placeholder="תיאור..."
                    />
                    <input
                      type="number"
                      value={editExpAmount}
                      onChange={(e) => setEditExpAmount(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white border border-[#7a4b29] rounded-lg text-xs font-mono font-bold"
                    />
                    <button
                      onClick={() => handleSaveExpenseEdit(exp.id)}
                      className="px-3 py-1 bg-[#7a4b29] text-white rounded-lg text-xs font-bold hover:bg-[#5f3414]"
                    >
                      שמור
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#5f3414]">{exp.categoryName}</span>
                        <button
                          onClick={() =>
                            setCustomExpectedExpenses((prev) =>
                              prev.map((i) => (i.id === exp.id ? { ...i, isConfirmed: !i.isConfirmed } : i))
                            )
                          }
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition ${
                            exp.isConfirmed
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-800'
                              : 'bg-amber-100 text-amber-800 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                          title="לחץ לשינוי סטטוס אישור"
                        >
                          {exp.isConfirmed ? 'מאושר ✓' : 'הערכה בלבד ⚡'}
                        </button>
                      </div>
                      <span className="text-[11px] text-[#51443c] block">{exp.description}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="font-mono font-bold text-[#5f3414]">
                        ₪{exp.expectedAmount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleStartEditExpense(exp)}
                        className="p-1 text-gray-400 hover:text-[#7a4b29] transition cursor-pointer"
                        title="ערוך סעיף הוצאה"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpenseItem(exp.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="מחק סעיף"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: SCENARIO SIMULATOR (סימולטור תרחישים ושינויים במאזן) */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#efeeea] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7a4b29]" />
            <h3 className="font-bold text-base text-[#5f3414] font-heading">
              סימולטור תרחישים ושינויים במאזן החודשי (What-If Analysis)
            </h3>
          </div>
          <span className="text-xs text-[#7a4b29] font-bold">השפעה מיידית על הרווח הנקי</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Slider 1: Children Enrollment Delta */}
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
            <label className="text-xs font-bold text-[#5f3414] block flex justify-between">
              <span>שינוי במספר ילדים:</span>
              <span className="font-mono text-[#7a4b29]">
                {simChildrenDelta > 0 ? `+${simChildrenDelta}` : simChildrenDelta} ילדים
              </span>
            </label>
            <input
              type="range"
              min="-3"
              max="5"
              step="1"
              value={simChildrenDelta}
              onChange={(e) => setSimChildrenDelta(Number(e.target.value))}
              className="w-full accent-[#7a4b29] cursor-pointer"
            />
            <span className="text-[11px] text-[#51443c] block">
              השפעה על ההכנסה: <strong>{simChildrenDelta >= 0 ? '+' : ''}₪{(simChildrenDelta * 4200).toLocaleString()}</strong>
            </span>
          </div>

          {/* Slider 2: Food & Supply Inflation */}
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
            <label className="text-xs font-bold text-[#5f3414] block flex justify-between">
              <span>התייקרות קניות מזון וציוד:</span>
              <span className="font-mono text-[#7a4b29]">+{simFoodInflationPercent}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={simFoodInflationPercent}
              onChange={(e) => setSimFoodInflationPercent(Number(e.target.value))}
              className="w-full accent-[#7a4b29] cursor-pointer"
            />
            <span className="text-[11px] text-[#51443c] block">
              תוספת הוצאה: <strong>+₪{Math.round((2200 * simFoodInflationPercent) / 100).toLocaleString()}</strong>
            </span>
          </div>

          {/* Slider 3: Extra Staff Assistant Hours */}
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] space-y-2">
            <label className="text-xs font-bold text-[#5f3414] block flex justify-between">
              <span>שעות סייעת משלימה נוספות:</span>
              <span className="font-mono text-[#7a4b29]">+{simExtraStaffHours} שעות</span>
            </label>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={simExtraStaffHours}
              onChange={(e) => setSimExtraStaffHours(Number(e.target.value))}
              className="w-full accent-[#7a4b29] cursor-pointer"
            />
            <span className="text-[11px] text-[#51443c] block">
              תוספת שכר: <strong>+₪{(simExtraStaffHours * 45).toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#e4e2de]">
            <div className="flex items-center justify-between border-b border-[#efeeea] pb-3">
              <h3 className="font-bold text-base text-[#5f3414]">הוספת סעיף הוצאה צפויה למאזן</h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#51443c] font-bold mb-1">קטגוריית הוצאה:</label>
                <input
                  type="text"
                  required
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                  placeholder="למשל: חשמל, ציוד, מזון..."
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">תיאור ההוצאה:</label>

                <input
                  type="text"
                  required
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                  placeholder="פירוט קצר..."
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">סכום צפוי (₪):</label>
                <input
                  type="number"
                  required
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706] font-mono"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkConfirm"
                  checked={newExpConfirmed}
                  onChange={(e) => setNewExpConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-[#7a4b29] cursor-pointer"
                />
                <label htmlFor="chkConfirm" className="text-[#51443c] font-bold cursor-pointer">
                  סכום סופי מאושר בחשבונית (סמן אם הסכום סופי)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold rounded-xl transition cursor-pointer shadow-xs mt-2"
              >
                שמור סעיף הוצאה במאזן
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SETTINGS MODAL (רותם ומאיה) */}
      {isEditSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#e4e2de]">
            <div className="flex items-center justify-between border-b border-[#efeeea] pb-3">
              <h3 className="font-bold text-base text-[#5f3414]">עריכת פרטי מעון (רותם ומאיה)</h3>
              <button
                onClick={() => setIsEditSettingsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#51443c] font-bold mb-1">שם המעון:</label>
                <input
                  type="text"
                  required
                  value={editDaycareName}
                  onChange={(e) => setEditDaycareName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">שם המנהלת:</label>
                <input
                  type="text"
                  required
                  value={editDirectorName}
                  onChange={(e) => setEditDirectorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">כתובת / מיקום המעון:</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">טלפון ליצירת קשר:</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold rounded-xl transition cursor-pointer shadow-xs mt-2"
              >
                עדכן פרטי מעון במערכת
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
