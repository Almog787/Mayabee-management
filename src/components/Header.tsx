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
} from 'lucide-react';
import { ComplianceRatioResult, DaycareSettings } from '../types';
import { TaxStatusReport } from '../lib/taxEngine';

interface HeaderProps {
  settings: DaycareSettings | null;
  activeChildrenCount: number;
  presentChildrenCount: number;
  ratioCompliance: ComplianceRatioResult;
  taxStatus: TaxStatusReport;
  allergyConflictsCount: number;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeChildrenCount,
  presentChildrenCount,
  ratioCompliance,
  taxStatus,
  allergyConflictsCount,
  onOpenBackupModal,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const todayHebrew = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const logoUrl =
    'https://raw.githubusercontent.com/Almog787/Mayabee/7556da7292780737f265ca3915efad246ff2eef9/public/Logo%20Mayabee.jpg';

  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md text-[#5f3414] border-b border-[#d6c3b8]/40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Mayabee Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-[#ffdeab] ring-2 ring-[#7a4b29]/20 overflow-hidden shadow-sm flex items-center justify-center flex-shrink-0">
              {logoLoaded ? (
                <img
                  src={logoUrl}
                  alt="הבית של מאיה - בהנהלת רותם עירון"
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setLogoLoaded(false)}
                />
              ) : (
                <span className="text-xl">🐝</span>
              )}
            </div>

            <div className="flex flex-col text-right">
              <h1 className="text-xl sm:text-2xl font-black text-[#5f3414] leading-tight font-heading">
                הבית של מאיה
              </h1>
              <p className="text-[10px] sm:text-xs text-[#7a4b29] font-bold flex items-center gap-1.5 opacity-80">
                <span>מערכת חיזוי ותכנון מאזן תציבי</span>
                <span className="hidden md:inline text-[#d6c3b8]">•</span>
                <span className="hidden md:flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {todayHebrew}
                </span>
              </p>
            </div>
          </div>

          {/* Cleaner Header: Middle area empty or for branding */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Optional subtle branding elements can go here */}
          </div>

          {/* Action Buttons: PWA Install only (Cleaner Header) */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </header>
  );
};
