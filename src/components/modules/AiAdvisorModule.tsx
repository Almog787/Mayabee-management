import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Brain,
  Globe,
  ExternalLink,
  BookOpen,
  Send,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

export const AiAdvisorModule: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'SEARCH' | 'THINKING'>('SEARCH');
  const [loading, setLoading] = useState(false);
  const [responseAnswer, setResponseAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleQueries = [
    {
      title: 'תקרת עוסק פטור וחוק המזומן 2026',
      text: 'מהן תקרות עוסק פטור המעודכנות לשנת 2026 בישראל ומהי תקרת קבלת מזומן לפי חוק לצמצום השימוש במזומן?',
      mode: 'SEARCH',
    },
    {
      title: 'יחס מטפלת-ילד לפי חוק הפיקוח',
      text: 'מהו יחס מטפלת-ילד המדויק לפי חוק הפיקוח על מעונות יום (תשע"ט-2018) עבור תינוקות, פעוטות ובוגרים?',
      mode: 'SEARCH',
    },
    {
      title: 'שעות נוספות לסייעת מעון בישראל',
      text: 'כיצד מחושב תשלום שעות נוספות לסייעת מעון בישראל לפי דיני עבודה (125% ו-150%)?',
      mode: 'SEARCH',
    },
    {
      title: 'תוכנית התערבות פדגוגית לחרדת פרידה קשה',
      text: 'פעוט בן שנה וחצי חווה חרדת פרידה קשה בכל בוקר עם בכי ממושך וסירוב לאכול. בצע ניתוח מעמיק, תוכנית פעולה אופרטיבית לגננת וניסוח שיחה מכילה להורים.',
      mode: 'THINKING',
    },
    {
      title: 'נוהל אלרגיה מסכנת חיים ואפיפן במעון',
      text: 'מהם נהלי משרד הבריאות ומשרד החינוך לגבי החזקת מזרק אפיפן, מניעת זיהום צולב של אלרגנים וטיפול חירום במעון יום?',
      mode: 'SEARCH',
    },
  ];

  const handleAsk = async (promptText?: string, targetMode?: 'SEARCH' | 'THINKING') => {
    const q = promptText || query;
    const m = targetMode || mode;
    if (!q.trim()) return;

    setLoading(true);
    setResponseAnswer(null);
    setSources([]);
    setErrorMsg(null);

    try {
      const endpoint = m === 'SEARCH' ? '/api/gemini/search' : '/api/gemini/thinking';
      const body = m === 'SEARCH' ? { query: q } : { prompt: q };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'שגיאה בקבלת תשובה מהשרת');
      }

      const data = await res.json();
      if (m === 'SEARCH') {
        setResponseAnswer(data.answer);
        setSources(data.sources || []);
      } else {
        setResponseAnswer(data.analysis);
      }
    } catch (err: any) {
      console.error('Advisor error:', err);
      setErrorMsg(err.message || 'אירעה שגיאה בחיבור לעוזר החכם');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ffdeab] text-xs font-medium border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#ffdeab]" />
            <span>יועץ רגולטורי ופדגוגי • הבית של מאיה</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
            מרכז ידע וחוקי מעונות יום בישראל
          </h2>
          <p className="text-sm text-white/90 max-w-2xl leading-relaxed">
            מענה מהימן ומעודכן לחוקי הפיקוח, תקרות מס, זכויות סייעות ונהלי אלרגנים באמצעות <strong>Google Search Grounding (Gemini 3.8 Flash)</strong>, או פתרון דילמות פדגוגיות באמצעות <strong>High Thinking (Gemini 4 Argon)</strong>.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-black/20 backdrop-blur p-1 rounded-2xl border border-white/10 self-start">
          <button
            onClick={() => setMode('SEARCH')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'SEARCH' ? 'bg-[#ffdeab] text-[#5f3414] shadow-md font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4 text-[#7a4b29]" />
            <span>חיפוש חוקים עדכני (Search)</span>
          </button>
          <button
            onClick={() => setMode('THINKING')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'THINKING' ? 'bg-[#ffdeab] text-[#5f3414] shadow-md font-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <Brain className="w-4 h-4 text-[#7a4b29]" />
            <span>חשיבה פדגוגית עמוקה (Thinking)</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-[#51443c] flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-[#d97706]" />
          <span>שאלות נפוצות לרותם עירון ומנהלות מעון (לחצי לקבלת תשובה מידית):</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item.text);
                setMode(item.mode as any);
                handleAsk(item.text, item.mode as any);
              }}
              className="text-xs text-right bg-white hover:bg-[#fff9f3] border border-[#e4e2de] hover:border-[#d97706] text-[#51443c] hover:text-[#5f3414] px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs font-semibold"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs p-4 space-y-3">
        <div className="flex items-center gap-2">
          {mode === 'SEARCH' ? (
            <Globe className="w-4 h-4 text-[#7a4b29]" />
          ) : (
            <Brain className="w-4 h-4 text-[#7a4b29]" />
          )}
          <span className="text-xs font-bold text-[#5f3414]">
            {mode === 'SEARCH'
              ? 'שאילתת חיפוש רגולטורית (מקורות רשמיים מ-Google)'
              : 'דילמה פדגוגית / אתגר התנהגותי (ניתוח חשיבה רב-שלבי)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="הקלידי שאלה בנושא חוקים, תקינה, שכר לימוד, או מקרה פדגוגי..."
            rows={2}
            className="flex-1 p-3 text-xs rounded-xl border border-[#e4e2de] focus:outline-[#d97706] focus:border-[#d97706] text-[#1b1c1a] resize-none"
          />

          <button
            onClick={() => handleAsk()}
            disabled={loading || !query.trim()}
            className="h-full px-6 py-4 bg-[#7a4b29] hover:bg-[#5f3414] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs self-stretch border border-[#ffdeab]/30"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Send className="w-4 h-4 text-[#ffdeab]" />
                <span>שאל</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-900 font-bold">
          {errorMsg}
        </div>
      )}

      {/* Answer & Sources Display */}
      {responseAnswer && (
        <div className="bg-white rounded-3xl border border-[#e4e2de] shadow-md p-6 sm:p-8 space-y-6 text-[#1b1c1a]">
          <div className="flex items-center justify-between border-b pb-4 border-[#efeeea]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ffdeab]/60 text-[#7a4b29] flex items-center justify-center">
                {mode === 'SEARCH' ? (
                  <Globe className="w-4 h-4 text-[#7a4b29]" />
                ) : (
                  <Brain className="w-4 h-4 text-[#7a4b29]" />
                )}
              </div>
              <h3 className="font-bold text-base text-[#5f3414]">
                {mode === 'SEARCH'
                  ? 'תשובת מומחה מבוססת מקורות מוסמכים (Google Search Grounded)'
                  : 'ניתוח פדגוגי מעמיק (Gemini 4 Argon High-Thinking)'}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#efeeea] text-[#51443c] font-mono">
              {mode === 'SEARCH' ? 'gemini-3.8-flash' : 'gemini-4-argon (Thinking)'}
            </span>
          </div>

          {/* Answer Text */}
          <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap space-y-2 text-[#1b1c1a] font-sans">
            {responseAnswer}
          </div>

          {/* Grounding Sources (Google Search Chunks) */}
          {sources && sources.length > 0 && (
            <div className="pt-4 border-t border-[#efeeea] space-y-3">
              <h4 className="font-bold text-xs text-[#51443c] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#7a4b29]" />
                <span>מקורות מידע ואסמכתאות (Google Grounding Sources):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sources.map((chunk, idx) => {
                  const uri = chunk?.web?.uri;
                  const title = chunk?.web?.title || uri;
                  if (!uri) return null;

                  return (
                    <a
                      key={idx}
                      href={uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-[#e4e2de] hover:border-[#d97706] hover:bg-[#fff9f3] text-[#7a4b29] transition flex items-center justify-between gap-2"
                    >
                      <span className="truncate font-medium">{title}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
