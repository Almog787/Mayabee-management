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
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  HelpCircle,
  ShieldCheck,
  Lock,
  Navigation,
  FileText,
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

// 10 Detailed Questionnaire Sections for "הבית של רותם ומאיה"
const QUESTIONNAIRE_SECTIONS = [
  {
    id: 1,
    title: '1. 📞 פרטים כלליים ופרטי התקשרות',
    content: `• שם הגן באתר: הבית של רותם ומאיה
• כותרת משנה: פעוטון, משפחתון וצהרון • אריאל
• טלפון ראשי להתקשרות וווטסאפ: 052-8707056
• מיקום: אריאל, שומרון

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 2,
    title: '2. 🌟 כותרת ראשית ופתיח האתר (Hero Section)',
    content: `• תגית עליונה: פעוטון וצהרון מומלץ באריאל
• כותרת ראשית: הבית של רותם ומאיה – הבית החם של הילדים באריאל
• תיאור פתיח: מסגרת חינוכית עשירה בחום, אהבה, למידה חווייתית וביטחון מלא באריאל.

• 4 תגיות אמון בולטות:
  1. קבוצות קטנות ואיכותיות
  2. יחס אישי וחם
  3. פיקוח וליווי מקצועי
  4. מצלמות ואבטחה

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 3,
    title: '3. ✨ הערכים והיתרונות שלנו',
    content: `• כותרת: למה הורים באריאל בוחרים בבית של רותם ומאיה?
• תיאור: אנחנו מאמינים שכל ילד וילדה זקוקים לקרקע בטוחה, אווירה נינוחה והרבה חום כדי לגלות את העולם בחיוך ובסקרנות טבעית.

4 כרטיסי הערכים:
1. חום, יחס אישי ואהבה: "דגש עמוק על פיתוח רגשי, יחס עוטף המותאם לקצב ההתפתחות הייחודי של כל ילד, קבוצות אינטימיות וחיבוק אמיתי לכל בוקר חדש."
2. ניהול מקצועי: "ליווי מקצועי רציף, סטנדרטים פדגוגיים מוקפדים, תקשורת פתוחה ושותפות אמיתית עם ההורים לאורך כל השנה."
3. סביבה מוגנת ומעשירה: "סדר יום עשיר בתנועה, מוזיקה וחוגים, ארוחות מזינות ומבושלות טריות מדי יום, חצר משחקים מוצלת, ירוקה ובטיחותית לפי כל התקנים."
4. שקיפות ותקשורת רציפה: "עדכונים שוטפים, פתיחות מלאה, מענה זמין להורים ושקט נפשי מוחלט בידיעה שהאוצר שלכם נמצא בידיים הכי בטוחות ומסורות שיש."

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 4,
    title: '4. ⏰ סדר היום בגן',
    content: `• 07:30 - 08:30 | קבלת פנים חמה: חיבוק בוקר אישי ומשחקי שולחן רגועים.
• 08:45 - 09:30 | ארוחת בוקר מזינה: ירקות חתוכים, גבינות, לחמים וממרחים בריאים.
• 09:30 - 11:30 | מפגש, חוגים וחצר: שירי עונות, סיפורים, יצירה ומשחק מוטורי בחצר.
• 11:45 - 12:45 | ארוחת צהריים חמה: אוכל ביתי מבושל, מגוון ומאוזן תזונתית.
• 13:00 - 15:00 | מנוחת צהריים שלווה: שינה מתוקה עם מנגינות מרגיעות ואיסוף נעים.

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 5,
    title: '5. 🗺️ מתחמי הגן במפה האינטראקטיבית (2D Map)',
    content: `1. קבלת הפנים ומפגש הבוקר (07:30 - 08:30): מרכז הכוורת, שער נעול בקודן, עמדת היגיינה.
2. מרחב הפעילות והמשחקים (08:30 - 10:30): פינות התפתחות, לגו עץ, מטבחון, ספרייה ותו תקן.
3. מתחם היצירה והחוגים (10:30 - 11:30): חוגי מוזיקה, תנועה, יצירה מביאה טבע.
4. פינת האוכל והמטבחון (08:30, 11:45, 15:30): אוכל מבושל טרי בבוקר, איסור אלרגנים.
5. אזור המנוחה והשינה (13:00 - 15:00): מרחב שינה שקט, מוזיקה מרגיעה, בקרת טמפרטורה.
6. החצר והמרחב החיצוני (09:30 - 10:30, 16:00): דשא סינתטי, רשת צל 95% UV, שער כפול נעול.

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 6,
    title: '6. ❓ שאלות ותשובות נפוצות (FAQ)',
    content: `1. לאילו גילאים מיועד הגן? פעוטון מגיל 3 חודשים עד 3 שנים, וצהרון עד כיתה ב'.
2. מהן שעות הפעילות? ימים א'-ה' 07:30-17:00 (או 16:30), ימי שישי 07:30-12:30. צהרון משעת סיום הלימודים עד 17:00.
3. מה כולל התפריט? בישול טרי מדי בוקר! ארוחת בוקר ישראלית, צהריים חמה ומאוזנת ומנחה קלה.
4. נהלי בטיחות? רישיון ופיקוח, קודן בכניסה, מוצלל 95% UV, הכשרות עזרה ראשונה והחייאה.
5. תהליך הסתגלות? הדרגתי, רגיש ועוטף בקצב האישי של הילד/ה וההורה.
6. איך תואמים סיור? בלחיצה על כפתור הווטסאפ או בטלפון 052-8707056 מול רותם.

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 7,
    title: '7. 📜 תקנון הגן ונהלים (Policy Rules)',
    content: `1. שעות פעילות: קבלה מ-07:30, איסוף ב-16:30/17:00, ועד 12:30 בימי שישי.
2. בריאות: חום מעל 38°, שלשולים או מחלה מידבקת מחייבים שהייה בבית עד אישור רופא.
3. תזונה: תפריט ביתי מבושל טרי מדי יום בהשגחת רותם והתאמה לאלרגיות.

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 8,
    title: '8. ♿ הצהרת נגישות',
    content: `• נגישות פיזית: חניות נגישות, שביל גישה מרוצף ומפולס, מעברים ללא מדרגות.
• נגישות אתר: תקן WCAG 2.1 AA, תמיכה בקוראי מסך, ניווט מקלדת מלא. רכזת נגישות: 052-8707056.

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 9,
    title: '9. 🔒 מדיניות פרטיות',
    content: `• מידע נשמר אך ורק ליצירת קשר ישיר ותיאום מול הנהלת הגן.
• ללא העברת מידע לצד שלישי.
• שליחת הודעות מאובטחת דרך WhatsApp.
• מצלמות אבטחה לשמירה על ביטחון הפעוטות על פי חוק.

[אשרו או כתבו תיקון]: `,
  },
  {
    id: 10,
    title: '10. 🚗 דרכי הגעה וחניה באריאל',
    content: `• מיקום: מיקום מרכזי, שקט, בטוח ונגיש בעיר אריאל.
• חניה: חניה חופשית ונגישה לצד שער הגן להורדה ואיסוף בטוחים.

[אשרו או כתבו תיקון]: `,
  },
];

const FULL_QUESTIONNAIRE_TEXT = `📋 שאלון לבדיקה ואישור תוכן לאתר - "הבית של רותם ומאיה" 🐝
--------------------------------------------------
שלום רותם ומאיה! להלן כל התכנים, הנהלים והניסוחים שיופיעו באתר הגן שלכם. 
אנא עברו על הסעיפים, תאשרו את התוכן הקיים או רשמו לנו תיקונים ושינויים במידת הצורך:

---

### 1. 📞 פרטים כלליים ופרטי התקשרות
• שם הגן באתר: הבית של רותם ומאיה
• כותרת משנה: פעוטון, משפחתון וצהרון • אריאל
• טלפון ראשי להתקשרות וווטסאפ: 052-8707056
• מיקום: אריאל, שומרון

[אשרו או כתבו תיקון]: ______________

---

### 2. 🌟 כותרת ראשית ופתיח האתר (Hero Section)
• תגית עליונה: פעוטון וצהרון מומלץ באריאל
• כותרת ראשית: הבית של רותם ומאיה – הבית החם של הילדים באריאל
• תיאור פתיח: מסגרת חינוכית עשירה בחום, אהבה, למידה חווייתית וביטחון מלא באריאל.

• 4 תגיות אמון בולטות:
  1. קבוצות קטנות ואיכותיות
  2. יחס אישי וחם
  3. פיקוח וליווי מקצועי
  4. מצלמות ואבטחה

[אשרו או כתבו תיקון]: ______________

---

### 3. ✨ הערכים והיתרונות שלנו
• כותרת: למה הורים באריאל בוחרים בבית של רותם ומאיה?
• תיאור: אנחנו מאמינים שכל ילד וילדה זקוקים לקרקע בטוחה, אווירה נינוחה והרבה חום כדי לגלות את העולם בחיוך ובסקרנות טבעית.

4 כרטיסי הערכים:
1. חום, יחס אישי ואהבה:
   "דגש עמוק על פיתוח רגשי, יחס עוטף המותאם לקצב ההתפתחות הייחודי של כל ילד, קבוצות אינטימיות וחיבוק אמיתי לכל בוקר חדש."
2. ניהול מקצועי:
   "ליווי מקצועי רציף, סטנדרטים פדגוגיים מוקפדים, תקשורת פתוחה ושותפות אמיתית עם ההורים לאורך כל השנה."
3. סביבה מוגנת ומעשירה:
   "סדר יום עשיר בתנועה, מוזיקה וחוגים, ארוחות מזינות ומבושלות טריות מדי יום, חצר משחקים מוצלת, ירוקה ובטיחותית לפי כל התקנים."
4. שקיפות ותקשורת רציפה:
   "עדכונים שוטפים, פתיחות מלאה, מענה זמין להורים ושקט נפשי מוחלט בידיעה שהאוצר שלכם נמצא בידיים הכי בטוחות ומסורות שיש."

[אשרו או כתבו תיקון]: ______________

---

### 4. ⏰ סדר היום בגן
• 07:30 - 08:30 | קבלת פנים חמה: חיבוק בוקר אישי ומשחקי שולחן רגועים.
• 08:45 - 09:30 | ארוחת בוקר מזינה: ירקות חתוכים, גבינות, לחמים וממרחים בריאים.
• 09:30 - 11:30 | מפגש, חוגים וחצר: שירי עונות, סיפורים, יצירה ומשחק מוטורי בחצר.
• 11:45 - 12:45 | ארוחת צהריים חמה: אוכל ביתי מבושל, מגוון ומאוזן תזונתית.
• 13:00 - 15:00 | מנוחת צהריים שלווה: שינה מתוקה עם מנגינות מרגיעות ואיסוף נעים.

[אשרו או כתבו תיקון]: ______________

---

### 5. 🗺️ מתחמי הגן במפה האינטראקטיבית (2D Map)

1. קבלת הפנים ומפגש הבוקר (07:30 - 08:30):
   • תיאור: מרכז הכוורת שבו הצוות מקבל כל ילד וילדה בחיבוק חם, חיוך ושיר אישי. כאן מתקיים מפגש הבוקר הנעים, סיפורי פתיחה ועדכון הלוח היומי.
   • בטיחות: שער כניסה נעול עם קודן, משטח למניעת החלקה, ועמדת היגיינה.

2. מרחב הפעילות והמשחקים (08:30 - 10:30):
   • תיאור: אזור רחב המדמה פינות התפתחות: משחקי הרכבה ולגו עץ, מטבחון פעוטות למשחקי תפקידים, פינת בובות וספרייה.
   • בטיחות: תו תקן אירופאי/ישראלי, ריפוד מגן בפינות, חיטוי יומי יסודי.

3. מתחם היצירה והחוגים (10:30 - 11:30):
   • תיאור: שולחנות עבודה המותאמים לגובה הפעוטות. חוגי מוזיקה, ציור באצבעות, פיסול בבצק טבעי ומפגשי טבע.
   • בטיחות: חומרי יצירה 100% Non-Toxic, שולחנות עץ יציבים עם פינות מעוגלות.

4. פינת האוכל והמטבחון (08:30, 11:45, 15:30):
   • תיאור: מתחם ארוחות נקי המגיש ארוחות חמות ומזינות המבושלות מדי בוקר מחומרי גלם טריים.
   • בטיחות: מטבחון סגור ומרוחק, איסור אלרגנים מסכנים, סטריליזציה יומיומית.

5. אזור המנוחה והשינה (13:00 - 15:00):
   • תיאור: מרחב שינה שקט וחשוך חלקית המשרה ביטחון. הקטנטנים נרדמים לצלילי מוזיקה שקטה ומצעים אישיים מהבית.
   • בטיחות: פיקוח עין רציף, בקרת טמפרטורה (22-24 מעלות), מרחק בטיחותי בין המיטות.

6. החצר והמרחב החיצוני (09:30 - 10:30, 16:00):
   • תיאור: חצר מרווחת עם משטח דשא סינתטי רך, בימבות, מגלשות שיווי משקל, ארגז חול נקי ופינת עציצים.
   • בטיחות: רשת צל 95% UV, משטח בלימת נפילות תקני, שער כפול נעול, ארגז חול מכוסה.

[אשרו או כתבו תיקון]: ______________

---

### 6. ❓ שאלות ותשובות נפוצות (FAQ)
1. לאילו גילאים מיועד 'הבית של רותם ומאיה' באריאל?
   תשובה: "המסגרת מחולקת לשני מסלולים עיקריים: פעוטון ומשפחתון לקטנטנים מגיל 3 חודשים ועד 3 שנים בקבוצות גיל אינטימיות עם יחס מטפלת-ילד מיטבי, וצהרון עשיר וחווייתי לילדי גנים ובתי ספר עד כיתה ב' הכולל ארוחה חמה, עזרה בשיעורים וחוגים."

2. מהן שעות הפעילות של הגן והצהרון באריאל?
   תשובה: "הפעוטון פועל בימים ראשון עד חמישי בין השעות 07:30 ל-17:00 (ניתן לבחור מסלול עד 16:30). בימי שישי וערבי חג הגן פועל בין 07:30 ל-12:30. הצהרון פועל משעת סיום מוסדות החינוך ועד השעה 17:00."

3. מה כולל התפריט והתזונה היומית בגן?
   תשובה: "אנחנו מקפידים על בישול טרי במקום בכל בוקר! התפריט כולל ארוחת בוקר ישראלית מזינה (ביצים, לחם מלא, ירקות וממרחים), ארוחת צהריים חמה ומאוזנת (עוף/בשר/קטניות, תוספת פחמימה מורכבת ומבחר ירקות מבושלים), וארוחת מנחה קלה. קיימת התאמה קפדנית לאלרגיות ולרגישויות מזון."

4. מהם נהלי הבטיחות, הפיקוח והמיגון בגן?
   תשובה: "הגן פועל ברישיון ופיקוח מחמירים. שערי הכניסה נעולים בקודן מאובטח, החצר מוצלת ב-95% הגנת UV ומרופדת במשטחי בלימה תקניים, הצעצועים והמתקנים בעלי תו תקן ישראלי, והצוות עובר הכשרות עזרה ראשונה והחייאת פעוטות בתדירות קבועה."

5. כיצד מתבצע תהליך ההסתגלות לקטנטנים חדשים?
   תשובה: "אנו מאמינים בהסתגלות הדרגתית, רגישה ועוטפת המותאמת לקצב האישי של כל ילד והורה. בימים הראשונים שעות השהות נבנות בהדרגה יחד עם נוכחות ההורה, כדי ליצור אמון וחיבור בטוח עם רותם והצוות."

6. איך יוצרים קשר ומתאמים סיור היכרות?
   תשובה: "הכי קל ומהיר! לוחצים על כפתור הווטסאפ באתר או מתקשרים ישירות לטלפון 052-8707056. רותם תשמח לשוחח, לענות על כל שאלה ולתאם מועד נוח לסיור אישי והתרשמות מהגן באריאל."

[אשרו או כתבו תיקון]: ______________

---

### 7. 📜 תקנון הגן ונהלים (Policy Rules)
1. שעות פעילות וקבלת ילדים:
   • קבלת ילדים החל מ-07:30.
   • איסוף עד 16:30 / 17:00 בימי חול, ועד 12:30 בימי שישי.
2. בריאות ורפואה:
   • ילד עם חום מעל 38 מעלות, שלשולים או מחלה מידבקת יישאר בבית עד להחלמה מלאה ואישור רופא.
3. תזונה:
   • תפריט עשיר, בריא וביתי המבושל טרי מדי יום בהשגחת רותם. התאמה לרגישויות ואלרגיות.

[אשרו או כתבו תיקון]: ______________

---

### 8. ♿ הצהרת נגישות
• נגישות פיזית במתחם הגן באריאל:
  - חניות נגישות בסמוך למתחם הגן.
  - שביל גישה מרוצף ומפולס עד לשער הכניסה וחלל הפעילות.
  - מעברים מרווחים ללא מדרגות בין חלל המשחקים לחצר.
• נגישות אתר האינטרנט:
  - האתר נבנה בהתאם לתקן WCAG 2.1 ברמת AA, תומך בקוראי מסך, ניווט מקלדת מלא, ניגודיות צבעים מוקפדת והתאמה מלאה למכשירים ניידים.
  - רכז/ת נגישות לפניות: טלפון 052-8707056.

[אשרו או כתבו תיקון]: ______________

---

### 9. 🔒 מדיניות פרטיות
• פרטיותכם ופרטיות ילדיכם יקרה לנו מכל. כל פרט שנמסר בטפסי ההרשמה או המועמדות לעבודה משמש אך ורק לצורך יצירת קשר ישיר ותיאום מול הנהלת הגן.
• אין העברת מידע לשום צד שלישי או חברות פרסום.
• שליחת ההודעות מתבצעת באופן מאובטח ישירות דרך אפליקציית WhatsApp האישית שלכם.
• מצלמות האבטחה בגן מיועדות לשמירה על שלומם וביטחונם של הפעוטות לפי כללי החוק.

[אשרו או כתבו תיקון]: ______________

---

### 10. 🚗 דרכי הגעה וחניה באריאל
• מיקום: "הבית של רותם ומאיה" ממוקם במיקום מרכזי, שקט, בטוח ונגיש בעיר אריאל.
• חניה: חניה חופשית ונגישה לצד שער הגן, להורדה ואיסוף בטוחים של הילדים ללא לחץ.

[אשרו או כתבו תיקון]: ______________

---
תודה רבה על השיתוף והשיתוף פעולה! ❤️`;

export const BusinessSiteSuggestionsModule: React.FC<BusinessSiteSuggestionsProps> = ({
  onBackToPlanner,
  onSwitchToManagementSuggestions,
}) => {
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderContact, setSenderContact] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);

  const loadFullQuestionnaire = () => {
    setSuggestionText(FULL_QUESTIONNAIRE_TEXT);
  };

  const appendSectionToText = (title: string, content: string) => {
    const formatted = `---
${title}
${content}
---`;
    setSuggestionText(prev => prev ? `${prev}\n\n${formatted}` : formatted);
  };

  const handleSendEmail = () => {
    if (!suggestionText.trim()) return;
    const recipient = getRecipientEmail();
    const subject = encodeURIComponent(`שאלון תוכן ואישור לאתר "הבית של רותם ומאיה" - ${senderName || 'רותם ומאיה'}`);
    const bodyContent = [
      `שלום רב,`,
      ``,
      `התקבל מענה ושאלון תוכן מאושר עבור אתר הגן (Mayabee):`,
      senderName ? `שם השולח/ת: ${senderName}` : '',
      senderContact ? `פרטי קשר: ${senderContact}` : '',
      `כתובת אתר הגן: ${BUSINESS_SITE_URL}`,
      ``,
      `==================================================`,
      `תוכן השאלון וההערות/אישורים:`,
      `==================================================`,
      ``,
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
    const textToCopy = suggestionText.trim() || FULL_QUESTIONNAIRE_TEXT;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-mono font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>שאלון תוכן ואישור לאתר · הגן של רותם ומאיה (Mayabee)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            📋 שאלון לבדיקה ואישור תוכן לאתר הגן
          </h2>
          <p className="text-xs text-slate-600">
            אישור התכנים, הנהלים והסעיפים שיופיעו באתר "הבית של רותם ומאיה" ושליחה ישירה במייל.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={BUSINESS_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <span>פתח אתר הגן</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
          </a>
          {onBackToPlanner && (
            <button
              onClick={onBackToPlanner}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              חזרה למאזן ←
            </button>
          )}
        </div>
      </div>

      {/* Hero preview card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
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
            <h4 className="text-sm font-bold text-slate-900">הבית של רותם ומאיה (Mayabee) · אריאל</h4>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">טופס אישור תוכן</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            עברו על 10 הסעיפים למטה, טענו את השאלון לתיבת הטקסט, רשמו אישור או תיקון, ושלחו בלחיצה אחת.
          </p>
          <span className="text-[11px] font-mono text-slate-500 block truncate">{BUSINESS_SITE_URL}</span>
        </div>
      </div>

      {/* Load Full Questionnaire Action Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 font-bold">
            <ClipboardList className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              טעינת השאלון המלא לתיבת העריכה והמשלוח
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              בלחיצה אחת השאלון המלא עם 10 הסעיפים יטען לתיבת הטקסט, שם תוכלו לרשום הערות ולשלוח ישירות למייל.
            </p>
          </div>
        </div>
        <button
          onClick={loadFullQuestionnaire}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0 active:scale-95"
        >
          <FileText className="w-4 h-4" />
          <span>טען שאלון מלא לעריכה 📝</span>
        </button>
      </div>

      {/* Accordion / Interactive 10 Questionnaire Sections */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              10 סעיפי השאלון לבדיקה ואישור (לחצו לצפייה בפרטים):
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">10 סעיפים</span>
        </div>

        <div className="space-y-2">
          {QUESTIONNAIRE_SECTIONS.map((sec) => {
            const isOpen = openSectionId === sec.id;
            return (
              <div
                key={sec.id}
                className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setOpenSectionId(isOpen ? null : sec.id)}
                  className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                >
                  <span className="text-xs font-bold text-slate-800">{sec.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        appendSectionToText(sec.title, sec.content);
                      }}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg transition"
                      title="הוסף סעיף זה בלבד לתיבת הטקסט"
                    >
                      + הוסף סעיף לעריכה
                    </button>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="p-3.5 border-t border-slate-200 bg-white text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {sec.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Card for Editing & Emailing */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-800 block">
              תוכן השאלון, המענה וההערות לשליחה במייל:
            </label>
            <button
              onClick={loadFullQuestionnaire}
              className="text-[11px] text-emerald-700 hover:underline font-semibold"
            >
              טען טקסט שאלון מלא 📝
            </button>
          </div>
          <textarea
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder="לחצו על 'טען שאלון מלא לעריכה' למעלה או רשמו כאן את התשובות והתיקונים לשאלון..."
            rows={10}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
          />
        </div>

        {/* Sender details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">שם המאשר/ת (אופציונלי):</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="רותם / מאיה"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">טלפון או מייל לחזרה (אופציונלי):</label>
            <input
              type="text"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
              placeholder="052-8707056"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              setSuggestionText('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>נקה טופס</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isCopied ? 'הועתק ללוח! ✓' : 'העתק שאלון ללוח'}</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={!suggestionText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isSent ? 'נפתח במייל! ✓' : 'שלח שאלון מאושר במייל'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
