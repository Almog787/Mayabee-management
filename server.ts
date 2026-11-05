import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI with required telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Google Apps Script Proxy Endpoint
// Proxies GET and POST requests to the user's deployed Apps Script Web App (follows 302 redirects automatically)
app.post('/api/sheets/proxy', async (req: Request, res: Response) => {
  try {
    const { scriptUrl, method = 'POST', payload, action } = req.body;

    if (!scriptUrl || typeof scriptUrl !== 'string') {
      return res.status(400).json({ error: 'חסרה כתובת Web App של Google Apps Script' });
    }

    if (!scriptUrl.includes('script.google.com')) {
      return res.status(400).json({ error: 'כתובת ה-URL אינה תקינה (חייבת להתחיל ב-script.google.com)' });
    }

    let targetUrl = scriptUrl;
    if (action && method === 'GET') {
      const urlObj = new URL(scriptUrl);
      urlObj.searchParams.set('action', action);
      targetUrl = urlObj.toString();
    }

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      redirect: 'follow',
    };

    if (method.toUpperCase() === 'POST') {
      fetchOptions.body = JSON.stringify({ action: action || 'sync', ...(payload || {}) });
    }

    const googleRes = await fetch(targetUrl, fetchOptions);
    const contentType = googleRes.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await googleRes.json();
    } else {
      const text = await googleRes.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawText: text, status: googleRes.status };
      }
    }

    return res.status(googleRes.ok ? 200 : 502).json({
      success: googleRes.ok,
      data,
      statusCode: googleRes.status,
    });
  } catch (error: any) {
    console.error('Error proxying to Google Apps Script:', error);
    return res.status(500).json({
      error: error.message || 'שגיאה בפנייה ל-Google Apps Script',
    });
  }
});

// Regulatory & Knowledge Search endpoint (Google Search Grounding via gemini-3.8-flash)
app.post('/api/gemini/search', async (req: Request, res: Response) => {
  try {
    const { query, topic } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'חסרה שאילתת חיפוש' });
    }

    const systemInstruction = `אתה יועץ מקצועי ומומחה לחוקי מדינת ישראל בתחום ניהול מעונות יום לגיל הרך, חוק הפיקוח על מעונות יום (תשע"ט-2018), תקינת יחס מטפלת-ילד, דיני עבודה ושעות נוספות, חוק לצמצום השימוש במזומן (תקרת 6,000 ש"ח), דיני מיסוי לעוסק פטור ומורשה (תקרות 2026, מע"מ), ונהלי משרד הבריאות לגבי אלרגנים ותזונה.
ענה בעברית רהוטה, ברורה, מעשית וממוקדת למנהלת מעון. השתמש במידע מעודכן מחיפוש Google.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'לא התקבלה תשובה מהמודל';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      answer: text,
      sources: groundingChunks,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/search:', error);
    res.status(500).json({
      error: error.message || 'שגיאה בביצוע חיפוש וייעוץ רגולטורי',
    });
  }
});

// Deep Pedagogical & Safety Thinking (gemini-4-argon with ThinkingLevel.HIGH)
app.post('/api/gemini/thinking', async (req: Request, res: Response) => {
  try {
    const { prompt, childContext, situationType } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'חסר תוכן לניתוח מעמיק' });
    }

    const systemInstruction = `אתה מומחה בכיר לפדגוגיה לגיל הרך, פסיכולוגיה התפתחותית, בטיחות ילדים וניהול מעונות.
בצע חשיבה מעמיקה ופתרון מובנה צעד-אחר-צעד:
1. ניתוח המצב והסיכונים (בטיחות, רגשי, קבוצתי).
2. עקרונות פדגוגיים ותקשורת מכילה.
3. תוכנית פעולה אופרטיבית מיידית למנהלת ולסייעת.
4. המלצה לשיחה מעצימה עם ההורים (כולל ניסוח מוצע).
השב בעברית ברורה, מקצועית ואמפתית.`;

    const fullPrompt = `${situationType ? `[סוג האירוע: ${situationType}]\n` : ''}${
      childContext ? `[הקשר: ${JSON.stringify(childContext)}]\n` : ''
    }השאלה/המקרה לניתוח:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      analysis: response.text || 'הניתוח הושלם ללא פלט טקסטואלי',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/thinking:', error);
    res.status(500).json({
      error: error.message || 'שגיאה בעיבוד הניתוח המעמיק',
    });
  }
});

// WhatsApp daily summary generator for parents
app.post('/api/gemini/daily-summary', async (req: Request, res: Response) => {
  try {
    const { childName, activities, mood, meals, naps, diaperCount, specialNotes } = req.body;
    if (!childName) {
      return res.status(400).json({ error: 'חסר שם הילד/ה' });
    }

    const prompt = `כתוב הודעת וואטסאפ חמה, קצרה, מרגיעה ומקצועית להורי הפעוט/ה ${childName} מהמעון.
פרטי היום:
- מצב רוח / השתתפות: ${mood || 'מצוין, שמח ופעיל'}
- ארוחות: ${meals || 'אכל יפה את ארוחת הבוקר והצהריים'}
- שנת צהריים: ${naps || 'ישן שעה וחצי בשלווה'}
- חיתולים/יציאות: ${diaperCount ? `${diaperCount} החלפות` : 'הוחלף כסדר'}
- פעילויות מיוחדות: ${activities || 'משחק בקוביות, חצר מוזיקלית וציור'}
- דגשים מיוחדים: ${specialNotes || 'אין משהו חריג, יום מקסים'}

כללים:
- כתוב בעברית חמה עם אימוג'ים מתאימים 👶🍎🎨🧸
- פנה בגוף חם ("היי הורים יקרים של...")
- אורך מקסימלי: 3-4 פסקאות קצרות שנעים לקרוא בטלפון.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      summary: response.text?.trim() || '',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/daily-summary:', error);
    res.status(500).json({
      error: error.message || 'שגיאה ביצירת סיכום יומי',
    });
  }
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
