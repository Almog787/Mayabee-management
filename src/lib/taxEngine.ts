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
  totalVatCollected: number;
  totalVatDeductible: number;
  netVatPayable: number;
}

export interface EstimatedTaxResult {
  businessType: 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY';
  grossIncome: number;
  grossExpenses: number;
  preTaxNetProfit: number; // רווח נקי לפני מס
  incomeTaxAmount: number; // מס הכנסה משוער
  nationalInsuranceAmount: number; // ביטוח לאומי ובריאות משוער
  netVatAmount: number; // מע"מ נטו
  totalTaxLiability: number; // סה"כ חבות מס
  postTaxNetProfit: number; // רווח נטו בכיס (אחרי מס)
  effectiveTaxRatePercent: number; // אחוז מס אפקטיבי
  explanationSummary: string;
}

/**
 * Calculates estimated Israeli Tax (Income tax, National Insurance, VAT, Corporate tax)
 * and produces side-by-side pre-tax and post-tax results.
 */
export function calculateIsraeliTaxEstimate(
  monthlyIncome: number,
  monthlyExpenses: number,
  businessType: 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY' = 'OSEK_PATUR'
): EstimatedTaxResult {
  const preTaxNetProfit = Math.max(0, monthlyIncome - monthlyExpenses);
  const annualProfit = preTaxNetProfit * 12;

  let incomeTaxAnnual = 0;
  let nationalInsuranceAnnual = 0;
  let netVatAnnual = 0;
  let explanationSummary = '';

  if (businessType === 'OSEK_PATUR') {
    // 0% VAT
    // National Insurance (~5.97% on lower tier up to ~₪86,304/yr, ~17.83% above)
    const lowerTierMax = 86304;
    if (annualProfit <= lowerTierMax) {
      nationalInsuranceAnnual = annualProfit * 0.0597;
    } else {
      nationalInsuranceAnnual = lowerTierMax * 0.0597 + (annualProfit - lowerTierMax) * 0.1783;
    }

    // Income tax with 2.25 credit points (~₪6,480 annual credit)
    const creditPointsDiscount = 6480;
    let grossIncomeTax = 0;
    if (annualProfit <= 81480) {
      grossIncomeTax = annualProfit * 0.10;
    } else if (annualProfit <= 116760) {
      grossIncomeTax = 81480 * 0.10 + (annualProfit - 81480) * 0.14;
    } else if (annualProfit <= 187440) {
      grossIncomeTax = 81480 * 0.10 + (116760 - 81480) * 0.14 + (annualProfit - 116760) * 0.20;
    } else {
      grossIncomeTax = 81480 * 0.10 + (116760 - 81480) * 0.14 + (187440 - 116760) * 0.20 + (annualProfit - 187440) * 0.31;
    }
    incomeTaxAnnual = Math.max(0, grossIncomeTax - creditPointsDiscount);
    explanationSummary = 'עוסק פטור: פטור ממע"מ עד תקרת ₪122,000. חישוב מס הכנסה לפי מדרגות יחיד בניכוי נקודות זיכוי (2.25 נק\') ודמי ביטוח לאומי.';
  } else if (businessType === 'OSEK_MURSHE') {
    // Osek Murshe includes VAT deduction & progressive tax
    netVatAnnual = (monthlyIncome - monthlyExpenses) * 12 * 0.17; // 17% VAT
    const lowerTierMax = 86304;
    if (annualProfit <= lowerTierMax) {
      nationalInsuranceAnnual = annualProfit * 0.0597;
    } else {
      nationalInsuranceAnnual = lowerTierMax * 0.0597 + (annualProfit - lowerTierMax) * 0.1783;
    }

    const creditPointsDiscount = 6480;
    let grossIncomeTax = 0;
    if (annualProfit <= 81480) {
      grossIncomeTax = annualProfit * 0.10;
    } else if (annualProfit <= 116760) {
      grossIncomeTax = 81480 * 0.10 + (annualProfit - 81480) * 0.14;
    } else if (annualProfit <= 187440) {
      grossIncomeTax = 81480 * 0.10 + (116760 - 81480) * 0.14 + (annualProfit - 116760) * 0.20;
    } else {
      grossIncomeTax = 81480 * 0.10 + (116760 - 81480) * 0.14 + (187440 - 116760) * 0.20 + (annualProfit - 187440) * 0.31;
    }
    incomeTaxAnnual = Math.max(0, grossIncomeTax - creditPointsDiscount);
    explanationSummary = 'עוסק מורשה: חבות מע"מ 17% + מדרגות מס הכנסה ליחיד ודמי ביטוח לאומי מלאים.';
  } else {
    // Company Ltd (23% Corporate tax + 25% Dividend tax on remaining)
    const corpTax = annualProfit * 0.23;
    const remainingForDividend = annualProfit - corpTax;
    const dividendTax = remainingForDividend * 0.25;
    incomeTaxAnnual = corpTax + dividendTax;
    nationalInsuranceAnnual = 0; // Paid via wage if owner takes salary
    explanationSummary = 'חברה בע"מ: מס חברות קצוב (23%) + מס דיבידנד (25%) בעת משיכת רווחים.';
  }

  const monthlyIncomeTax = Math.round(incomeTaxAnnual / 12);
  const monthlyNationalInsurance = Math.round(nationalInsuranceAnnual / 12);
  const monthlyNetVat = Math.round(netVatAnnual / 12);

  const totalMonthlyTaxLiability = monthlyIncomeTax + monthlyNationalInsurance;
  const postTaxNetProfit = Math.max(0, preTaxNetProfit - totalMonthlyTaxLiability);
  const effectiveTaxRatePercent = preTaxNetProfit > 0 ? (totalMonthlyTaxLiability / preTaxNetProfit) * 100 : 0;

  return {
    businessType,
    grossIncome: monthlyIncome,
    grossExpenses: monthlyExpenses,
    preTaxNetProfit,
    incomeTaxAmount: monthlyIncomeTax,
    nationalInsuranceAmount: monthlyNationalInsurance,
    netVatAmount: monthlyNetVat,
    totalTaxLiability: totalMonthlyTaxLiability,
    postTaxNetProfit,
    effectiveTaxRatePercent: Math.round(effectiveTaxRatePercent * 10) / 10,
    explanationSummary,
  };
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
