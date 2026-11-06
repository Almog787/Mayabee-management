import Dexie, { Table } from 'dexie';
import {
  Child,
  DailyAttendance,
  DailyActivityLog,
  FinancialTransaction,
  StaffMember,
  StaffShift,
  DaycareSettings,
  WeeklyMealDay,
  SafetyCheckItem,
} from '../types';

// Origin-aware database name to prevent collisions on GitHub Pages / shared origins
const getDbName = () => {
  if (typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const repo = segments[0] || 'daycare_app';
    return `DaycareDB_${repo}`;
  }
  return 'DaycareDB_default';
};

export class DaycareDatabase extends Dexie {
  children!: Table<Child, string>;
  attendance!: Table<DailyAttendance, string>;
  dailyLogs!: Table<DailyActivityLog, string>;
  transactions!: Table<FinancialTransaction, string>;
  staff!: Table<StaffMember, string>;
  shifts!: Table<StaffShift, string>;
  menu!: Table<WeeklyMealDay, string>;
  safetyChecks!: Table<SafetyCheckItem, string>;
  settings!: Table<DaycareSettings, string>;

  constructor() {
    super(getDbName());

    this.version(1).stores({
      children: 'id, idNumber, firstName, lastName, ageGroup, status, updatedAt',
      attendance: 'id, date, childId, status, updatedAt, [date+childId]',
      dailyLogs: 'id, date, childId, updatedAt, [date+childId]',
      transactions: 'id, type, category, date, paymentMethod, childId, isReportedToAccountant, updatedAt',
      staff: 'id, fullName, role, status, updatedAt',
      shifts: 'id, staffId, date, updatedAt, [date+staffId]',
      menu: 'dayName',
      safetyChecks: 'id, category, status, lastCheckedDate',
      settings: 'id',
    });
  }
}

export const db = new DaycareDatabase();

// Default 10 Children Seed Data
const initialChildren: Child[] = [
  {
    id: 'c-01',
    idNumber: '324567891',
    firstName: 'איתי',
    lastName: 'לוי',
    birthDate: '2025-04-12',
    enrollmentDate: '2025-09-01',
    ageGroup: 'TODDLER',
    allergies: ['שומשום', 'טחינה'],
    medicalNotes: 'אלרגיה מסכנת חיים לשומשום וטחינה. מזרק אפיפן בתוקף במגירה הראשית.',
    pediatricianName: 'ד"ר ענת פרידמן',
    pediatricianPhone: '052-9876543',
    parent1: {
      fullName: 'רונית לוי',
      phone: '054-1234567',
      email: 'ronit.levi@example.com',
      relation: 'אמא',
      idNumber: '038912345',
      address: 'רחוב הרקפת 14, תל אביב',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    parent2: {
      fullName: 'יוסי לוי',
      phone: '052-7654321',
      email: 'yossi.levi@example.com',
      relation: 'אבא',
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4200,
    extraFees: { afternoonCare: 400, fridayCare: 200, activities: 150 },
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
    isSynced: false,
  },
  {
    id: 'c-02',
    idNumber: '326789123',
    firstName: 'מאיה',
    lastName: 'כהן',
    birthDate: '2025-08-20',
    enrollmentDate: '2025-09-01',
    ageGroup: 'INFANT',
    allergies: ['חלב'],
    medicalNotes: 'רגישות לחלבון חלב פרה. ניזונה מתחליף צמחי מיוחד שההורים מביאים.',
    pediatricianName: 'ד"ר מיכאל ברק',
    pediatricianPhone: '050-4433221',
    parent1: {
      fullName: 'דנה כהן',
      phone: '050-8765432',
      email: 'dana.cohen@example.com',
      relation: 'אמא',
      address: 'שדרות ירושלים 45, רמת גן',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4500,
    extraFees: { afternoonCare: 400, fridayCare: 0, activities: 100 },
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-03',
    idNumber: '329871234',
    firstName: 'נועם',
    lastName: 'אזולאי',
    birthDate: '2024-11-15',
    enrollmentDate: '2025-09-01',
    ageGroup: 'PRESCHOOL',
    allergies: ['בוטנים'],
    medicalNotes: 'אלרגיה לבוטנים ואגוזי לוז. דורש השגחה צמודה בעת מסיבות וימי הולדת.',
    pediatricianName: 'ד"ר שרה וייס',
    pediatricianPhone: '054-2233445',
    parent1: {
      fullName: 'שירן אזולאי',
      phone: '053-9988776',
      email: 'shiran.azoulay@example.com',
      relation: 'אמא',
      address: 'רחוב הבנים 8, גבעתיים',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    parent2: {
      fullName: 'אלעד אזולאי',
      phone: '053-1122334',
      email: 'elad.azoulay@example.com',
      relation: 'אבא',
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4000,
    tuitionStatus: 'PARTIAL',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-04',
    idNumber: '328112233',
    firstName: 'אורי',
    lastName: 'שפירא',
    birthDate: '2025-01-10',
    enrollmentDate: '2025-09-01',
    ageGroup: 'TODDLER',
    allergies: [],
    medicalNotes: 'ללא אלרגיות ידועות. עור רגיש לעקיצות יתושים (למרוח גל אלוורה).',
    parent1: {
      fullName: 'גלית שפירא',
      phone: '054-3322110',
      email: 'galit.shapiro@example.com',
      relation: 'אמא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4100,
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-05',
    idNumber: '327998877',
    firstName: 'ליה',
    lastName: 'גולדשטיין',
    birthDate: '2025-06-05',
    enrollmentDate: '2025-09-01',
    ageGroup: 'INFANT',
    allergies: ['ביצים'],
    medicalNotes: 'המלצת רופא: הימנעות מוחלטת מביצים לא מבושלות או מיונז.',
    parent1: {
      fullName: 'תמר גולדשטיין',
      phone: '052-6655443',
      email: 'tamar.gold@example.com',
      relation: 'אמא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4400,
    tuitionStatus: 'UNPAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-06',
    idNumber: '325667788',
    firstName: 'דניאל',
    lastName: 'מזרחי',
    birthDate: '2024-10-02',
    enrollmentDate: '2025-09-01',
    ageGroup: 'PRESCHOOL',
    allergies: [],
    parent1: {
      fullName: 'לירון מזרחי',
      phone: '050-1199887',
      email: 'liron.m@example.com',
      relation: 'אבא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 3900,
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-07',
    idNumber: '324009988',
    firstName: 'עלמה',
    lastName: 'ברקוביץ\'',
    birthDate: '2025-03-18',
    enrollmentDate: '2025-09-01',
    ageGroup: 'TODDLER',
    allergies: ['גלוטן'],
    medicalNotes: 'צליאק מאובחן. מקבלת כריך וארוחות נפרדות ללא גלוטן מהבית/מטבח.',
    parent1: {
      fullName: 'מיכל ברקוביץ',
      phone: '054-7766554',
      email: 'michal.berko@example.com',
      relation: 'אמא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4200,
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-08',
    idNumber: '323114455',
    firstName: 'תומר',
    lastName: 'חדד',
    birthDate: '2025-07-14',
    enrollmentDate: '2025-09-01',
    ageGroup: 'INFANT',
    allergies: [],
    parent1: {
      fullName: 'אבי חדד',
      phone: '052-3344556',
      email: 'avi.hadad@example.com',
      relation: 'אבא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4500,
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-09',
    idNumber: '322887766',
    firstName: 'רוני',
    lastName: 'אלפסי',
    birthDate: '2024-12-25',
    enrollmentDate: '2025-09-01',
    ageGroup: 'PRESCHOOL',
    allergies: ['סויה'],
    parent1: {
      fullName: 'שני אלפסי',
      phone: '050-6677889',
      email: 'shani.alfasi@example.com',
      relation: 'אמא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 3950,
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 'c-10',
    idNumber: '321990011',
    firstName: 'יהונתן',
    lastName: 'קליין',
    birthDate: '2025-05-30',
    enrollmentDate: '2025-09-01',
    ageGroup: 'TODDLER',
    allergies: [],
    parent1: {
      fullName: 'קרן קליין',
      phone: '054-8899001',
      email: 'keren.klein@example.com',
      relation: 'אמא',
      isEmergencyContact: true,
      isAuthorizedPickup: true,
    },
    monthlyTuition: 4200,
    tuitionStatus: 'PAID',
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
];

// Initial Staff Seed Data
const initialStaff: StaffMember[] = [
  {
    id: 's-01',
    fullName: 'רותם עירון',
    idNumber: '028912345',
    role: 'DIRECTOR',
    phone: '052-870-7056',
    email: 'rotem.eiron@mayabee.co.il',
    hourlyRate: 70,
    standardDailyHours: 8.5,
    firstAidCertExpiryDate: '2027-08-15', // בתוקף
    policeClearanceDate: '2025-08-10',
    policeClearanceApproved: true,
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 's-02',
    fullName: 'מורן דוד',
    idNumber: '034567890',
    role: 'LEAD_EDUCATOR',
    phone: '052-2345678',
    email: 'moran.david@daycare.co.il',
    hourlyRate: 52,
    standardDailyHours: 8,
    firstAidCertExpiryDate: '2026-12-01', // קרוב לתפוגה (עוד חודש)
    policeClearanceDate: '2025-07-20',
    policeClearanceApproved: true,
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
  {
    id: 's-03',
    fullName: 'אודליה נגר',
    idNumber: '039876543',
    role: 'ASSISTANT',
    phone: '054-3456789',
    email: 'odelia.nagar@daycare.co.il',
    hourlyRate: 45,
    standardDailyHours: 8,
    firstAidCertExpiryDate: '2027-05-10',
    policeClearanceDate: '2025-09-01',
    policeClearanceApproved: true,
    status: 'ACTIVE',
    updatedAt: Date.now(),
  },
];

const initialWeeklyMenu: WeeklyMealDay[] = [
  {
    dayName: 'יום ראשון',
    breakfast: 'דייסת שיבולת שועל עם בננה וקינמון',
    morningSnack: 'תפוחי עץ חתוכים',
    lunch: 'קציצות הודו ברוטב עגבניות ביתי, פירה תפוחי אדמה וגזר מאודה',
    afternoonSnack: 'קרקרים מחיטה מלאה עם ממרח אבוקדו',
    ingredients: ['שיבולת שועל', 'בננה', 'קינמון', 'תפוח', 'הודו', 'עגבניות', 'תפוח אדמה', 'גזר', 'אבוקדו'],
    allergensPresent: ['גלוטן'],
  },
  {
    dayName: 'יום שני',
    breakfast: 'לחם מלא, גבינה לבנה 5%, חביתת ירק ורצועות מלפפון',
    morningSnack: 'אגס מתוק',
    lunch: 'פסטה בולונז בשר בקר טרי ועדשים אדומות עם סלט ירקות ישראלי',
    afternoonSnack: 'טחינה גולמית איכותית וסילאן על פרוסת לחם מלא',
    ingredients: ['לחם', 'גבינה', 'ביצים', 'מלפפון', 'אגס', 'בקר', 'עדשים', 'עגבניות', 'טחינה', 'שומשום', 'סילאן'],
    allergensPresent: ['חלב', 'ביצים', 'גלוטן', 'שומשום'],
  },
  {
    dayName: 'יום שלישי',
    breakfast: 'פנקייק גבינה עשיר בחלבון ויוגורט טבעי',
    morningSnack: 'פלחי מלון/קלמנטינה',
    lunch: 'חזה עוף מוקפץ עם אורז בסמטי מלא ואפונה ירוקה עדינה',
    afternoonSnack: 'עוגת גזר ביתית ללא סוכר מעובד',
    ingredients: ['גבינה', 'יוגורט', 'ביצים', 'עוף', 'אורז', 'אפונה', 'גזר'],
    allergensPresent: ['חלב', 'ביצים', 'גלוטן'],
  },
  {
    dayName: 'יום רביעי',
    breakfast: 'שקשוקה עדינה לילדים עם פיתה מקמח מלא וזיתים ללא חרצנים',
    morningSnack: 'בננות חתוכות',
    lunch: 'קדירת קציצות דג סלמון עשירות באומגה 3 וקוסקוס ירקות',
    afternoonSnack: 'פירות יבשים חתוכים (תמר מג\'הול) וקרקר כוסמין',
    ingredients: ['עגבניות', 'ביצים', 'פיתה', 'דג סלמון', 'קוסקוס', 'קישוא', 'תמר'],
    allergensPresent: ['ביצים', 'גלוטן', 'דגים'],
  },
  {
    dayName: 'יום חמישי',
    breakfast: 'כריכוני טונה עם מיונז ביתי דל שומן, עגבניות שרי וגמבה',
    morningSnack: 'רצועות פירות הדר',
    lunch: 'שניצל אפוי בתנור בציפוי פירורי לחם זהובים, מג\'דרה בורגול וסלט כרוב',
    afternoonSnack: 'כדורי תמרים ושיבולת שועל',
    ingredients: ['טונה', 'לחם', 'עגבניה', 'פלפל', 'עוף', 'פירורי לחם', 'בורגול', 'עדשים', 'תמר'],
    allergensPresent: ['דגים', 'גלוטן', 'ביצים'],
  },
  {
    dayName: 'יום שישי',
    breakfast: 'קבלת שבת: חלה טרייה, חומוס ביתי, סלט ירקות עשיר וטחינה',
    morningSnack: 'ענבים חצויים לאורכם (מניעת חנק)',
    lunch: 'ארוחת קלה וחלוקת עוגת שבת',
    afternoonSnack: 'פרי עונתי',
    ingredients: ['חלה', 'חומוס', 'טחינה', 'שומשום', 'ענבים'],
    allergensPresent: ['גלוטן', 'שומשום'],
  },
];

const initialSafetyChecks: SafetyCheckItem[] = [
  {
    id: 'sc-01',
    title: 'נעילת שער הכניסה ומנגנון מניעת בריחת פעוטות',
    category: 'DAILY',
    frequency: 'יומי (בוקר וצהריים)',
    description: 'בדיקה פיזית ששער הביטחון ננעל אוטומטית ובגובה תקני שאינו נגיש לפעוטות.',
    lastCheckedDate: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    inspectorName: 'רותם עירון',
  },
  {
    id: 'sc-02',
    title: 'סריקת חצר המשחקים מחפצים חדים, אבנים ולשלשת',
    category: 'DAILY',
    frequency: 'יומי (טרם יציאת ילדים לחצר)',
    description: 'בדיקת מתקני החצר, תקינות מזרני הגנה וניקיון ארגז החול.',
    lastCheckedDate: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    inspectorName: 'מורן דוד',
  },
  {
    id: 'sc-03',
    title: 'בדיקת מרחב מוגן (ממ"ד/מקלט) ולחצן מצוקה',
    category: 'DAILY',
    frequency: 'יומי',
    description: 'פתיחה מלאה של דלת הממ"ד, בדיקת תאורת חירום וסוללת גיבוי בלחצן מצוקה.',
    lastCheckedDate: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    inspectorName: 'רותם עירון',
  },
  {
    id: 'sc-04',
    title: 'תוקף מטפי כיבוי אש וספרינקלרים',
    category: 'MONTHLY',
    frequency: 'חודשי',
    description: 'בדיקת שעון לחץ במטף אבקה 6 ק"ג וחתימת בודק מוסמך בתוקף.',
    lastCheckedDate: '2026-10-15',
    status: 'PASSED',
    inspectorName: 'חברת ביטחון ואש',
  },
  {
    id: 'sc-05',
    title: 'מלאי ותוקף תרופות בתיק עזרה ראשונה ומזרק אפיפן',
    category: 'MONTHLY',
    frequency: 'חודשי',
    description: 'ספירת תחבושות סטריליות, מדחום, תמיסת חיטוי ותוקף מזרק אפיפן של איתי לוי.',
    lastCheckedDate: new Date().toISOString().split('T')[0],
    status: 'PASSED',
    inspectorName: 'אודליה נגר',
  },
];

const initialSettings: DaycareSettings = {
  id: 'settings-default',
  daycareName: 'מעון ילדים',
  licenseNumber: 'LIC-ARIEL-40700',
  businessType: 'OSEK_PATUR',
  businessTaxId: '028912345',
  directorName: 'הנהלת המעון',
  directorPhone: '052-870-7056',
  daycareAddress: 'רחוב הרקפת 12, אריאל (שומרון)',
  currentYearOsekPaturCeiling: 122000,
  vatRate: 0.17,
  hasMasterPassword: false,
  googleSyncEnabled: false,
};

/**
 * Initializes database with rich seed data if empty
 */
export async function seedDatabaseIfEmpty() {
  const childrenCount = await db.children.count();
  if (childrenCount > 0) return;

  console.log('Seeding initial daycare data...');

  const today = new Date().toISOString().split('T')[0];

  // Seed Children
  await db.children.bulkAdd(initialChildren);

  // Seed Staff
  await db.staff.bulkAdd(initialStaff);

  // Seed Menu
  await db.menu.bulkAdd(initialWeeklyMenu);

  // Seed Safety Checks
  await db.safetyChecks.bulkAdd(initialSafetyChecks);

  // Seed Settings
  await db.settings.add(initialSettings);

  // Seed Today's Attendance (8 present, 1 sick, 1 absent)
  const initialAttendance: DailyAttendance[] = [
    { id: 'att-01', date: today, childId: 'c-01', checkInTime: '07:45', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-02', date: today, childId: 'c-02', checkInTime: '08:00', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-03', date: today, childId: 'c-03', checkInTime: '08:15', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-04', date: today, childId: 'c-04', checkInTime: '07:50', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-05', date: today, childId: 'c-05', checkInTime: null, checkOutTime: null, status: 'SICK', notes: 'חום גבוה וצינון, הודעה מההורים', updatedAt: Date.now() },
    { id: 'att-06', date: today, childId: 'c-06', checkInTime: '08:20', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-07', date: today, childId: 'c-07', checkInTime: '08:05', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-08', date: today, childId: 'c-08', checkInTime: '08:10', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
    { id: 'att-09', date: today, childId: 'c-09', checkInTime: null, checkOutTime: null, status: 'ABSENT', notes: 'ביקור רופא משפחה', updatedAt: Date.now() },
    { id: 'att-10', date: today, childId: 'c-10', checkInTime: '07:55', checkOutTime: null, status: 'PRESENT', updatedAt: Date.now() },
  ];
  await db.attendance.bulkAdd(initialAttendance);

  // Seed Today's Staff Shifts (2 currently clocked in, 1 starting later)
  const initialShifts: StaffShift[] = [
    {
      id: 'sh-01',
      staffId: 's-01',
      date: today,
      clockIn: '07:30',
      clockOut: null,
      regularHours: 8.5,
      overtime125Hours: 0,
      overtime150Hours: 0,
      totalPay: 552.5,
      notes: 'משמרת פתיחה ומנהלת',
      updatedAt: Date.now(),
    },
    {
      id: 'sh-02',
      staffId: 's-02',
      date: today,
      clockIn: '07:45',
      clockOut: null,
      regularHours: 8,
      overtime125Hours: 0,
      overtime150Hours: 0,
      totalPay: 416,
      notes: 'גננת מובילה',
      updatedAt: Date.now(),
    },
  ];
  await db.shifts.bulkAdd(initialShifts);

  // Seed Financial Transactions (Income from tuition & typical daycare expenses)
  const initialTransactions: FinancialTransaction[] = [
    {
      id: 'tx-01',
      type: 'INCOME',
      category: 'TUITION',
      description: 'שכר לימוד חודש נובמבר - איתי לוי (כולל צהרון)',
      amount: 4600,
      vatAmount: 0,
      vatRate: 0,
      date: `${today.substring(0, 8)}01`,
      paymentMethod: 'BANK_TRANSFER',
      childId: 'c-01',
      childName: 'איתי לוי',
      referenceNumber: 'REC-2026-001',
      manualReceiptNumber: 'פנקס-1042',
      isReportedToAccountant: true,
      receiptIssuedDate: `${today.substring(0, 8)}01`,
      updatedAt: Date.now(),
    },
    {
      id: 'tx-02',
      type: 'INCOME',
      category: 'TUITION',
      description: 'שכר לימוד חודש נובמבר - מאיה כהן',
      amount: 4500,
      vatAmount: 0,
      vatRate: 0,
      date: `${today.substring(0, 8)}01`,
      paymentMethod: 'CHECK',
      childId: 'c-02',
      childName: 'מאיה כהן',
      referenceNumber: 'REC-2026-002',
      checkDetails: {
        checkNumber: '100482',
        bankName: 'בנק הפועלים',
        bankNumber: '12',
        branchNumber: '614',
        accountNumber: '482910',
        dueDate: `${today.substring(0, 8)}05`,
      },
      isReportedToAccountant: true,
      updatedAt: Date.now(),
    },
    {
      id: 'tx-03',
      type: 'INCOME',
      category: 'TUITION',
      description: 'שכר לימוד חודש נובמבר - נועם אזולאי (מקדמה)',
      amount: 2500,
      vatAmount: 0,
      vatRate: 0,
      date: `${today.substring(0, 8)}02`,
      paymentMethod: 'BIT',
      childId: 'c-03',
      childName: 'נועם אזולאי',
      referenceNumber: 'REC-2026-003',
      isReportedToAccountant: true,
      updatedAt: Date.now(),
    },
    {
      id: 'tx-04',
      type: 'INCOME',
      category: 'TUITION',
      description: 'שכר לימוד חודש נובמבר - אורי שפירא (מזומן מותר)',
      amount: 4100, // תקין לפי חוק המזומן (מתחת ל-6,000 ש"ח)
      vatAmount: 0,
      vatRate: 0,
      date: `${today.substring(0, 8)}02`,
      paymentMethod: 'CASH',
      childId: 'c-04',
      childName: 'אורי שפירא',
      referenceNumber: 'REC-2026-004',
      isReportedToAccountant: true,
      updatedAt: Date.now(),
    },
    {
      id: 'tx-05',
      type: 'EXPENSE',
      category: 'FOOD',
      description: 'רכש מזון שבועי, ירקות, בשר ומוצרי יסוד (רמי לוי)',
      amount: 1450,
      vatAmount: 210.68,
      vatRate: 0.17,
      date: `${today.substring(0, 8)}03`,
      paymentMethod: 'CREDIT_CARD',
      referenceNumber: 'INV-RL-9821',
      isReportedToAccountant: true,
      updatedAt: Date.now(),
    },
    {
      id: 'tx-06',
      type: 'EXPENSE',
      category: 'SUPPLIES',
      description: 'חומרי יצירה, צבעי גואש לא רעילים, חיתולים ומגבונים',
      amount: 620,
      vatAmount: 90.08,
      vatRate: 0.17,
      date: `${today.substring(0, 8)}04`,
      paymentMethod: 'CREDIT_CARD',
      referenceNumber: 'INV-CR-4512',
      isReportedToAccountant: true,
      updatedAt: Date.now(),
    },
    {
      id: 'tx-07',
      type: 'EXPENSE',
      category: 'INSURANCE',
      description: 'פוליסת ביטוח צד ג\' ותאונות אישיות מורחב לפעוטות מעון',
      amount: 980,
      vatAmount: 0,
      vatRate: 0,
      date: `${today.substring(0, 8)}01`,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'POL-HAR-7711',
      isReportedToAccountant: true,
      updatedAt: Date.now(),
    },
  ];

  await db.transactions.bulkAdd(initialTransactions);

  // Seed sample Daily Log for c-01
  const initialDailyLog: DailyActivityLog = {
    id: 'log-01',
    date: today,
    childId: 'c-01',
    napStart: '12:30',
    napEnd: '14:00',
    napDurationMinutes: 90,
    diaperChanges: [
      { time: '09:30', type: 'WET', notes: 'הוחלף כסדר' },
      { time: '12:15', type: 'DIRTY', notes: 'לפני שנת צהריים, נמרח קרם' },
      { time: '15:00', type: 'WET', notes: 'אחרי הקימה' },
    ],
    meals: [
      { mealName: 'ארוחת בוקר', amount: 'FULL', notes: 'אכל יפה מאוד דייסה ובננה' },
      { mealName: 'ארוחת צהריים', amount: 'FULL', notes: 'קציצות הודו ופירה בהנאה רבה' },
      { mealName: 'ארוחת מנחה', amount: 'HALF', notes: 'קרקר ואבוקדו' },
    ],
    mood: 'EXCELLENT',
    highlightActivities: 'בנה מגדל קוביות מרשים, נהנה בחצר ורקד במפגש בוקר עם המטפחת',
    specialNotes: 'מצב רוח נהדר, שתה הרבה מים',
    summaryText: 'היי רונית ויוסי! איתי עבר יום נפלא במעון 🌟 אכל נהדר את כל הארוחות, ישן שעה וחצי רצוף בצהריים ובנה מגדל קוביות מרהיב בחצר. נשמח לראותכם באיסוף! 🧸',
    updatedAt: Date.now(),
  };
  await db.dailyLogs.add(initialDailyLog);

  console.log('Database seeded successfully!');
}
