import { db } from './db';
import { FinancialTransaction } from '../types';
import { encryptData, decryptData } from './crypto';

export interface FullDaycareBackup {
  version: number;
  exportDate: string;
  repoName: string;
  isEncrypted: boolean;
  children: any[];
  attendance: any[];
  dailyLogs: any[];
  transactions: any[];
  staff: any[];
  shifts: any[];
  menu: any[];
  safetyChecks: any[];
  settings: any[];
}

/**
 * Exports full daycare database to JSON file download
 */
export async function exportDatabaseToJson(masterPassword?: string): Promise<void> {
  const [
    children,
    attendance,
    dailyLogs,
    transactions,
    staff,
    shifts,
    menu,
    safetyChecks,
    settings,
  ] = await Promise.all([
    db.children.toArray(),
    db.attendance.toArray(),
    db.dailyLogs.toArray(),
    db.transactions.toArray(),
    db.staff.toArray(),
    db.shifts.toArray(),
    db.menu.toArray(),
    db.safetyChecks.toArray(),
    db.settings.toArray(),
  ]);

  const backupData: FullDaycareBackup = {
    version: 1,
    exportDate: new Date().toISOString(),
    repoName: window.location.pathname.split('/')[1] || 'daycare_app',
    isEncrypted: !!masterPassword,
    children,
    attendance,
    dailyLogs,
    transactions,
    staff,
    shifts,
    menu,
    safetyChecks,
    settings,
  };

  let fileContent = JSON.stringify(backupData, null, 2);
  let fileName = `daycare_backup_${new Date().toISOString().split('T')[0]}.json`;

  if (masterPassword) {
    const encryptedPayload = await encryptData(fileContent, masterPassword);
    fileContent = JSON.stringify({
      version: 1,
      isEncrypted: true,
      exportDate: backupData.exportDate,
      payload: encryptedPayload,
    });
    fileName = `daycare_backup_encrypted_${new Date().toISOString().split('T')[0]}.enc`;
  }

  const blob = new Blob([fileContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports full daycare database from a JSON or encrypted backup file
 */
export async function importDatabaseFromJson(
  file: File,
  masterPassword?: string
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let parsed = JSON.parse(text);

        if (parsed.isEncrypted && parsed.payload) {
          if (!masterPassword) {
            return resolve({
              success: false,
              message: 'קובץ זה מוצפן. יש להזין סיסמת מאסטר לביצוע שחזור.',
            });
          }
          const decryptedText = await decryptData(parsed.payload, masterPassword);
          parsed = JSON.parse(decryptedText);
        }

        // Restore tables
        await db.transaction(
          'rw',
          [
            db.children,
            db.attendance,
            db.dailyLogs,
            db.transactions,
            db.staff,
            db.shifts,
            db.menu,
            db.safetyChecks,
            db.settings,
          ],
          async () => {
            if (parsed.children?.length) {
              await db.children.clear();
              await db.children.bulkAdd(parsed.children);
            }
            if (parsed.attendance?.length) {
              await db.attendance.clear();
              await db.attendance.bulkAdd(parsed.attendance);
            }
            if (parsed.dailyLogs?.length) {
              await db.dailyLogs.clear();
              await db.dailyLogs.bulkAdd(parsed.dailyLogs);
            }
            if (parsed.transactions?.length) {
              await db.transactions.clear();
              await db.transactions.bulkAdd(parsed.transactions);
            }
            if (parsed.staff?.length) {
              await db.staff.clear();
              await db.staff.bulkAdd(parsed.staff);
            }
            if (parsed.shifts?.length) {
              await db.shifts.clear();
              await db.shifts.bulkAdd(parsed.shifts);
            }
            if (parsed.menu?.length) {
              await db.menu.clear();
              await db.menu.bulkAdd(parsed.menu);
            }
            if (parsed.safetyChecks?.length) {
              await db.safetyChecks.clear();
              await db.safetyChecks.bulkAdd(parsed.safetyChecks);
            }
            if (parsed.settings?.length) {
              await db.settings.clear();
              await db.settings.bulkAdd(parsed.settings);
            }
          }
        );

        resolve({
          success: true,
          message: `השחזור הושלם בהצלחה! שוחזרו ${parsed.children?.length || 0} ילדים ו-${parsed.transactions?.length || 0} תנועות פיננסיות.`,
        });
      } catch (err: any) {
        console.error('Import error:', err);
        resolve({
          success: false,
          message: `שגיאה בייבוא הקובץ: ${err.message || 'קובץ לא תקין'}`,
        });
      }
    };
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file);
  });
}

/**
 * Generates an accountant CSV report for Israeli tax submission
 */
export function exportTransactionsToCsv(transactions: FinancialTransaction[]): void {
  const headers = [
    'מזהה',
    'סוג (הכנסה/הוצאה)',
    'תאריך',
    'קטגוריה',
    'תיאור',
    'סכום כולל (₪)',
    'מע"מ (₪)',
    'אמצעי תשלום',
    'מספר אסמכתא / קבלה',
    'מספר קבלה ידנית',
    'שם הילד',
    'דווח לרו"ח',
  ];

  const categoryLabels: Record<string, string> = {
    TUITION: 'שכר לימוד',
    FOOD: 'מזון ושתייה',
    SUPPLIES: 'חומרי יצירה וניקיון',
    SALARY: 'שכר עובדות',
    RENT: 'שכירות וארנונה',
    INSURANCE: 'ביטוח',
    UTILITIES: 'חשמל ומים',
    MAINTENANCE: 'תחזוקה',
    OTHER: 'אחר',
  };

  const methodLabels: Record<string, string> = {
    CASH: 'מזומן',
    CHECK: 'צ\'ק',
    BANK_TRANSFER: 'העברה בנקאית',
    CREDIT_CARD: 'כרטיס אשראי',
    BIT: 'ביט / פייבוקס',
  };

  const rows = transactions.map((t) => [
    t.id,
    t.type === 'INCOME' ? 'הכנסה' : 'הוצאה',
    t.date,
    categoryLabels[t.category] || t.category,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    (t.vatAmount || 0).toFixed(2),
    methodLabels[t.paymentMethod] || t.paymentMethod,
    t.referenceNumber || '',
    t.manualReceiptNumber || '',
    t.childName || '',
    t.isReportedToAccountant ? 'כן' : 'לא',
  ]);

  // Add BOM for Excel UTF-8 Hebrew support
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daycare_tax_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
