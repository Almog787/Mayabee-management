export type AgeGroup = 'INFANT' | 'TODDLER' | 'PRESCHOOL'; // תינוקות (עד 15 חודש), פעוטות (15-24 חודש), בוגרים (24-36 חודש)

export interface ParentContact {
  fullName: string;
  phone: string;
  email: string;
  idNumber?: string;
  relation: string; // אמא / אבא / אפוטרופוס
  address?: string;
  isEmergencyContact?: boolean;
  isAuthorizedPickup?: boolean;
}

export interface Child {
  id: string; // UUID v4
  idNumber: string; // ת.ז. הילד/ה
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  enrollmentDate: string;
  ageGroup: AgeGroup;
  allergies: string[]; // ['בוטנים', 'שומשום', 'חלב', 'ביצים', 'גלוטן']
  medicalNotes?: string;
  pediatricianName?: string;
  pediatricianPhone?: string;
  parent1: ParentContact;
  parent2?: ParentContact;
  monthlyTuition: number; // שכר לימוד חודשי בסיסי
  extraFees?: {
    afternoonCare: number; // צהרון
    fridayCare: number; // ימי שישי
    activities: number; // חוגים והעשרה
  };
  tuitionStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'ACTIVE' | 'ARCHIVED';
  notes?: string;
  updatedAt: number;
  isSynced?: boolean;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'SICK' | 'VACATION';

export interface DailyAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  childId: string;
  checkInTime: string | null; // HH:mm
  checkOutTime: string | null; // HH:mm
  status: AttendanceStatus;
  pickupPerson?: string;
  notes?: string;
  updatedAt: number;
  isSynced?: boolean;
}

export interface DailyActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  childId: string;
  napStart?: string; // HH:mm
  napEnd?: string; // HH:mm
  napDurationMinutes?: number;
  diaperChanges: {
    time: string;
    type: 'WET' | 'DIRTY' | 'BOTH' | 'NORMAL';
    notes?: string;
  }[];
  meals: {
    mealName: string; // 'ארוחת בוקר' | 'ארוחת צהריים' | 'ארוחת מנחה'
    amount: 'FULL' | 'HALF' | 'LITTLE' | 'REFUSED'; // מלאה, חצי, מעט, סירב
    notes?: string;
  }[];
  mood: 'EXCELLENT' | 'CALM' | 'TIRED' | 'FUSSY' | 'CRYING';
  highlightActivities: string; // משחקים, ציור, חצר
  specialNotes?: string;
  summaryText?: string; // סיכום שנוצר להורה
  updatedAt: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory =
  | 'TUITION' // שכר לימוד
  | 'FOOD' // מזון ושתייה למעון
  | 'SUPPLIES' // חומרי יצירה, היגיינה וניקיון
  | 'SALARY' // שכר עובדות וסייעות
  | 'RENT' // שכירות וארנונה יחסית
  | 'INSURANCE' // ביטוחי צד ג' ותאונות אישיות
  | 'UTILITIES' // חשמל, מים, אינטרנט
  | 'MAINTENANCE' // תחזוקה ובטיחות
  | 'OTHER';

export type PaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'BIT';

export interface CheckDetails {
  checkNumber: string;
  bankName: string;
  bankNumber: string;
  branchNumber: string;
  accountNumber: string;
  dueDate: string; // תאריך פירעון
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number; // סכום כולל
  vatAmount: number; // סכום מע"מ
  vatRate: number; // 0 לעוסק פטור, 17 או 18 לעוסק מורשה
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  childId?: string; // מקושר לילד במקרה של שכר לימוד
  childName?: string;
  referenceNumber: string; // מס' קבלה פנימי / אסמכתא בנקאית
  manualReceiptNumber?: string; // מספר קבלה ידנית מפנקס
  checkDetails?: CheckDetails;
  isReportedToAccountant: boolean;
  notes?: string;
  receiptIssuedDate?: string;
  updatedAt: number;
  isSynced?: boolean;
}

export interface StaffMember {
  id: string;
  fullName: string;
  idNumber: string;
  role: 'LEAD_EDUCATOR' | 'ASSISTANT' | 'SUBSTITUTE' | 'DIRECTOR'; // גננת מובילה, סייעת, ממלאת מקום, מנהלת
  phone: string;
  email: string;
  hourlyRate: number;
  standardDailyHours: number; // שעות תקן יומיות (לרוב 8 או 8.5)
  firstAidCertExpiryDate: string; // תוקף קורס עזרה ראשונה והחייאת תינוקות (שנתיים)
  policeClearanceDate: string; // אישור משטרה להעסקת בגיר
  policeClearanceApproved: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  updatedAt: number;
}

export interface StaffShift {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut: string | null; // HH:mm
  regularHours: number;
  overtime125Hours: number; // שעתיים ראשונות מעל התקן
  overtime150Hours: number; // מעבר לכך
  totalPay: number;
  notes?: string;
  updatedAt: number;
}

export interface DaycareSettings {
  id: string;
  daycareName: string;
  licenseNumber?: string;
  businessType: 'OSEK_PATUR' | 'OSEK_MURSHE' | 'COMPANY';
  businessTaxId: string; // ע.מ / ח.פ
  directorName: string;
  directorPhone: string;
  daycareAddress: string;
  currentYearOsekPaturCeiling: number; // 122000 ל-2026
  vatRate: number; // 17%
  hasMasterPassword: boolean;
  saltHex?: string;
  lastBackupDate?: string;
  googleSheetsId?: string;
  googleSyncEnabled: boolean;
  lastSyncTime?: number;
  appsScriptUrl?: string; // כתובת ה-Web App של Google Apps Script
  appsScriptToken?: string; // טוקן אבטחה לאימות
  lastSheetsSyncStatus?: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSheetsSyncMessage?: string;
}

export interface WeeklyMealDay {
  dayName: string; // ראשון, שני, וכו'
  breakfast: string;
  morningSnack: string;
  lunch: string;
  afternoonSnack: string;
  ingredients: string[]; // ['טחינה', 'ביצים', 'גבינה', 'עוף', 'אורז', 'ירקות']
  allergensPresent: string[]; // ['שומשום', 'ביצים', 'חלב', 'גלוטן']
}

export interface SafetyCheckItem {
  id: string;
  title: string;
  category: 'DAILY' | 'MONTHLY';
  frequency: string;
  description: string;
  lastCheckedDate: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  inspectorName?: string;
  notes?: string;
}

export interface ComplianceRatioResult {
  presentChildrenCount: number;
  infantsCount: number;
  toddlersCount: number;
  preschoolersCount: number;
  activeStaffCount: number;
  requiredStaffCount: number;
  isCompliant: boolean;
  statusBadge: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  alertMessage: string;
}

export interface DiagnosticIssue {
  id: string;
  category:
    | 'CASH_LAW'
    | 'CHILDREN_DATA'
    | 'STAFF_SAFETY'
    | 'ALLERGIES'
    | 'SYNC_INTEGRITY'
    | 'FINANCE'
    | 'RATIO_SUPERVISION'
    | 'SAFETY_CHECKS';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  remedy: string;
  entityId?: string;
  entityName?: string;
}

export interface DatabaseDiagnosticsReport {
  timestamp: number;
  totalRecordsChecked: number;
  issuesCount: number;
  criticalCount: number;
  warningCount: number;
  issues: DiagnosticIssue[];
  status: 'EXCELLENT' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK';
  score: number;
}
