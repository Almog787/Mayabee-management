/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDaycareData } from './hooks/useDaycareData';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { QuickMasterPlannerModule } from './components/modules/QuickMasterPlannerModule';
import { Building2 } from 'lucide-react';

export default function App() {
  const {
    loading,
    settings,
    updateSettings,
  } = useDaycareData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-600 text-white flex items-center justify-center shadow-xl animate-bounce mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800">טוען את נתוני המשפחתון...</h2>
        <p className="text-xs text-slate-500 mt-1">מאתחל מחשבון מאזן אישי בדירה...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Heebo','Rubik',sans-serif] selection:bg-teal-500/20 selection:text-teal-900">
      {/* Top Header for Private Home Daycare */}
      <Header
        settings={settings}
        onPrint={() => window.print()}
      />

      {/* Single Unified Page */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <QuickMasterPlannerModule
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      </main>

      {/* Offline Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
