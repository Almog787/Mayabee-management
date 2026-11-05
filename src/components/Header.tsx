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
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#5f3414] leading-tight font-heading">
                  הבית של מאיה
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#ffdeab] text-[#5f3414] border border-[#f9b98e]/50">
                  מחשבון מאזן חודשי חכם
                </span>
              </div>
              <p className="text-xs text-[#51443c] font-medium flex items-center gap-1.5">
                <span>מערכת חיזוי ותכנון מאזן תציבי</span>
                <span className="hidden md:inline text-[#d6c3b8]">•</span>
                <span className="hidden md:flex items-center gap-1 text-[#7a4b29]/80">
                  <Calendar className="w-3 h-3 text-[#d97706]" />
                  {todayHebrew}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Real-Time Status Badges */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Osek Patur percentage gauge */}
            <div
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#fff9f3] border border-[#ffdcc6] rounded-xl text-xs font-semibold text-[#5f3414]"
              title={`מחזור שנתי מצטבר: ₪${taxStatus.totalAnnualIncome.toLocaleString()} מתוך ₪${taxStatus.osekPaturCeiling.toLocaleString()}`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#d97706]" />
              <span>תקרת עוסק פטור: <strong className="text-[#7a4b29]">{taxStatus.percentageUsed.toFixed(0)}%</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl text-xs font-bold text-[#065f46]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>סנכרון גוגל שייטס: מחובר ✓</span>
            </div>
          </div>

          {/* Action Buttons: Phone, PWA Install & Master Lock/Backup */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#efeeea] text-[#5f3414] text-xs font-bold border border-[#e4e2de]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>מנהלת: {settings?.directorName || 'רותם עירון'}</span>
            </div>

            <PWAInstallButton />

            <button
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 rounded-xl border border-[#e4e2de] bg-white px-3 py-1.5 text-xs font-bold text-[#5f3414] hover:bg-[#efeeea] hover:border-[#d6c3b8] transition cursor-pointer shadow-2xs"
              title="גיבוי, הצפנה, שחזור וסנכרון"
            >
              {settings?.hasMasterPassword ? (
                <Lock className="w-3.5 h-3.5 text-[#059669]" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-[#a8a29e]" />
              )}
              <span className="hidden sm:inline">גיבוי ואבטחה</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
