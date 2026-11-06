import { db } from './db';
import { Child, FinancialTransaction, DaycareSettings } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: number;
  details?: {
    childrenCount?: number;
    transactionsCount?: number;
    attendanceCount?: number;
  };
}

/**
 * Sends a request to Google Apps Script Web App via our backend proxy to avoid CORS/redirect issues
 */
async function callAppsScriptProxy(params: {
  scriptUrl: string;
  method?: 'GET' | 'POST';
  action?: string;
  payload?: any;
}) {
  const { scriptUrl, method = 'POST', action, payload } = params;

  const res = await fetch('/api/sheets/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scriptUrl,
      method,
      action,
      payload,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `שגיאת שרת בפנייה ל-Google Sheets (${res.status})`);
  }

  const json = await res.json();
  if (!json.success && json.error) {
    throw new Error(json.error);
  }
  return json.data;
}

/**
 * 1. Test Connection with Apps Script Web App
 */
export async function testAppsScriptConnection(scriptUrl: string): Promise<{
  success: boolean;
  message: string;
  info?: any;
}> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, message: 'נא להזין כתובת URL תקינה של Google Apps Script' };
  }

  try {
    const data = await callAppsScriptProxy({
      scriptUrl,
      method: 'GET',
      action: 'ping',
    });

    if (data && (data.status === 'ok' || data.daycare)) {
      return {
        success: true,
        message: `חיבור תקין! גליון המעון "${data.daycare || 'מעון ילדים'}" זוהה ומגיב כהלכה.`,
        info: data,
      };
    }

    return {
      success: false,
      message: 'התקבלה תשובה לא מזוהה מהסקריפט. יש לוודא שהפריסה (Deploy) בוצעה עם גישה ל-"Anyone".',
    };
  } catch (err: any) {
    console.error('Apps Script test connection failed:', err);
    return {
      success: false,
      message: `שגיאת חיבור: ${err.message || 'לא ניתן לתקשר עם ה-Web App של Google Sheets'}`,
    };
  }
}

/**
 * 2. PULL: משיכת כלל המידע מ-Google Sheets ועדכון ה-IndexedDB המקומי
 */
export async function pullFromGoogleSheets(scriptUrl: string): Promise<SyncResult> {
  try {
    const data = await callAppsScriptProxy({
      scriptUrl,
      method: 'GET',
      action: 'getAllData',
    });

    if (!data) {
      throw new Error('לא התקבלו נתונים מ-Google Sheets');
    }

    let childrenUpdated = 0;
    let transactionsUpdated = 0;

    // Update children
    if (data.children && Array.isArray(data.children) && data.children.length > 0) {
      for (const c of data.children) {
        if (c.id && c.firstName) {
          await db.children.put({
            id: c.id,
            idNumber: c.idNumber || '',
            firstName: c.firstName,
            lastName: c.lastName || '',
            birthDate: c.birthDate || '2025-01-01',
            enrollmentDate: c.enrollmentDate || '2025-09-01',
            ageGroup: c.ageGroup || 'TODDLER',
            allergies: Array.isArray(c.allergies) ? c.allergies : [],
            medicalNotes: c.medicalNotes || '',
            parent1: c.parent1 || { fullName: 'הורה', phone: '', email: '', relation: 'אמא' },
            monthlyTuition: Number(c.monthlyTuition) || 4200,
            status: c.status || 'ACTIVE',
            updatedAt: Date.now(),
            isSynced: true,
          });
          childrenUpdated++;
        }
      }
    }

    // Update transactions
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      for (const t of data.transactions) {
        if (t.id && t.amount) {
          await db.transactions.put({
            id: t.id,
            type: t.type || 'INCOME',
            category: t.category || 'TUITION',
            description: t.description || 'תנועה כספית',
            amount: Number(t.amount) || 0,
            vatAmount: Number(t.vatAmount) || 0,
            vatRate: Number(t.vatRate) || 0,
            date: t.date || new Date().toISOString().split('T')[0],
            paymentMethod: t.paymentMethod || 'BANK_TRANSFER',
            childName: t.childName || '',
            referenceNumber: t.referenceNumber || `REC-${t.id}`,
            manualReceiptNumber: t.manualReceiptNumber || '',
            isReportedToAccountant: true,
            updatedAt: Date.now(),
            isSynced: true,
          });
          transactionsUpdated++;
        }
      }
    }

    const now = Date.now();
    await updateSyncSettings({
      lastSyncTime: now,
      lastSheetsSyncStatus: 'SUCCESS',
      lastSheetsSyncMessage: `סנכרון משיכה הצליח: ${childrenUpdated} ילדים ו-${transactionsUpdated} תנועות עודכנו מקומית.`,
    });

    return {
      success: true,
      message: `משיכה הושלמה בהצלחה! עודכנו ${childrenUpdated} ילדים ו-${transactionsUpdated} תנועות כספיות מתוך Google Sheets.`,
      timestamp: now,
      details: {
        childrenCount: childrenUpdated,
        transactionsCount: transactionsUpdated,
      },
    };
  } catch (err: any) {
    console.error('Pull from Google Sheets failed:', err);
    await updateSyncSettings({
      lastSheetsSyncStatus: 'ERROR',
      lastSheetsSyncMessage: `שגיאה במשיכה: ${err.message}`,
    });

    return {
      success: false,
      message: `שגיאה במשיכת הנתונים: ${err.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * 3. PUSH: דחיפת כלל המידע מ-IndexedDB לתוך Google Sheets
 */
export async function pushToGoogleSheets(scriptUrl: string): Promise<SyncResult> {
  try {
    const children = await db.children.toArray();
    const transactions = await db.transactions.toArray();
    const staff = await db.staff.toArray();
    const attendance = await db.attendance.toArray();

    const payload = {
      action: 'sync',
      data: {
        children,
        transactions,
        staff,
        attendance,
        timestamp: Date.now(),
      },
    };

    const res = await callAppsScriptProxy({
      scriptUrl,
      method: 'POST',
      action: 'sync',
      payload,
    });

    const now = Date.now();
    await updateSyncSettings({
      lastSyncTime: now,
      lastSheetsSyncStatus: 'SUCCESS',
      lastSheetsSyncMessage: `סנכרון דחיפה הצליח: ${children.length} ילדים ו-${transactions.length} תנועות נשמרו ב-Google Sheets.`,
    });

    return {
      success: true,
      message: `דחיפת הנתונים הושלמה בהצלחה! ${children.length} ילדים ו-${transactions.length} תנועות כספיות סונכרנו לגליון.`,
      timestamp: now,
      details: {
        childrenCount: children.length,
        transactionsCount: transactions.length,
        attendanceCount: attendance.length,
      },
    };
  } catch (err: any) {
    console.error('Push to Google Sheets failed:', err);
    await updateSyncSettings({
      lastSheetsSyncStatus: 'ERROR',
      lastSheetsSyncMessage: `שגיאה בדחיפה: ${err.message}`,
    });

    return {
      success: false,
      message: `שגיאה בדחיפת הנתונים לגוגל שיטס: ${err.message}`,
      timestamp: Date.now(),
    };
  }
}

async function updateSyncSettings(updates: Partial<DaycareSettings>) {
  const currentSettings = await db.settings.get('settings-default');
  if (currentSettings) {
    await db.settings.update('settings-default', updates);
  }
}
