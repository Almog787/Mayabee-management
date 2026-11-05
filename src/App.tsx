/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDaycareData } from './hooks/useDaycareData';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ReceiptModal } from './components/common/ReceiptModal';
import { BackupSyncModule } from './components/modules/BackupSyncModule';
import { QuickMasterPlannerModule } from './components/modules/QuickMasterPlannerModule';
import { FinancialTransaction } from './types';
import {
  TrendingUp,
  Building2,
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

      {/* Main Single-Page Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <QuickMasterPlannerModule
          settings={settings}
          onUpdateSettings={updateSettings}
        />
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
