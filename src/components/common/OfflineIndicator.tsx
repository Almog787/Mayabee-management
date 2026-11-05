import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-xl backdrop-blur border border-amber-400">
      <WifiOff className="w-4 h-4 animate-pulse text-amber-200" />
      <div className="flex flex-col">
        <span>מצב לא מקוון (Offline)</span>
        <span className="text-[11px] text-amber-100 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          הנתונים נשמרים מקומית במכשירך ב-IndexedDB
        </span>
      </div>
    </div>
  );
};
