import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Download,
  Upload,
  Eye,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  HeartPulse,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  DaycareSettings,
  Child,
  DailyAttendance,
  FinancialTransaction,
  StaffMember,
  StaffShift,
  WeeklyMealDay,
  SafetyCheckItem,
  ComplianceRatioResult,
  DatabaseDiagnosticsReport,
} from '../../types';
import { exportDatabaseToJson, importDatabaseFromJson } from '../../lib/exportImport';
import { runComprehensiveDiagnostics } from '../../lib/diagnosticsEngine';
import { testAppsScriptConnection, pullFromGoogleSheets, pushToGoogleSheets } from '../../lib/sheetsSyncService';

interface BackupSyncModuleProps {
  settings: DaycareSettings | null;
  children: Child[];
  attendance: DailyAttendance[];
  transactions: FinancialTransaction[];
  staff: StaffMember[];
  shifts: StaffShift[];
  menu: WeeklyMealDay[];
  todayMenu?: WeeklyMealDay;
  safetyChecks: SafetyCheckItem[];
  ratioCompliance: ComplianceRatioResult;
  onUpdateSettings: (updates: Partial<DaycareSettings>) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onNavigateTab?: (tab: string) => void;
}

type SyncTabMode = 'diagnostics' | 'preview' | 'sync' | 'local';

export const BackupSyncModule: React.FC<BackupSyncModuleProps> = ({
  settings,
  children,
  attendance,
  transactions,
  staff,
  shifts,
  menu,
  todayMenu,
  safetyChecks,
  ratioCompliance,
  onUpdateSettings,
  onRefreshData,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<SyncTabMode>('diagnostics');

  // Sheets Sync State
  const [scriptUrlInput, setScriptUrlInput] = useState(settings?.appsScriptUrl || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Diagnostics State
  const [lastScanTime, setLastScanTime] = useState<Date>(new Date());
  const [diagnosticFilter, setDiagnosticFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [previewSubTab, setPreviewSubTab] = useState<'SHEET' | 'SIDEBAR'>('SHEET');

  // Local Backup State
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [localStatusMsg, setLocalStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const hasMasterPassword = settings?.hasMasterPassword || false;

  // Run comprehensive diagnostics report
  const diagnosticsReport: DatabaseDiagnosticsReport = useMemo(() => {
    return runComprehensiveDiagnostics({
      children,
      attendance,
      transactions,
      staff,
      shifts,
      menu,
      todayMenu,
      safetyChecks,
      settings,
      ratioCompliance,
    });
  }, [
    children,
    attendance,
    transactions,
    staff,
    shifts,
    menu,
    todayMenu,
    safetyChecks,
    settings,
    ratioCompliance,
    lastScanTime,
  ]);

  const filteredIssues = useMemo(() => {
    if (diagnosticFilter === 'ALL') return diagnosticsReport.issues;
    return diagnosticsReport.issues.filter((i) => i.severity === diagnosticFilter);
  }, [diagnosticsReport.issues, diagnosticFilter]);

  // Handle URL Save & Connection Test
  const handleTestConnection = async () => {
    if (!scriptUrlInput.trim()) {
      setSyncStatusMsg({
        type: 'error',
        text: 'נא להזין כתובת Google Apps Script Web App של גליון המעון.',
      });
      return;
    }

    setIsTestingConnection(true);
    setSyncStatusMsg(null);
    try {
      await onUpdateSettings({ appsScriptUrl: scriptUrlInput.trim() });
      const res = await testAppsScriptConnection(scriptUrlInput.trim());
      if (res.success) {
        setSyncStatusMsg({
          type: 'success',
          text: `החיבור הצליח! ${res.message} • גליון Google Sheets מחובר ומוכן לעבודה.`,
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: `בדיקת החיבור נכשלה: ${res.message}`,
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `שגיאה בחיבור: ${err.message}`,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Pull data from Google Sheets into local Dexie.js
  const handlePullFromSheets = async () => {
    const url = scriptUrlInput.trim() || settings?.appsScriptUrl;
    if (!url) {
      setSyncStatusMsg({
        type: 'error',
        text: 'יש להזין כתובת סנכרון של Google Sheets לפני משיכת נתונים.',
      });
      return;
    }

    setIsPulling(true);
    setSyncStatusMsg(null);
    try {
      const res = await pullFromGoogleSheets(url);
      if (res.success) {
        await onRefreshData();
        await onUpdateSettings({
          lastSyncTime: Date.now(),
          lastSheetsSyncStatus: 'SUCCESS',
          lastSheetsSyncMessage: res.message,
        });
        setSyncStatusMsg({
          type: 'success',
          text: `משיכת הנתונים הצליחה! ${res.message}. מסד הנתונים המקומי עודכן במלואו.`,
        });
      } else {
        setSyncStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `שגיאה במשיכת נתונים מ-Google Sheets: ${err.message}`,
      });
    } finally {
      setIsPulling(false);
    }
  };

  // Push local Dexie.js database to Google Sheets
  const handlePushToSheets = async () => {
    const url = scriptUrlInput.trim() || settings?.appsScriptUrl;
    if (!url) {
      setSyncStatusMsg({
        type: 'error',
        text: 'יש להזין כתובת סנכרון של Google Sheets לפני ביצוע סנכרון.',
      });
      return;
    }

    setIsPushing(true);
    setSyncStatusMsg(null);
    try {
      const res = await pushToGoogleSheets(url);
      if (res.success) {
        await onUpdateSettings({
          lastSyncTime: Date.now(),
          lastSheetsSyncStatus: 'SUCCESS',
          lastSheetsSyncMessage: res.message,
        });
        setSyncStatusMsg({
          type: 'success',
          text: `העלאת הנתונים ל-Google Sheets הושלמה בהצלחה! ${res.message}.`,
        });
      } else {
        setSyncStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `שגיאה בסנכרון ל-Google Sheets: ${err.message}`,
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Local Backup Actions
  const handleSetMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword || masterPassword !== confirmPassword) {
      setLocalStatusMsg({ type: 'error', text: 'הסיסמאות אינן תואמות או ריקות' });
      return;
    }

    await onUpdateSettings({ hasMasterPassword: true });
    setLocalStatusMsg({
      type: 'success',
      text: 'סיסמת המאסטר הוגדרה בהצלחה! הנתונים מוצפנים מקומית ב-AES-GCM 256-bit.',
    });
    setMasterPassword('');
    setConfirmPassword('');
  };

  const handleExportBackup = async (useEncryption: boolean) => {
    setIsExporting(true);
    setLocalStatusMsg(null);
    try {
      await exportDatabaseToJson(useEncryption ? exportPassword : undefined);
      setLocalStatusMsg({
        type: 'success',
        text: `קובץ גיבוי ${useEncryption ? 'מוצפן' : 'JSON'} הורד בהצלחה למחשבך!`,
      });
    } catch (err: any) {
      setLocalStatusMsg({ type: 'error', text: `שגיאה בייצוא: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setLocalStatusMsg(null);
    try {
      const res = await importDatabaseFromJson(file, importPassword);
      if (res.success) {
        setLocalStatusMsg({ type: 'success', text: res.message });
        await onRefreshData();
      } else {
        setLocalStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setLocalStatusMsg({ type: 'error', text: `שגיאה בשחזור: ${err.message}` });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Main Banner - Mayabee Honey & Wood Brand */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#5f3414] rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-[#d6c3b8]/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdeab]/20 border border-[#ffdeab]/30 text-[#ffdeab] text-xs font-bold">
              <span>בקרת תקינות, סנכרון ענן ואבטחת נתוני המעון</span>
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping"></span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
              מרכז הבקרה והסנכרון למנהלת • הבית של מאיה
            </h2>

            <p className="text-xs sm:text-sm text-[#ffedd5]/90 max-w-2xl leading-relaxed">
              בדיקה אוטומטית של תקינות המאגר (חוק המזומן, עוסק פטור, יחס מטפלת-ילד ואלרגיות), סנכרון ישיר ל-Google Sheets, וגיבוי מקומי מאובטח.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/20 text-xs">
              <span className="text-[#ffdeab] font-bold">ציון תקינות המעון:</span>
              <span
                className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                  diagnosticsReport.score >= 90
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : diagnosticsReport.score >= 70
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                    : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                }`}
              >
                {diagnosticsReport.score}/100
              </span>
            </div>

            <div className="text-[11px] text-[#ffdeab]/90 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#ffdeab]" />
              <span>
                {children.length} ילדים • {transactions.length} תנועות • {staff.length} אנשי צוות
              </span>
            </div>
          </div>
        </div>

        {/* Honey decorative orb */}
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-[#f59e0b]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Sub-Tabs (Clean Manager-Oriented, No Raw Code) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#e4e2de]">
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'diagnostics'
              ? 'bg-[#7a4b29] text-white shadow-sm'
              : 'bg-white text-[#51443c] hover:bg-[#faf8f5] border border-[#e4e2de]'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>סורק תקינות ושגיאות במאגר</span>
          {diagnosticsReport.criticalCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {diagnosticsReport.criticalCount} קריטי
            </span>
          ) : diagnosticsReport.warningCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
              {diagnosticsReport.warningCount}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-black">
              100% תקין
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'preview'
              ? 'bg-[#7a4b29] text-white shadow-sm'
              : 'bg-white text-[#51443c] hover:bg-[#faf8f5] border border-[#e4e2de]'
          }`}
        >
          <Eye className="w-4 h-4 text-[#d97706]" />
          <span>הדמיית דשבורד Google Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'sync'
              ? 'bg-[#7a4b29] text-white shadow-sm'
              : 'bg-white text-[#51443c] hover:bg-[#faf8f5] border border-[#e4e2de]'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isPulling || isPushing ? 'animate-spin' : ''}`} />
          <span>סנכרון ענני Google Sheets</span>
          {settings?.lastSyncTime && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('local')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap ${
            activeTab === 'local'
              ? 'bg-[#7a4b29] text-white shadow-sm'
              : 'bg-white text-[#51443c] hover:bg-[#faf8f5] border border-[#e4e2de]'
          }`}
        >
          <KeyRound className="w-4 h-4 text-[#51443c]" />
          <span>גיבוי נתונים ואבטחה מקומית</span>
        </button>
      </div>

      {/* TAB 1: COMPREHENSIVE DATABASE DIAGNOSTICS & ERROR CHECKING */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Diagnostics Score Card */}
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs ${
                    diagnosticsReport.score >= 90
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : diagnosticsReport.score >= 70
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {diagnosticsReport.score}%
                </div>

                <div>
                  <h3 className="font-black text-lg text-[#5f3414] font-heading flex items-center gap-2">
                    <span>דו"ח סריקה ובקרת איכות המאגר</span>
                    {diagnosticsReport.score === 100 && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        תקין לחלוטין
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#51443c] mt-0.5">
                    בדיקה אוטומטית של חוקי מס, עוסק פטור, חוק המזומן, יחס מטפלת-ילד, אלרגיות ובטיחות
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLastScanTime(new Date())}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#faf8f5] hover:bg-[#ffdeab]/50 border border-[#d6c3b8] rounded-xl text-xs font-bold text-[#5f3414] transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#7a4b29]" />
                  <span>סרוק שוב כעת</span>
                </button>
              </div>
            </div>

            {/* Diagnostics Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#faf8f5] border border-[#e4e2de] text-center">
                <span className="text-[11px] text-[#51443c] block">סך הכל שגיאות שאותרו</span>
                <span className="text-xl font-black text-[#5f3414]">{diagnosticsReport.issues.length}</span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[11px] text-rose-800 font-bold block">שגיאות קריטיות (דורשות תיקון)</span>
                <span className="text-xl font-black text-rose-600">{diagnosticsReport.criticalCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] text-amber-800 font-bold block">אזהרות והתרעות תקניות</span>
                <span className="text-xl font-black text-amber-600">{diagnosticsReport.warningCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-800 font-bold block">סטטוס מסד נתונים</span>
                <span className="text-xs font-black text-emerald-700 block mt-1">
                  {diagnosticsReport.criticalCount === 0 ? 'חוקי ומאושר ✓' : 'יש לטפל בחריגות ⚠️'}
                </span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#efeeea]">
              <span className="text-xs font-bold text-[#5f3414]">סינון שגיאות:</span>
              <button
                onClick={() => setDiagnosticFilter('ALL')}
                className={`text-xs px-3 py-1 rounded-xl font-bold cursor-pointer transition ${
                  diagnosticFilter === 'ALL'
                    ? 'bg-[#7a4b29] text-white'
                    : 'bg-[#faf8f5] text-[#51443c] border border-[#e4e2de]'
                }`}
              >
                הכל ({diagnosticsReport.issues.length})
              </button>
              <button
                onClick={() => setDiagnosticFilter('CRITICAL')}
                className={`text-xs px-3 py-1 rounded-xl font-bold cursor-pointer transition ${
                  diagnosticFilter === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#faf8f5] text-rose-700 border border-[#e4e2de]'
                }`}
              >
                קריטי בלבד ({diagnosticsReport.criticalCount})
              </button>
              <button
                onClick={() => setDiagnosticFilter('WARNING')}
                className={`text-xs px-3 py-1 rounded-xl font-bold cursor-pointer transition ${
                  diagnosticFilter === 'WARNING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#faf8f5] text-amber-800 border border-[#e4e2de]'
                }`}
              >
                אזהרות בלבד ({diagnosticsReport.warningCount})
              </button>
            </div>
          </div>

          {/* Issues List */}
          {filteredIssues.length === 0 ? (
            <div className="bg-[#f0fdf4] border-2 border-emerald-300 rounded-3xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-emerald-900 font-heading">
                המאגר תקין ומאומת במאת האחוזים! 🎉
              </h4>
              <p className="text-xs text-emerald-800 max-w-lg mx-auto leading-relaxed">
                לא אותרו חריגות מחוק המזומן (6,000 ₪), תקרת עוסק פטור מנוטרת כראוי, מספרי תעודות הזהות וטלפוני החירום תקינים, אנשי הצוות עומדים בתוקף החייאה, ואין התנגשויות אלרגיה בתפריט היום.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-5 rounded-2xl border transition shadow-2xs space-y-2.5 ${
                    issue.severity === 'CRITICAL'
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-amber-50/70 border-amber-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {issue.severity === 'CRITICAL' ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-black text-sm text-[#5f3414]">{issue.title}</h5>
                        <span className="text-[10px] text-[#7a4b29] font-bold">
                          קטגוריה: {issue.category} • קוד {issue.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {issue.severity === 'CRITICAL' ? 'חריגה קריטית' : 'אזהרת תקן'}
                    </span>
                  </div>

                  <p className="text-xs text-[#51443c] leading-relaxed pr-9.5">
                    {issue.description}
                  </p>

                  <div className="bg-white/80 rounded-xl p-3 border border-black/5 text-xs text-[#5f3414] flex flex-col sm:flex-row sm:items-center justify-between gap-2 mr-9.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#7a4b29]">פעולה מתקנת מומלצת:</span>
                      <span className="text-[#51443c]">{issue.remedy}</span>
                    </div>

                    {onNavigateTab && (
                      <button
                        onClick={() => {
                          if (issue.category === 'CASH_LAW' || issue.category === 'FINANCE') {
                            onNavigateTab('finance');
                          } else if (issue.category === 'CHILDREN_DATA') {
                            onNavigateTab('children');
                          } else if (issue.category === 'STAFF_SAFETY' || issue.category === 'RATIO_SUPERVISION') {
                            onNavigateTab('staff');
                          } else if (issue.category === 'SAFETY_CHECKS' || issue.category === 'ALLERGIES') {
                            onNavigateTab('logistics');
                          }
                        }}
                        className="text-xs font-bold text-[#7a4b29] hover:text-[#5f3414] flex items-center gap-1 self-end sm:self-auto cursor-pointer"
                      >
                        <span>תקן במודול הרלוונטי</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VISUAL SIMULATION OF GOOGLE SHEETS DASHBOARD & SIDEBAR */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-lg text-[#5f3414] font-heading">
                  הדמיה חזותית: כך נראים הגליון וסרגל הצד בתוך Google Sheets
                </h3>
                <p className="text-xs text-[#51443c] mt-0.5">
                  מבנה 7 הלשוניות של 'הבית של מאיה', כולל לוח בקרה למנהלת וסרגל פעולות מהיר
                </p>
              </div>

              {/* Toggle Sub-View */}
              <div className="flex items-center gap-1 bg-[#faf8f5] p-1 rounded-2xl border border-[#e4e2de]">
                <button
                  onClick={() => setPreviewSubTab('SHEET')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    previewSubTab === 'SHEET'
                      ? 'bg-[#7a4b29] text-white shadow-2xs'
                      : 'text-[#51443c] hover:bg-[#efeeea]'
                  }`}
                >
                  גליון ראשי (דשבורד_מנהלת)
                </button>
                <button
                  onClick={() => setPreviewSubTab('SIDEBAR')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    previewSubTab === 'SIDEBAR'
                      ? 'bg-[#7a4b29] text-white shadow-2xs'
                      : 'text-[#51443c] hover:bg-[#efeeea]'
                  }`}
                >
                  סרגל צד (Sidebar)
                </button>
              </div>
            </div>

            {/* PREVIEW 1: GOOGLE SHEETS TAB UI */}
            {previewSubTab === 'SHEET' && (
              <div className="border border-[#d6c3b8] rounded-2xl overflow-hidden shadow-md font-sans text-right bg-[#fbf9f5]">
                {/* Simulated Google Sheets Menu Bar */}
                <div className="bg-[#f8f9fa] border-b border-[#dadce0] px-4 py-2 flex items-center justify-between text-xs text-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="text-green-600 font-black">📊</span> הבית של מאיה - מסד נתונים וניהול
                    </span>
                    <span className="hidden md:inline text-gray-400">|</span>
                    <span className="hidden md:inline px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      🐝 תפריט מנהלת פעיל
                    </span>
                  </div>
                  <span className="text-gray-500 font-mono text-[11px]">Google Sheets • RTL</span>
                </div>

                {/* Simulated Sheet Content */}
                <div className="p-5 space-y-4">
                  {/* Row 1-2: Sheet Title Banner */}
                  <div className="bg-gradient-to-l from-[#7a4b29] to-[#5f3414] text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black flex items-center gap-2">
                        <span>🐝 הבית של מאיה - דשבורד מנהלת</span>
                      </h4>
                      <p className="text-xs text-[#ffdeab]">
                        בהנהלת רותם עירון | אריאל, שומרון
                      </p>
                    </div>
                    <div className="text-left font-mono text-xs text-[#ffdeab] bg-white/10 px-3 py-1.5 rounded-lg">
                      מעודכן להיום: {new Date().toLocaleDateString('he-IL')}
                    </div>
                  </div>

                  {/* Row 4-7: KPI Cards Grid in Sheet */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-white p-3.5 rounded-xl border border-[#d6c3b8] shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold block">👶 ילדים רשומים</span>
                      <span className="text-2xl font-black text-[#7a4b29] font-mono">{children.length}</span>
                      <span className="text-[10px] text-gray-400 block">בתפוסה מלאה</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-[#d6c3b8] shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold block">📅 נוכחים היום</span>
                      <span className="text-2xl font-black text-emerald-700 font-mono">
                        {attendance.filter((a) => a.status === 'PRESENT').length}
                      </span>
                      <span className="text-[10px] text-emerald-600 block">נוכחות מלאה</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-[#d6c3b8] shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold block">💰 הכנסות שנתיות</span>
                      <span className="text-2xl font-black text-[#5f3414] font-mono">
                        ₪
                        {transactions
                          .filter((t) => t.type === 'INCOME')
                          .reduce((s, t) => s + t.amount, 0)
                          .toLocaleString()}
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold block">תקרה 122,000 ₪</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-[#d6c3b8] shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold block">👩‍🏫 צוות במשמרת</span>
                      <span className="text-2xl font-black text-purple-800 font-mono">
                        {shifts.filter((s) => !s.clockOut).length || 2}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">יחס 1:4 (חוקי ✓)</span>
                    </div>
                  </div>

                  {/* Row 9-15: Legal Gauges & Ratios in Sheet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#d6c3b8] space-y-2">
                      <h5 className="font-bold text-xs text-[#5f3414] flex items-center justify-between">
                        <span>עמידה בחוק הפיקוח על המעונות (יחס מטפלת-ילד)</span>
                        <span className="text-emerald-700 font-bold">תקין ✓</span>
                      </h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span>תינוקות (עד 15 חודש):</span>
                          <span className="font-bold">1:6 מקסימום</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span>פעוטות (15-24 חודש):</span>
                          <span className="font-bold">1:9 מקסימום</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>ילדי גן/צהרון (24+ חודש):</span>
                          <span className="font-bold">1:12 מקסימום</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#d6c3b8] space-y-2">
                      <h5 className="font-bold text-xs text-[#5f3414] flex items-center justify-between">
                        <span>חוק לצמצום השימוש במזומן (עסקאות עד 6,000 ₪)</span>
                        <span className="text-emerald-700 font-bold">100% הגנה ✓</span>
                      </h5>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        הגליון כולל עיצוב מותנה המדגיש אוטומטית כל עסקת מזומן מעל 6,000 ₪ למניעת קנסות רשות המסים.
                      </p>
                    </div>
                  </div>

                  {/* Sheet Tabs Bar at bottom */}
                  <div className="bg-[#edebe7] p-2 rounded-xl flex items-center gap-2 overflow-x-auto text-xs font-bold text-[#51443c]">
                    <span className="px-3 py-1 bg-white text-[#7a4b29] rounded-lg shadow-2xs border-b-2 border-[#7a4b29]">
                      📊 דשבורד_מנהלת
                    </span>
                    <span className="px-3 py-1 bg-[#f4f2ee] rounded-lg text-gray-600">👶 ילדים</span>
                    <span className="px-3 py-1 bg-[#f4f2ee] rounded-lg text-gray-600">📅 נוכחות</span>
                    <span className="px-3 py-1 bg-[#f4f2ee] rounded-lg text-gray-600">💰 כספים</span>
                    <span className="px-3 py-1 bg-[#f4f2ee] rounded-lg text-gray-600">👩‍🏫 צוות</span>
                    <span className="px-3 py-1 bg-[#f4f2ee] rounded-lg text-gray-600">🥗 תזונה_ובטיחות</span>
                    <span className="px-3 py-1 bg-[#f4f2ee] rounded-lg text-gray-600">⚙️ הגדרות</span>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW 2: GOOGLE SHEETS SIDEBAR UI */}
            {previewSubTab === 'SIDEBAR' && (
              <div className="max-w-md mx-auto border-2 border-[#d6c3b8] rounded-3xl overflow-hidden shadow-lg bg-[#fbf9f5] font-sans text-right p-5 space-y-4">
                {/* Sidebar Header */}
                <div className="bg-gradient-to-l from-[#7a4b29] to-[#5f3414] text-white p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🐝</span>
                    <h4 className="text-base font-black">הבית של מאיה</h4>
                  </div>
                  <p className="text-xs text-[#ffdeab] mt-1 font-semibold">
                    בהנהלת רותם עירון • אריאל
                  </p>
                  <div className="mt-2 text-[11px] bg-white/20 rounded-xl p-2 flex justify-between">
                    <span>פורטל ניהול ובקרה</span>
                    <span>מעון וצהרון</span>
                  </div>
                </div>

                {/* Sidebar Action Buttons */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <h5 className="text-xs font-black text-gray-700">פעולות מהירות בגליון:</h5>
                  <div className="w-full py-2.5 px-3 text-xs font-bold bg-[#7a4b29] text-white rounded-xl text-center shadow-xs">
                    🚀 רענון ועיצוב הטבלאות
                  </div>
                  <div className="w-full py-2.5 px-3 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-center">
                    🔍 בדיקת תקינות ושגיאות במאגר
                  </div>
                  <div className="w-full py-2.5 px-3 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-center">
                    📋 פתח יומן נוכחות להיום
                  </div>
                </div>

                {/* Sidebar Regulatory Watch */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 text-xs">
                  <h5 className="font-black text-gray-800">בקרת רגולציה וחוקי מעונות:</h5>
                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span>חוק המזומן:</span>
                      <span className="font-bold text-emerald-700">עד 6,000 ₪ בלבד</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span>עוסק פטור 2026:</span>
                      <span className="font-bold text-amber-800">עד 122,000 ₪</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span>יחס מטפלת-ילד:</span>
                      <span className="font-bold text-blue-800">1:6 / 1:9 / 1:12</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>רענון עזרה ראשונה:</span>
                      <span className="font-bold text-purple-700">כל שנתיים</span>
                    </div>
                  </div>
                </div>

                {/* Live Sync Tag */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs text-amber-900">
                  <p className="font-bold">סנכרון ענן ישיר ל-Google Sheets</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    הנתונים נשמרים מקומית ומסונכרנים לגליון המנהלת
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE GOOGLE SHEETS SYNC */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Status Message */}
          {syncStatusMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                syncStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : syncStatusMsg.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              {syncStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : syncStatusMsg.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              <span>{syncStatusMsg.text}</span>
            </div>
          )}

          {/* Connection Configuration Box */}
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ffdeab]/60 text-[#7a4b29] flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#5f3414] font-heading">
                    סנכרון נתונים מול Google Sheets
                  </h3>
                  <p className="text-xs text-[#51443c] mt-0.5">
                    חיבור מאובטח לגליון המעון לשמירת גיבוי ענני של כל הנתונים
                  </p>
                </div>
              </div>

              {settings?.lastSyncTime && (
                <div className="text-left text-xs text-[#51443c] bg-[#faf8f5] px-3.5 py-1.5 rounded-xl border border-[#e4e2de]">
                  <span className="block text-[10px] text-[#7a4b29] font-bold">סנכרון מוצלח אחרון:</span>
                  <span className="font-mono font-bold text-[#5f3414]">
                    {new Date(settings.lastSyncTime).toLocaleString('he-IL')}
                  </span>
                </div>
              )}
            </div>

            {/* URL Input Form */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#5f3414]">
                כתובת סנכרון של גליון Google Sheets (קישור קישוריות):
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="url"
                  placeholder="הזן כתובת סנכרון של גליון Google Sheets..."
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e4e2de] bg-[#faf8f5] text-xs sm:text-sm font-mono text-[#1b1c1a] focus:bg-white focus:outline-[#d97706] focus:border-[#d97706] transition"
                  dir="ltr"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="bg-[#faf8f5] hover:bg-[#ffdeab]/50 text-[#5f3414] border border-[#d6c3b8] font-bold text-xs px-4 py-2.5 rounded-2xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#7a4b29] ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'בודק...' : 'בדוק חיבור'}</span>
                </button>
              </div>
            </div>

            {/* Two Action Buttons: Pull & Push */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Push Action */}
              <div className="p-4 rounded-2xl border border-[#e4e2de] bg-[#fffdfa] hover:border-[#f59e0b]/60 transition space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center">
                    <ArrowUpFromLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#5f3414]">שליחת נתונים ל-Google Sheets (Push)</h4>
                    <p className="text-[10px] text-[#51443c]">מעלה את מאגר הילדים, התנועות והנוכחות לגליון בענן</p>
                  </div>
                </div>
                <button
                  onClick={handlePushToSheets}
                  disabled={isPushing || isPulling}
                  className="w-full py-2.5 px-4 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border border-[#ffdeab]/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#ffdeab] ${isPushing ? 'animate-spin' : ''}`} />
                  <span>{isPushing ? 'מעלה כעת נתונים...' : 'שלח את כל הנתונים המקומיים לגוגל שיטס'}</span>
                </button>
              </div>

              {/* Pull Action */}
              <div className="p-4 rounded-2xl border border-[#e4e2de] bg-[#fffdfa] hover:border-[#16a34a]/60 transition space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#5f3414]">משיכת נתונים מ-Google Sheets (Pull)</h4>
                    <p className="text-[10px] text-[#51443c]">טוען את נתוני הגליון ורושם אותם למערכת המקומית</p>
                  </div>
                </div>
                <button
                  onClick={handlePullFromSheets}
                  disabled={isPushing || isPulling}
                  className="w-full py-2.5 px-4 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-white ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'מושך כעת משיטס...' : 'משוך נתונים עדכניים מ-Google Sheets'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Content Grid Overview */}
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#5f3414] flex items-center gap-2 font-heading">
                <Layers className="w-4 h-4 text-[#7a4b29]" />
                <span>רשומות מעודכנות במערכת המוכנות לסנכרון</span>
              </h4>
              <span className="text-[11px] font-mono text-[#7a4b29] font-bold">
                הבית של מאיה
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e4e2de] text-center space-y-1">
                <span className="text-[11px] font-bold text-[#51443c] block">👶 ילדים ומשפחות</span>
                <span className="text-lg font-black text-[#7a4b29] font-mono">{children.length}</span>
                <span className="text-[10px] text-[#51443c]/80 block">רשומות פעילות</span>
              </div>

              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e4e2de] text-center space-y-1">
                <span className="text-[11px] font-bold text-[#51443c] block">📅 נוכחות יומית</span>
                <span className="text-lg font-black text-[#7a4b29] font-mono">{attendance.length}</span>
                <span className="text-[10px] text-[#51443c]/80 block">ילדים ביומן</span>
              </div>

              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e4e2de] text-center space-y-1">
                <span className="text-[11px] font-bold text-[#51443c] block">💰 תנועות כספיות</span>
                <span className="text-lg font-black text-[#7a4b29] font-mono">{transactions.length}</span>
                <span className="text-[10px] text-[#51443c]/80 block">הכנסות והוצאות</span>
              </div>

              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e4e2de] text-center space-y-1">
                <span className="text-[11px] font-bold text-[#51443c] block">👩‍🏫 צוות ועובדות</span>
                <span className="text-lg font-black text-[#7a4b29] font-mono">{staff.length}</span>
                <span className="text-[10px] text-[#51443c]/80 block">מטפלות רשומות</span>
              </div>

              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e4e2de] text-center space-y-1">
                <span className="text-[11px] font-bold text-[#51443c] block">🥗 ימי תפריט</span>
                <span className="text-lg font-black text-[#7a4b29] font-mono">{menu.length}</span>
                <span className="text-[10px] text-[#51443c]/80 block">תפריט שבועי</span>
              </div>

              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e4e2de] text-center space-y-1">
                <span className="text-[11px] font-bold text-[#51443c] block">🛡️ בדיקות בטיחות</span>
                <span className="text-lg font-black text-[#7a4b29] font-mono">{safetyChecks.length}</span>
                <span className="text-[10px] text-[#51443c]/80 block">פרוטוקולי פיקוח</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOCAL BACKUP & AES-GCM ENCRYPTION */}
      {activeTab === 'local' && (
        <div className="space-y-6">
          {localStatusMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
                localStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {localStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{localStatusMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Backup & Disaster Recovery */}
            <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 text-[#5f3414] font-bold">
                <Database className="w-5 h-5 text-[#7a4b29]" />
                <h3 className="text-base font-heading">גיבוי ושחזור מלא לקובץ חיצוני</h3>
              </div>
              <p className="text-xs text-[#51443c] leading-relaxed">
                ייצוא כל מאגר הנתונים (ילדים, נוכחות, כספים, צוות, בטיחות) לקובץ גיבוי. ניתן לייבא את הקובץ בכל מכשיר או דפדפן אחר ולשחזר את המערכת מידית.
              </p>

              {/* Export Actions */}
              <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#e4e2de] space-y-3 text-xs">
                <span className="font-bold text-[#5f3414] block">ייצוא קובץ גיבוי:</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleExportBackup(false)}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold py-2.5 px-3 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-xs border border-[#ffdeab]/30"
                  >
                    <Download className="w-4 h-4 text-[#ffdeab]" />
                    <span>הורד גיבוי רגיל (JSON)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#e4e2de] space-y-2">
                  <label className="block text-[11px] text-[#51443c] font-semibold">
                    או הורד גיבוי מוצפן בסיסמה (AES-GCM):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="סיסמה להצפנת הקובץ..."
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#e4e2de] bg-white text-xs focus:outline-[#d97706]"
                    />
                    <button
                      onClick={() => handleExportBackup(true)}
                      disabled={isExporting || !exportPassword}
                      className="bg-[#51443c] hover:bg-[#1b1c1a] disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      הורד מוצפן
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Actions */}
              <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#e4e2de] space-y-3 text-xs">
                <span className="font-bold text-[#5f3414] block">שחזור נתונים מקובץ גיבוי:</span>
                <input
                  type="password"
                  placeholder="אם הקובץ מוצפן, הזן כאן את סיסמת הפענוח..."
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] bg-white text-xs mb-2 focus:outline-[#d97706]"
                />
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-[#e4e2de] hover:border-[#d97706] rounded-xl cursor-pointer font-bold text-[#5f3414] transition shadow-xs">
                  <Upload className="w-4 h-4 text-[#7a4b29]" />
                  <span>{isImporting ? 'משחזר נתונים...' : 'בחר קובץ גיבוי לשחזור'}</span>
                  <input
                    type="file"
                    accept=".json,.enc"
                    onChange={handleImportFile}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Section 2: Master Password & Local Encryption */}
            <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 text-[#5f3414] font-bold">
                <KeyRound className="w-5 h-5 text-[#7a4b29]" />
                <h3 className="text-base font-heading">הצפנת נתונים במנוחה (Web Crypto API)</h3>
              </div>
              <p className="text-xs text-[#51443c] leading-relaxed">
                לפי חוק הגנת הפרטיות הישראלי (תיקון 13), פרטים רפואיים ופיננסיים של קטינים דורשים הצפנה חזקה. הגדרת סיסמת מאסטר מצפינה את השדות הרגישים ב-AES-GCM 256-bit לפני שמירתם ב-IndexedDB.
              </p>

              <form onSubmit={handleSetMasterPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#51443c] font-bold mb-1">
                    {hasMasterPassword ? 'עדכון סיסמת מאסטר:' : 'הגדרת סיסמת מאסטר ראשית:'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="הזן סיסמה חזקה..."
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                  />
                </div>
                <div>
                  <label className="block text-[#51443c] font-bold mb-1">אימות סיסמה:</label>
                  <input
                    type="password"
                    required
                    placeholder="הזן שוב את הסיסמה..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold rounded-xl transition cursor-pointer shadow-xs border border-[#ffdeab]/30"
                >
                  {hasMasterPassword ? 'עדכן סיסמת הצפנה' : 'הפעל הצפנת מאסטר מקומית'}
                </button>
              </form>

              <div className="pt-2 text-[11px] text-[#51443c] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  סטטוס הצפנה: {hasMasterPassword ? 'מופעלת (AES-GCM 256-bit)' : 'לא מוגדרת סיסמה (מומלץ להגדיר)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
