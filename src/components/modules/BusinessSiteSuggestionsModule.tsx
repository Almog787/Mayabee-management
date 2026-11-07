import React, { useState } from 'react';
import {
  Send,
  Home,
  CheckCircle2,
  Copy,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Camera,
  MapPin,
  Heart,
  PhoneCall,
  Utensils,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface BusinessSiteSuggestionsProps {
  onBackToPlanner?: () => void;
  onSwitchToManagementSuggestions?: () => void;
}

// Obfuscated email destination so it NEVER appears in raw plain text on the site
const getRecipientEmail = (): string => {
  try {
    return atob('YWxtb2dzaGFrZWQ4QGdtYWlsLmNvbQ==');
  } catch {
    return ['almogshaked8', 'gmail.com'].join('@');
  }
};

const BUSINESS_SITE_URL = 'https://almog787.github.io/Mayabee/';
const HERO_LOGO_URL = 'https://raw.githubusercontent.com/Almog787/Mayabee/eab9bfa3fcd371d10d3ec14b887a4df6f6039a0c/public/New%20hero.jpg';

const SITE_SECTIONS = [
  { id: 'hero', label: 'שער המעון ותמונת הכניסה', icon: Home },
  { id: 'vision', label: 'חזון חינוכי ופדגוגיה', icon: Heart },
  { id: 'registration', label: 'שריון מקום וטופס הרשמה', icon: PhoneCall },
  { id: 'gallery', label: 'גלריית תמונות מהמעון', icon: Camera },
  { id: 'nutrition', label: 'תפריט הזנה שבועי', icon: Utensils },
  { id: 'contact', label: 'מיקום ושעות פעילות באריאל', icon: MapPin },
];

const QUICK_FEATURE_REQUESTS = [
  'הוספת טופס מקוון לשריון מקום ורישום ישיר',
  'שילוב סיור וירטואלי / וידאו קצר מתוך הגן',
  'הוספת אזור המלצות הורים אותנטיות',
  'כפתור חיוג מהיר ושיחת WhatsApp למנהלת',
];

export const BusinessSiteSuggestionsModule: React.FC<BusinessSiteSuggestionsProps> = ({
  onBackToPlanner,
  onSwitchToManagementSuggestions,
}) => {
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [senderName, setSenderName] = useState<string>('');
  const [senderContact, setSenderContact] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  const toggleSection = (id: string, label: string) => {
    if (selectedSections.includes(id)) {
      setSelectedSections(prev => prev.filter(s => s !== id));
    } else {
      setSelectedSections(prev => [...prev, id]);
      if (!suggestionText.includes(label)) {
        setSuggestionText(prev => prev ? `${prev}\n• לגבי ${label}: ` : `• לגבי ${label}: `);
      }
    }
  };

  const addPreset = (text: string) => {
    setSuggestionText(prev => prev ? `${prev}\n• הצעת שדרוג: ${text}` : `• הצעת שדרוג: ${text}`);
  };

  const handleSendEmail = () => {
    if (!suggestionText.trim()) return;
    const recipient = getRecipientEmail();
    const subject = encodeURIComponent(`הצעות ושדרוגים לאתר הגן Mayabee - ${senderName || 'משתמש/ת'}`);
    const selectedLabels = SITE_SECTIONS.filter(s => selectedSections.includes(s.id)).map(s => s.label).join(', ');
    const bodyContent = [
      `שלום רב,`,
      ``,
      `התקבלה הצעה לשדרוג אתר הגן (Mayabee):`,
      senderName ? `שם השולח/ת: ${senderName}` : '',
      senderContact ? `פרטי קשר: ${senderContact}` : '',
      selectedLabels ? `חלקים מסומנים באתר: ${selectedLabels}` : '',
      `כתובת אתר הגן: ${BUSINESS_SITE_URL}`,
      ``,
      `תוכן ההצעה:`,
      suggestionText,
      ``,
      `נשלח ישירות מתוך פורטל הניהול.`
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono font-bold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>הצעות לאתר הגן · הגן של רותם ומאיה (Mayabee)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight font-heading">
            הצעות ושדרוגים לאתר העסק 🏡
          </h2>
          <p className="text-xs text-slate-300">
            הצעות תוכן, עיצוב ותכונות חדשות עבור אתר הגן הציבורי.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={BUSINESS_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition"
          >
            <span>פתח אתר הגן</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </a>
          {onBackToPlanner && (
            <button
              onClick={onBackToPlanner}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition cursor-pointer"
            >
              חזרה למאזן ←
            </button>
          )}
        </div>
      </div>

      {/* Hero preview card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-950">
          <img
            src={HERO_LOGO_URL}
            alt="הגן של רותם ומאיה"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="space-y-1 text-right flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">הגן של רותם ומאיה (Mayabee) · אריאל</h4>
            <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">פעיל</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            אתר הבית של הגן באריאל המציג להורים את תוכנית הלימודים, שעות הפעילות, התזונה הטריה וטפסי יצירת קשר.
          </p>
          <span className="text-[11px] font-mono text-slate-400 block truncate">{BUSINESS_SITE_URL}</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
        {/* Sections selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 block">
            סמנו איזה חלק באתר הגן תרצו לשפר (אופציונלי):
          </label>
          <div className="flex flex-wrap gap-2">
            {SITE_SECTIONS.map(section => {
              const Icon = section.icon;
              const isSelected = selectedSections.includes(section.id);
              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id, section.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick feature requests */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 block">
            שדרוגים מומלצים בלחיצה אחת:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {QUICK_FEATURE_REQUESTS.map((req, idx) => (
              <button
                key={idx}
                onClick={() => addPreset(req)}
                className="text-right p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-between"
              >
                <span>{req}</span>
                <span className="text-emerald-400 text-xs font-bold mr-2">+ הוסף</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 block">
            פירוט ההצעה או השדרוג לאתר:
          </label>
          <textarea
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder="כתבו כאן מה תרצו לשנות או להוסיף באתר הגן..."
            rows={5}
            className="w-full bg-slate-950/90 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 leading-relaxed font-sans"
          />
        </div>

        {/* Sender details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">שם השולח/ת (אופציונלי):</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="למשל: הנהלת הגן"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">טלפון או מייל לחזרה (אופציונלי):</label>
            <input
              type="text"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
              placeholder="טלפון או מייל למענה"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              setSuggestionText('');
              setSelectedSections([]);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>נקה טופס</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyText}
              disabled={!suggestionText.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-slate-600 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isCopied ? 'הועתק ללוח! ✓' : 'העתק טקסט'}</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={!suggestionText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
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
