import React, { useState } from 'react';
import {
  Baby,
  Plus,
  Search,
  Phone,
  Mail,
  AlertTriangle,
  Calendar,
  Clock,
  Send,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Heart,
  Moon,
  UtensilsCrossed,
  ShieldAlert,
  Smile,
  FileCheck,
  MessageCircle,
} from 'lucide-react';
import { Child, DailyActivityLog, AgeGroup } from '../../types';

interface ChildrenModuleProps {
  children: Child[];
  dailyLogs: DailyActivityLog[];
  todayStr: string;
  onAddChild: (child: Omit<Child, 'id' | 'updatedAt'>) => Promise<Child>;
  onUpdateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  onDeleteChild: (id: string) => Promise<void>;
  onSaveDailyLog: (log: Partial<DailyActivityLog> & { childId: string }) => Promise<void>;
}

export const ChildrenModule: React.FC<ChildrenModuleProps> = ({
  children,
  dailyLogs,
  todayStr,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onSaveDailyLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState<'ALL' | AgeGroup>('ALL');
  const [selectedChildForTracker, setSelectedChildForTracker] = useState<Child | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Daily tracker state for selected child
  const [trackerNapStart, setTrackerNapStart] = useState('12:30');
  const [trackerNapEnd, setTrackerNapEnd] = useState('14:00');
  const [trackerMood, setTrackerMood] = useState<'EXCELLENT' | 'CALM' | 'TIRED' | 'FUSSY' | 'CRYING'>('EXCELLENT');
  const [trackerBreakfast, setTrackerBreakfast] = useState<'FULL' | 'HALF' | 'LITTLE' | 'REFUSED'>('FULL');
  const [trackerLunch, setTrackerLunch] = useState<'FULL' | 'HALF' | 'LITTLE' | 'REFUSED'>('FULL');
  const [trackerSnack, setTrackerSnack] = useState<'FULL' | 'HALF' | 'LITTLE' | 'REFUSED'>('FULL');
  const [trackerDiapers, setTrackerDiapers] = useState<string[]>(['09:30 (רטוב)', '12:15 (צואה)', '15:00 (רטוב)']);
  const [newDiaperTime, setNewDiaperTime] = useState('10:00');
  const [newDiaperType, setNewDiaperType] = useState('רטוב');
  const [trackerHighlights, setTrackerHighlights] = useState('משחק בקוביות, חצר מוזיקלית וציור בצבעי ידיים');
  const [trackerNotes, setTrackerNotes] = useState('יום נפלא, שתה מים היטב');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Filter children
  const filteredChildren = children.filter((child) => {
    const matchesSearch =
      `${child.firstName} ${child.lastName} ${child.idNumber}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.allergies.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAge = ageFilter === 'ALL' || child.ageGroup === ageFilter;
    return matchesSearch && matchesAge;
  });

  const openTracker = (child: Child) => {
    setSelectedChildForTracker(child);
    const existingLog = dailyLogs.find((l) => l.childId === child.id && l.date === todayStr);
    if (existingLog) {
      setTrackerNapStart(existingLog.napStart || '12:30');
      setTrackerNapEnd(existingLog.napEnd || '14:00');
      setTrackerMood(existingLog.mood || 'EXCELLENT');
      setTrackerHighlights(existingLog.highlightActivities || 'משחק, ציור וחצר');
      setTrackerNotes(existingLog.specialNotes || '');
      setGeneratedSummary(existingLog.summaryText || '');
    } else {
      setGeneratedSummary('');
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedChildForTracker) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/gemini/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: selectedChildForTracker.firstName,
          activities: trackerHighlights,
          mood: trackerMood === 'EXCELLENT' ? 'שמח, פעיל ומלא אנרגיה' : trackerMood,
          meals: `בוקר (${trackerBreakfast}), צהריים (${trackerLunch}), מנחה (${trackerSnack})`,
          naps: `שנת צהריים מ-${trackerNapStart} עד ${trackerNapEnd}`,
          diaperCount: trackerDiapers.length,
          specialNotes: trackerNotes,
        }),
      });

      const data = await res.json();
      if (data.summary) {
        setGeneratedSummary(data.summary);
        await onSaveDailyLog({
          childId: selectedChildForTracker.id,
          date: todayStr,
          napStart: trackerNapStart,
          napEnd: trackerNapEnd,
          mood: trackerMood,
          highlightActivities: trackerHighlights,
          specialNotes: trackerNotes,
          summaryText: data.summary,
        });
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      // Fallback local text template
      const fallback = `היי הורים יקרים של ${selectedChildForTracker.firstName}! 🌸\nעבר עלינו יום נהדר במעון 🧸\n${selectedChildForTracker.firstName} אכל יפה מאוד, ישן שנת צהריים רגועה בין ${trackerNapStart} ל-${trackerNapEnd}, ונהנה מ${trackerHighlights}.\n${trackerNotes ? `דגש: ${trackerNotes}\n` : ''}מחכים לראותכם באיסוף! ❤️`;
      setGeneratedSummary(fallback);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopySummary = () => {
    if (!generatedSummary) return;
    navigator.clipboard.writeText(generatedSummary);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!selectedChildForTracker || !generatedSummary) return;
    const phone = selectedChildForTracker.parent1.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? `972${phone.substring(1)}` : phone;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedSummary)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#5f3414]">ניהול ילדים, משפחתון ופדגוגיה</h2>
            <p className="text-xs text-[#51443c]">
              {children.length} ילדים רשומים ב'הבית של מאיה' באריאל | תיק אישי, אלרגיות ומעקב סדר יום
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש ילד/ה או אלרגיה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-[#e4e2de] focus:outline-[#7a4b29] focus:border-[#7a4b29]"
            />
          </div>

          {/* Age Group Filter */}
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value as any)}
            className="text-xs py-2 px-3 rounded-xl border border-[#e4e2de] bg-white text-[#5f3414] focus:outline-[#7a4b29]"
          >
            <option value="ALL">כל קבוצות הגיל (3 חודשים - 3 שנים)</option>
            <option value="INFANT">תינוקות / פעוטון (3-15 חודש)</option>
            <option value="TODDLER">פעוטות / משפחתון (15-24 חודש)</option>
            <option value="PRESCHOOL">בוגרים וצהרון (24-36 חודש)</option>
          </select>

          <button
            onClick={() => {
              setEditingChild(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs active:scale-95 border border-[#ffdeab]/30"
          >
            <Plus className="w-4 h-4 text-[#ffdeab]" />
            <span>קליטת ילד/ה חדש/ה</span>
          </button>
        </div>
      </div>

      {/* Children Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChildren.map((child) => {
          const ageMonths = Math.floor(
            (new Date().getTime() - new Date(child.birthDate).getTime()) /
              (1000 * 60 * 60 * 24 * 30.4375)
          );

          const ageBadgeColor = {
            INFANT: 'bg-pink-100 text-pink-800 border-pink-200',
            TODDLER: 'bg-teal-100 text-teal-800 border-teal-200',
            PRESCHOOL: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          }[child.ageGroup];

          const ageGroupName = {
            INFANT: 'תינוק/ת',
            TODDLER: 'פעוט/ה',
            PRESCHOOL: 'בוגר/ת',
          }[child.ageGroup];

          return (
            <div
              key={child.id}
              className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs hover:shadow-md transition p-5 space-y-4 relative flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#1b1c1a] font-heading">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ת.ז. {child.idNumber} | גיל: {ageMonths} חודשים
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${ageBadgeColor}`}
                  >
                    {ageGroupName}
                  </span>
                </div>

                {/* Life-threatening Allergies Banner */}
                {child.allergies && child.allergies.length > 0 ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2 text-rose-900 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-950 font-bold">
                        אלרגיות מסכנות חיים:
                      </strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {child.allergies.map((a, i) => (
                          <span
                            key={i}
                            className="bg-rose-200 text-rose-950 font-bold px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                      {child.medicalNotes && (
                        <p className="text-[10px] text-rose-800 mt-1 italic">
                          {child.medicalNotes}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ללא אלרגיות ידועות</span>
                  </div>
                )}
              </div>

              {/* Parents Contact Section */}
              <div className="space-y-2 text-xs text-slate-600 border-t pt-3 border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    {child.parent1.relation || 'אמא'}: {child.parent1.fullName}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${child.parent1.phone}`}
                      className="p-1 rounded-lg hover:bg-slate-100 text-teal-700"
                      title="התקשר להורה"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${child.parent1.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-slate-100 text-emerald-600"
                      title="שלח וואטסאפ"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>שכר לימוד חודשי:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    ₪{child.monthlyTuition.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#e4e2de]">
                <button
                  onClick={() => openTracker(child)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#fff9f3] hover:bg-[#ffedd5] text-[#5f3414] font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer border border-[#ffdcc6] active:scale-95"
                >
                  <Smile className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>מעקב יומי וסיכום</span>
                </button>
                <button
                  onClick={() => {
                    setEditingChild(child);
                    setIsAddModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#5f3414] hover:bg-[#efeeea] transition"
                  title="ערוך פרטי ילד"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Tracker & WhatsApp Summary Drawer / Modal */}
      {selectedChildForTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e4e2de] overflow-hidden text-right">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7a4b29] to-[#5f3414] text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Baby className="w-5 h-5 text-[#ffdeab]" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-heading">
                    מעקב סדר יום - {selectedChildForTracker.firstName} {selectedChildForTracker.lastName}
                  </h3>
                  <p className="text-xs text-[#ffdeab]">
                    הבית של מאיה • תיעוד שינה, ארוחות, חיתולים וסיכום וואטסאפ ({todayStr})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChildForTracker(null)}
                className="p-1 rounded-xl text-white/80 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tracker Inputs Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Nap Times */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>שנת צהריים (הרדמה והשכמה)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">הלך לישון:</label>
                    <input
                      type="time"
                      value={trackerNapStart}
                      onChange={(e) => setTrackerNapStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">התעורר:</label>
                    <input
                      type="time"
                      value={trackerNapEnd}
                      onChange={(e) => setTrackerNapEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Meals Consumption */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <UtensilsCrossed className="w-4 h-4 text-teal-600" />
                  <span>כמויות אוכל שנאכלו בארוחות</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="block text-slate-500 mb-1">ארוחת בוקר:</span>
                    <select
                      value={trackerBreakfast}
                      onChange={(e) => setTrackerBreakfast(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="FULL">אכל הכל 🥣</option>
                      <option value="HALF">אכל חצי</option>
                      <option value="LITTLE">מעט מאוד</option>
                      <option value="REFUSED">סירב לאכול</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">ארוחת צהריים:</span>
                    <select
                      value={trackerLunch}
                      onChange={(e) => setTrackerLunch(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="FULL">אכל הכל 🍲</option>
                      <option value="HALF">אכל חצי</option>
                      <option value="LITTLE">מעט מאוד</option>
                      <option value="REFUSED">סירב לאכול</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">ארוחת מנחה:</span>
                    <select
                      value={trackerSnack}
                      onChange={(e) => setTrackerSnack(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="FULL">אכל הכל 🍎</option>
                      <option value="HALF">אכל חצי</option>
                      <option value="LITTLE">מעט מאוד</option>
                      <option value="REFUSED">סירב לאכול</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mood & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">מצב רוח כללי:</label>
                  <select
                    value={trackerMood}
                    onChange={(e) => setTrackerMood(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="EXCELLENT">מצוין, שמח ומלא אנרגיה 🌟</option>
                    <option value="CALM">רגוע ומשתף פעולה 🌸</option>
                    <option value="TIRED">עייף מעט / זקוק לחיבוק 🧸</option>
                    <option value="FUSSY">נודניק / שיניים / קשיי פרידה</option>
                    <option value="CRYING">בכה בחלק מהזמן</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    פעילויות בולטות היום:
                  </label>
                  <input
                    type="text"
                    value={trackerHighlights}
                    onChange={(e) => setTrackerHighlights(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    placeholder="משחק בקוביות, חצר מוזיקלית..."
                  />
                </div>
              </div>

              {/* AI Daily Summary Generator */}
              <div className="bg-[#fff9f3] border border-[#ffdcc6] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d97706]" />
                    <span className="text-xs font-bold text-[#5f3414]">
                      הפקת הודעת סיכום חמה לוואטסאפ (Gemini AI • הבית של מאיה)
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isGeneratingAi ? (
                      <span>יוצר סיכום...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#ffdeab]" />
                        <span>חולל סיכום יומי</span>
                      </>
                    )}
                  </button>
                </div>

                {generatedSummary ? (
                  <div className="space-y-3">
                    <textarea
                      value={generatedSummary}
                      onChange={(e) => setGeneratedSummary(e.target.value)}
                      rows={4}
                      className="w-full p-3 text-xs bg-white rounded-xl border border-[#ffdcc6] text-[#1b1c1a] leading-relaxed font-sans focus:outline-[#7a4b29]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopySummary}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#5f3414] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#451a03] transition cursor-pointer"
                      >
                        {copiedSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#ffdeab]" />
                            <span>הועתק ללוח!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#ffdeab]" />
                            <span>העתק טקסט לוואטסאפ</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleSendWhatsApp}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#20ba59] transition cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>שלח ישירות לוואטסאפ ההורה</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#51443c]">
                    לחצי על "חולל סיכום יומי" כדי ליצור הודעה אוטומטית מנוסחת היטב המבוססת על נתוני השינה, הארוחות ומצב הרוח של {selectedChildForTracker.firstName}.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedChildForTracker(null)}
                className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-300 transition"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Child Modal */}
      {isAddModalOpen && (
        <ChildFormModal
          initialChild={editingChild}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingChild(null);
          }}
          onSave={async (childData) => {
            if (editingChild) {
              await onUpdateChild(editingChild.id, childData);
            } else {
              await onAddChild(childData as any);
            }
            setIsAddModalOpen(false);
            setEditingChild(null);
          }}
        />
      )}
    </div>
  );
};

// Child Form Modal component
const ChildFormModal: React.FC<{
  initialChild: Child | null;
  onClose: () => void;
  onSave: (data: Partial<Child>) => Promise<void>;
}> = ({ initialChild, onClose, onSave }) => {
  const [firstName, setFirstName] = useState(initialChild?.firstName || '');
  const [lastName, setLastName] = useState(initialChild?.lastName || '');
  const [idNumber, setIdNumber] = useState(initialChild?.idNumber || '');
  const [birthDate, setBirthDate] = useState(initialChild?.birthDate || '2025-01-01');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(initialChild?.ageGroup || 'TODDLER');
  const [allergiesText, setAllergiesText] = useState(
    (initialChild?.allergies || []).join(', ')
  );
  const [medicalNotes, setMedicalNotes] = useState(initialChild?.medicalNotes || '');
  const [parentName, setParentName] = useState(initialChild?.parent1.fullName || '');
  const [parentPhone, setParentPhone] = useState(initialChild?.parent1.phone || '');
  const [parentEmail, setParentEmail] = useState(initialChild?.parent1.email || '');
  const [parentRelation, setParentRelation] = useState(initialChild?.parent1.relation || 'אמא');
  const [monthlyTuition, setMonthlyTuition] = useState(initialChild?.monthlyTuition || 4200);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      firstName,
      lastName,
      idNumber,
      birthDate,
      enrollmentDate: initialChild?.enrollmentDate || new Date().toISOString().split('T')[0],
      ageGroup,
      allergies,
      medicalNotes,
      monthlyTuition: Number(monthlyTuition),
      status: initialChild?.status || 'ACTIVE',
      parent1: {
        fullName: parentName,
        phone: parentPhone,
        email: parentEmail,
        relation: parentRelation,
        isEmergencyContact: true,
        isAuthorizedPickup: true,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#e4e2de] overflow-hidden text-right">
        <div className="bg-[#7a4b29] text-white p-5 flex items-center justify-between border-b border-[#ffdeab]/20">
          <h3 className="font-black text-base font-heading">
            {initialChild ? 'עריכת פרטי ילד/ה • הבית של מאיה' : 'קליטת ילד/ה חדש/ה במעון • הבית של מאיה'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">שם פרטי:</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">שם משפחה:</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">ת.ז. ילד/ה:</label>
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
                placeholder="9 ספרות"
              />
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">תאריך לידה:</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">קבוצת גיל במעון:</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              >
                <option value="INFANT">פעוטון (3-15 חודש)</option>
                <option value="TODDLER">משפחתון (15-24 חודש)</option>
                <option value="PRESCHOOL">בוגרים וצהרון (24-36 חודש)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">שכר לימוד חודשי (₪):</label>
              <input
                type="number"
                required
                value={monthlyTuition}
                onChange={(e) => setMonthlyTuition(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] font-mono font-bold focus:outline-[#d97706]"
              />
            </div>
          </div>

          {/* Allergies & Medical */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5 space-y-2">
            <label className="block text-rose-950 font-bold">
              אלרגיות מסכנות חיים (מופרדות בפסיקים):
            </label>
            <input
              type="text"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="למשל: בוטנים, שומשום, חלב, ביצים"
              className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white focus:outline-rose-500"
            />
            <label className="block text-[#51443c] font-bold mt-2">
              הערות רפואיות / מיקום מזרק אפיפן:
            </label>
            <input
              type="text"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="מיקום אפיפן, הנחיות מיוחדות..."
              className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
            />
          </div>

          {/* Parent Info */}
          <div className="bg-[#faf8f5] p-3.5 rounded-2xl border border-[#e4e2de] space-y-2">
            <span className="font-bold text-[#5f3414] block">פרטי איש קשר עיקרי (הורה):</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="שם מלא של ההורה"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              />
              <input
                type="text"
                placeholder="קרבה (אמא / אבא)"
                value={parentRelation}
                onChange={(e) => setParentRelation(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                placeholder="טלפון נייד"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              />
              <input
                type="email"
                placeholder="כתובת דוא''ל"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#efeeea]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#efeeea] text-[#51443c] font-bold hover:bg-[#e4e2de] cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#7a4b29] text-white font-bold hover:bg-[#5f3414] shadow-xs cursor-pointer transition border border-[#ffdeab]/30"
            >
              שמור פרטים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
