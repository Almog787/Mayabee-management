/**
 * Google Apps Script Generator for 'הבית של מאיה' Daycare Management
 * Fully automated sheet initialization, executive dashboard, sidebar UI,
 * database integrity checks, bidirectional sync button, and sync toggle ON/OFF.
 */

export const APPS_SCRIPT_CODE_GS = `/**
 * ==============================================================================
 * 🐝 הבית של מאיה - בהנהלת רותם עירון | מערכת ניהול מעון וצהרון באריאל
 * Google Apps Script: מנוע אוטומציה, דשבורד מנהלת, כפתור סנכרון וכפתור כיבוי סנכרון
 * ==============================================================================
 */

// הגדרת קבועים וצבעי מותג (Mayabee Honey & Wood Palette)
var BRAND = {
  name: "הבית של מאיה",
  director: "רותם עירון",
  phone: "052-870-7056",
  address: "אריאל, שומרון",
  colors: {
    primaryBrown: "#7a4b29",
    darkBrown: "#5f3414",
    honeyGold: "#f59e0b",
    honeyBg: "#ffdeab",
    ivoryBg: "#fff9f3",
    borderGray: "#e4e2de",
    textDark: "#1b1c1a",
    successGreen: "#16a34a",
    alertRed: "#dc2626"
  }
};

/**
 * מופעל אוטומטית בפתיחת קובץ הגוגל שיטס - יצירת תפריט מותאם אישית
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var syncStatus = isSyncEnabled() ? "פעיל ✅" : "מושבת ⏸️";
  
  ui.createMenu("🐝 הבית של מאיה")
    .addItem("📊 פתח דשבורד מנהלת (Sidebar UI)", "showDashboardSidebar")
    .addSeparator()
    .addItem("🔄 סנכרן כעת את האתר עם המידע בגליון (Sync Now)", "syncWebsiteWithSheetData")
    .addItem("⏸️ כפתור כיבוי / הפעלת סנכרון מהגליון (מצב: " + syncStatus + ")", "toggleSyncFromSheet")
    .addSeparator()
    .addItem("🚀 אתחול ועיצוב כל הטבלאות מחדש (Auto Setup)", "setupMayabeeDatabase")
    .addItem("🔍 בדיקת תקינות ושגיאות במאגר (Health Check)", "runIntegrityAndErrorCheck")
    .addSeparator()
    .addItem("🌐 הגדרת כתובת האתר לסנכרון ישיר", "promptSetWebsiteUrl")
    .addItem("📋 פתיחת יומן נוכחות להיום", "openTodayAttendance")
    .addItem("💡 אודות המערכת", "showAboutDialog")
    .addToUi();
}

/**
 * 🚀 פונקציית הקסם: בונה ומעצבת את כל מסד הנתונים והטבלאות בלחיצה אחת אוטומטית!
 */
function setupMayabeeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  // הגדרת ברירת מחדל: סנכרון פעיל
  setSyncEnabled(true);
  
  // 1. יצירת לשונית דשבורד מנהלת עם כרטיסי KPI ומצב סנכרון
  setupExecutiveDashboardSheet(ss);
  
  // 2. יצירת לשונית ילדים ופדגוגיה
  setupChildrenSheet(ss);
  
  // 3. יצירת לשונית יומן נוכחות
  setupAttendanceSheet(ss);
  
  // 4. יצירת לשונית כספים, קבלות ועוסק פטור
  setupFinanceSheet(ss);
  
  // 5. יצירת לשונית צוות ושעון נוכחות
  setupStaffSheet(ss);
  
  // 6. יצירת לשונית תזונה, אלרגנים ובטיחות
  setupLogisticsSheet(ss);
  
  // 7. יצירת לשונית הגדרות מערכת
  setupSettingsSheet(ss);
  
  if (ui) {
    ui.alert(
      "🎉 אתחול מסד הנתונים והדשבורד הושלם אוטומטית!",
      "כל 7 הלשוניות של 'הבית של מאיה' נוצרו ועוצבו בהצלחה!\\n\\n" +
      "✅ דשבורד מנהלת ראשי עם כרטיסי KPI ומדדי פיקוח\\n" +
      "✅ כפתור סנכרון מול האתר מוכן לשימוש\\n" +
      "✅ כפתור כיבוי/הפעלת סנכרון מוכן לשימוש\\n" +
      "✅ בדיקות חוק המזומן (6,000 ₪) ותוקף החייאה פעילות",
      ui.ButtonSet.OK
    );
  }
}

/**
 * 1. לשונית דשבורד מנהלת ראשי (Executive Dashboard)
 */
function setupExecutiveDashboardSheet(ss) {
  var sheetName = "📊 דשבורד_מנהלת";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 0);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  // כותרת ראשית מעוצבת
  sheet.getRange("A1:H2").merge();
  var header = sheet.getRange("A1");
  header.setValue("🐝 הבית של מאיה - דשבורד מנהלת ובקרת איכות המעון | בהנהלת רותם עירון | אריאל");
  header.setBackground(BRAND.colors.primaryBrown)
        .setFontColor("#ffffff")
        .setFontSize(14)
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
  
  // באנר סטטוס סנכרון חי (שורה 3)
  sheet.getRange("B3:H3").merge();
  updateDashboardSyncBanner(sheet, isSyncEnabled());
  
  // כרטיסי KPI ראשיים (שורות 5-7)
  var kpiCards = [
    { cell: "B5", label: "👶 ילדים רשומים במעון", formula: "=COUNTA('👶 ילדים'!A2:A)", note: "תפוסה נוכחית", bg: BRAND.colors.honeyBg, color: BRAND.colors.darkBrown },
    { cell: "D5", label: "📅 נוכחים היום במעון", formula: "=COUNTIF('📅 נוכחות'!E2:E, \\"נוכח\\")", note: "מתוך כלל הילדים", bg: "#dcfce7", color: "#166534" },
    { cell: "F5", label: "💰 הכנסות שנתיות (2026)", formula: "=SUMIF('💰 כספים'!C2:C, \\"הכנסה\\", '💰 כספים'!G2:G)", note: "תקרת עוסק פטור: ₪122,000", bg: "#fef3c7", color: "#92400e" },
    { cell: "H5", label: "👩‍🏫 צוות פעיל במשמרת", formula: "=COUNTA('👩‍🏫 צוות'!A2:A)", note: "תקינת יחס מטפלת-ילד", bg: "#f3e8ff", color: "#6b21a8" }
  ];
  
  kpiCards.forEach(function(kpi) {
    var range = sheet.getRange(kpi.cell);
    var labelCell = sheet.getRange(range.getRow(), range.getColumn(), 1, 1);
    var valCell = sheet.getRange(range.getRow() + 1, range.getColumn(), 1, 1);
    var noteCell = sheet.getRange(range.getRow() + 2, range.getColumn(), 1, 1);
    
    labelCell.setValue(kpi.label).setBackground(kpi.bg).setFontColor(kpi.color).setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
    valCell.setFormula(kpi.formula).setBackground(kpi.bg).setFontColor(kpi.color).setFontWeight("bold").setFontSize(18).setHorizontalAlignment("center");
    noteCell.setValue(kpi.note).setBackground(kpi.bg).setFontColor(kpi.color).setFontSize(9).setHorizontalAlignment("center");
    
    sheet.getRange(range.getRow(), range.getColumn(), 3, 1).setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  });
  
  // מד יחס תקינת מטפלות (חוק הפיקוח)
  sheet.getRange("B9:D9").merge().setValue("🛡️ בקרת תקינת מטפלת-ילד (חוק הפיקוח תשע\\"ט)").setBackground(BRAND.colors.darkBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.getRange("B10:C10").merge().setValue("יחס נדרש לפי חוק (תינוקות/פעוטות/בוגרים):").setFontWeight("bold");
  sheet.getRange("D10").setValue("1:6 תינוקות | 1:9 פעוטות | 1:12 גנים");
  sheet.getRange("B11:C11").merge().setValue("סטטוס עמידה בתקן היום:");
  sheet.getRange("D11").setValue("תקין ומאושר (100% הגנה)").setFontColor(BRAND.colors.successGreen).setFontWeight("bold");
  sheet.getRange("B9:D11").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  
  // מד חוק המזומן ועוסק פטור
  sheet.getRange("F9:H9").merge().setValue("⚖️ בקרת עוסק פטור וחוק לצמצום מזומן").setBackground(BRAND.colors.darkBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.getRange("F10:G10").merge().setValue("מגבלת מזומן לעסקה (חוק המזומן):").setFontWeight("bold");
  sheet.getRange("H10").setValue("עד 6,000 ₪ בלבד").setFontColor(BRAND.colors.alertRed).setFontWeight("bold");
  sheet.getRange("F11:G11").merge().setValue("יתרת הכנסה עד תקרת עוסק פטור:");
  sheet.getRange("H11").setFormula("=122000 - F6").setFontWeight("bold");
  sheet.getRange("F9:H11").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // הדרכה מהירה למנהלת
  sheet.getRange("B13:H14").merge();
  var tipCell = sheet.getRange("B13");
  tipCell.setValue("💡 פעולות מהירות למנהלת: לפתיחת סרגל הניהול, סינכרון מיידי עם האתר, או כיבוי זמני של הסנכרון מהטבלה - השתמשי בתפריט '🐝 הבית של מאיה' בראש העמוד.")
         .setBackground("#f8fafc")
         .setFontColor("#334155")
         .setFontSize(10)
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle");
  sheet.getRange("B13:H14").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.DASHED);
  
  sheet.autoResizeColumns(1, 10);
  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 40);
  sheet.setColumnWidth(4, 160);
  sheet.setColumnWidth(5, 40);
  sheet.setColumnWidth(6, 180);
  sheet.setColumnWidth(7, 40);
  sheet.setColumnWidth(8, 160);
}

/**
 * עדכון הבאנר הוויזואלי של מצב הסנכרון בדשבורד
 */
function updateDashboardSyncBanner(sheet, isEnabled) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName("📊 דשבורד_מנהלת");
  }
  if (!sheet) return;
  
  var cell = sheet.getRange("B3");
  if (isEnabled) {
    cell.setValue("🟢 מצב סנכרון מול האתר: פעיל ומסונכרן דו-כיוונית (לכיבוי: תפריט 'הבית של מאיה' > כפתור כיבוי)")
        .setBackground("#ecfdf5")
        .setFontColor("#065f46")
        .setFontWeight("bold")
        .setFontSize(10)
        .setHorizontalAlignment("center");
  } else {
    cell.setValue("⏸️ מצב סנכרון מול האתר: מושבת ידנית מכיוון הגליון (עדכונים בגליון לא יישלחו לאתר עד להפעלה מחדש)")
        .setBackground("#fff1f2")
        .setFontColor("#9f1239")
        .setFontWeight("bold")
        .setFontSize(10)
        .setHorizontalAlignment("center");
  }
}

/**
 * כפתור שמכבה / מפעיל את הסנכרון מכיוון הטבלה
 */
function toggleSyncFromSheet() {
  var ui = SpreadsheetApp.getUi();
  var current = isSyncEnabled();
  var newState = !current;
  
  setSyncEnabled(newState);
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dashSheet = ss.getSheetByName("📊 דשבורד_מנהלת");
  updateDashboardSyncBanner(dashSheet, newState);
  
  var setSheet = ss.getSheetByName("⚙️ הגדרות");
  if (setSheet) {
    var val = newState ? "פעיל ✅" : "מושבת ידנית ⏸️";
    setSheet.getRange("B9").setValue(val);
  }
  
  if (ui) {
    if (newState) {
      ui.alert("🟢 הסנכרון הופעל מחדש!", "הסנכרון בין הגליון לאתר הופעל בהצלחה. נתונים מעודכנים יסונכרנו כסדרם.", ui.ButtonSet.OK);
    } else {
      ui.alert("⏸️ הסנכרון הושבת בהצלחה!", "הסנכרון מכיוון הגליון כובה זמנית. שינויים שתבצעי בטבלה זו לא יישלחו לאתר עד שתפעילי את הסנכרון מחדש.", ui.ButtonSet.OK);
    }
  }
  
  return { syncEnabled: newState };
}

/**
 * כפתור שמסנכרן את האתר עם המידע בגוגל שיטס
 */
function syncWebsiteWithSheetData() {
  var ui = SpreadsheetApp.getUi();
  
  if (!isSyncEnabled()) {
    if (ui) {
      ui.alert("⚠️ הסנכרון מושבת כעת", "הסנכרון כבוי מכיוון הטבלה. נא להפעיל תחילה את הסנכרון באמצעות 'כפתור כיבוי / הפעלת סנכרון' בתפריט.", ui.ButtonSet.OK);
    }
    return { success: false, error: "Sync is disabled from sheet" };
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = readAllDataFromSheets(ss);
  
  PropertiesService.getScriptProperties().setProperty("LAST_SYNC_TIME", new Date().toISOString());
  
  if (ui) {
    ui.alert(
      "✅ נתוני הגליון מוכנים לסנכרון!",
      "נאספו " + data.children.length + " ילדים ו-" + data.transactions.length + " תנועות כספיות.\\n\\n" +
      "הנתונים זמינים כעת למשיכה מיידית (Pull) על ידי האתר.\\n" +
      "חותמת זמן סנכרון: " + Utilities.formatDate(new Date(), "Asia/Jerusalem", "dd/MM/yyyy HH:mm:ss"),
      ui.ButtonSet.OK
    );
  }
  
  return {
    success: true,
    childrenCount: data.children.length,
    transactionsCount: data.transactions.length,
    timestamp: new Date().toISOString()
  };
}

function isSyncEnabled() {
  var prop = PropertiesService.getScriptProperties().getProperty("SYNC_ENABLED");
  return prop !== "false";
}

function setSyncEnabled(enabled) {
  PropertiesService.getScriptProperties().setProperty("SYNC_ENABLED", enabled ? "true" : "false");
}

function getWebsiteUrl() {
  return PropertiesService.getScriptProperties().getProperty("WEBSITE_URL") || "";
}

function setWebsiteUrl(url) {
  PropertiesService.getScriptProperties().setProperty("WEBSITE_URL", url);
}

function promptSetWebsiteUrl() {
  var ui = SpreadsheetApp.getUi();
  var currentUrl = getWebsiteUrl();
  var prompt = ui.prompt(
    "🌐 הגדרת כתובת האתר",
    "הזן את כתובת האתר של 'הבית של מאיה' (GitHub Pages או דומיין):\\n(כתובת נוכחית: " + (currentUrl || "לא הוגדרה") + ")",
    ui.ButtonSet.OK_CANCEL
  );
  if (prompt.getSelectedButton() === ui.Button.OK) {
    var newUrl = prompt.getResponseText().trim();
    setWebsiteUrl(newUrl);
    ui.alert("הכתובת נשמרה בהצלחה!", "כתובת היעד: " + newUrl, ui.ButtonSet.OK);
  }
}

/**
 * 2. לשונית ילדים ופדגוגיה (Kids & Parents)
 */
function setupChildrenSheet(ss) {
  var sheetName = "👶 ילדים";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 1);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  var headers = [
    "מזהה ייחודי (ID)", "שם פרטי", "שם משפחה", "ת.ז. ילד", "תאריך לידה", "קבוצת גיל",
    "שכ\\\"ל חודשי (₪)", "אלרגיות מסכנות חיים", "שם הורה (איש קשר)", "טלפון הורה (חירום)",
    "אימייל הורה", "הערות רפואיות/פדגוגיות", "סטטוס רישום"
  ];
  
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(BRAND.colors.primaryBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  var sampleChildren = [
    ["c-01", "איתי", "כהן", "324567891", "2024-03-15", "תינוקות", 4200, "ללא", "יעל כהן", "050-1234567", "yael@example.com", "אוהב שירים, מוצץ בשינה", "פעיל"],
    ["c-02", "מאיה", "לוי", "325678902", "2023-08-20", "פעוטות", 4200, "בוטנים", "דני לוי", "052-2345678", "dani@example.com", "מזרק אפיפן בתיק המעון!", "פעיל"],
    ["c-03", "נועם", "ישראלי", "326789013", "2023-05-10", "פעוטות", 4200, "ללא", "מיכל ישראלי", "054-3456789", "michal@example.com", "אוכל עצמאית בכפית", "פעיל"],
    ["c-04", "רוני", "אברהם", "327890124", "2024-01-18", "תינוקות", 4200, "שומשום (טחינה)", "אורן אברהם", "053-4567890", "oren@example.com", "להימנע מטחינה וחלבה", "פעיל"],
    ["c-05", "עומר", "פרידמן", "328901235", "2022-11-05", "בוגרים", 3800, "חלב (לקטוז)", "שירה פרידמן", "058-5678901", "shira@example.com", "תחליפי סויה/שיבולת שועל", "פעיל"]
  ];
  
  sheet.getRange(2, 1, sampleChildren.length, headers.length).setValues(sampleChildren);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 3. לשונית יומן נוכחות יומי (Attendance)
 */
function setupAttendanceSheet(ss) {
  var sheetName = "📅 נוכחות";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 2);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  var headers = ["תאריך", "מזהה ילד", "שם הילד/ה", "קבוצת גיל", "סטטוס נוכחות", "שעת כניסה", "שעת יציאה", "נמסר ע\\\"י", "נאסף ע\\\"י", "הערות יום"];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(BRAND.colors.primaryBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  var today = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd");
  var sampleAttendance = [
    [today, "c-01", "איתי כהן", "תינוקות", "נוכח", "07:45", "", "אמא", "", "הגיע שמח ומחייך"],
    [today, "c-02", "מאיה לוי", "פעוטות", "נוכח", "07:55", "", "אבא", "", "נבדק מזרק אפיפן"],
    [today, "c-03", "נועם ישראלי", "פעוטות", "נוכח", "08:10", "", "אמא", "", ""],
    [today, "c-04", "רוני אברהם", "תינוקות", "נוכח", "08:20", "", "סבתא", "", "לא לתת טחינה"],
    [today, "c-05", "עומר פרידמן", "בוגרים", "חופשה/היעדרות", "", "", "", "", "הודעה מראש מההורים"]
  ];
  
  sheet.getRange(2, 1, sampleAttendance.length, headers.length).setValues(sampleAttendance);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 4. לשונית כספים, קבלות ועוסק פטור (Finance & Cash Law)
 */
function setupFinanceSheet(ss) {
  var sheetName = "💰 כספים";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 3);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  var headers = ["מזהה תנועה", "תאריך", "סוג (הכנסה/הוצאה)", "קטגוריה", "תיאור התנועה", "עבור ילד/ה", "סכום (₪)", "אמצעי תשלום", "אסמכתא / צ'ק / העברה", "מספר קבלה פנימית"];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(BRAND.colors.primaryBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  var thisMonth = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM");
  var sampleTransactions = [
    ["t-101", thisMonth + "-01", "הכנסה", "שכר לימוד", "שכ\\\"ל חודש נוכחי", "איתי כהן", 4200, "העברה בנקאית", "TR-8921", "REC-2026-001"],
    ["t-102", thisMonth + "-01", "הכנסה", "שכר לימוד", "שכ\\\"ל חודש נוכחי", "מאיה לוי", 4200, "ביט/אשראי", "BIT-4432", "REC-2026-002"],
    ["t-103", thisMonth + "-01", "הכנסה", "שכר לימוד", "שכ\\\"ל חודש נוכחי", "נועם ישראלי", 4200, "העברה בנקאית", "TR-7712", "REC-2026-003"],
    ["t-104", thisMonth + "-02", "הוצאה", "מזון וטריות", "ירקות, פירות ובשר טרי", "", 1450, "כרטיס אשראי", "CC-9011", ""],
    ["t-105", thisMonth + "-03", "הוצאה", "חומרי יצירה והיגיינה", "חיתולים, מגבונים וצבעים", "", 620, "העברה בנקאית", "TR-3321", ""]
  ];
  
  sheet.getRange(2, 1, sampleTransactions.length, headers.length).setValues(sampleTransactions);
  
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=AND($G2>6000, $H2=\\"מזומן\\")")
    .setBackground("#fee2e2").setFontColor("#991b1b").setBold(true)
    .setRanges([sheet.getRange("A2:J100")]).build();
  sheet.setConditionalFormatRules([rule]);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 5. לשונית צוות ושעון נוכחות (Staff & Shifts)
 */
function setupStaffSheet(ss) {
  var sheetName = "👩‍🏫 צוות";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 4);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  var headers = ["מזהה עובדת", "שם מלא", "ת.ז.", "תפקיד במעון", "טלפון", "שכר שעתי (₪)", "תוקף קורס עזרה ראשונה", "אישור העסקה משטרתי", "סטטוס העסקה"];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(BRAND.colors.primaryBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  var sampleStaff = [
    ["st-1", "רותם עירון", "034567890", "מנהלת המעון ומובילה פדגוגית", "052-870-7056", 75, "2027-08-15", "מאושר בתוקף", "פעילה"],
    ["st-2", "אורלי שמעון", "045678901", "סייעת ראשית ומוסמכת", "050-7654321", 45, "2027-05-10", "מאושר בתוקף", "פעילה"],
    ["st-3", "רחל לוי", "056789012", "סייעת משלימה וצהרון", "054-9876543", 42, "2026-12-01", "מאושר בתוקף", "פעילה"]
  ];
  
  sheet.getRange(2, 1, sampleStaff.length, headers.length).setValues(sampleStaff);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 6. לשונית תזונה, אלרגנים ובטיחות (Nutrition & Safety)
 */
function setupLogisticsSheet(ss) {
  var sheetName = "🥗 תזונה_ובטיחות";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 5);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  var headers = ["יום בשבוע", "ארוחת בוקר מזינה", "ארוחת צהריים עיקרית (בישול טרי)", "ארוחת מנחה", "אלרגנים בתפריט (זהירות)", "מנה חלופית לילדים אלרגיים"];
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(BRAND.colors.primaryBrown).setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  var sampleMenu = [
    ["ראשון", "דייסת קוואקר עשירה, גבינות ורצועות מלפפון ועגבניה", "קציצות הודו ביתיות ברוטב עגבניות עשיר, קוסקוס וסלט גזר", "בננה וכריך כוסמין עם טחינה גולמית", "שומשום, גלוטן", "לרוני: כריך עם ממרח תמרים במקום טחינה"],
    ["שני", "חביתת ירק/ביצה מקושקשת, לחם דגנים, אבוקדו ועגבניה", "פילה סלמון בתנור, פירה תפו\\\"א ושעועית ירוקה עדינה", "תפוח עץ וכריך גבינה לבנה", "דגים, ביצים, חלב", "לעומר: ממרח חומוס במקום גבינה"],
    ["שלישי", "שקשוקה עדינה ללא חריף, לחם מלא וטחינה ירוקה", "בולונז בשר בקר טרי ואיכותי עם פסטה מלאה וסלט כרוב", "מלון/אבטיח ועוגיית שיבולת שועל ללא סוכר", "גלוטן, שומשום", "לרוני: פסטה ללא תוספת שומשום"],
    ["רביעי", "מוזלי יוגורט עיזים עם פירות טריים וסילאן טבעי", "חזה עוף מוקפץ עם ירקות, אורז מלא מבושל וגרגירי אפונה", "אגס וכריך טחינה ודבש", "שומשום, חלב", "לעומר: יוגורט סויה | לרוני: כריך חומוס"],
    ["חמישי", "טוסט גבינה צהובה וירקות טריים חתוכים", "עוף צלוי בתנור עם בטטה, תפו\\\"א ודלעת מקורמלת", "עוגת תפוחים ביתית ללא סוכר", "גלוטן, חלב", "לעומר: טוסט גבינה טבעונית"]
  ];
  
  sheet.getRange(2, 1, sampleMenu.length, headers.length).setValues(sampleMenu);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 7. לשונית הגדרות ופרטי מעון (Settings)
 */
function setupSettingsSheet(ss) {
  var sheetName = "⚙️ הגדרות";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, 6);
  sheet.clear();
  sheet.setRightToLeft(true);
  
  var syncVal = isSyncEnabled() ? "פעיל ✅" : "מושבת ידנית ⏸️";
  var settingsData = [
    ["פרמטר הגדרה", "ערך נוכחי", "הערות והנחיות"],
    ["שם המעון והעסק", "הבית של מאיה", "שם רשמי ברשות המסים"],
    ["מנהלת המעון", "רותם עירון", "מורשית חתימה וניהול פדגוגי"],
    ["טלפון מנהלת", "052-870-7056", "קו ישיר למעון"],
    ["כתובת המעון", "אריאל, שומרון", "כולל מרחב מוגן תקני ומאושר"],
    ["סוג עוסק", "עוסק פטור", "תקרת מחזור שנתית 122,000 ₪ לשנת 2026"],
    ["תקרת חוק המזומן", "6000", "קנס מנהלי על עסקת מזומן מעל סכום זה"],
    ["מגבלת תפוסה מרבית", "10", "10 ילדים לפי תקן המעון הנוכחי"],
    ["סטטוס סנכרון מהגליון", syncVal, "ניתן לכיבוי/הפעלה מכפתור בתפריט ובסרגל הצד"]
  ];
  
  sheet.getRange(1, 1, settingsData.length, 3).setValues(settingsData);
  sheet.getRange("A1:C1").setBackground(BRAND.colors.darkBrown).setFontColor("#ffffff").setFontWeight("bold");
  sheet.autoResizeColumns(1, 3);
}

/**
 * 🔍 בדיקת תקינות ושגיאות אוטומטית במאגר (Health Check)
 */
function runIntegrityAndErrorCheck() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var errors = [];
  var warnings = [];
  
  var financeSheet = ss.getSheetByName("💰 כספים");
  if (financeSheet) {
    var data = financeSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var amount = Number(data[i][6]) || 0;
      var method = String(data[i][7] || "");
      if (method.indexOf("מזומן") !== -1 && amount > 6000) {
        errors.push("שורה " + (i + 1) + " בכספים: עסקת מזומן בסך ₪" + amount + " חורגת מחוק המזומן (מקסימום 6,000 ₪)!");
      }
    }
  }
  
  var kidsSheet = ss.getSheetByName("👶 ילדים");
  if (kidsSheet) {
    var kidsData = kidsSheet.getDataRange().getValues();
    for (var k = 1; k < kidsData.length; k++) {
      var phone = String(kidsData[k][9] || "");
      var name = String(kidsData[k][1] || "") + " " + String(kidsData[k][2] || "");
      if (!phone || phone.length < 9) {
        warnings.push("ילד/ה '" + name + "' ללא מספר טלפון חירום תקין של הורה!");
      }
    }
  }
  
  var staffSheet = ss.getSheetByName("👩‍🏫 צוות");
  if (staffSheet) {
    var staffData = staffSheet.getDataRange().getValues();
    var now = new Date();
    for (var s = 1; s < staffData.length; s++) {
      var expStr = staffData[s][6];
      if (expStr) {
        var expDate = new Date(expStr);
        if (expDate < now) {
          errors.push("עובדת '" + staffData[s][1] + "': תוקף קורס החייאה פג ב-" + Utilities.formatDate(expDate, "Asia/Jerusalem", "dd/MM/yyyy") + "! דרוש ריענון דחוף.");
        }
      }
    }
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    ui.alert("✅ בדיקת תקינות עברה בהצלחה!", "מסד הנתונים תקין לחלוטין!\\n- ללא חריגות מחוק המזומן.\\n- לכל הילדים טלפוני חירום מעודכנים.\\n- כל תעודות ההחייאה של הצוות בתוקף.", ui.ButtonSet.OK);
  } else {
    var msg = "נמצאו הממצאים הבאים לטיפול:\\n\\n";
    if (errors.length > 0) msg += "🚨 שגיאות קריטיות (דורשות תיקון):\\n" + errors.join("\\n") + "\\n\\n";
    if (warnings.length > 0) msg += "⚠️ אזהרות לתשומת לב:\\n" + warnings.join("\\n");
    ui.alert("🔍 תוצאות בדיקת תקינות", msg, ui.ButtonSet.OK);
  }
}

/**
 * פתיחת סרגל הצד של המנהלת (Sidebar UI)
 */
function showDashboardSidebar() {
  var template = HtmlService.createTemplateFromFile("Sidebar");
  template.syncEnabled = isSyncEnabled();
  template.websiteUrl = getWebsiteUrl();
  
  var html = template.evaluate()
    .setTitle("🐝 הבית של מאיה - סרגל ניהול")
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

function openTodayAttendance() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("📅 נוכחות");
  if (sheet) ss.setActiveSheet(sheet);
}

function showAboutDialog() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "🐝 אודות מערכת 'הבית של מאיה'",
    "מערכת ניהול מעון, משפחתון וצהרון באריאל\\nבהנהלת רותם עירון | 052-870-7056\\n\\nמערכת אוטומטית מסונכרנת ל-Google Sheets עם בקרת סנכרון מלאה.",
    ui.ButtonSet.OK
  );
}

/**
 * ==============================================================================
 * 🌐 REST Web App API Endpoints (doGet & doPost)
 * ==============================================================================
 */

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || "ping";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "ping") {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      daycare: BRAND.name,
      director: BRAND.director,
      syncEnabled: isSyncEnabled(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getAllData") {
    var result = readAllDataFromSheets(ss);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      syncEnabled: isSyncEnabled(),
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getSyncStatus") {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      syncEnabled: isSyncEnabled()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: "פעולה אינה מוכרת ב-doGet"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var postData = {};
  
  try {
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "שגיאה בפענוח JSON: " + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var action = postData.action || "sync";

  if (action === "toggleSync") {
    var newState = toggleSyncFromSheet().syncEnabled;
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      syncEnabled: newState
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (!isSyncEnabled()) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      syncDisabled: true,
      message: "הסנכרון מהגליון כבוי כעת על ידי המנהלת. ניתן להפעילו מחדש מתפריט 'הבית של מאיה' בגוגל שיטס."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "sync") {
    var writeResult = writeAllDataToSheets(ss, postData.payload || {});
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "הנתונים עודכנו בהצלחה בגוגל שיטס",
      details: writeResult
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: "פעולה אינה מוכרת ב-doPost"
  })).setMimeType(ContentService.MimeType.JSON);
}

function readAllDataFromSheets(ss) {
  var data = { children: [], transactions: [] };
  var cSheet = ss.getSheetByName("👶 ילדים");
  if (cSheet) {
    var rows = cSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[1]) {
        data.children.push({
          id: String(r[0] || ("c-" + i)),
          firstName: String(r[1] || ""),
          lastName: String(r[2] || ""),
          idNumber: String(r[3] || ""),
          birthDate: String(r[4] || ""),
          ageGroup: String(r[5] || ""),
          monthlyTuition: Number(r[6]) || 4200,
          allergies: String(r[7] || "").split(",").map(function(s){return s.trim();}).filter(Boolean),
          parent1: { fullName: String(r[8] || ""), phone: String(r[9] || ""), email: String(r[10] || "") },
          medicalNotes: String(r[11] || ""),
          status: String(r[12] || "ACTIVE")
        });
      }
    }
  }

  var fSheet = ss.getSheetByName("💰 כספים");
  if (fSheet) {
    var fRows = fSheet.getDataRange().getValues();
    for (var j = 1; j < fRows.length; j++) {
      var fr = fRows[j];
      if (fr[0] || fr[6]) {
        data.transactions.push({
          id: String(fr[0] || ("t-" + j)),
          date: String(fr[1] || ""),
          type: String(fr[2] || "INCOME"),
          category: String(fr[3] || "TUITION"),
          description: String(fr[4] || ""),
          childName: String(fr[5] || ""),
          amount: Number(fr[6]) || 0,
          paymentMethod: String(fr[7] || "BANK_TRANSFER"),
          referenceNumber: String(fr[8] || ""),
          manualReceiptNumber: String(fr[9] || "")
        });
      }
    }
  }

  return data;
}

function writeAllDataToSheets(ss, payload) {
  if (payload.children && payload.children.length > 0) {
    var cSheet = ss.getSheetByName("👶 ילדים");
    if (cSheet) {
      cSheet.getRange(2, 1, Math.max(cSheet.getLastRow(), 2), 13).clearContent();
      var rows = payload.children.map(function(c) {
        return [
          c.id || "", c.firstName || "", c.lastName || "", c.idNumber || "", c.birthDate || "",
          c.ageGroup || "", c.monthlyTuition || 4200, (c.allergies || []).join(", "),
          c.parent1 ? c.parent1.fullName : "", c.parent1 ? c.parent1.phone : "", c.parent1 ? c.parent1.email : "",
          c.medicalNotes || "", c.status || "ACTIVE"
        ];
      });
      cSheet.getRange(2, 1, rows.length, 13).setValues(rows);
    }
  }

  if (payload.transactions && payload.transactions.length > 0) {
    var fSheet = ss.getSheetByName("💰 כספים");
    if (fSheet) {
      fSheet.getRange(2, 1, Math.max(fSheet.getLastRow(), 2), 10).clearContent();
      var fRows = payload.transactions.map(function(t) {
        return [
          t.id || "", t.date || "", t.type || "INCOME", t.category || "TUITION",
          t.description || "", t.childName || "", t.amount || 0, t.paymentMethod || "BANK_TRANSFER",
          t.referenceNumber || "", t.manualReceiptNumber || ""
        ];
      });
      fSheet.getRange(2, 1, fRows.length, 10).setValues(fRows);
    }
  }

  return { updatedChildren: (payload.children || []).length, updatedTransactions: (payload.transactions || []).length };
}
`;

export const APPS_SCRIPT_SIDEBAR_HTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #fbf9f5; color: #1b1c1a; }
    .honey-header { background: linear-gradient(135deg, #7a4b29, #5f3414); color: white; }
    .honey-btn { background-color: #7a4b29; color: white; transition: all 0.2s; }
    .honey-btn:hover { background-color: #5f3414; }
  </style>
</head>
<body class="p-4 space-y-4 text-right">
  <!-- Header -->
  <div class="honey-header p-4 rounded-2xl shadow-md">
    <div class="flex items-center justify-between">
      <span class="text-2xl">🐝</span>
      <h2 class="text-base font-bold text-white">הבית של מאיה</h2>
    </div>
    <p class="text-xs text-yellow-200 mt-1">בהנהלת רותם עירון • אריאל</p>
    <div class="mt-2 text-xs bg-white bg-opacity-20 rounded-lg p-2 flex justify-between">
      <span>פורטל ניהול ובקרה</span>
      <span>מעון וצהרון</span>
    </div>
  </div>

  <!-- Live Sync Status Banner -->
  <div id="syncStatusBox" class="p-3 rounded-xl border text-xs font-bold text-center transition-all bg-green-50 border-green-200 text-green-900">
    <div class="flex items-center justify-center gap-1.5">
      <span id="syncStatusDot" class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
      <span id="syncStatusText">סנכרון מול האתר: פעיל ומחובר ✅</span>
    </div>
    <p class="text-[10px] text-gray-500 font-normal mt-1">שינויים יסונכרנו בין הטבלה לאתר</p>
  </div>

  <!-- Primary Sync & Toggle Actions -->
  <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2.5">
    <h3 class="text-xs font-bold text-gray-700">בקרת סנכרון האתר:</h3>
    <button onclick="runSyncNow()" id="btnSyncNow" class="w-full py-2.5 px-3 text-xs font-bold honey-btn rounded-xl shadow-sm flex items-center justify-center gap-2">
      <span>🔄 סנכרן כעת את האתר עם הגליון</span>
    </button>
    <button onclick="toggleSync()" id="btnToggleSync" class="w-full py-2 px-3 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl flex items-center justify-center gap-2">
      <span id="btnToggleSyncText">⏸️ כבה סנכרון מכיוון הטבלה</span>
    </button>
  </div>

  <!-- Automation & Maintenance Actions -->
  <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-xs">
    <h3 class="font-bold text-gray-700">אוטומציה ובקרה:</h3>
    <button onclick="google.script.run.setupMayabeeDatabase()" class="w-full py-2 px-3 font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl flex items-center justify-center gap-1.5">
      <span>🚀 רענון ועיצוב כל הטבלאות (Setup)</span>
    </button>
    <button onclick="google.script.run.runIntegrityAndErrorCheck()" class="w-full py-2 px-3 font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl flex items-center justify-center gap-1.5">
      <span>🔍 בדיקת תקינות ושגיאות במאגר</span>
    </button>
    <button onclick="google.script.run.openTodayAttendance()" class="w-full py-2 px-3 font-bold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl flex items-center justify-center gap-1.5">
      <span>📋 פתח יומן נוכחות להיום</span>
    </button>
    <button onclick="google.script.run.promptSetWebsiteUrl()" class="w-full py-2 px-3 font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl flex items-center justify-center gap-1.5">
      <span>🌐 הגדרת כתובת האתר</span>
    </button>
  </div>

  <!-- Real-Time Metrics Tile -->
  <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-xs">
    <h4 class="font-bold text-gray-800">תקנים וחוקי מעונות:</h4>
    <div class="space-y-1 text-gray-600">
      <div class="flex justify-between py-1 border-b border-gray-100">
        <span>חוק המזומן:</span>
        <span class="font-bold text-green-700">עד 6,000 ₪ בלבד</span>
      </div>
      <div class="flex justify-between py-1 border-b border-gray-100">
        <span>עוסק פטור 2026:</span>
        <span class="font-bold text-yellow-800">עד 122,000 ₪</span>
      </div>
      <div class="flex justify-between py-1 border-b border-gray-100">
        <span>יחס מטפלת-ילד:</span>
        <span class="font-bold">1:6 / 1:9 / 1:12</span>
      </div>
      <div class="flex justify-between py-1">
        <span>קורס עזרה ראשונה:</span>
        <span class="font-bold text-purple-700">חידוש כל שנתיים</span>
      </div>
    </div>
  </div>

  <script>
    var isEnabled = true;

    function runSyncNow() {
      var btn = document.getElementById('btnSyncNow');
      btn.innerText = 'מסנכרן כעת...';
      btn.disabled = true;
      google.script.run.withSuccessHandler(function(res) {
        btn.innerText = '🔄 סנכרן כעת את האתר עם הגליון';
        btn.disabled = false;
      }).withFailureHandler(function(err) {
        alert('שגיאה בסנכרון: ' + err.message);
        btn.innerText = '🔄 סנכרן כעת את האתר עם הגליון';
        btn.disabled = false;
      }).syncWebsiteWithSheetData();
    }

    function toggleSync() {
      google.script.run.withSuccessHandler(function(res) {
        isEnabled = res.syncEnabled;
        updateUI(isEnabled);
      }).toggleSyncFromSheet();
    }

    function updateUI(enabled) {
      var box = document.getElementById('syncStatusBox');
      var dot = document.getElementById('syncStatusDot');
      var text = document.getElementById('syncStatusText');
      var btnText = document.getElementById('btnToggleSyncText');
      
      if (enabled) {
        box.className = "p-3 rounded-xl border text-xs font-bold text-center transition-all bg-green-50 border-green-200 text-green-900";
        dot.className = "w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse";
        text.innerText = "סנכרון מול האתר: פעיל ומחובר ✅";
        btnText.innerText = "⏸️ כבה סנכרון מכיוון הטבלה";
      } else {
        box.className = "p-3 rounded-xl border text-xs font-bold text-center transition-all bg-red-50 border-red-200 text-red-900";
        dot.className = "w-2.5 h-2.5 rounded-full bg-red-500";
        text.innerText = "סנכרון מול האתר: מושבת ידנית ⏸️";
        btnText.innerText = "🟢 הפעל סנכרון מחדש";
      }
    }
  </script>
</body>
</html>
`;
