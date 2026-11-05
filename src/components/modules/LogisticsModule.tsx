import React, { useState } from 'react';
import {
  Utensils,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar,
  Lock,
  Flame,
  LifeBuoy,
  HeartHandshake,
} from 'lucide-react';
import { WeeklyMealDay, SafetyCheckItem, Child } from '../../types';

interface LogisticsModuleProps {
  menu: WeeklyMealDay[];
  todayMenu?: WeeklyMealDay;
  presentChildren: Child[];
  allergenConflicts: { child: Child; matchingAllergen: string }[];
  safetyChecks: SafetyCheckItem[];
  onUpdateSafetyCheck: (
    id: string,
    status: 'PASSED' | 'FAILED' | 'PENDING',
    inspectorName?: string,
    notes?: string
  ) => Promise<void>;
}

export const LogisticsModule: React.FC<LogisticsModuleProps> = ({
  menu,
  todayMenu,
  presentChildren,
  allergenConflicts,
  safetyChecks,
  onUpdateSafetyCheck,
}) => {
  const [selectedDayName, setSelectedDayName] = useState<string>(
    todayMenu?.dayName || 'יום ראשון'
  );
  const [activeTab, setActiveTab] = useState<'MENU' | 'SAFETY'>('MENU');

  const selectedMenuDay = menu.find((m) => m.dayName === selectedDayName) || menu[0];

  const dailySafetyChecks = safetyChecks.filter((s) => s.category === 'DAILY');
  const monthlySafetyChecks = safetyChecks.filter((s) => s.category === 'MONTHLY');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#5f3414] flex items-center gap-2 font-heading">
            <Utensils className="w-5 h-5 text-[#7a4b29]" />
            <span>תזונה, רכש ובטיחות המעון • הבית של מאיה</span>
          </h2>
          <p className="text-xs text-[#51443c] mt-0.5">
            תפריט משרד הבריאות לגיל הרך, הצלבת אלרגנים בזמן אמת, וצ'קליסט בטיחות יומי/חודשי באריאל
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('MENU')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'MENU'
                ? 'bg-[#7a4b29] text-white shadow-xs border border-[#ffdeab]/30'
                : 'bg-[#efeeea] text-[#51443c] hover:bg-[#e4e2de]'
            }`}
          >
            תפריט שבועי ואלרגנים
          </button>
          <button
            onClick={() => setActiveTab('SAFETY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SAFETY'
                ? 'bg-[#7a4b29] text-white shadow-xs border border-[#ffdeab]/30'
                : 'bg-[#efeeea] text-[#51443c] hover:bg-[#e4e2de]'
            }`}
          >
            צ'קליסט בטיחות וממ"ד
          </button>
        </div>
      </div>

      {/* Critical Cross-Contamination Allergen Safeguard Banner */}
      {allergenConflicts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-rose-950 space-y-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-950">
                מערכת מניעת אלרגנים (Cross-Contamination Safeguard) - התראה פעילה!
              </h3>
              <p className="text-xs text-rose-800">
                נמצאו התנגשויות בין תפריט היום לאלרגיות הילדים הנוכחים כעת במעון:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {allergenConflicts.map(({ child, matchingAllergen }, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-xl border border-rose-300 shadow-2xs text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1b1c1a]">
                    {child.firstName} {child.lastName}
                  </span>
                  <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    אלרגיה ל{matchingAllergen}
                  </span>
                </div>
                <p className="text-[#51443c] text-[11px]">
                  <strong>הנחיה למטבח:</strong> יש להכין מנה חלופית נקייה בנפרד בכלי נקי. מזרק אפיפן זמין בהישג יד.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: Weekly Menu */}
      {activeTab === 'MENU' && (
        <div className="space-y-4">
          {/* Day Selector Tabs */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {menu.map((m) => {
              const isToday = m.dayName === todayMenu?.dayName;
              const isSelected = m.dayName === selectedDayName;

              return (
                <button
                  key={m.dayName}
                  onClick={() => setSelectedDayName(m.dayName)}
                  className={`px-4 py-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#7a4b29] text-white border-[#7a4b29] shadow-xs'
                      : 'bg-white text-[#51443c] border-[#e4e2de] hover:border-[#d97706]'
                  }`}
                >
                  <span>{m.dayName}</span>
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#ffdeab] text-[#5f3414] font-black border border-[#f9b98e]">
                      היום
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Meals View */}
          {selectedMenuDay && (
            <div className="bg-white rounded-2xl border border-[#e4e2de] p-6 shadow-2xs space-y-6">
              <div className="flex items-start justify-between border-b pb-4 border-[#efeeea]">
                <div>
                  <h3 className="text-lg font-black text-[#5f3414] font-heading">
                    תפריט מאוזן ל{selectedMenuDay.dayName}
                  </h3>
                  <p className="text-xs text-[#51443c] mt-0.5">
                    בפיקוח הנחיות תזונת תינוקות ופעוטות של משרד הבריאות
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#51443c]">אלרגנים ביום זה:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedMenuDay.allergensPresent.map((a, i) => (
                      <span
                        key={i}
                        className="bg-[#ffdeab] text-[#5f3414] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#f9b98e]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Breakfast */}
                <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#e4e2de] space-y-2">
                  <span className="font-bold text-[#7a4b29] text-sm block">
                    ארוחת בוקר (08:30)
                  </span>
                  <p className="text-[#1b1c1a] leading-relaxed font-medium">
                    {selectedMenuDay.breakfast}
                  </p>
                  <p className="text-[11px] text-[#51443c] pt-2 border-t border-[#e4e2de]">
                    חטיף בוקר: {selectedMenuDay.morningSnack}
                  </p>
                </div>

                {/* Lunch */}
                <div className="bg-[#fff9f3] p-4 rounded-2xl border border-[#ffdcc6] space-y-2">
                  <span className="font-bold text-[#5f3414] text-sm block">
                    ארוחת צהריים עיקרית (11:45)
                  </span>
                  <p className="text-[#1b1c1a] leading-relaxed font-bold">
                    {selectedMenuDay.lunch}
                  </p>
                  <p className="text-[11px] text-[#7a4b29] pt-2 border-t border-[#ffdcc6] font-semibold">
                    עשיר בברזל, חלבון איכותי וסיבים תזונתיים
                  </p>
                </div>

                {/* Afternoon Snack */}
                <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#e4e2de] space-y-2">
                  <span className="font-bold text-[#7a4b29] text-sm block">
                    ארוחת מנחה (15:30)
                  </span>
                  <p className="text-[#1b1c1a] leading-relaxed font-medium">
                    {selectedMenuDay.afternoonSnack}
                  </p>
                  <p className="text-[11px] text-[#51443c] pt-2 border-t border-[#e4e2de]">
                    פירות טריים, דגנים וקרקרים
                  </p>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="pt-2 text-xs text-[#51443c]">
                <strong className="text-[#5f3414]">רכיבים מלאים לרכש ומטבח:</strong>{' '}
                {selectedMenuDay.ingredients.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Safety Checklists */}
      {activeTab === 'SAFETY' && (
        <div className="space-y-6">
          {/* Daily Checklist */}
          <div className="bg-white rounded-2xl border border-[#e4e2de] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#7a4b29]" />
                <h3 className="font-bold text-[#5f3414] text-base font-heading">
                  צ'קליסט בטיחות יומי שוטף • הבית של מאיה
                </h3>
              </div>
              <span className="text-xs text-[#51443c]">יש לבצע בכל בוקר לפני כניסת ילדים לחצר</span>
            </div>

            <div className="divide-y divide-[#efeeea]">
              {dailySafetyChecks.map((item) => {
                const isPassed = item.status === 'PASSED';
                const isFailed = item.status === 'FAILED';

                return (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-[#1b1c1a]">{item.title}</h4>
                      <p className="text-[#51443c] mt-0.5">{item.description}</p>
                      <span className="text-[10px] text-[#51443c]/80 mt-1 block">
                        נבדק לאחרונה: {item.lastCheckedDate} ע"י {item.inspectorName || 'רותם עירון'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onUpdateSafetyCheck(item.id, 'PASSED')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isPassed
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-[#efeeea] text-[#51443c] hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>תקין</span>
                      </button>

                      <button
                        onClick={() => onUpdateSafetyCheck(item.id, 'FAILED')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isFailed
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-[#efeeea] text-[#51443c] hover:bg-rose-50 hover:text-rose-800'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ליקוי</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Checklist (Fire, First Aid, Equipment) */}
          <div className="bg-white rounded-2xl border border-[#e4e2de] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#d97706]" />
                <h3 className="font-bold text-[#5f3414] text-base font-heading">
                  צ'קליסט בטיחות חודשי ואישורי כיבוי אש באריאל
                </h3>
              </div>
              <span className="text-xs text-[#51443c]">מטפים, אפיפן, ציוד חירום ומקלט/ממ"ד</span>
            </div>

            <div className="divide-y divide-[#efeeea]">
              {monthlySafetyChecks.map((item) => {
                const isPassed = item.status === 'PASSED';
                const isFailed = item.status === 'FAILED';

                return (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-[#1b1c1a]">{item.title}</h4>
                      <p className="text-[#51443c] mt-0.5">{item.description}</p>
                      <span className="text-[10px] text-[#51443c]/80 mt-1 block">
                        נבדק לאחרונה: {item.lastCheckedDate} ע"י {item.inspectorName || 'רותם עירון'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onUpdateSafetyCheck(item.id, 'PASSED')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isPassed
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-[#efeeea] text-[#51443c] hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>תקין</span>
                      </button>

                      <button
                        onClick={() => onUpdateSafetyCheck(item.id, 'FAILED')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isFailed
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-[#efeeea] text-[#51443c] hover:bg-rose-50 hover:text-rose-800'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ליקוי</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
