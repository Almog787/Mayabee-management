import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, do not show button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-[#7a4b29] hover:bg-[#5f3414] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition cursor-pointer active:scale-95 border border-[#ffdeab]/30"
        title="התקנת מערכת 'הבית של מאיה' כאפליקציה במחשב או בטלפון"
      >
        <Download className="w-4 h-4 text-[#ffdeab]" />
        <span>התקנת אפליקציה</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-[#ffdcc6] bg-[#fff9f3] px-3 py-1.5 text-xs font-bold text-[#5f3414] hover:bg-[#ffedd5] transition cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-[#7a4b29]" />
          <span>התקנה ב-iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-right border border-[#e4e2de]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e4e2de]">
                <h3 className="text-base font-bold text-[#5f3414]">התקנת 'הבית של מאיה' ב-iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-[#51443c] hover:bg-[#efeeea]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-[#51443c] leading-relaxed">
                כדי להשתמש באפליקציה בנוחות ובמסך מלא גם ללא אינטרנט:
              </p>
              <div className="mt-4 space-y-2.5 text-xs text-[#51443c] bg-[#fff9f3] p-3.5 rounded-2xl border border-[#ffdcc6]">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7a4b29] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>לחץ/י על כפתור <strong>השיתוף (Share)</strong> בתחתית דפדפן Safari.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7a4b29] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>גלול/י מטה ובחר/י <strong>"הוסף למסך הבית" (Add to Home Screen)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7a4b29] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>לחץ/י על <strong>"הוסף" (Add)</strong> בפינה העליונה.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#7a4b29] py-2.5 text-sm font-bold text-white hover:bg-[#5f3414] transition shadow-xs"
              >
                הבנתי, תודה!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
