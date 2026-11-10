import * as XLSX from 'xlsx';
import { Child, StaffMember, DaycareSettings, ExpectedExpenseItem } from '../types';

interface ExportBalanceData {
  monthLabel: string;
  selectedMonth: string;
  activeChildren: Child[];
  expectedExpenses: ExpectedExpenseItem[];
  staff: StaffMember[];
  settings: DaycareSettings | null;
  completenessScore: number;
}

/**
 * Generates and downloads a fully formatted Excel / Google Sheets workbook (.xlsx)
 * complete with dynamic formulas (=SUM, =IF, cell references) and styled tabs.
 */
export function exportToGoogleSheetsXlsx(data: ExportBalanceData) {
  const {
    monthLabel,
    activeChildren,
    expectedExpenses,
    staff,
    settings,
    completenessScore,
  } = data;

  const directorName = settings?.directorName || 'הנהלת המעון';
  const daycareName = settings?.daycareName || 'מעון ילדים';

  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: דשבורד מאזן חודשי (Dashboard)
  // ==========================================
  const dashboardData: (string | number | { f: string })[][] = [
    [`📊 ${daycareName} - דשבורד מאזן חודשי צפוי`],
    [`מנהלת: ${directorName} | אריאל | חודש יעד: ${monthLabel}`],
    [`מדד שלמות המאזן: ${completenessScore}%`],
    [''],
    ['סעיף מאזן ראשי', 'סכום צפוי (₪)', 'הערות ונוסחאות'],
    ['סה"כ הכנסות צפויות', { f: "SUM('פירוט הכנסות'!E3:E50)" }, 'מחושב אוטומטית מגיליון פירוט הכנסות'],
    ['סה"כ הוצאות תפעול', { f: "SUM('פירוט הוצאות'!C3:C50)" }, 'מחושב אוטומטית מגיליון פירוט הוצאות'],
    ['סה"כ חבות שכר צוות', { f: "SUM('צוות ושכר'!E3:E50)" }, 'מחושב אוטומטית מגיליון צוות ושכר'],
    ['סה"כ הוצאות כולל', { f: 'B7+B8' }, 'סיכום הוצאות תפעול ושכר'],
    ['מאזן חודשי נקי (רווח/הפסד)', { f: 'B6-B9' }, 'הכנסות פחות הוצאות כולל'],
    ['סטטוס איזון תקציבי', { f: 'IF(B10>=0, "מאוזן - עודף תקציבי ✓", "חור במאזן - דרוש עירנון!")' }, 'נוסחת בדיקת איזון אוטומטית'],
    ['פערים פתוחים לטיפול', { f: 'COUNTIF(\'פירוט הכנסות\'!F3:F50, "טרם אושר") + COUNTIF(\'פירוט הוצאות\'!D3:D50, "הערכה בלבד")' }, 'ספירת מידע חסר במאזן'],
  ];

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);

  // Set column widths for Dashboard
  wsDashboard['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 45 }];

  // Add sheet to workbook
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'דשבורד מאזן');

  // ==========================================
  // SHEET 2: פירוט הכנסות (Income Detail)
  // ==========================================
  const incomeRows: (string | number | { f: string })[][] = [
    [`🐝 ${daycareName} - פירוט הכנסות צפויות משכר לימוד (${monthLabel})`],
    ['שם הילד/ה', 'שכ"ל בסיס (₪)', 'תוספות/צהרון (₪)', 'קבוצת גיל', 'סה"כ הכנסה (₪)', 'סטטוס אישור'],
  ];

  activeChildren.forEach((c, idx) => {
    const rowNum = idx + 3; // 1-indexed, headers take rows 1 and 2
    const extraSum = c.extraFees
      ? (c.extraFees.afternoonCare || 0) + (c.extraFees.fridayCare || 0) + (c.extraFees.activities || 0)
      : 0;

    const ageGroupLabel =
      c.ageGroup === 'INFANT' ? 'תינוקות' : c.ageGroup === 'TODDLER' ? 'פעוטות' : 'בוגרים';

    incomeRows.push([
      `${c.firstName} ${c.lastName}`,
      c.monthlyTuition || 4200,
      extraSum,
      ageGroupLabel,
      { f: `B${rowNum}+C${rowNum}` }, // Formula for total per child
      c.tuitionStatus === 'PAID' ? 'מאושר ✓' : 'טרם אושר',
    ]);
  });

  // Total Income Row
  const startIncomeRow = 3;
  const endIncomeRow = incomeRows.length;
  incomeRows.push([
    'סה"כ הכנסות מתוכננות',
    { f: `SUM(B${startIncomeRow}:B${endIncomeRow})` },
    { f: `SUM(C${startIncomeRow}:C${endIncomeRow})` },
    '',
    { f: `SUM(E${startIncomeRow}:E${endIncomeRow})` },
    '',
  ]);

  const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
  wsIncome['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsIncome, 'פירוט הכנסות');

  // ==========================================
  // SHEET 3: פירוט הוצאות (Expense Detail)
  // ==========================================
  const expenseRows: (string | number | { f: string })[][] = [
    [`📦 ${daycareName} - פירוט הוצאות תפעול מתוכננות (${monthLabel})`],
    ['קטגוריית הוצאה', 'תיאור הסעיף', 'סכום צפוי (₪)', 'סטטוס אישור', 'הערות'],
  ];

  expectedExpenses.forEach((exp) => {
    expenseRows.push([
      exp.categoryName,
      exp.description,
      exp.expectedAmount,
      exp.isConfirmed ? 'סופי ומאושר ✓' : 'הערכה בלבד',
      exp.notes || '',
    ]);
  });

  const lastExpRow = expenseRows.length;
  expenseRows.push([
    'סה"כ הוצאות תפעול',
    '',
    { f: `SUM(C3:C${lastExpRow})` },
    '',
    '',
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
  wsExpenses['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'פירוט הוצאות');

  // ==========================================
  // SHEET 4: צוות ושכר (Staff & Wages)
  // ==========================================
  const staffRows: (string | number | { f: string })[][] = [
    [`👩‍🏫 ${daycareName} - חבות שכר צוות ומטפלות (${monthLabel})`],
    ['שם העובדת', 'תפקיד', 'שכר שעתי (₪)', 'שעות חודשיות', 'חבות שכר צפויה (₪)', 'סטטוס', 'הערות ופירוט עלויות מעסיק'],
  ];

  const activeStaff = staff.filter((s) => s.status === 'ACTIVE');
  activeStaff.forEach((s, idx) => {
    const rowNum = idx + 3;
    const estHours = (s.standardDailyHours || 8) * 22; // 22 work days in month
    const roleLabel =
      s.role === 'LEAD_EDUCATOR'
        ? 'גננת מובילה'
        : s.role === 'ASSISTANT'
        ? 'סייעת / מטפלת'
        : s.role === 'DIRECTOR'
        ? 'מנהלת'
        : 'ממלאת מקום';

    staffRows.push([
      s.fullName,
      roleLabel,
      s.hourlyRate || 45,
      estHours,
      s.hourlyRate === 0 ? s.notes?.split('= ₪')[1] ? Number(s.notes.split('= ₪')[1]) : 10000 : { f: `C${rowNum}*D${rowNum}` }, // Formula for staff wage liability
      'פעילה במשמרת',
      s.notes || '',
    ]);
  });

  const lastStaffRow = staffRows.length;
  staffRows.push([
    'סה"כ חבות שכר צוות',
    '',
    '',
    { f: `SUM(D3:D${lastStaffRow})` },
    { f: `SUM(E3:E${lastStaffRow})` },
    '',
    '',
  ]);

  const wsStaff = XLSX.utils.aoa_to_sheet(staffRows);
  wsStaff['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsStaff, 'צוות ושכר');

  // Download the file
  const fileName = `מאזן_חודשי_${data.selectedMonth}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
