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
  Maximize2,
  X,
  Eye,
  ShieldAlert,
  Music,
  Heart,
  Home,
  CheckSquare,
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
  previewSnippet: React.ReactNode;
  fullPreviewTitle?: string;
  fullPreviewDesc?: string;
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
  const [inspectingFeature, setInspectingFeature] = useState<SiteFeatureOption | null>(null);

  // Expanded site features aligned with the Mayabee Daycare website structure in Ariel
  const siteFeatures: SiteFeatureOption[] = useMemo(
    () => [
      {
        id: 'hero-header',
        title: 'שער המעון, סלוגן וכותרת ראשית',
        category: 'כותרת ושער',
        icon: <Home className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי כותרת השער של האתר, הסלוגן והתמונה המרכזית בכניסה:',
        fullPreviewTitle: 'כותרת שער האתר, סלוגן המעון ותמונת הכניסה',
        fullPreviewDesc: 'הרו הידר מרשים עם סלוגן "בית חם, עוטף ובטוח לקטנטנים באריאל", כפתור חיוג מהיר ושריון מקום.',
        previewSnippet: (
          <div className="bg-gradient-to-l from-[#7a4b29] to-[#5f3414] text-white p-3 rounded-xl space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="flex justify-between items-center border-b border-white/20 pb-1">
              <span className="font-black text-[#ffdeab]">🐝 מעון הבית של מאיה • אריאל</span>
              <span className="text-[8px] bg-white/20 px-1 rounded">תשפ"ו</span>
            </div>
            <h4 className="text-xs font-black">מקום חם, אוהב ומפתח לקטנטנים</h4>
            <p className="text-[8.5px] text-[#ffedd5]">תינוקייה ופעוטון באווירה משפחתית, למידה חווייתית וליווי פדגוגי צמוד.</p>
            <div className="bg-[#ffdeab] text-[#5f3414] text-center font-black py-1 rounded text-[8.5px]">
              שריון מקום לשנת הלימודים הבאה ➔
            </div>
          </div>
        ),
      },
      {
        id: 'about-vision',
        title: 'אודות המעון והחזון החינוכי',
        category: 'פדגוגיה וחזון',
        icon: <Heart className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי סקירת החזון החינוכי, הגישה הפדגוגית והערכים של המעון:',
        fullPreviewTitle: 'אודות המעון והחזון הפדגוגי',
        fullPreviewDesc: 'פירוט הערכים המובילים: יחס אישי, פיתוח ערוצי תקשורת, עצמאות, סדר יום עשיר וביטחון רגשי.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>💛 הגישה החינוכית והערכים שלנו</span>
              <span className="text-slate-400">חזון פדגוגי</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[8.5px] text-slate-700">
              <div className="bg-white p-1 rounded border border-[#e4e2de]">✨ יחס אישי ומכיל לכל ילד/ה</div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">🌱 פיתוח עצמאות וביטחון עצמי</div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">🎨 גירוי חושי ולמידה חווייתית</div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">🤗 תקשורת שוטפת ומקרבת מול ההורים</div>
            </div>
          </div>
        ),
      },
      {
        id: 'age-groups',
        title: 'קבוצות גיל: תינוקייה ופעוטון',
        category: 'כיתות וגילאים',
        icon: <Users className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי פירוט קבוצות הגיל (תינוקייה ופעוטון) והחלוקה לכיתות:',
        fullPreviewTitle: 'חלוקה לקבוצות גיל: תינוקייה ופעוטון',
        fullPreviewDesc: 'הפרדה מותאמת בין תינוקות (3 חודשים עד שנה וחצי, יחס 1:6) לפעוטות (שנה וחצי עד 3 שנים, יחס 1:9).',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>👶 קבוצות הגיל במעון</span>
              <span className="text-emerald-700 font-bold">יחס מורחב</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                <strong className="block text-[#7a4b29] text-[9.5px]">תינוקייה (3 חוד' - 1.5)</strong>
                <span className="text-[8px] text-slate-500 block">יחס חוקי 1:6 • מרחב זחילה מרופד</span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                <strong className="block text-emerald-800 text-[9.5px]">פעוטון (1.5 - 3 שנים)</strong>
                <span className="text-[8px] text-slate-500 block">יחס חוקי 1:9 • פינות משחק ויצירה</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'safety-security',
        title: 'בטיחות, מרחב מוגן ומצלמות',
        category: 'בטיחות ומוגנות',
        icon: <ShieldAlert className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי נהלי הבטיחות, המרחב המוגן, המצלמות והאבטחה במעון:',
        fullPreviewTitle: 'נהלי בטיחות, מרחב מוגן (ממ"ד) ואבטחה היקפית',
        fullPreviewDesc: 'ממ"ד מרווח ותקני, שער חשמלי עם קודן, לחצן מצוקה, בדיקות בטיחות תקופתיות של מהנדס מוסמך.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>🛡️ בטיחות ומוגנות ברמה הגבוהה ביותר</span>
              <span className="text-emerald-700 font-bold">מאושר משרד העבודה</span>
            </div>
            <div className="space-y-1 text-[8.5px]">
              <div className="bg-white p-1 rounded border border-[#e4e2de] flex justify-between">
                <span>🏰 מרחב מוגן (ממ"ד) תקני ומאובזר:</span>
                <strong className="text-emerald-700">גישה מיידית ✓</strong>
              </div>
              <div className="bg-white p-1 rounded border border-[#e4e2de] flex justify-between">
                <span>🔐 שער כניסה נעול עם קודן מאובטח:</span>
                <strong className="text-emerald-700">בקרת כניסה ✓</strong>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'enrichment-activities',
        title: 'חוגי העשרה, תנועה ומוזיקה',
        category: 'חוגים ופעילויות',
        icon: <Music className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי פירוט חוגי ההעשרה (מוזיקה, ריתמיקה, תנועה ובעלי חיים):',
        fullPreviewTitle: 'חוגי העשרה חיצוניים וסדנאות התפתחות',
        fullPreviewDesc: 'חוגי ריתמיקה ומוזיקה לגיל הרך, חוג תנועה וספורט כייפי, מפגשי טבע וחוויה עם בעלי חיים.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>🎵 חוגי העשרה שבועיים</span>
              <span className="text-indigo-700 font-bold">מדריכים מוסמכים</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[8px] text-center">
              <div className="bg-white p-1 rounded border border-[#e4e2de]">
                <strong className="block text-indigo-700">🎶 ריתמיקה וצליל</strong>
                <span>פיתוח שמיעה וקצב</span>
              </div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">
                <strong className="block text-[#7a4b29]">🤸 תנועה לגיל הרך</strong>
                <span>מוטוריקה גסה</span>
              </div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">
                <strong className="block text-emerald-700">🐾 מפגש טבע</strong>
                <span>חוויה חושית</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'daily-menu',
        title: 'תפריט הזנה יומי ושבועי',
        category: 'תזונה ובריאות',
        icon: <Utensils className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי הצגת התפריט השבועי, פירוט הארוחות הטריות והטיפול באלרגיות:',
        fullPreviewTitle: 'תפריט הזנה עשיר, טרי ומאוזן לילדים',
        fullPreviewDesc: '3 ארוחות טריות המבושלות יום-יום במעון, באישור תזונאית לגיל הרך ובהתאמה מלאה לאלרגיות.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>🍎 תפריט הזנה יומי טרי</span>
              <span className="text-amber-800 font-bold">כשר • מבושל במקום</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[8px] text-center">
              <div className="bg-white p-1 rounded border border-[#e4e2de]">
                <strong className="block text-[#7a4b29]">08:30 בוקר</strong>
                <span>ביצים, גבינות, ירקות</span>
              </div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">
                <strong className="block text-[#7a4b29]">12:00 צהריים</strong>
                <span>עוף טרי, קטניות ודגנים</span>
              </div>
              <div className="bg-white p-1 rounded border border-[#e4e2de]">
                <strong className="block text-[#7a4b29]">15:30 מנחה</strong>
                <span>פירות העונה וכריך</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'gallery',
        title: 'גלריית תמונות וסרטוני מעון',
        category: 'מדיה וויזואל',
        icon: <Camera className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי גלריית התמונות והסרטונים של המעון, המתקנים והחצר:',
        fullPreviewTitle: 'גלריית תמונות וסרטונים מהמעון והחצר באריאל',
        fullPreviewDesc: 'תצוגה ויזואלית של מתקני המשחקים, חדרי הפעילות, פינות הג\'ימבורי וארוחות הילדים.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="flex justify-between items-center text-[#5f3414] font-black border-b border-[#e4e2de] pb-1">
              <span>📸 גלריית חוויות מהמעון</span>
              <span className="text-[8px] text-slate-400">מתקנים וחצר</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-amber-100 rounded-lg p-2 text-center text-amber-900 font-bold border border-amber-200">
                🌳 חצר מתקנים מוצלת
              </div>
              <div className="bg-emerald-100 rounded-lg p-2 text-center text-emerald-900 font-bold border border-emerald-200">
                🎨 פינת יצירה וצבע
              </div>
              <div className="bg-rose-100 rounded-lg p-2 text-center text-rose-900 font-bold border border-rose-200">
                🧸 ג'ימבורי בטיחותי
              </div>
              <div className="bg-indigo-100 rounded-lg p-2 text-center text-indigo-900 font-bold border border-indigo-200">
                📚 שעת סיפור ומפגש
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'staff-presentation',
        title: 'הצגת הצוות והמובילות הפדגוגיות',
        category: 'אמינות והיכרות',
        icon: <Users className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי הצגת המטפלות, הגננות והרקע המקצועי שלהן:',
        fullPreviewTitle: 'כרטיסי היכרות עם צוות המעון והמובילות',
        fullPreviewDesc: 'הצגת שמות, תפקידים, שנות ניסיון, הכשרות עזרה ראשונה ותפיסה חינוכית של צוות המעון.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>👩‍🏫 הצוות החינוכי המסור שלנו</span>
              <span className="text-emerald-700 font-bold">הכשרות בתוקף ✓</span>
            </div>
            <div className="space-y-1">
              <div className="bg-white p-1.5 rounded-lg border border-[#e4e2de] flex items-center justify-between">
                <div>
                  <strong className="block text-[#5f3414]">גננת ומנהלת פדגוגית</strong>
                  <span className="text-[8px] text-slate-400">תואר בחינוך לגיל הרך • ניסיון עשיר</span>
                </div>
                <span className="text-[8px] bg-[#ffdeab] px-1 py-0.5 rounded font-bold text-[#5f3414]">מובילה</span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-[#e4e2de] flex items-center justify-between">
                <div>
                  <strong className="block text-[#5f3414]">מטפלת מוסמכת בתינוקייה</strong>
                  <span className="text-[8px] text-slate-400">עזרה ראשונה • גישה חמה ומכילה</span>
                </div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold">צוות מוסמך</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'parent-testimonials',
        title: 'המלצות וחוות דעת של הורים',
        category: 'הוכחה חברתית',
        icon: <Star className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי הצגת חוות הדעת וההמלצות של הורים מרוצים מהמעון:',
        fullPreviewTitle: 'המלצות וחוות דעת של הורים מרוצים',
        fullPreviewDesc: 'עדויות של הורים על החום, המסירות, ההתפתחות המוטורית והשפה שהילדים רוכשים במעון.',
        previewSnippet: (
          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="flex justify-between items-center border-b border-amber-200 pb-1">
              <span className="font-black text-[#5f3414]">⭐ הורים ממליצים בחום</span>
              <span className="text-amber-500 font-bold">★★★★★</span>
            </div>
            <p className="bg-white p-1.5 rounded border border-[#ebd7c5] text-slate-700 italic leading-snug">
              "הצוות הכי חם, אכפתי ומקצועי שיש באריאל! הילד רץ לגן כל בוקר עם חיוך ענק."
              <span className="block text-left text-[8px] text-slate-400 font-bold not-italic mt-0.5">- משפחת לוי</span>
            </p>
          </div>
        ),
      },
      {
        id: 'calendar-schedule',
        title: 'לוח חופשות ופעילויות שנתי',
        category: 'לוח זמנים',
        icon: <Calendar className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי לוח החופשות, חגי ישראל, מסיבות ואירועים במעון:',
        fullPreviewTitle: 'לוח חופשות שנתי, מסיבות ואירועים קהילתיים',
        fullPreviewDesc: 'לוח שנה שנתי ברור להורים עם חופשות משרד העבודה/החינוך, ימי שישי, מסיבות חנוכה, פורים וסוף שנה.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#e4e2de] pb-1 flex justify-between">
              <span>📅 לוח חופשות ואירועים תשפ"ו</span>
              <span className="text-slate-400">מעודכן להורים</span>
            </div>
            <div className="space-y-1 text-[8.5px]">
              <div className="bg-white p-1 rounded border border-[#e4e2de] flex justify-between">
                <span>חופשת סוכות ושמחת תורה:</span>
                <strong className="text-amber-800">גשר קצר בלבד</strong>
              </div>
              <div className="bg-white p-1 rounded border border-[#e4e2de] flex justify-between">
                <span>מסיבת חנוכה משותפת:</span>
                <strong className="text-indigo-800">יום שישי 10:00</strong>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'contact-tour-booking',
        title: 'טופס יצירת קשר ותיאום סיור היכרות',
        category: 'קליטת הורים חדשים',
        icon: <PhoneCall className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי תהליך השארת הפרטים של הורים ותיאום סיור במעון:',
        fullPreviewTitle: 'טופס פנייה מקוון לתיאום סיור היכרות במעון',
        fullPreviewDesc: 'טופס נוח שמאפשר להורים להשאיר פרטים, לבחור מועד מועדף לביקור ולקבל מענה מהיר.',
        previewSnippet: (
          <div className="bg-white p-2.5 rounded-xl border border-[#ebd7c5] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="text-[#5f3414] font-black border-b border-[#ebd7c5] pb-1 flex justify-between">
              <span>📞 בואו להכיר: תיאום ביקור במעון</span>
              <span className="text-amber-800 font-bold">שנת הלימודים הבאה</span>
            </div>
            <div className="space-y-1">
              <div className="bg-[#faf8f5] px-2 py-1 rounded border border-[#e4e2de] text-slate-500">
                שם מלא: ישראל ישראלי | טלפון: 050-XXXXXXX
              </div>
              <div className="bg-[#7a4b29] text-white py-1 rounded text-center font-black">
                תיאום סיור היכרות בלחיצה אחת ➔
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'location-map',
        title: 'מיקום, דרכי הגעה ומפה באריאל',
        category: 'נגישות ומיקום',
        icon: <MapPin className="w-4 h-4 text-[#7a4b29]" />,
        defaultPrompt: 'לגבי המיקום של המעון באריאל, הוראות הגעה ושעות הפעילות:',
        fullPreviewTitle: 'מיקום המעון באריאל, שעות פעילות ודרכי הגעה',
        fullPreviewDesc: 'כתובת מדויקת, מפה אינטראקטיבית, חניה נוחה להורדת והעלאת ילדים ושעות פעילות.',
        previewSnippet: (
          <div className="bg-[#faf8f5] p-2.5 rounded-xl border border-[#e4e2de] space-y-1.5 pointer-events-none select-none text-[9px]">
            <div className="flex items-center justify-between text-[#5f3414] font-black border-b border-[#e4e2de] pb-1">
              <span>📍 רחוב הרקפת 12, אריאל</span>
              <span className="text-emerald-700">חניה צמודה ✓</span>
            </div>
            <div className="bg-white p-1.5 rounded border border-[#e4e2de] text-slate-600 space-y-0.5">
              <div>⏰ <strong>שעות פעילות:</strong> א'-ה' 07:00-17:00, ו' 07:30-12:30</div>
            </div>
            <div className="flex gap-1">
              <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold text-[8px]">ניווט ב-Waze</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[8px]">Google Maps</span>
            </div>
          </div>
        ),
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
            התבוננו בחלוניות הדוגמה המעודכנות של חלקי אתר העסק למטה (כותרות, חזון, בטיחות, חוגים, תזונה וצוות), סמנו את החלקים שתרצו לשדרג, או בקשו כל מערכת אוטומטית עבור אתר הגן בכתובת{' '}
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

        {/* LEFT COLUMN: Visual Preview Windows & Custom Automations for Mayabee (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Features on Mayabee public site with mini preview snippets */}
          <div className="bg-white rounded-3xl border border-[#e4e2de] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7a4b29]" />
                <h4 className="font-black text-base text-[#5f3414] font-heading">
                  חלוניות דוגמה מעודכנות של אתר הגן (סמנו כדי לדבר עליהם)
                </h4>
              </div>
              <p className="text-xs text-[#51443c]">
                סמנו את החלקים באתר העסק שאליהם תרצו להתייחס או לחצו על זכוכית המגדלת להגדלה:
              </p>
            </div>

            <div className="space-y-3.5">
              {siteFeatures.map((feature) => {
                const isSelected = selectedFeatures.includes(feature.id);
                return (
                  <div
                    key={feature.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isSelected
                        ? 'bg-[#fffdfa] border-[#7a4b29] ring-2 ring-[#7a4b29]/20 shadow-xs'
                        : 'bg-[#faf8f5] border-[#e4e2de] hover:border-[#7a4b29]/40'
                    }`}
                  >
                    {/* Header bar of the feature card */}
                    <div className="p-3 bg-white flex items-center justify-between border-b border-[#efeeea] gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-[#faf8f5] border border-[#e4e2de] flex items-center justify-center flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <span className="text-xs font-black text-[#5f3414] block leading-tight">
                            {feature.title}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-medium">
                            {feature.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setInspectingFeature(feature)}
                          className="p-1.5 rounded-lg bg-[#faf8f5] hover:bg-[#efeeea] text-slate-500 hover:text-[#7a4b29] transition cursor-pointer"
                          title="צפייה בחלון דוגמה מוגדל"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFeaturePrompt(feature)}
                          className="px-2 py-1 rounded-lg bg-[#efeeea] hover:bg-[#ffdeab] text-[10px] font-bold text-[#7a4b29] cursor-pointer shadow-2xs transition"
                          title="הוסף התייחסות לרכיב זה בתיבת הטקסט"
                        >
                          + טקסט
                        </button>

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFeature(feature.id)}
                          className="w-4 h-4 rounded text-[#7a4b29] accent-[#7a4b29] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Interactive Non-Interactive Mini Window / Screenshot Replica */}
                    <div
                      onClick={() => toggleFeature(feature.id)}
                      className="p-3 cursor-pointer group hover:bg-[#fff9f2] transition"
                      title="לחץ לסימון/ביטול סימון רכיב זה"
                    >
                      {feature.previewSnippet}
                      <div className="flex justify-between items-center text-[9.5px] text-slate-400 pt-1.5">
                        <span className="group-hover:text-[#7a4b29] font-bold transition flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>חלון דוגמה לא פעיל (לחצו לסימון)</span>
                        </span>
                        <span className={`font-black ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {isSelected ? 'נבחר להתייחסות ✓' : 'לא נבחר'}
                        </span>
                      </div>
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

                    <p className="text-[11px] text-[#51443c] mt-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Large Inspected Preview Window */}
      {inspectingFeature && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#d6c3b8] shadow-2xl overflow-hidden space-y-4 p-6 relative">
            <div className="flex items-center justify-between border-b border-[#efeeea] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#faf8f5] flex items-center justify-center">
                  {inspectingFeature.icon}
                </div>
                <div>
                  <h4 className="text-base font-black text-[#5f3414]">
                    {inspectingFeature.fullPreviewTitle || inspectingFeature.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {inspectingFeature.category} • חלון דוגמה לא פעיל לאתר הגן
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectingFeature(null)}
                className="w-8 h-8 rounded-full bg-[#efeeea] hover:bg-[#d6c3b8] flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#51443c] leading-relaxed">
              {inspectingFeature.fullPreviewDesc || 'תצוגה מוגדלת של הרכיב כפי שהוא מופיע באתר העסק של הגן (Mayabee):'}
            </p>

            <div className="bg-[#fbf9f5] p-5 rounded-2xl border border-[#d6c3b8]/60 shadow-inner">
              {inspectingFeature.previewSnippet}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!selectedFeatures.includes(inspectingFeature.id)) {
                    toggleFeature(inspectingFeature.id);
                  }
                  insertFeaturePrompt(inspectingFeature);
                  setInspectingFeature(null);
                }}
                className="flex-1 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                סמן רכיב זה והוסף פסקה לטקסט ✓
              </button>
              <button
                type="button"
                onClick={() => setInspectingFeature(null)}
                className="px-4 py-2.5 rounded-xl bg-[#efeeea] hover:bg-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
