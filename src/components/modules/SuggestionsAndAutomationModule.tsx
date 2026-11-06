import React, { useState, useMemo } from 'react';
import {
  Send,
  Lightbulb,
  Sparkles,
  Bot,
  CheckCircle2,
  Copy,
  Layers,
  MessageSquare,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Building,
  Target,
  DollarSign,
  HeartHandshake,
  Smartphone,
  Check,
  ArrowRight,
  ExternalLink,
  Sliders,
  RotateCcw,
} from 'lucide-react';

interface SuggestionsAndAutomationModuleProps {
  onBackToPlanner?: () => void;
}

// Obfuscated email destination so it NEVER appears in raw plain text on the site
// Decodes at runtime to almogshaked8[at]gmail[dot]com
const getRecipientEmail = (): string => {
  try {
    return atob('YWxtb2dzaGFrZWQ4QGdtYWlsLmNvbQ==');
  } catch {
    return ['almogshaked8', 'gmail.com'].join('@');
  }
};

interface SiteFeatureOption {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  defaultPrompt: string;
}

interface AutomationPreset {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  sampleScope: string;
}

export const SuggestionsAndAutomationModule: React.FC<SuggestionsAndAutomationModuleProps> = ({
  onBackToPlanner,
}) => {
  // Form State
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedAutomations, setSelectedAutomations] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<'IMPROVEMENT' | 'AUTOMATION' | 'BUG' | 'GENERAL'>('IMPROVEMENT');
  const [senderName, setSenderName] = useState<string>('');
  const [senderContact, setSenderContact] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);

  // Available site features to relate to specifically
  const siteFeatures: SiteFeatureOption[] = useMemo(
    () => [
      {
        id: 'multi-age-tuition',
        title: 'תמחור רב-גילאי (תינוקייה ופעוטון)',
        category: 'מודל הכנסות',
        icon: <Users className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי תמחור שכר הלימוד של התינוקות והפעוטות:',
      },
      {
        id: 'break-even',
        title: 'ניתוח נקודת איזון (Break-Even)',
        category: 'בקרה וניתוח',
        icon: <Target className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי חישוב נקודת האיזון וכמות הילדים הנדרשת:',
      },
      {
        id: 'staff-ratios',
        title: 'תקן צוות חוקי (חוק הפיקוח)',
        category: 'רגולציה וצוות',
        icon: <ShieldCheck className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי יחס אנשי הצוות לילדים ועמידה בתקן החוקי:',
      },
      {
        id: 'partnership-split',
        title: 'חלוקת רווחי שותפות וקרן חירום',
        category: 'שותפות וכספים',
        icon: <HeartHandshake className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי מודל חלוקת הרווחים בין השותפים והפרשה לקרן חירום:',
      },
      {
        id: 'macro-sliders',
        title: 'סליידרים רחבים למגע',
        category: 'חוויית משתמש ומובייל',
        icon: <Sliders className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי נוחות הזנת המספרים בסליידרים במסכי מגע:',
      },
      {
        id: 'whatsapp-share',
        title: 'שיתוף דוח מעוצב בווטסאפ',
        category: 'דוחות ושיתוף',
        icon: <MessageSquare className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי מבנה הודעת הווטסאפ שנשלחת עם נתוני המאזן:',
      },
      {
        id: 'google-sheets',
        title: 'ייצוא חכם לגוגל שייטס / אקסל',
        category: 'קובצי נתונים',
        icon: <FileSpreadsheet className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי קובץ האקסל המיוצא ונוסחאות החישוב:',
      },
      {
        id: 'tax-calculator',
        title: 'מחשבון מס מוערך (עוסק פטור/מורשה)',
        category: 'מיסוי',
        icon: <DollarSign className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי אומדן חבות המס וביטוח לאומי:',
      },
      {
        id: 'mobile-view',
        title: 'נראות במסכים ניידים ומהירות',
        category: 'עיצוב ומובייל',
        icon: <Smartphone className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי תצוגת האתר בטלפונים ניידים:',
      },
    ],
    []
  );

  // Ready-to-request automation presets
  const automationPresets: AutomationPreset[] = useMemo(
    () => [
      {
        id: 'whatsapp-bot',
        title: '🤖 בוט ווטסאפ אוטומטי להורים וצוות',
        tagline: 'עדכוני נוכחות, תזכורות תשלום והודעות שוטפות',
        description:
          'מערכת השולחת להורים עדכונים אוטומטיים כשהילד מגיע/עוזב, תזכורות תשלום שכר לימוד, והודעות שוטפות ישירות לוואטסאפ ללא עבודה ידנית.',
        icon: <Bot className="w-5 h-5 text-emerald-600" />,
        sampleScope: 'בקשה לפיתוח בוט ווטסאפ אוטומטי לתקשורת עם הורי המעון והצוות',
      },
      {
        id: 'auto-invoicing',
        title: '🧾 הפקת קבלות וחשבוניות אוטומטית',
        tagline: 'שליחה מידית להורה בוואטסאפ/מייל עם קבלת תשלום',
        description:
          'חיבור לסליקת אשראי או ביט המפיק קבלה ירוקה חוקית עם חתימה דיגיטלית ונשלחת אוטומטית להורה ללא צורך בכתיבה ידנית של פנקסי קבלות.',
        icon: <DollarSign className="w-5 h-5 text-[#7a4b29]" />,
        sampleScope: 'בקשה לפיתוח מערכת הפקת קבלות דיגיטליות אוטומטיות עם שליחה ישירה להורים',
      },
      {
        id: 'digital-registration',
        title: '📝 טופס הרשמה וקליטת ילדים דיגיטלי',
        tagline: 'טופס מקוון להורים עם חתימה דיגיטלית ואישורי אלרגיות',
        description:
          'דף הרשמה מקוון מותאם לטלפון: ההורה ממלא פרטים, מעלה תמונת ילד, מסמן אלרגיות, חותם דיגיטלית והנתונים נכנסים אוטומטית למערכת הניהול.',
        icon: <Sparkles className="w-5 h-5 text-amber-600" />,
        sampleScope: 'בקשה לפיתוח מערכת רישום וקליטת ילדים מקוונת עם חתימה דיגיטלית',
      },
      {
        id: 'smart-shift-clock',
        title: '⏱️ שעון נוכחות וסידור עבודה חכם לצוות',
        tagline: 'התראות חריגה מתקן משרד החינוך וחישוב שכר מדויק',
        description:
          'דיווח נוכחות מטפלות מהטלפון (כולל מיקום), חישוב שעות נוספות, והתראה מיידית אם יש חוסר בעובדת מול התקן החוקי לפי כמות הילדים.',
        icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
        sampleScope: 'בקשה לפיתוח שעון נוכחות חכם לצוות עם התראות תקינת פיקוח',
      },
      {
        id: 'food-safety-procurement',
        title: '🍱 ניהול תפריט הזנה ורכש שבועי אוטומטי',
        tagline: 'רשימת קניות שבועית אוטומטית מותאמת לאלרגיות',
        description:
          'בניית תפריט שבועי מאושר משרד הבריאות ויצירה אוטומטית של כמויות רכש ומזון טרי לפי כמות הילדים הנוכחית וסינוס אלרגיות בטוח.',
        icon: <Building className="w-5 h-5 text-[#8c532d]" />,
        sampleScope: 'בקשה לפיתוח מערכת אוטומטית לניהול תפריטים והזמנת רכש מזון שבועי',
      },
      {
        id: 'accounting-sync',
        title: '📊 אינטגרציה ישירה לרואה חשבון',
        tagline: 'סנכרון תנועות ודוח שנתי ישירות לתוכנות החשבונות',
        description:
          'העברת נתונים אוטומטית בסוף כל חודש לקובץ מותאם תוכנות הנהלת חשבונות (חשבשבת, רווחית, ריווחית, קומאקס, iCount ועוד).',
        icon: <FileSpreadsheet className="w-5 h-5 text-teal-600" />,
        sampleScope: 'בקשה לפיתוח סנכרון ישיר לרואה החשבון ותוכנות הנהלת חשבונות',
      },
    ],
    []
  );

  // Toggle selection of a feature
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  };

  // Toggle or add an automation preset to request
  const toggleAutomation = (preset: AutomationPreset) => {
    setSelectedAutomations((prev) => {
      const isSelected = prev.includes(preset.id);
      if (isSelected) {
        return prev.filter((id) => id !== preset.id);
      } else {
        // Automatically inject friendly context to the text if empty
        if (!suggestionText.includes(preset.title)) {
          setSuggestionText((curr) => {
            const prefix = curr.trim() ? `${curr.trim()}\n\n` : '';
            return `${prefix}💡 *${preset.title}*:\nברצוני לבקש תוספת של מערכת זו: ${preset.tagline}.\nפירוט הצורך בעסק: `;
          });
        }
        return [...prev, preset.id];
      }
    });
  };

  // Insert feature prompt to text
  const insertFeaturePrompt = (feature: SiteFeatureOption) => {
    if (!selectedFeatures.includes(feature.id)) {
      setSelectedFeatures((prev) => [...prev, feature.id]);
    }
    setSuggestionText((curr) => {
      const prefix = curr.trim() ? `${curr.trim()}\n\n` : '';
      return `${prefix}📌 *${feature.title}*:\n${feature.defaultPrompt} `;
    });
  };

  // Build the complete email text
  const emailPayload = useMemo(() => {
    const typeLabel =
      suggestionType === 'IMPROVEMENT'
        ? '💡 הצעת ייעול ושדרוג למערכת'
        : suggestionType === 'AUTOMATION'
        ? '🤖 בקשת פיתוח מערכת אוטומטית'
        : suggestionType === 'BUG'
        ? '⚠️ דיווח על תקלה / אי-דיוק'
        : '📋 משוב והצעה כללית';

    const selectedFeaturesList = selectedFeatures
      .map((id) => siteFeatures.find((f) => f.id === id)?.title)
      .filter(Boolean);

    const selectedAutomationsList = selectedAutomations
      .map((id) => automationPresets.find((a) => a.id === id)?.title)
      .filter(Boolean);

    const subject = `[הצעה למערכת מעון] ${typeLabel} - ${new Date().toLocaleDateString('he-IL')}`;

    const bodyLines = [
      `שלום רב לצוות הפיתוח,`,
      ``,
      `נשלחה הצעה חדשה דרך פורטל ניהול מעון ילדים:`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ סוג הפנייה: ${typeLabel}`,
      senderName ? `👤 מאת: ${senderName}` : '',
      senderContact ? `📞 פרטי קשר לחזרה: ${senderContact}` : '',
      `📅 תאריך: ${new Date().toLocaleString('he-IL')}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      selectedFeaturesList.length > 0
        ? `🎯 רכיבים שסומנו באתר להתייחסות ספציפית:\n${selectedFeaturesList.map((t) => ` • ${t}`).join('\n')}\n`
        : '',
      selectedAutomationsList.length > 0
        ? `🤖 מערכות אוטומטיות מבוקשות:\n${selectedAutomationsList.map((t) => ` • ${t}`).join('\n')}\n`
        : '',
      `📝 תוכן ההצעה והפירוט:`,
      suggestionText.trim() || '(לא הוזן מלל נוסף מעבר לרכיבים והמערכות שסומנו)',
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `נשלח ישירות מתיבת ההצעות של המערכת: https://almog787.github.io/Mayabee-management/`,
    ].filter(Boolean);

    return {
      subject,
      body: bodyLines.join('\n'),
    };
  }, [suggestionType, selectedFeatures, selectedAutomations, suggestionText, senderName, senderContact, siteFeatures, automationPresets]);

  // Handle direct send to email (using runtime obfuscated email address)
  const handleSendEmail = () => {
    const recipient = getRecipientEmail();
    const encodedSubject = encodeURIComponent(emailPayload.subject);
    const encodedBody = encodeURIComponent(emailPayload.body);
    const mailtoUrl = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

    setIsSent(true);
    setTimeout(() => setIsSent(false), 3500);

    // Open mail client safely
    window.location.href = mailtoUrl;
  };

  // Handle copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${emailPayload.subject}\n\n${emailPayload.body}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Reset form
  const handleClear = () => {
    setSuggestionText('');
    setSelectedFeatures([]);
    setSelectedAutomations([]);
    setSuggestionType('IMPROVEMENT');
    setSenderName('');
    setSenderContact('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Return to Planner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e4e2de] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ffdeab] text-[#7a4b29] flex items-center justify-center font-bold shadow-inner">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#5f3414] font-heading">
              תיבת הצעות ובקשת מערכות אוטומטיות 💡
            </h2>
            <p className="text-xs text-[#51443c]">
              יש לכם רעיון לשיפור, רצון במערכת אוטומטית חדשה, או הערה על רכיב מסוים באתר? שתפו אותנו בקלות!
            </p>
          </div>
        </div>

        {onBackToPlanner && (
          <button
            onClick={onBackToPlanner}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#efeeea] hover:bg-[#ffdeab] text-[#5f3414] text-xs font-black transition cursor-pointer border border-[#e4e2de] active:scale-95 self-start sm:self-auto"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה למתכנן המאזן והשותפות</span>
          </button>
        )}
      </div>

      {/* Main Grid: Form on the Right/Top, Automation Ideas & Tags on the Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RIGHT COLUMN: The Interactive Suggestion Writing Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#efeeea] pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-[#5f3414] font-heading flex items-center gap-2">
                  <span>כתיבת הצעה או בקשה</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-xs text-[#51443c] mt-0.5">
                  הזינו את תוכן הפנייה. תוכלו לסמן רכיבים ספציפיים משמאל שיתווספו אוטומטית.
                </p>
              </div>

              {(suggestionText || selectedFeatures.length > 0 || selectedAutomations.length > 0) && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="נקה טופס"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>נקה הכל</span>
                </button>
              )}
            </div>

            {/* Step 1: Suggestion Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#51443c] block">סוג הפנייה:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'IMPROVEMENT', label: '💡 הצעת ייעול', sub: 'שיפור קיים' },
                  { id: 'AUTOMATION', label: '🤖 מערכת אוטומטית', sub: 'פיתוח חדש' },
                  { id: 'BUG', label: '⚠️ תקלה / דיוק', sub: 'תיקון חישוב' },
                  { id: 'GENERAL', label: '📋 כללי / משוב', sub: 'דעה ורעיונות' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSuggestionType(type.id as any)}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                      suggestionType === type.id
                        ? 'bg-[#7a4b29] text-white border-[#7a4b29] shadow-xs'
                        : 'bg-[#faf8f5] text-[#5f3414] border-[#e4e2de] hover:border-[#7a4b29]/40'
                    }`}
                  >
                    <span className="text-xs font-black block">{type.label}</span>
                    <span className={`text-[10px] block mt-0.5 ${suggestionType === type.id ? 'text-[#ffdeab]' : 'text-slate-400'}`}>
                      {type.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Tags Display */}
            {(selectedFeatures.length > 0 || selectedAutomations.length > 0) && (
              <div className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#ebd7c5] space-y-2">
                <span className="text-[11px] font-black text-[#7a4b29] uppercase tracking-wide block">
                  רכיבים ומערכות שסומנו לפנייה ({selectedFeatures.length + selectedAutomations.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFeatures.map((fId) => {
                    const feat = siteFeatures.find((f) => f.id === fId);
                    if (!feat) return null;
                    return (
                      <span
                        key={fId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#d6c3b8] text-xs font-bold text-[#5f3414] shadow-2xs"
                      >
                        {feat.icon}
                        <span>{feat.title}</span>
                        <button
                          type="button"
                          onClick={() => toggleFeature(fId)}
                          className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {selectedAutomations.map((aId) => {
                    const auto = automationPresets.find((a) => a.id === aId);
                    if (!auto) return null;
                    return (
                      <span
                        key={aId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 shadow-2xs"
                      >
                        <Bot className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{auto.title}</span>
                        <button
                          type="button"
                          onClick={() => toggleAutomation(auto)}
                          className="text-emerald-500 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: The Main Suggestion Text Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#51443c] block">
                  תוכן ההצעה, הבקשה או ההערה:
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {suggestionText.length} תווים
                </span>
              </div>

              <textarea
                rows={8}
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="כתבו כאן את הצעתכם בפירוט: מה תרצו לשפר באתר, מה יעזור לכם בניהול היומיומי של המעון, או איזה תהליך אוטומטי הייתם שמחים שהמערכת תבצע בעצמה..."
                className="w-full p-4 rounded-2xl bg-[#faf8f5] border border-[#d6c3b8]/60 focus:bg-white focus:border-[#7a4b29] focus:ring-4 focus:ring-[#7a4b29]/10 outline-none text-sm text-[#1b1c1a] leading-relaxed transition resize-y shadow-inner"
              />
            </div>

            {/* Step 3: Optional Sender Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#efeeea]">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#51443c] block">
                  שם השולח/ת (אופציונלי):
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="למשל: מנהלת המעון / שותף"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#faf8f5] border border-[#d6c3b8]/60 text-xs text-[#1b1c1a] outline-none focus:bg-white focus:border-[#7a4b29]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#51443c] block">
                  טלפון או כתובת מייל לחזרה (אופציונלי):
                </label>
                <input
                  type="text"
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                  placeholder="למשל: 050-0000000 / דוא&quot;ל לחזרה"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#faf8f5] border border-[#d6c3b8]/60 text-xs text-[#1b1c1a] outline-none focus:bg-white focus:border-[#7a4b29]"
                />
              </div>
            </div>

            {/* Action Buttons: Direct Email Dispatch (without raw email in plain text) */}
            <div className="space-y-3 pt-4 border-t border-[#efeeea]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSendEmail}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-[#7a4b29] to-[#8c532d] hover:from-[#5f3414] hover:to-[#7a4b29] text-white font-black px-6 py-4 rounded-2xl shadow-lg transition-all text-sm sm:text-base cursor-pointer active:scale-98"
                  title="שליחת תוכן התיבה ישירות במייל"
                >
                  <Send className="w-5 h-5 text-[#ffdeab]" />
                  <span>שליחת ההצעה ישירות לצוות הפיתוח בדוא"ל 🚀</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-2 bg-[#efeeea] hover:bg-[#ffdeab] text-[#5f3414] font-black px-5 py-3.5 rounded-2xl transition cursor-pointer border border-[#d6c3b8] active:scale-98 text-xs sm:text-sm"
                  title="העתקת תוכן ההודעה ללוח"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#7a4b29]" />}
                  <span>{isCopied ? 'התוכן הועתק בהצלחה! ✓' : 'העתקת תוכן ההודעה'}</span>
                </button>
              </div>

              {isSent && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>נפתח חלון הדוא"ל שלך לשליחה ישירה לצוות הפיתוח. תודה על המשוב!</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                בלחיצה על "שליחת ההצעה" תיפתח תוכנת הדוא"ל שלכם (Gmail / Outlook / טלפון נייד) עם תוכן ההודעה המעוצב מוכן לשילוח בלחיצה אחת.
              </p>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Feature Selection Tags & Custom Automation Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Tagging specific site features */}
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7a4b29]" />
                <h4 className="font-black text-base text-[#5f3414] font-heading">
                  סימון רכיבים ספציפיים באתר להתייחסות
                </h4>
              </div>
              <p className="text-xs text-[#51443c]">
                לחצו על רכיב באתר כדי לקשר אליו את ההצעה או להוסיף תבנית התייחסות ישירות לתיבת הטקסט:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {siteFeatures.map((feature) => {
                const isSelected = selectedFeatures.includes(feature.id);
                return (
                  <div
                    key={feature.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#ffdeab]/30 border-[#7a4b29] ring-2 ring-[#7a4b29]/10'
                        : 'bg-[#faf8f5] border-[#e4e2de] hover:border-[#7a4b29]/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      className="flex items-center gap-2.5 flex-1 text-right cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#e4e2de] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {feature.icon}
                      </div>
                      <div>
                        <span className="text-xs font-black text-[#5f3414] block leading-snug">
                          {feature.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {feature.category}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => insertFeaturePrompt(feature)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-[#ffdeab] text-[10px] font-bold text-[#7a4b29] border border-[#d6c3b8]/60 cursor-pointer shadow-2xs transition"
                        title="הוסף פסקה על רכיב זה בתיבת הטקסט"
                      >
                        + הוסף לטקסט
                      </button>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFeature(feature.id)}
                        className="w-4 h-4 rounded text-[#7a4b29] accent-[#7a4b29] cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Proposing Any Automated System Desired */}
          <div className="bg-gradient-to-br from-[#fffdfa] to-[#faf6f0] rounded-3xl border-2 border-[#ffdeab] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-700" />
                <h4 className="font-black text-base text-[#5f3414] font-heading">
                  בקשת מערכות אוטומטיות שרוצים בעסק
                </h4>
              </div>
              <p className="text-xs text-[#51443c]">
                בחרו מתוך ההצעות הבאות או בקשו כל מערכת אוטומטית שתרצו לחסוך זמן וטעויות:
              </p>
            </div>

            <div className="space-y-3">
              {automationPresets.map((preset) => {
                const isSelected = selectedAutomations.includes(preset.id);
                return (
                  <div
                    key={preset.id}
                    onClick={() => toggleAutomation(preset)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/15'
                        : 'bg-white border-[#ebd7c5] hover:border-[#7a4b29]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#faf8f5] border border-[#e4e2de] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {preset.icon}
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-[#5f3414]">
                            {preset.title}
                          </h5>
                          <span className="text-[11px] font-bold text-emerald-800 block">
                            {preset.tagline}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex-shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isSelected ? 'נבחר לבקשה ✓' : '+ הוסף'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
