import React, { useState } from 'react';
import {
  Users,
  Baby,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Utensils,
  CheckCircle2,
  Calendar,
  HeartHandshake,
  MessageCircle,
  ArrowRight,
  Phone,
  Sparkles,
  MapPin,
  Heart,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';
import {
  Child,
  DailyAttendance,
  StaffMember,
  StaffShift,
  DaycareSettings,
  WeeklyMealDay,
  SafetyCheckItem,
  ComplianceRatioResult,
} from '../../types';
import { TaxStatusReport } from '../../lib/taxEngine';

interface DashboardModuleProps {
  children: Child[];
  activeChildren: Child[];
  presentChildren: Child[];
  attendance: DailyAttendance[];
  staff: StaffMember[];
  activeClockedStaff: StaffShift[];
  ratioCompliance: ComplianceRatioResult;
  taxStatus: TaxStatusReport;
  todayMenu?: WeeklyMealDay;
  allergenConflicts: { child: Child; matchingAllergen: string }[];
  safetyChecks: SafetyCheckItem[];
  settings: DaycareSettings | null;
  onNavigateTab: (tab: string) => void;
  onQuickCheckInAll: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  activeChildren,
  presentChildren,
  attendance,
  activeClockedStaff,
  ratioCompliance,
  taxStatus,
  todayMenu,
  allergenConflicts,
  safetyChecks,
  settings,
  onNavigateTab,
  onQuickCheckInAll,
}) => {
  const [heroImageLoaded, setHeroImageLoaded] = useState(true);

  const attendanceRate =
    activeChildren.length > 0
      ? Math.round((presentChildren.length / activeChildren.length) * 100)
      : 0;

  const passedDailyChecks = safetyChecks.filter(
    (s) => s.category === 'DAILY' && s.status === 'PASSED'
  ).length;
  const totalDailyChecks = safetyChecks.filter((s) => s.category === 'DAILY').length;

  const heroImgUrl =
    'https://raw.githubusercontent.com/Almog787/Mayabee/7556da7292780737f265ca3915efad246ff2eef9/public/Hero%20Mayabee.png';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar - Mayabee Brand Executive Director Portal */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden border border-[#d6c3b8]/30">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdeab]/20 border border-[#ffdeab]/30 text-[#ffdeab] text-xs font-bold">
            <span>פורטל ניהול ובקרה למנהלת המעון • הבית של מאיה</span>
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping"></span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
            שלום, {settings?.directorName || 'רותם עירון'} ☀️🐝
          </h2>

          <p className="text-sm text-[#ffedd5]/90 leading-relaxed font-sans">
            לוח בקרה תפעולי ורגולטורי פנימי: המעון פועל כעת עם <strong>{presentChildren.length} ילדים נוכחים</strong> ו-<strong>{activeClockedStaff.length} אנשי צוות</strong> במשמרת.
            בקרה מלאה על יומן נוכחות, תיקי ילדים, כספים וחשבונות, תקינת יחס פיקוח ובטיחות מרחב מוגן.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#ffdeab]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              אריאל, שומרון
            </span>
            <span>•</span>
            <span className="font-semibold text-emerald-300">עמידה בתקן חוק הפיקוח (100%)</span>
            <span>•</span>
            <span>סנכרון ענני Google Sheets פעיל</span>
          </div>
        </div>

        {/* Hero actions - Executive Management Tools */}
        <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onQuickCheckInAll}
              className="flex items-center gap-2 bg-[#ffdeab] hover:bg-[#ffd291] text-[#5f3414] font-bold px-4 py-2.5 rounded-2xl shadow-lg transition text-xs sm:text-sm cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-[#7a4b29]" />
              <span>סמן נוכחות לכל הילדים</span>
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2.5 rounded-2xl backdrop-blur border border-white/25 transition text-xs sm:text-sm cursor-pointer active:scale-95"
            >
              <span>יומן נוכחות מלא</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('planner')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ffdeab] text-[#5f3414] hover:bg-white text-xs font-bold border border-[#ffdeab] transition cursor-pointer shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#7a4b29]" />
              <span>תכנון מאזן ומידע חסר 📊</span>
            </button>

            <button
              onClick={() => onNavigateTab('finance')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#ffdeab] text-xs font-bold border border-[#ffdeab]/30 transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#ffdeab]" />
              <span>הוספת תנועה / קבלה</span>
            </button>

            <button
              onClick={() => onNavigateTab('children')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
            >
              <Baby className="w-3.5 h-3.5 text-[#ffdeab]" />
              <span>קליטת ילד/ה חדש/ה</span>
            </button>
          </div>
        </div>

        {/* Subtle Decorative honeycomb background */}
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Critical System Alert Banners */}
      <div className="space-y-3">
        {/* Allergen Collision Alert */}
        {allergenConflicts.length > 0 && (
          <div className="bg-[#fff1f2] border-2 border-[#fecdd3] rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-[#9f1239] shadow-xs animate-pulse">
            <div className="p-2.5 bg-[#e11d48] text-white rounded-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-base text-[#881337] flex items-center gap-2">
                אזהרת אלרגיה קריטית בארוחת היום!
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fecdd3] text-[#881337]">
                  {allergenConflicts.length} ילדים בסכנה
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-[#9f1239] leading-relaxed">
                תפריט היום ({todayMenu?.dayName}) מכיל רכיבים אלרגניים שמתנגשים עם אלרגיות ילדים הנוכחים כעת במעון:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {allergenConflicts.map(({ child, matchingAllergen }, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#fecdd3] rounded-lg text-xs font-bold text-[#881337] shadow-2xs"
                  >
                    <span>{child.firstName} {child.lastName}</span>
                    <span className="text-[#e11d48]">({matchingAllergen})</span>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('logistics')}
              className="text-xs font-bold text-[#e11d48] hover:text-[#881337] underline whitespace-nowrap self-center"
            >
              צפה בתפריט ומנות חלופיות
            </button>
          </div>
        )}

        {/* Ratio Compliance Violation Alert */}
        {!ratioCompliance.isCompliant && (
          <div className="bg-[#fffbeb] border-2 border-[#fde68a] rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-[#92400e] shadow-xs">
            <div className="p-2.5 bg-[#d97706] text-white rounded-xl flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-base text-[#78350f]">
                חריגה מתקן הפיקוח על מעונות יום באריאל!
              </h4>
              <p className="text-xs sm:text-sm text-[#92400e]">
                {ratioCompliance.alertMessage}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('staff')}
              className="text-xs font-bold text-[#b45309] hover:text-[#78350f] underline whitespace-nowrap self-center"
            >
              נהל נוכחות צוות
            </button>
          </div>
        )}

        {/* Osek Patur Threshold Warnings */}
        {taxStatus.status === 'WARNING_80' && (
          <div className="bg-[#fff9f3] border border-[#ffdcc6] rounded-2xl p-4 flex items-center justify-between text-[#5f3414] text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#d97706]" />
              <span>{taxStatus.warningMessage}</span>
            </div>
            <button
              onClick={() => onNavigateTab('finance')}
              className="font-bold underline text-[#7a4b29]"
            >
              דוח כספי
            </button>
          </div>
        )}
        {taxStatus.status === 'CRITICAL_90' && (
          <div className="bg-[#fff7ed] border-2 border-[#fdba74] rounded-2xl p-4 flex items-center justify-between text-[#7c2d12] text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#ea580c]" />
              <span className="font-bold">{taxStatus.warningMessage}</span>
            </div>
            <button
              onClick={() => onNavigateTab('finance')}
              className="font-bold underline text-[#9a3412]"
            >
              היערכות למורשה
            </button>
          </div>
        )}
      </div>

      {/* Google Sheets Sync & Database Diagnostics Hub Bar */}
      <div className="bg-gradient-to-r from-[#fffbf5] via-[#faf8f5] to-[#fff9f3] rounded-2xl border border-[#d6c3b8] p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-[#5f3414]">
                סנכרון Google Sheets & בקרת תקינות המאגר
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>פעיל (Apps Script)</span>
              </span>
            </div>
            <p className="text-[11px] text-[#51443c] mt-0.5">
              מסד נתונים ב-7 לשוניות מותאמות אישית, כולל דשבורד מנהלת אוטומטי ובדיקת חוקי מעונות
              {settings?.lastSyncTime && (
                <span className="font-mono text-[#7a4b29] font-semibold mr-1">
                  (סנכרון אחרון: {new Date(settings.lastSyncTime).toLocaleTimeString('he-IL')})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigateTab('backup')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#ffdeab]/40 border border-[#d6c3b8] text-xs font-bold text-[#5f3414] shadow-2xs transition cursor-pointer"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>בדיקת שגיאות ותקינות</span>
          </button>

          <button
            onClick={() => onNavigateTab('backup')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7a4b29] hover:bg-[#5f3414] text-white text-xs font-bold shadow-2xs transition cursor-pointer border border-[#ffdeab]/30"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#ffdeab]" />
            <span>פתח סנכרון Google Sheets</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid (Mayabee Styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Children Card */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs hover:border-[#d97706] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#51443c] mb-3">
            <span className="text-xs font-bold text-[#5f3414]">נוכחות ילדים היום</span>
            <div className="w-8 h-8 rounded-xl bg-[#fff9f3] text-[#d97706] flex items-center justify-center group-hover:scale-110 transition border border-[#ffdcc6]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#5f3414]">{presentChildren.length}</span>
            <span className="text-xs text-[#51443c]">מתוך {activeChildren.length} רשומים</span>
          </div>
          <div className="mt-3 w-full bg-[#efeeea] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#d97706] h-2 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#7a4b29] font-bold">
            תפוסה נוכחית: {attendanceRate}%
          </p>
        </div>

        {/* Staff & Supervision Ratio Card */}
        <div
          onClick={() => onNavigateTab('staff')}
          className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs hover:border-[#d97706] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#51443c] mb-3">
            <span className="text-xs font-bold text-[#5f3414]">יחס מטפלת-ילד (תקינה)</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition border ${
                ratioCompliance.isCompliant
                  ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                  : 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]'
              }`}
            >
              {ratioCompliance.isCompliant ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#5f3414]">
              {activeClockedStaff.length}
            </span>
            <span className="text-xs text-[#51443c]">
              צוות פעיל (נדרש: {ratioCompliance.requiredStaffCount})
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span
              className={`font-bold ${
                ratioCompliance.isCompliant ? 'text-[#065f46]' : 'text-[#9f1239]'
              }`}
            >
              {ratioCompliance.isCompliant ? 'עומד בחוק הפיקוח' : 'דרושה סייעת נוספת'}
            </span>
            <span className="text-[#a8a29e] font-mono">
              1:{activeClockedStaff.length > 0 ? (presentChildren.length / activeClockedStaff.length).toFixed(1) : '0'}
            </span>
          </div>
        </div>

        {/* Osek Patur Progress Bar */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs hover:border-[#d97706] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#51443c] mb-3">
            <span className="text-xs font-bold text-[#5f3414]">תקרת עוסק פטור 2026</span>
            <div className="w-8 h-8 rounded-xl bg-[#fff9f3] text-[#7a4b29] flex items-center justify-center group-hover:scale-110 transition border border-[#ffdcc6]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#5f3414] font-mono">
              ₪{taxStatus.totalAnnualIncome.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#51443c]">
              / ₪{taxStatus.osekPaturCeiling.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 w-full bg-[#efeeea] rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                taxStatus.percentageUsed >= 90
                  ? 'bg-[#e11d48]'
                  : taxStatus.percentageUsed >= 80
                  ? 'bg-[#ea580c]'
                  : 'bg-[#7a4b29]'
              }`}
              style={{ width: `${Math.min(100, taxStatus.percentageUsed)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#51443c]">
            נוצל: <strong>{taxStatus.percentageUsed.toFixed(1)}%</strong> | נותרו ₪{taxStatus.remainingAmount.toLocaleString()}
          </p>
        </div>

        {/* Safety Checks Card */}
        <div
          onClick={() => onNavigateTab('logistics')}
          className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs hover:border-[#d97706] hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#51443c] mb-3">
            <span className="text-xs font-bold text-[#5f3414]">בטיחות ומרחב מוגן</span>
            <div className="w-8 h-8 rounded-xl bg-[#fff9f3] text-[#d97706] flex items-center justify-center group-hover:scale-110 transition border border-[#ffdcc6]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#5f3414]">{passedDailyChecks}</span>
            <span className="text-xs text-[#51443c]">מתוך {totalDailyChecks} בדיקות יומיות</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-[#51443c]">שער, חצר מוצלת, ממ"ד</span>
            <span className="text-[#065f46] font-bold">
              {passedDailyChecks === totalDailyChecks ? '100% תקין' : 'ממתין לבדיקה'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Menu & Fast Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Fresh Menu Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#e4e2de] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#d97706]" />
              <h3 className="font-bold text-[#5f3414] text-base font-heading">
                תפריט תזונה יומי ובקרת אלרגנים ({todayMenu?.dayName || 'יום ראשון'})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('logistics')}
              className="text-xs text-[#7a4b29] font-bold hover:underline"
            >
              לכל השבוע
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="bg-[#fff9f3] p-3 rounded-xl border border-[#ffdcc6]">
              <span className="font-bold text-[#7a4b29] block mb-0.5">ארוחת בוקר:</span>
              <p className="text-[#51443c]">{todayMenu?.breakfast || 'דייסה מזינה, גבינה ופירות'}</p>
            </div>
            <div className="bg-[#fffbeb] p-3 rounded-xl border border-[#fde68a]">
              <span className="font-bold text-[#92400e] block mb-0.5">ארוחת צהריים עיקרית (בשרי/דג):</span>
              <p className="text-[#51443c] font-medium">{todayMenu?.lunch || 'קציצות הודו ברוטב, תוספת וסלט ירקות'}</p>
            </div>
            <div className="bg-[#fff9f3] p-3 rounded-xl border border-[#ffdcc6]">
              <span className="font-bold text-[#7a4b29] block mb-0.5">ארוחת מנחה:</span>
              <p className="text-[#51443c]">{todayMenu?.afternoonSnack || 'פרי עונתי וכריך'}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#e4e2de]">
            <span className="text-[11px] text-[#7a4b29] font-semibold block mb-1">אלרגנים בתפריט היום:</span>
            <div className="flex flex-wrap gap-1.5">
              {(todayMenu?.allergensPresent || []).map((allergen, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#efeeea] text-[#5f3414] rounded-md text-[11px] font-medium"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modules Quick Access & Feature Highlights */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#e4e2de] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#5f3414] text-base font-heading">
              מודולי ניהול תפעוליים - פורטל המנהלת
            </h3>
            <span className="text-xs text-[#7a4b29] font-semibold">אריאל, שומרון</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              onClick={() => onNavigateTab('children')}
              className="p-4 rounded-xl border border-[#e4e2de] hover:border-[#d97706] hover:bg-[#fff9f3]/60 transition cursor-pointer flex items-start gap-3.5 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffdeab] text-[#5f3414] flex items-center justify-center flex-shrink-0">
                <Baby className="w-5 h-5 text-[#7a4b29]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#5f3414]">1. ילדים, הורים ופדגוגיה</h4>
                <p className="text-xs text-[#51443c] mt-0.5">
                  תיק אישי לכל ילד, אלרגיות, מעקב שינה וחיתולים, וסיכום יומי לוואטסאפ.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('finance')}
              className="p-4 rounded-xl border border-[#e4e2de] hover:border-[#d97706] hover:bg-[#fff9f3]/60 transition cursor-pointer flex items-start gap-3.5 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffdeab] text-[#5f3414] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#7a4b29]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#5f3414]">2. כספים ומיסוי ישראלי</h4>
                <p className="text-xs text-[#51443c] mt-0.5">
                  מעקב עוסק פטור 2026, מגבלת 6,000 ₪ בחוק המזומן, קבלות פנימיות ודוח לרו"ח.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('staff')}
              className="p-4 rounded-xl border border-[#e4e2de] hover:border-[#d97706] hover:bg-[#fff9f3]/60 transition cursor-pointer flex items-start gap-3.5 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffdeab] text-[#5f3414] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#7a4b29]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#5f3414]">3. כוח אדם ותקינת פיקוח</h4>
                <p className="text-xs text-[#51443c] mt-0.5">
                  שעון נוכחות, שעות נוספות 125%/150%, תקינת יחס מטפלת-ילד ותוקף החייאה.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('ai-advisor')}
              className="p-4 rounded-xl border border-[#e4e2de] hover:border-[#d97706] hover:bg-[#fff9f3]/60 transition cursor-pointer flex items-start gap-3.5 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ffdeab] text-[#5f3414] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#7a4b29]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#5f3414]">יועץ חוקי ורגולציה AI</h4>
                <p className="text-xs text-[#51443c] mt-0.5">
                  חיפוש חוקי עבודה, תקנות פיקוח ומיסוי מעודכנים מ-Google Search וחשיבה עמוקה.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
