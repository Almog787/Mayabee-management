import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Copy,
  Users,
  Target,
  ShieldCheck,
  Building,
  RotateCcw,
  Sliders,
  DollarSign,
} from 'lucide-react';

interface SuggestionsAndAutomationModuleProps {
  onBackToPlanner?: () => void;
  onSwitchToBusinessSuggestions?: () => void;
}

// Obfuscated email destination so it NEVER appears in raw plain text on the site
const getRecipientEmail = (): string => {
  try {
    return atob('YWxtb2dzaGFrZWQ4QGdtYWlsLmNvbQ==');
  } catch {
    return ['almogshaked8', 'gmail.com'].join('@');
  }
};

const MANAGEMENT_TOPICS = [
  { id: 'tuition', label: 'תמחור ושכ"ל ילדים', icon: Users },
  { id: 'payroll', label: 'שכר צוות ותקן כוח אדם', icon: ShieldCheck },
  { id: 'breakeven', label: 'חישוב נקודת איזון', icon: Target },
  { id: 'opex', label: 'שכירות, ארנונה ותפעול', icon: Building },
  { id: 'tax', label: 'עמידה בתקנות מס', icon: DollarSign },
  { id: 'sliders', label: 'סליידרים וממשק טאץ\'', icon: Sliders },
];

const AUTOMATION_IDEAS = [
  'סנכרון דו-כיווני ישיר עם Google Sheets',
  'שליחת תזכורות תשלום להורים ב-WhatsApp',
  'הפקת דוח נוכחות חודשי אוטומטי למשרד החינוך',
  'חישוב שעות נוספות ועומסי עבודה בזמן אמת',
];

export const SuggestionsAndAutomationModule: React.FC<SuggestionsAndAutomationModuleProps> = ({
  onBackToPlanner,
  onSwitchToBusinessSuggestions,
}) => {
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [senderName, setSenderName] = useState<string>('');
  const [senderContact, setSenderContact] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const toggleTopic = (id: string, label: string) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics(prev => prev.filter(t => t !== id));
    } else {
      setSelectedTopics(prev => [...prev, id]);
      if (!suggestionText.includes(label)) {
        setSuggestionText(prev => prev ? `${prev}\n• לגבי ${label}: ` : `• לגבי ${label}: `);
      }
    }
  };

  const addAutomationPreset = (text: string) => {
    setSuggestionText(prev => prev ? `${prev}\n• בקשת אוטומציה: ${text}` : `• בקשת אוטומציה: ${text}`);
  };

  const handleSendEmail = () => {
    if (!suggestionText.trim()) return;
    const recipient = getRecipientEmail();
    const subject = encodeURIComponent(`הצעה ובקשת שיפור למערכת הניהול - ${senderName || 'משתמש/ת במערכת'}`);
    const selectedLabels = MANAGEMENT_TOPICS.filter(t => selectedTopics.includes(t.id)).map(t => t.label).join(', ');
    const bodyContent = [
      `שלום רב,`,
      ``,
      `התקבלה פנייה חדשה לגבי מערכת הניהול והמאזן:`,
      senderName ? `שם השולח/ת: ${senderName}` : '',
      senderContact ? `פרטי קשר לחזרה: ${senderContact}` : '',
      selectedLabels ? `נושאים מסומנים: ${selectedLabels}` : '',
      ``,
      `תוכן ההצעה / בקשת האוטומציה:`,
      suggestionText,
      ``,
      `נשלח ישירות מתוך פורטל הניהול והמאזן.`
    ].filter(Boolean).join('\n');

    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;
    window.location.href = mailtoUrl;
    setIsSent(true);
    setTimeout(() => setIsSent(false), 4000);
  };

  const handleCopyText = async () => {
    if (!suggestionText.trim()) return;
    try {
      await navigator.clipboard.writeText(suggestionText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-mono font-bold">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>משוב ובקשות שיפור · מערכת הניהול</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            תיבת הצעות ופיתוח אוטומציות 💡
          </h2>
          <p className="text-xs text-slate-600">
            שתפו אותנו ברעיונות לשיפור, תכונות שהייתם רוצים לראות, או בקשות למערכות אוטומטיות.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBackToPlanner && (
            <button
              onClick={onBackToPlanner}
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              חזרה למאזן ←
            </button>
          )}
          {onSwitchToBusinessSuggestions && (
            <button
              onClick={onSwitchToBusinessSuggestions}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              הצעות לאתר הגן 🏡
            </button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Quick Topics */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            סמנו נושא שברצונכם להתייחס אליו (אופציונלי):
          </label>
          <div className="flex flex-wrap gap-2">
            {MANAGEMENT_TOPICS.map(topic => {
              const Icon = topic.icon;
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id, topic.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Automations ideas */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            בקשות אוטומציה מהירות בלחיצה אחת:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {AUTOMATION_IDEAS.map((idea, idx) => (
              <button
                key={idx}
                onClick={() => addAutomationPreset(idea)}
                className="text-right p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 transition cursor-pointer flex items-center justify-between"
              >
                <span>{idea}</span>
                <span className="text-teal-700 text-xs font-bold mr-2">+ הוסף</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 block">
            פירוט ההצעה או הבקשה:
          </label>
          <textarea
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder="כתבו כאן מה תרצו להוסיף, לשנות או לתקן במערכת..."
            rows={5}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 leading-relaxed font-sans"
          />
        </div>

        {/* Sender details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">שם השולח/ת (אופציונלי):</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="למשל: מנהלת המעון"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">טלפון או מייל לחזרה (אופציונלי):</label>
            <input
              type="text"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
              placeholder="טלפון או מייל למענה חוזר"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              setSuggestionText('');
              setSelectedTopics([]);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>נקה טופס</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyText}
              disabled={!suggestionText.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-teal-600" />
              <span>{isCopied ? 'הועתק ללוח! ✓' : 'העתק טקסט'}</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={!suggestionText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isSent ? 'נפתח במייל! ✓' : 'שלח הצעה ישירות למייל'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
