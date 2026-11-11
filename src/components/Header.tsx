import React, { useState } from 'react';
import { PWAInstallButton } from './common/PWAInstallButton';
import {
  Home,
  GraduationCap,
  Calendar,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { DaycareSettings } from '../types';

import daycareLogo from '../assets/images/applet_daycare_logo_1793960832604.jpg';

interface HeaderProps {
  settings: DaycareSettings | null;
  onPrint?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onPrint,
}) => {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const todayHebrew = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-2.5 sm:h-16 gap-3">
          {/* Brand & Private Home Daycare Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl p-0.5 bg-amber-50 ring-1 ring-amber-200/80 overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                {logoLoaded ? (
                  <img
                    src={daycareLogo}
                    alt="משפחתון ביתי"
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setLogoLoaded(false)}
                  />
                ) : (
                  <Home className="w-5 h-5 text-amber-700" />
                )}
              </div>

              <div className="flex flex-col text-right">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                    משפחתון ביתי פרטי בדירה
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <GraduationCap className="w-3 h-3 text-emerald-700" />
                    <span>בעלת תואר ראשון בחינוך (B.Ed.)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="text-amber-800 font-semibold">דירת המגורים שלנו</span>
                  <span className="text-slate-300">·</span>
                  <span>ניהול ומאזן אישי (עד 5 ילדים)</span>
                  <span className="hidden md:inline text-slate-300">·</span>
                  <span className="hidden md:flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                    <Calendar className="w-3 h-3 text-teal-600" />
                    {todayHebrew}
                  </span>
                </p>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-1">
              <PWAInstallButton />
            </div>
          </div>

          {/* Quick Badges & Utility Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>תקן פיקוח לדירה: עד 5 פעוטות</span>
            </div>

            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
                title="הדפסת דוח מאזן חודשי"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">הדפסה</span>
              </button>
            )}

            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
