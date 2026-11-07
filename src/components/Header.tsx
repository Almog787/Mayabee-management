import React, { useState } from 'react';
import { PWAInstallButton } from './common/PWAInstallButton';
import {
  Users,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Lock,
  Unlock,
  TrendingUp,
  Phone,
  Sparkles,
  Building,
} from 'lucide-react';
import { ComplianceRatioResult, DaycareSettings } from '../types';
import { TaxStatusReport } from '../lib/taxEngine';

import daycareLogo from '../assets/images/applet_daycare_logo_1793960832604.jpg';

export type AppTab = 'planner' | 'management-suggestions' | 'business-suggestions';

interface HeaderProps {
  settings: DaycareSettings | null;
  activeChildrenCount: number;
  presentChildrenCount: number;
  ratioCompliance: ComplianceRatioResult;
  taxStatus: TaxStatusReport;
  allergyConflictsCount: number;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenBackupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeChildrenCount,
  presentChildrenCount,
  ratioCompliance,
  taxStatus,
  allergyConflictsCount,
  activeTab,
  onSelectTab,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const todayHebrew = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const logoUrl = daycareLogo;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-2 sm:h-16 gap-3">
          {/* Brand & BI System Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-0.5 bg-slate-800 ring-1 ring-cyan-500/30 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                {logoLoaded ? (
                  <img
                    src={logoUrl}
                    alt="לוגו מערכת ניהול"
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setLogoLoaded(false)}
                  />
                ) : (
                  <span className="text-lg">📊</span>
                )}
              </div>

              <div className="flex flex-col text-right">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-tight">
                    מערכת ניהול מעון ילדים
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-semibold tracking-wider">
                    BI ANALYTICS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span>מאזן חכם, חיזוי תזרימי וסימולציות</span>
                  <span className="hidden md:inline text-slate-600">·</span>
                  <span className="hidden md:flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    {todayHebrew}
                  </span>
                </p>
              </div>
            </div>

            <div className="md:hidden">
              <PWAInstallButton />
            </div>
          </div>

          {/* Navigation Tabs (Superset Workspace Slices) */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold shadow-inner overflow-x-auto max-w-full">
            <button
              onClick={() => onSelectTab('planner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'planner'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>דשבורד מאזן ו-BI</span>
            </button>

            <button
              onClick={() => onSelectTab('management-suggestions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'management-suggestions'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>הצעות לניהול</span>
            </button>

            <button
              onClick={() => onSelectTab('business-suggestions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'business-suggestions'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>הצעות לאתר הגן (Mayabee) 🏡</span>
            </button>
          </div>

          {/* Action Buttons: PWA Install only on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </header>
  );
};
