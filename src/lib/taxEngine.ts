import { Child, FinancialTransaction, StaffMember, StaffShift, ComplianceRatioResult } from '../types';

export const OSEK_PATUR_2026_CEILING = 122000; // תקרת עוסק פטור לשנת 2026
export const CASH_LEGAL_LIMIT = 6000; // חוק לצמצום השימוש במזומן
export const DEFAULT_VAT_RATE = 0.17; // מע"מ נוכחי בישראל

export interface TaxStatusReport {
  totalAnnualIncome: number;
  osekPaturCeiling: number;
  percentageUsed: number;
  remainingAmount: number;
  status: 'SAFE' | 'WARNING_80' | 'CRITICAL_90' | 'EXCEEDED';
  warningMessage?: string;
  totalVatCollected: number; // מע"מ עסקאות
  totalVatDeductible: number; // מע"מ תשומות (הוצאות מוכרות)
  netVatPayable: number; // לתשלום/החזר מע"מ
}

/**
 * Calculates current year tax status against Osek Patur ceiling or VAT
 */
export function calculateTaxStatus(
  transactions: FinancialTransaction[],
  businessType: 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY',
  customCeiling: number = OSEK_PATUR_2026_CEILING
): TaxStatusReport {
  const currentYear = new Date().getFullYear();

  const annualIncomes = transactions.filter(
    (t) => t.type === 'INCOME' && new Date(t.date).getFullYear() === currentYear
  );

  const totalAnnualIncome = annualIncomes.reduce((acc, t) => acc + t.amount, 0);

  const annualExpenses = transactions.filter(
    (t) => t.type === 'EXPENSE' && new Date(t.date).getFullYear() === currentYear
  );

  // VAT calculations
  const totalVatCollected = annualIncomes.reduce((acc, t) => acc + (t.vatAmount || 0), 0);
  const totalVatDeductible = annualExpenses.reduce((acc, t) => acc + (t.vatAmount || 0), 0);
  const netVatPayable = totalVatCollected - totalVatDeductible;

  const percentageUsed = Math.min(100, (totalAnnualIncome / customCeiling) * 100);
  const remainingAmount = Math.max(0, customCeiling - totalAnnualIncome);

  let status: 'SAFE' | 'WARNING_80' | 'CRITICAL_90' | 'EXCEEDED' = 'SAFE';
  let warningMessage: string | undefined;

  if (totalAnnualIncome >= customCeiling) {
    status = 'EXCEEDED';
    warningMessage = `שים/י לב: חריגה מתקרת עוסק פטור (${customCeiling.toLocaleString()} ₪)! יש לפנות מיד לרואה החשבון למעבר לעוסק מורשה.`;
  } else if (percentageUsed >= 90) {
    status = 'CRITICAL_90';
    warningMessage = `התראה קריטית: הגעת ל-${percentageUsed.toFixed(1)}% מתקרת עוסק פטור (נותרו ${remainingAmount.toLocaleString()} ₪). שקול/י מעבר לעוסק מורשה.`;
  } else if (percentageUsed >= 80) {
    status = 'WARNING_80';
    warningMessage = `התראה: הגעת ל-${percentageUsed.toFixed(1)}% מתקרת עוסק פטור (נותרו ${remainingAmount.toLocaleString()} ₪).`;
  }

  return {
    totalAnnualIncome,
    osekPaturCeiling: customCeiling,
    percentageUsed,
    remainingAmount,
    status,
    warningMessage,
    totalVatCollected,
    totalVatDeductible,
    netVatPayable,
  };
}

/**
 * Validates transaction according to Israeli Cash Reduction Law
 */
export function validateCashTransaction(
  amount: number,
  paymentMethod: string
): { isValid: boolean; errorMessage?: string } {
  if (paymentMethod === 'CASH' && amount > CASH_LEGAL_LIMIT) {
    return {
      isValid: false,
      errorMessage: `חוק לצמצום השימוש במזומן: חל איסור מוחלט על קבלת מזומן מעל ${CASH_LEGAL_LIMIT.toLocaleString()} ₪ בעסקה עסקית! יש לפצל אמצעי תשלום (למשל צ'ק, העברה בנקאית או אשראי).`,
    };
  }
  return { isValid: true };
}

/**
 * Overtime calculator according to Israeli labor laws:
 * Standard Shift (e.g. 8.5 hours)
 * Next 2 hours: 125%
 * Additional hours beyond 2 hours: 150%
 */
export function calculateShiftHoursAndPay(
  clockIn: string,
  clockOut: string,
  hourlyRate: number,
  standardDailyHours: number = 8.5
): {
  totalHours: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
  totalPay: number;
} {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);

  const startMinutes = inH * 60 + inM;
  let endMinutes = outH * 60 + outM;
  if (endMinutes < startMinutes) endMinutes += 24 * 60; // crossed midnight

  const totalHours = Math.max(0, (endMinutes - startMinutes) / 60);

  let regularHours = Math.min(totalHours, standardDailyHours);
  let remainingOvertime = Math.max(0, totalHours - standardDailyHours);

  let overtime125Hours = Math.min(remainingOvertime, 2.0);
  let overtime150Hours = Math.max(0, remainingOvertime - 2.0);

  const regularPay = regularHours * hourlyRate;
  const ot125Pay = overtime125Hours * (hourlyRate * 1.25);
  const ot150Pay = overtime150Hours * (hourlyRate * 1.5);
  const totalPay = Math.round((regularPay + ot125Pay + ot150Pay) * 100) / 100;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtime125Hours: Math.round(overtime125Hours * 100) / 100,
    overtime150Hours: Math.round(overtime150Hours * 100) / 100,
    totalPay,
  };
}

/**
 * Staff-to-Child Ratio Engine according to the Daycare Supervision Law:
 * - Infants (< 15 months): 1 staff member per 6 children (1:6)
 * - Toddlers (15 - 24 months): 1 staff member per 9 children (1:9)
 * - Preschoolers (24 - 36 months): 1 staff member per 12 children (1:12)
 */


export function evaluateDaycareRatioCompliance(
  presentChildren: Child[],
  activeStaffCount: number
): ComplianceRatioResult {
  let infantsCount = 0;
  let toddlersCount = 0;
  let preschoolersCount = 0;

  const now = new Date();

  for (const child of presentChildren) {
    const birth = new Date(child.birthDate);
    const ageMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

    if (ageMonths < 15 || child.ageGroup === 'INFANT') {
      infantsCount++;
    } else if (ageMonths < 24 || child.ageGroup === 'TODDLER') {
      toddlersCount++;
    } else {
      preschoolersCount++;
    }
  }

  // Calculate required staff based on fractional weights:
  // 1 infant requires 1/6 staff, 1 toddler requires 1/9 staff, 1 preschooler requires 1/12 staff
  const fractionalStaffRequired =
    infantsCount / 6 + toddlersCount / 9 + preschoolersCount / 12;

  // Law requires at least 2 staff members if there are 6+ kids, and ceiling of fractional requirement
  const minBaseStaff = presentChildren.length > 0 ? (presentChildren.length > 5 ? 2 : 1) : 0;
  const calculatedCeil = Math.ceil(fractionalStaffRequired);
  const requiredStaffCount = Math.max(minBaseStaff, calculatedCeil);

  const isCompliant = activeStaffCount >= requiredStaffCount;
  let statusBadge: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
  let alertMessage = `תקינת חוק הפיקוח מלאה: ${activeStaffCount} אנשי צוות על ${presentChildren.length} ילדים.`;

  if (!isCompliant) {
    statusBadge = 'VIOLATION';
    alertMessage = `אזהרת תקינה חמורה: נדרשים לפחות ${requiredStaffCount} אנשי צוות עבור ${presentChildren.length} הילדים הנוכחים (נמצאים כעת: ${activeStaffCount}). חריגה מחוק הפיקוח!`;
  } else if (activeStaffCount === requiredStaffCount && presentChildren.length > 0) {
    statusBadge = 'WARNING';
    alertMessage = `תקינה גבולית: יש ${activeStaffCount} אנשי צוות בדיוק לפי המינימום הנדרש. מומלץ לוודא גיבוי למקרה של איחור או עזיבה.`;
  }

  return {
    presentChildrenCount: presentChildren.length,
    infantsCount,
    toddlersCount,
    preschoolersCount,
    activeStaffCount,
    requiredStaffCount,
    isCompliant,
    statusBadge,
    alertMessage,
  };
}
