import {
  Child,
  DailyAttendance,
  FinancialTransaction,
  StaffMember,
  StaffShift,
  WeeklyMealDay,
  SafetyCheckItem,
  DaycareSettings,
  ComplianceRatioResult,
  DatabaseDiagnosticsReport,
  DiagnosticIssue,
} from '../types';
import { CASH_LEGAL_LIMIT } from './taxEngine';

export function runComprehensiveDiagnostics(params: {
  children: Child[];
  attendance: DailyAttendance[];
  transactions: FinancialTransaction[];
  staff: StaffMember[];
  shifts: StaffShift[];
  menu: WeeklyMealDay[];
  todayMenu?: WeeklyMealDay;
  safetyChecks: SafetyCheckItem[];
  settings: DaycareSettings | null;
  ratioCompliance: ComplianceRatioResult;
}): DatabaseDiagnosticsReport {
  const {
    children,
    attendance,
    transactions,
    staff,
    shifts,
    todayMenu,
    safetyChecks,
    settings,
    ratioCompliance,
  } = params;

  const issues: DiagnosticIssue[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Check Cash Law Compliance (חוק לצמצום השימוש במזומן)
  for (const tx of transactions) {
    if (tx.paymentMethod === 'CASH' && tx.amount > CASH_LEGAL_LIMIT) {
      issues.push({
        id: `cash-violation-${tx.id}`,
        category: 'CASH_LAW',
        severity: 'CRITICAL',
        title: `עסקת מזומן חורגת מהחוק (₪${tx.amount.toLocaleString()})`,
        description: `תנועה מ-${tx.date} עבור "${tx.description}" בסך ₪${tx.amount.toLocaleString()} שולמה במזומן, מעל תקרת החוק (6,000 ₪). חושף לקנסות מנהליים כבדים מרשות המסים.`,
        remedy: 'יש לשנות את אמצעי התשלום להעברה בנקאית, צ\'ק או ביט/אשראי, או לפצל את התשלומים בהתאם לחוק.',
        entityId: tx.id,
        entityName: tx.description,
      });
    }
  }

  // 2. Check Osek Patur Ceiling
  const isOsekPatur = settings?.businessType === 'OSEK_PATUR';
  const ceiling = settings?.currentYearOsekPaturCeiling || 122000;
  const totalAnnualIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  if (isOsekPatur) {
    if (totalAnnualIncome > ceiling) {
      issues.push({
        id: 'osek-patur-exceeded',
        category: 'FINANCE',
        severity: 'CRITICAL',
        title: 'חריגה מתקרת עוסק פטור לשנת 2026',
        description: `מחזור ההכנסות השנתי (₪${totalAnnualIncome.toLocaleString()}) חצה את תקרת הפטור (₪${ceiling.toLocaleString()}). חובה חוקית לדווח למע"מ ולהפוך לעוסק מורשה.`,
        remedy: 'פני בדחיפות לרואה החשבון לצורך פתיחת תיק עוסק מורשה במע"מ ועדכון הגדרות המעון.',
      });
    } else if (totalAnnualIncome >= ceiling * 0.9) {
      issues.push({
        id: 'osek-patur-critical-90',
        category: 'FINANCE',
        severity: 'WARNING',
        title: `התקרבות קריטית לתקרת עוסק פטור (${((totalAnnualIncome / ceiling) * 100).toFixed(0)}%)`,
        description: `נותרו ₪${(ceiling - totalAnnualIncome).toLocaleString()} בלבד עד לחציית התקרה.`,
        remedy: 'היערכי מראש עם יועץ המס לקראת מעבר צפוי לעוסק מורשה.',
      });
    }
  }

  // 3. Check Children Data Completeness
  for (const child of children) {
    if (!child.idNumber || child.idNumber.replace(/[^0-9]/g, '').length < 8) {
      issues.push({
        id: `child-missing-id-${child.id}`,
        category: 'CHILDREN_DATA',
        severity: 'WARNING',
        title: `תעודת זהות חסרה או לקויה: ${child.firstName} ${child.lastName}`,
        description: `ת.ז. שהוזנה (${child.idNumber || 'ריק'}) אינה תקינה לפי מרשם האוכלוסין בישראל.`,
        remedy: 'עדכני את תעודת הזהות (9 ספרות) בתיק הילד/ה לצורך ביטוח ודיווח תקין.',
        entityId: child.id,
        entityName: `${child.firstName} ${child.lastName}`,
      });
    }

    if (!child.parent1?.phone || child.parent1.phone.replace(/[^0-9]/g, '').length < 9) {
      issues.push({
        id: `child-missing-phone-${child.id}`,
        category: 'CHILDREN_DATA',
        severity: 'CRITICAL',
        title: `טלפון הורה חסר לחירום: ${child.firstName} ${child.lastName}`,
        description: 'לא מוגדר מספר טלפון תקין לאיש הקשר הראשי. במקרה חירום לא ניתן יהיה ליצור קשר מיידי.',
        remedy: 'הזיני מספר טלפון נייד זמין עבור איש הקשר הראשי.',
        entityId: child.id,
        entityName: `${child.firstName} ${child.lastName}`,
      });
    }

    if (!child.birthDate) {
      issues.push({
        id: `child-missing-birth-${child.id}`,
        category: 'CHILDREN_DATA',
        severity: 'WARNING',
        title: `חסר תאריך לידה: ${child.firstName} ${child.lastName}`,
        description: 'ללא תאריך לידה לא ניתן לחשב במדויק את יחס המטפלת-ילד לפי חוק הפיקוח.',
        remedy: 'הזיני את תאריך הלידה המדויק בטופס עריכת הילד.',
        entityId: child.id,
        entityName: `${child.firstName} ${child.lastName}`,
      });
    }
  }

  // 4. Check Allergy Cross-Contamination with Today's Present Children
  const presentChildIds = new Set(
    attendance.filter((a) => a.status === 'PRESENT').map((a) => a.childId)
  );

  if (todayMenu) {
    const presentWithAllergies = children.filter(
      (c) => presentChildIds.has(c.id) && c.allergies && c.allergies.length > 0
    );

    for (const child of presentWithAllergies) {
      for (const allergen of child.allergies) {
        const hasConflict = todayMenu.allergensPresent.some(
          (m) => m.toLowerCase().includes(allergen.toLowerCase()) || allergen.toLowerCase().includes(m.toLowerCase())
        );

        if (hasConflict) {
          issues.push({
            id: `allergy-conflict-${child.id}-${allergen}`,
            category: 'ALLERGIES',
            severity: 'CRITICAL',
            title: `סכנת אלרגיה מסכנת חיים: ${child.firstName} (${allergen})`,
            description: `הילד/ה נוכח/ת היום בגן ותפריט היום (${todayMenu.dayName}) מכיל ${allergen}. סכנת זיהום צולב חמורה!`,
            remedy: 'יש לוודא הכנת מנה חלופית בכלי נפרד וסטרילי, ושמזרק האפיפן נמצא בהישג יד מיידי של הגננת.',
            entityId: child.id,
            entityName: `${child.firstName} ${child.lastName}`,
          });
        }
      }
    }
  }

  // 5. Staff Certifications & Safety Compliance
  for (const member of staff) {
    if (!member.firstAidCertExpiryDate) {
      issues.push({
        id: `staff-cpr-missing-${member.id}`,
        category: 'STAFF_SAFETY',
        severity: 'CRITICAL',
        title: `חסר תוקף עזרה ראשונה: ${member.fullName}`,
        description: 'לפי חוק הפיקוח, כל עובדת במעון מחויבת בקורס החייאה ועזרה ראשונה בתוקף (חידוש כל שנתיים).',
        remedy: 'הפני את העובדת לקורס רענון החייאה מיידי ועדכני את התאריך במערכת.',
        entityId: member.id,
        entityName: member.fullName,
      });
    } else {
      const expDate = new Date(member.firstAidCertExpiryDate);
      if (expDate < now) {
        issues.push({
          id: `staff-cpr-expired-${member.id}`,
          category: 'STAFF_SAFETY',
          severity: 'CRITICAL',
          title: `תוקף החייאה ועזרה ראשונה פג: ${member.fullName}`,
          description: `התעודה פגה ב-${member.firstAidCertExpiryDate}. חריגת בטיחות חמורה בחוק הפיקוח.`,
          remedy: 'רישום דחוף לקורס רענון החייאת תינוקות ופעוטות.',
          entityId: member.id,
          entityName: member.fullName,
        });
      } else if ((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 30) {
        issues.push({
          id: `staff-cpr-expiring-${member.id}`,
          category: 'STAFF_SAFETY',
          severity: 'WARNING',
          title: `תוקף קורס החייאה עומד לפוג בקרוב: ${member.fullName}`,
          description: `התעודה תפוג ב-${member.firstAidCertExpiryDate} (בעוד פחות מ-30 יום).`,
          remedy: 'תאמי מועד לרענון עזרה ראשונה לפני פקיעת התוקף.',
          entityId: member.id,
          entityName: member.fullName,
        });
      }
    }

    if (!member.policeClearanceApproved) {
      issues.push({
        id: `staff-police-missing-${member.id}`,
        category: 'STAFF_SAFETY',
        severity: 'CRITICAL',
        title: `חסר אישור משטרת ישראל להעסקת בגיר: ${member.fullName}`,
        description: 'חוק למניעת העסקה של עברייני מין במוסדות מסוימים (תשס"א-2001) מחייב קבלת אישור משטרה רשמי לפני העסקה.',
        remedy: 'דרשי מהעובדת להמציא אישור משטרה תקני ללא דיחוי.',
        entityId: member.id,
        entityName: member.fullName,
      });
    }
  }

  // 6. Daycare Supervision Ratio Violation
  if (!ratioCompliance.isCompliant) {
    issues.push({
      id: 'ratio-compliance-violation',
      category: 'STAFF_SAFETY',
      severity: 'CRITICAL',
      title: 'חריגה מתקינת יחס מטפלת-ילד (חוק הפיקוח תשע"ט-2018)',
      description: `במשמרת כעת ${ratioCompliance.activeStaffCount} סייעות, אך לפי מספר הילדים הנוכחים נדרשות לפחות ${ratioCompliance.requiredStaffCount} סייעות.`,
      remedy: 'יש להקפיץ סייעת ממלאת מקום או להחתים מיידית עובדת נוספת במשמרת.',
    });
  }

  // 7. Safety Checks Status
  const failedDailyChecks = safetyChecks.filter(
    (s) => s.category === 'DAILY' && s.status === 'FAILED'
  );
  for (const check of failedDailyChecks) {
    issues.push({
      id: `safety-check-failed-${check.id}`,
      category: 'STAFF_SAFETY',
      severity: 'CRITICAL',
      title: `ליקוי בטיחות יומי פעיל: ${check.title}`,
      description: check.description || 'נמצא ליקוי בטיחות בבדיקת הבוקר.',
      remedy: 'יש לטפל בליקוי הבטיחותי בחצר/במעון לפני שהילדים יוצאים לפעילות.',
      entityId: check.id,
      entityName: check.title,
    });
  }

  // 8. Tuition Collection Unpaid Alerts
  const unpaidTuitionKids = children.filter((c) => c.tuitionStatus === 'UNPAID');
  if (unpaidTuitionKids.length > 0) {
    issues.push({
      id: 'tuition-unpaid-kids',
      category: 'FINANCE',
      severity: 'INFO',
      title: `${unpaidTuitionKids.length} ילדים עם שכר לימוד טרם שולם לחודש זה`,
      description: `ילדים: ${unpaidTuitionKids.map((k) => `${k.firstName} ${k.lastName}`).join(', ')}.`,
      remedy: 'הפיקי קבלות או שלחי תזכורת ידידותית בוואטסאפ להורים להסדרת שכר הלימוד.',
    });
  }

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;

  let status: 'EXCELLENT' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK' = 'EXCELLENT';
  if (criticalCount > 0) {
    status = 'CRITICAL_RISK';
  } else if (warningCount > 0) {
    status = 'NEEDS_ATTENTION';
  }

  const totalRecords =
    children.length +
    attendance.length +
    transactions.length +
    staff.length +
    safetyChecks.length;

  const score = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);

  return {
    timestamp: Date.now(),
    totalRecordsChecked: totalRecords,
    issuesCount: issues.length,
    criticalCount,
    warningCount,
    issues,
    status,
    score,
  };
}
