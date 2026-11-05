/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDaycareData } from './hooks/useDaycareData';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ReceiptModal } from './components/common/ReceiptModal';
import { DashboardModule } from './components/modules/DashboardModule';
import { ChildrenModule } from './components/modules/ChildrenModule';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { StaffModule } from './components/modules/StaffModule';
import { LogisticsModule } from './components/modules/LogisticsModule';
import { AiAdvisorModule } from './components/modules/AiAdvisorModule';
import { BackupSyncModule } from './components/modules/BackupSyncModule';
import { QuickMasterPlannerModule } from './components/modules/QuickMasterPlannerModule';
import { MonthlyBalancePlannerModule } from './components/modules/MonthlyBalancePlannerModule';
import { FinancialTransaction } from './types';
import {
  TrendingUp,
  LayoutDashboard,
  Baby,
  UserCheck,
  CreditCard,
  Clock,
  Utensils,
  Sparkles,
  ShieldCheck,
  Building2,
  HardDrive,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';

export default function App() {
  const {
    loading,
    children,
    activeChildren,
    presentChildren,
    attendance,
    dailyLogs,
    transactions,
    staff,
    shifts,
    activeClockedStaff,
    menu,
    todayMenu,
    allergenConflicts,
    safetyChecks,
    settings,
    ratioCompliance,
    taxStatus,
    todayStr,
    addChild,
    updateChild,
    deleteChild,
    setAttendanceStatus,
    markCheckIn,
    markCheckOut,
    quickCheckInAll,
    saveDailyLog,
    addTransaction,
    deleteTransaction,
    addStaff,
    updateStaff,
    clockInStaff,
    clockOutStaff,
    updateSafetyCheck,
    updateSettings,
    refreshData,
  } = useDaycareData();

  const [activeTab, setActiveTab] = useState<string>('master-planner');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<FinancialTransaction | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center shadow-xl animate-bounce mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800">טוען את נתוני המעון...</h2>
        <p className="text-xs text-slate-500 mt-1">מאתחל מסד נתונים מקומי (IndexedDB / Dexie)...</p>
      </div>
    );
  }

  const navItems = [
    {
      id: 'master-planner',
      label: 'מחשבון מאזן מהיר 📊',
      icon: TrendingUp,
      badge: 'דף ראשון',
      badgeColor: 'bg-[#ffdeab] text-[#5f3414] font-bold',
    },
    {
      id: 'planner',
      label: 'תכנון מאזן ומידע חסר 📊',
      icon: TrendingUp,
      badge: 'גלאי פערים',
      badgeColor: 'bg-[#ffdeab] text-[#5f3414] font-bold',
    },
    {
      id: 'dashboard',
      label: 'דשבורד ראשי 🐝',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'children',
      label: 'ילדים ופדגוגיה',
      icon: Baby,
      badge: `${activeChildren.length} ילדים`,
      badgeColor: 'bg-[#ffdeab] text-[#5f3414]',
    },
    {
      id: 'attendance',
      label: 'יומן נוכחות',
      icon: UserCheck,
      badge: `${presentChildren.length}/${activeChildren.length}`,
      badgeColor: 'bg-[#fef3c7] text-[#92400e]',
    },
    {
      id: 'finance',
      label: 'כספים ומיסוי',
      icon: CreditCard,
      badge: `${taxStatus.percentageUsed.toFixed(0)}%`,
      badgeColor: taxStatus.percentageUsed >= 80 ? 'bg-[#ffdcc6] text-[#c2410c] font-bold' : undefined,
    },
    {
      id: 'staff',
      label: 'צוות ותקינת פיקוח',
      icon: Clock,
      badge: ratioCompliance.isCompliant ? 'תקין' : 'חריגה!',
      badgeColor: ratioCompliance.isCompliant ? 'bg-[#ecfdf5] text-[#065f46]' : 'bg-[#fff1f2] text-[#9f1239] animate-pulse font-bold',
    },
    {
      id: 'logistics',
      label: 'תזונה, אלרגנים ובטיחות',
      icon: Utensils,
      badge: allergenConflicts.length > 0 ? `אלרגיה (${allergenConflicts.length})` : undefined,
      badgeColor: 'bg-[#fff1f2] text-[#9f1239] font-bold',
    },
    {
      id: 'ai-advisor',
      label: 'יועץ רגולציה AI',
      icon: Sparkles,
      badge: 'Google Search',
      badgeColor: 'bg-[#fef3c7] text-[#7a4b29] font-bold',
    },
    {
      id: 'backup',
      label: 'בקרת תקינות, סנכרון וגיבוי',
      icon: FileSpreadsheet,
      badge: 'תקינות 100%',
      badgeColor: 'bg-[#ecfdf5] text-[#065f46] font-bold',
    },
  ];

  const receiptChild = selectedReceiptTx?.childId
    ? children.find((c) => c.id === selectedReceiptTx.childId)
    : undefined;

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1b1c1a] flex flex-col font-['Heebo','Rubik',sans-serif] selection:bg-[#ffdeab] selection:text-[#5f3414]">
      {/* Top Header */}
      <Header
        settings={settings}
        activeChildrenCount={activeChildren.length}
        presentChildrenCount={presentChildren.length}
        ratioCompliance={ratioCompliance}
        taxStatus={taxStatus}
        allergyConflictsCount={allergenConflicts.length}
        onOpenBackupModal={() => setActiveTab('backup')}
      />

      {/* Main Navigation Tabs */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-[#e4e2de] sticky top-16 sm:top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-reverse space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-[#7a4b29] text-white shadow-xs'
                      : 'text-[#51443c] hover:text-[#5f3414] hover:bg-[#efeeea]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffdeab]' : 'text-[#7a4b29]/70'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-[#efeeea] text-[#5f3414]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'master-planner' && (
          <QuickMasterPlannerModule
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        )}

        {activeTab === 'planner' && (
          <MonthlyBalancePlannerModule
            children={children}
            transactions={transactions}
            staff={staff}
            shifts={shifts}
            settings={settings}
            taxStatus={taxStatus}
            onAddTransaction={addTransaction}
            onUpdateChild={updateChild}
            onUpdateSettings={updateSettings}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardModule
            children={children}
            activeChildren={activeChildren}
            presentChildren={presentChildren}
            attendance={attendance}
            staff={staff}
            activeClockedStaff={activeClockedStaff}
            ratioCompliance={ratioCompliance}
            taxStatus={taxStatus}
            todayMenu={todayMenu}
            allergenConflicts={allergenConflicts}
            safetyChecks={safetyChecks}
            settings={settings}
            onNavigateTab={setActiveTab}
            onQuickCheckInAll={quickCheckInAll}
          />
        )}

        {activeTab === 'children' && (
          <ChildrenModule
            children={children}
            dailyLogs={dailyLogs}
            todayStr={todayStr}
            onAddChild={addChild}
            onUpdateChild={updateChild}
            onDeleteChild={deleteChild}
            onSaveDailyLog={saveDailyLog}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceModule
            children={children}
            attendance={attendance}
            todayStr={todayStr}
            onSetAttendanceStatus={setAttendanceStatus}
            onMarkCheckIn={markCheckIn}
            onMarkCheckOut={markCheckOut}
            onQuickCheckInAll={quickCheckInAll}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceModule
            transactions={transactions}
            children={children}
            settings={settings}
            taxStatus={taxStatus}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            onUpdateSettings={updateSettings}
            onOpenReceipt={(tx) => setSelectedReceiptTx(tx)}
          />
        )}

        {activeTab === 'staff' && (
          <StaffModule
            staff={staff}
            shifts={shifts}
            presentChildren={presentChildren}
            ratioCompliance={ratioCompliance}
            todayStr={todayStr}
            onClockIn={clockInStaff}
            onClockOut={clockOutStaff}
            onAddStaff={addStaff}
            onUpdateStaff={updateStaff}
          />
        )}

        {activeTab === 'logistics' && (
          <LogisticsModule
            menu={menu}
            todayMenu={todayMenu}
            presentChildren={presentChildren}
            allergenConflicts={allergenConflicts}
            safetyChecks={safetyChecks}
            onUpdateSafetyCheck={updateSafetyCheck}
          />
        )}

        {activeTab === 'ai-advisor' && <AiAdvisorModule />}

        {activeTab === 'backup' && (
          <BackupSyncModule
            settings={settings}
            children={children}
            attendance={attendance}
            transactions={transactions}
            staff={staff}
            shifts={shifts}
            menu={menu}
            todayMenu={todayMenu}
            safetyChecks={safetyChecks}
            ratioCompliance={ratioCompliance}
            onUpdateSettings={updateSettings}
            onRefreshData={refreshData}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Internal Receipt & Voucher Modal */}
      {selectedReceiptTx && (
        <ReceiptModal
          transaction={selectedReceiptTx}
          child={receiptChild}
          settings={settings}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}

      {/* Offline Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
