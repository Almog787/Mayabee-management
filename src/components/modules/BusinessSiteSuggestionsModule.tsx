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
  Users,
  ShieldCheck,
  Building,
  DollarSign,
  HeartHandshake,
  Smartphone,
  Check,
  ArrowRight,
  ExternalLink,
  Camera,
  Calendar,
  MapPin,
  PhoneCall,
  Star,
  Clock,
  Utensils,
  Download,
  RotateCcw,
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
}

export const BusinessSiteSuggestionsModule: React.FC<BusinessSiteSuggestionsProps> = ({
  onBackToPlanner,
  onSwitchToManagementSuggestions,
}) => {
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedAutomations, setSelectedAutomations] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<'IMPROVEMENT' | 'AUTOMATION' | 'CONTENT' | 'GENERAL'>('IMPROVEMENT');
  const [senderName, setSenderName] = useState<string>('');
  const [senderContact, setSenderContact] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Features of the daycare's public-facing business website (Mayabee)
  const siteFeatures: SiteFeatureOption[] = useMemo(
    () => [
      {
        id: 'gallery',
        title: 'גלריית תמונות וסרטוני מעון',
        category: 'מדיה וויזואל',
        icon: <Camera className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי גלריית התמונות והסרטונים של המעון, המתקנים והחצר:',
      },
      {
        id: 'staff-presentation',
        title: 'הצגת הצוות והמובילות הפדגוגיות',
        category: 'אמינות והיכרות',
        icon: <Users className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי הצגת המטפלות, הגננות והרקע המקצועי שלהן:',
      },
      {
        id: 'contact-tour-booking',
        title: 'טופס יצירת קשר ותיאום סיור היכרות',
        category: 'קליטת הורים חדשים',
        icon: <PhoneCall className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי תהליך השארת הפרטים של הורים ותיאום סיור במעון:',
      },
      {
        id: 'location-map',
        title: 'מיקום, דרכי הגעה ומפה באריאל',
        category: 'נגישות ומיקום',
        icon: <MapPin className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי המיקום של המעון באריאל, הוראות הגעה ושעות הפעילות:',
      },
      {
        id: 'daily-menu',
        title: 'תפריט הזנה יומי ושבועי',
        category: 'תזונה ובריאות',
        icon: <Utensils className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי הצגת התפריט השבועי, פירוט הארוחות הטריות והטיפול באלרגיות:',
      },
      {
        id: 'calendar-schedule',
        title: 'לוח חופשות ופעילויות שנתי',
        category: 'לוח זמנים',
        icon: <Calendar className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי לוח החופשות, חגי ישראל, מסיבות ואירועים במעון:',
      },
      {
        id: 'parent-testimonials',
        title: 'המלצות וחוות דעת של הורים',
        category: 'הוכחה חברתית',
        icon: <Star className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי הצגת חוות הדעת וההמלצות של הורים מרוצים מהמעון:',
      },
      {
        id: 'mobile-experience',
        title: 'חוויית גלישה בטלפונים ניידים',
        category: 'עיצוב ומובייל',
        icon: <Smartphone className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי מראה אתר העסק במובייל, נוחות הקריאה ומהירות הטעינה:',
      },
    ],
    []
  );

  // Automation presets specific to the public-facing business site
  const automationPresets: AutomationPreset[] = useMemo(
    () => [
      {
        id: 'floating-whatsapp-widget',
        title: '💬 כפתור ובוט וואטסאפ צף באתר העסק',
        tagline: 'מענה אוטומטי מהיר להורים שמתעניינים בהרשמה',
        description:
          'הוספת כפתור WhatsApp צף באתר שמאפשר להורים לפנות בלחיצה אחת ולקבל תשובות אוטומטיות על שעות פעילות, גילאים ומקומות פנויים.',
        icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
      },
      {
        id: 'online-tour-scheduler',
        title: '📅 יומן מקוון לתיאום עצמאי של סיור במעון',
        tagline: 'ההורה בוחר יום ושעה פנויים ומקבל תזכורת אוטומטית',
        description:
          'מערכת המציגה להורים מועדים פנויים לסיור היכרות במעון באריאל (למשל בימי שישי או בשעות אחה"צ), שולחת אישור מידי ומונעת כפילויות.',
        icon: <Clock className="w-5 h-5 text-indigo-600" />,
      },
      {
        id: 'digital-waitlist-enrollment',
        title: '📝 טופס שריון מקום ורישום דיגיטלי מקוון',
        tagline: 'טופס ממוחשב להרשמה לשנת הלימודים הבאה',
        description:
          'דף הרשמה דיגיטלי מלא להורים: הזנת פרטי הילד, שריון מקום בתינוקייה או בפעוטון, והעלאת מסמכים מכל מכשיר נייד.',
        icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      },
      {
        id: 'live-instagram-feed',
        title: '📸 גלריה חיה מסונכרנת מאינסטגרם/פייסבוק',
        tagline: 'תמונות טריות מפעילויות המעון מתעדכנות אוטומטית',
        description:
          'עדכון אוטומטי של תמונות חדשות מהחצר ומהפעילויות השוטפות ישירות מדף הרשתות החברתיות של המעון אל תוך אתר העסק.',
        icon: <Camera className="w-5 h-5 text-rose-600" />,
      },
      {
        id: 'tuition-calculator-widget',
        title: '🧮 מחשבון שקיפות שכר לימוד להורים',
        tagline: 'סימולטור פשוט להורים לחישוב עלות חודשית',
        description:
          'רכיב פשוט שמאפשר להורה לבחור גיל (תינוק/פעוט) ותוספות (צהרון/יום שישי) ולקבל אומדן שקוף של שכר הלימוד החודשי.',
        icon: <DollarSign className="w-5 h-5 text-[#7a4b29]" />,
      },
      {
        id: 'review-collector-system',
        title: '⭐ מערכת אוטומטית לאיסוף המלצות הורים',
        tagline: 'טופס מהיר לשליחת פרגון והצגה מעוצבת באתר',
        description:
          'טופס דיגיטלי קצר שנשלח להורי המעון בסוף שנה ומאפשר להם לכתוב המלצה חמה וציון, שמתפרסמים באתר העסק לאחר אישור מנהלת.',
        icon: <Star className="w-5 h-5 text-yellow-600" />,
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

  // Toggle automation preset
  const toggleAutomation = (preset: AutomationPreset) => {
    setSelectedAutomations((prev) => {
      const isSelected = prev.includes(preset.id);
      if (isSelected) {
        return prev.filter((id) => id !== preset.id);
      } else {
        if (!suggestionText.includes(preset.title)) {
          setSuggestionText((curr) => {
            const prefix = curr.trim() ? `${curr.trim()}\n\n` : '';
            return `${prefix}💡 *${preset.title}*:\nברצוני לבקש תוספת של מערכת זו לאתר העסק: ${preset.tagline}.\nפירוט ההתאמה לגן: `;
          });
        }
        return [...prev, preset.id];
      }
    });
  };

  // Insert prompt to text
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
        ? '🏡 הצעת ייעול לאתר העסק (Mayabee)'
        : suggestionType === 'AUTOMATION'
        ? '🤖 בקשת מערכת אוטומטית לאתר העסק'
        : suggestionType === 'CONTENT'
        ? '📝 עדכון תוכן / תמונות / מידע באתר הגן'
        : '📋 משוב כללי לאתר העסק';

    const selectedFeaturesList = selectedFeatures
      .map((id) => siteFeatures.find((f) => f.id === id)?.title)
      .filter(Boolean);

    const selectedAutomationsList = selectedAutomations
      .map((id) => automationPresets.find((a) => a.id === id)?.title)
      .filter(Boolean);

    const subject = `[הצעה לאתר העסק Mayabee] ${typeLabel} - ${new Date().toLocaleDateString('he-IL')}`;

    const bodyLines = [
      `שלום רב לצוות הפיתוח,`,
      ``,
      `נשלחה הצעה חדשה ייעודית עבור אתר העסק של הגן (${BUSINESS_SITE_URL}):`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ סוג הפנייה: ${typeLabel}`,
      senderName ? `👤 מאת: ${senderName}` : '',
      senderContact ? `📞 פרטי קשר לחזרה: ${senderContact}` : '',
      `📅 תאריך: ${new Date().toLocaleString('he-IL')}`,
      `🌐 כתובת אתר העסק: ${BUSINESS_SITE_URL}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      selectedFeaturesList.length > 0
        ? `🎯 רכיבים שסומנו באתר העסק להתייחסות:\n${selectedFeaturesList.map((t) => ` • ${t}`).join('\n')}\n`
        : '',
      selectedAutomationsList.length > 0
        ? `🤖 מערכות אוטומטיות מבוקשות לאתר העסק:\n${selectedAutomationsList.map((t) => ` • ${t}`).join('\n')}\n`
        : '',
      `📝 תוכן ההצעה והפירוט:`,
      suggestionText.trim() || '(לא הוזן מלל נוסף מעבר לרכיבים והמערכות שסומנו)',
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `נשלח דרך תיבת ההצעות הייעודית לאתר העסק: ${BUSINESS_SITE_URL}`,
    ].filter(Boolean);

    return {
      subject,
      body: bodyLines.join('\n'),
    };
  }, [suggestionType, selectedFeatures, selectedAutomations, suggestionText, senderName, senderContact, siteFeatures, automationPresets]);

  // Handle direct send to email (using runtime obfuscated email)
  const handleSendEmail = () => {
    const recipient = getRecipientEmail();
    const encodedSubject = encodeURIComponent(emailPayload.subject);
    const encodedBody = encodeURIComponent(emailPayload.body);
    const mailtoUrl = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

    setIsSent(true);
    setTimeout(() => setIsSent(false), 3500);

    window.location.href = mailtoUrl;
  };

  // Handle copy text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${emailPayload.subject}\n\n${emailPayload.body}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Generate a downloadable standalone HTML file ready to deploy on Mayabee repo
  const handleDownloadStandalonePage = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תיבת הצעות ושדרוגים לאתר הגן Mayabee</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Heebo', sans-serif; background-color: #fbf9f5; color: #1b1c1a; }
  </style>
</head>
<body class="p-4 sm:p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="bg-gradient-to-l from-[#7a4b29] to-[#451a03] text-white p-6 sm:p-8 rounded-3xl shadow-xl">
      <h1 class="text-2xl sm:text-3xl font-black">💡 תיבת הצעות ושדרוגים לאתר הגן (Mayabee)</h1>
      <p class="text-xs sm:text-sm text-[#ffedd5] mt-2">יש לכם רעיון לשיפור אתר הגן או שתרצו להציע תכנים חדשים? שתפו אותנו!</p>
    </div>
    <div class="bg-white p-6 sm:p-8 rounded-3xl border border-[#e4e2de] shadow-sm space-y-4">
      <label class="block text-sm font-black text-[#5f3414]">כתבו את הצעתכם:</label>
      <textarea id="suggestionText" rows="6" class="w-full p-4 border border-[#d6c3b8] rounded-2xl outline-none focus:border-[#7a4b29]" placeholder="רשמו כאן את הצעתכם..."></textarea>
      <button onclick="sendMail()" class="w-full bg-[#7a4b29] hover:bg-[#5f3414] text-white font-black py-4 rounded-2xl shadow-lg transition">
        שליחת ההצעה לצוות הפיתוח בדוא"ל 🚀
      </button>
    </div>
  </div>
  <script>
    function sendMail() {
      var text = document.getElementById('suggestionText').value;
      var recipient = atob('YWxtb2dzaGFrZWQ4QGdtYWlsLmNvbQ==');
      var subject = encodeURIComponent('[הצעה מאתר Mayabee] הצעה חדשה לאתר העסק');
      var body = encodeURIComponent(text || 'נשלחה הצעה מאתר Mayabee');
      window.location.href = 'mailto:' + recipient + '?subject=' + subject + '&body=' + body;
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'suggestions-mayabee.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

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
      {/* Top Banner with Direct Link to the Business Website */}
      <div className="bg-gradient-to-l from-[#7a4b29] via-[#8c532d] to-[#451a03] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-[#d6c3b8]/30">
        <div className="space-y-2.5 max-w-2xl relative z-10 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#ffdeab] text-xs font-black tracking-wide uppercase">
            <Building className="w-3.5 h-3.5" />
            <span>אתר העסק של הגן • Mayabee</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading leading-tight">
            תיבת הצעות ואוטומציה לאתר הגן (Mayabee) 🏡
          </h2>

          <p className="text-xs sm:text-sm text-[#ffedd5]/90 leading-relaxed font-medium">
            דף ייעודי להצעות שדרוג, תוספות תכנים, רעיונות עיצוב ובקשת מערכות אוטומטיות עבור אתר העסק הרשמי של הגן בכתובת{' '}
            <a
              href={BUSINESS_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ffdeab] underline decoration-[#ffdeab]/60 underline-offset-4 inline-flex items-center gap-1 font-bold hover:text-white"
            >
              <span>{BUSINESS_SITE_URL}</span>
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 flex-shrink-0">
          <a
            href={BUSINESS_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#ffdeab] hover:bg-white text-[#5f3414] font-black px-4 py-2.5 rounded-2xl shadow-lg transition-all text-xs sm:text-sm cursor-pointer border border-[#ffdeab] active:scale-95 justify-center"
            title="צפייה באתר העסק של הגן בלשונית חדשה"
          >
            <ExternalLink className="w-4 h-4 text-[#7a4b29]" />
            <span>פתיחת אתר הגן (Mayabee) 🔗</span>
          </a>

          <button
            onClick={handleDownloadStandalonePage}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-black px-4 py-2 rounded-2xl border border-white/30 transition text-xs cursor-pointer justify-center"
            title="הורדת קובץ HTML מוכן לשימוש ישיר בפרויקט Mayabee"
          >
            <Download className="w-3.5 h-3.5 text-[#ffdeab]" />
            <span>{downloadSuccess ? 'קובץ HTML הורד! ✓' : 'הורד דף זה כקובץ HTML לאתר'}</span>
          </button>

          {onSwitchToManagementSuggestions && (
            <button
              onClick={onSwitchToManagementSuggestions}
              className="text-xs text-[#ffedd5] hover:text-white underline font-bold mt-1 text-center"
            >
              מעבר לתיבת הצעות של פורטל הניהול ➔
            </button>
          )}
        </div>

        {/* Background glow */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Form on the Right/Top, Tags & Business Automations on the Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RIGHT COLUMN: The Interactive Suggestion Writing Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#efeeea] pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-[#5f3414] font-heading flex items-center gap-2">
                  <span>כתיבת הצעה עבור אתר העסק (Mayabee)</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-xs text-[#51443c] mt-0.5">
                  סמנו רכיבים ומערכות משמאל או רשמו בחופשיות כל רעיון לשדרוג חוויית ההורים באתר.
                </p>
              </div>

              {(suggestionText || selectedFeatures.length > 0 || selectedAutomations.length > 0) && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="איפוס טופס"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>נקה טופס</span>
                </button>
              )}
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-[#51443c] block">סוג ההצעה לאתר הגן:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'IMPROVEMENT', label: '🏡 שדרוג אתר הגן', sub: 'עיצוב ונראות' },
                  { id: 'AUTOMATION', label: '🤖 אוטומציה להורים', sub: 'בוט / יומן / הרשמה' },
                  { id: 'CONTENT', label: '📸 תכנים ותמונות', sub: 'גלריה / תפריט / צוות' },
                  { id: 'GENERAL', label: '📋 משוב כללי', sub: 'רעיונות ורשמים' },
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
                  סעיפים שסומנו לפנייה לאתר הגן ({selectedFeatures.length + selectedAutomations.length}):
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

            {/* Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#51443c] block">
                  פירוט ההצעה או הבקשה לאתר הגן (Mayabee):
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {suggestionText.length} תווים
                </span>
              </div>

              <textarea
                rows={8}
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="כתבו כאן את הצעתכם בפירוט: תוספת דפים באתר הגן, עדכון גלריית תמונות, הוספת בוט ווטסאפ לקביעת סיורים, תפריטי אוכל, או כל תכונה שתרצו שתופיע באתר הרשמי..."
                className="w-full p-4 rounded-2xl bg-[#faf8f5] border border-[#d6c3b8]/60 focus:bg-white focus:border-[#7a4b29] focus:ring-4 focus:ring-[#7a4b29]/10 outline-none text-sm text-[#1b1c1a] leading-relaxed transition resize-y shadow-inner"
              />
            </div>

            {/* Optional Sender Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#efeeea]">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#51443c] block">
                  שם השולח/ת (אופציונלי):
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="למשל: הנהלת הגן / הורה"
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

            {/* Action buttons (Direct Email Dispatch without plain email in text) */}
            <div className="space-y-3 pt-4 border-t border-[#efeeea]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSendEmail}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-l from-[#7a4b29] to-[#8c532d] hover:from-[#5f3414] hover:to-[#7a4b29] text-white font-black px-6 py-4 rounded-2xl shadow-lg transition-all text-sm sm:text-base cursor-pointer active:scale-98"
                  title="שליחת ההצעה ישירות לצוות הפיתוח בדוא&quot;ל"
                >
                  <Send className="w-5 h-5 text-[#ffdeab]" />
                  <span>שליחת ההצעה עבור אתר הגן בדוא"ל 🚀</span>
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
                  <span>נפתח חלון הדוא"ל שלך לשליחת ההצעה על אתר הגן Mayabee. תודה על המשוב!</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                בלחיצה על "שליחת ההצעה" תיפתח תוכנת הדוא"ל שלכם מוכנה לשליחה ישירה לצוות הפיתוח עם כל הרכיבים והקישורים הרלוונטיים.
              </p>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Feature Selection Tags & Custom Automations for Mayabee (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Features on Mayabee public site */}
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7a4b29]" />
                <h4 className="font-black text-base text-[#5f3414] font-heading">
                  סימון רכיבים ספציפיים באתר הגן להתייחסות
                </h4>
              </div>
              <p className="text-xs text-[#51443c]">
                סמנו את החלקים באתר העסק שאליהם תרצו להתייחס או הוסיפו תבנית ישירות לטקסט:
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

          {/* Card 2: Automations for the public-facing site */}
          <div className="bg-gradient-to-br from-[#fffdfa] to-[#faf6f0] rounded-3xl border-2 border-[#ffdeab] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-700" />
                <h4 className="font-black text-base text-[#5f3414] font-heading">
                  מערכות אוטומטיות מובילות לאתר העסק
                </h4>
              </div>
              <p className="text-xs text-[#51443c]">
                בחרו מתוך ההצעות הבאות לשדרוג שירות ההורים באתר הגן Mayabee:
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
