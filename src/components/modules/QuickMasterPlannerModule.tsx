import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { DaycareSettings } from '../../types';
import { exportToGoogleSheetsXlsx } from '../../lib/googleSheetsExporter';

interface QuickMasterPlannerProps {
  settings: DaycareSettings | null;
  onUpdateSettings?: (updates: Partial<DaycareSettings>) => Promise<void>;
}

export const QuickMasterPlannerModule: React.FC<QuickMasterPlannerProps> = ({ settings }) => {
  // Target Month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Macro Financial Inputs (Clean & Simple Input Controls)
  const [childrenCount, setChildrenCount] = useState<number>(24);
  const [tuitionPerChild, setTuitionPerChild] = useState<number>(4200);
  const [afternoonCareFee, setAfternoonCareFee] = useState<number>(600);
  const [afternoonCareChildren, setAfternoonCareChildren] = useState<number>(14);

  // Expense Inputs
  const [rentAndTax, setRentAndTax] = useState<number>(3800);
  const [insuranceCost, setInsuranceCost] = useState<number>(850);
  const [accountantCost, setAccountantCost] = useState<number>(650);
  const [utilitiesCost, setUtilitiesCost] = useState<number>(1200);
  const [foodPerChild, setFoodPerChild] = useState<number>(120);
  const [suppliesPerChild, setSuppliesPerChild] = useState<number>(45);

  // Staff Payroll Inputs
  const [staffCount, setStaffCount] = useState<number>(4);
  const [avgStaffHourlyRate, setAvgStaffHourlyRate] = useState<number>(45);
  const [dailyHoursPerStaff, setDailyHoursPerStaff] = useState<number>(8);

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
  const staffPayrollTotal = useMemo(
    () => staffCount * avgStaffHourlyRate * dailyHoursPerStaff * 22,
    [staffCount, avgStaffHourlyRate, dailyHoursPerStaff]
  );
  const variableFoodSuppliesTotal = useMemo(
    () => childrenCount * (foodPerChild + suppliesPerChild),
    [childrenCount, foodPerChild, suppliesPerChild]
  );
  const fixedExpensesTotal = rentAndTax + insuranceCost + accountantCost + utilitiesCost;
  const totalExpenses = staffPayrollTotal + variableFoodSuppliesTotal + fixedExpensesTotal;

  // Net Balance & Margin
  const netBalance = totalIncome - totalExpenses;
  const profitMarginPercent = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

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
            <span className="text-xs font-bold text-[#5f3414] uppercase tracking-wide">מאזן חודשי נקי (רווח נקי)</span>
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
              {netBalance >= 0 ? 'מאזן חיובי ✓' : 'גרעון במאזן!'}
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

      {/* INPUT FORM SECTION (הזנת נתונים נקייה ללא סרבול) */}
      <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#efeeea] pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7a4b29]" />
            <h3 className="font-black text-lg text-[#5f3414] font-heading">
              טופס הזנת נתונים ראשי (שנה נתונים וצפה בעדכון מיידי במאזן)
            </h3>
          </div>
          <span className="text-xs text-[#7a4b29] font-bold hidden sm:inline">
            כל הנתונים ניתנים לשינוי באופן חופשי
          </span>
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
                    min="1"
                    max="60"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Math.max(1, Number(e.target.value)))}
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
                  value={tuitionPerChild}
                  onChange={(e) => setTuitionPerChild(Number(e.target.value))}
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
                  onChange={(e) => setAfternoonCareChildren(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">מחיר צהרון חודשי לילד (₪):</label>
                <input
                  type="number"
                  step="50"
                  value={afternoonCareFee}
                  onChange={(e) => setAfternoonCareFee(Number(e.target.value))}
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
                  onChange={(e) => setRentAndTax(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">עלות ביטוח מעון חודשית (₪):</label>
                <input
                  type="number"
                  step="50"
                  value={insuranceCost}
                  onChange={(e) => setInsuranceCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">תקציב מזון חודשי לילד (₪):</label>
                <input
                  type="number"
                  step="10"
                  value={foodPerChild}
                  onChange={(e) => setFoodPerChild(Number(e.target.value))}
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
                    setAccountantCost(650);
                    setUtilitiesCost(Math.max(0, total - 650));
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>
            </div>
          </div>

          {/* GROUP 3: STAFF & WAGES */}
          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#e4e2de] space-y-4">
            <div className="flex items-center gap-2 text-[#5f3414] font-bold text-sm border-b border-[#e4e2de] pb-2">
              <ShieldCheck className="w-4 h-4 text-[#7a4b29]" />
              <h4>3. צוות ושכר עבודה</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#51443c] font-bold mb-1">כמות אנשי צוות / מטפלות:</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={staffCount}
                  onChange={(e) => setStaffCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">שכר שעתי ממוצע לצוות (₪/שעה):</label>
                <input
                  type="number"
                  step="1"
                  value={avgStaffHourlyRate}
                  onChange={(e) => setAvgStaffHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div>
                <label className="block text-[#51443c] font-bold mb-1">שעות עבודה יומיות לכל עובדת:</label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyHoursPerStaff}
                  onChange={(e) => setDailyHoursPerStaff(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#d6c3b8] font-mono font-bold text-sm focus:outline-[#7a4b29]"
                />
              </div>

              <div className="pt-2">
                <div className="p-3 bg-[#f5efe6] rounded-xl border border-[#e4e2de] text-[11px] text-[#51443c]">
                  <span>חבות שכר מחושבת לפי 22 ימי עבודה בחודש: </span>
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
