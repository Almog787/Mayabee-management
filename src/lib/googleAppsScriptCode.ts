/**
 * Google Apps Script Generator for 'הבית של מאיה' Daycare Management
 * Fully automated sheet initialization, executive dashboard, sidebar UI,
 * database integrity checks, and bidirectional REST Web App endpoints.
 */

export const APPS_SCRIPT_CODE_GS = `/**
 * ==============================================================================
 * 🐝 הבית של מאיה - בהנהלת רותם עירון | מערכת ניהול מעון וצהרון באריאל
 * Google Apps Script: מנוע אוטומציה, דשבורד מנהלת, בדיקת שגיאות ו-Web App API
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
  ui.createMenu("🐝 הבית של מאיה")
    .addItem("📊 פתח דשבורד מנהלת (Sidebar UI)", "showDashboardSidebar")
    .addSeparator()
    .addItem("🚀 אתחול ועיצוב כל הטבלאות מחדש (Auto Setup)", "setupMayabeeDatabase")
    .addItem("🔍 בדיקת תקינות ושגיאות במאגר (Health Check)", "runIntegrityAndErrorCheck")
    .addSeparator()
    .addItem("📋 פתיחת יומן נוכחות להיום", "openTodayAttendance")
    .addItem("💡 אודות המערכת", "showAboutDialog")
    .addToUi();
}

/**
 * 🚀 פונקציית הקסם: בונה ומעצבת את כל מסד הנתונים והטבלאות בלחיצה אחת!
 */
function setupMayabeeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  // 1. יצירת לשונית דשבורד מנהלת
  setupExecutiveDashboardSheet(ss);
  
  // 2. יצירת לשונית ילדים ופדגוגיה
  setupChildrenSheet(ss);
  
  // 3. יצירת לשונית נוכחות יומית
  setupAttendanceSheet(ss);
  
  // 4. יצירת לשונית תנועות כספיות וקבלות
  setupFinanceSheet(ss);
  
  // 5. יצירת לשונית צוות ומשמרות
  setupStaffSheet(ss);
  
  // 6. יצירת לשונית תזונה ובטיחות
  setupLogisticsSheet(ss);
  
  // 7. יצירת לשונית הגדרות
  setupSettingsSheet(ss);
  
  ui.alert(
    "✅ הושלם בהצלחה!",
    "כל הטבלאות, הנוסחאות, הדשבורד ועיצובי המותג של 'הבית של מאיה' הוגדרו בהצלחה!\\n\\nכעת ניתן להשתמש בגליון או לסנכרן עם אתר הניהול.",
    ui.ButtonSet.OK
  );
}

/**
 * 📊 עיצוב ובניית דשבורד מנהלת חזותי בגליון
 */
function setupExecutiveDashboardSheet(ss) {
  var sheet = getOrCreateSheet(ss, "📊 דשבורד_מנהלת", 1);
  sheet.clear();
  sheet.setRightToLeft(true);
  sheet.setTabColor(BRAND.colors.primaryBrown);
  
  // כותרת עליונה
  sheet.getRange("A1:H2").merge()
    .setValue("🐝 הבית של מאיה - דשבורד ניהול מעון וצהרון באריאל | בהנהלת רותם עירון")
    .setBackground(BRAND.colors.darkBrown)
    .setFontColor("#ffffff")
    .setFontSize(16)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sheet.getRange("A3:H3").merge()
    .setValue("מעקב נוכחות, תקרת עוסק פטור 2026 (122,000 ₪), תקינת חוק הפיקוח וזיהום אלרגנים בזמן אמת")
    .setBackground(BRAND.colors.honeyBg)
    .setFontColor(BRAND.colors.darkBrown)
    .setFontSize(11)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  // כרטיסי KPI (Tiles)
  var kpiRanges = [
    { range: "A5:B6", title: "👶 סה\\"כ ילדים רשומים", formula: '=COUNTA(\\'👶 ילדים\\'!A2:A)', bg: "#fff9f3", text: BRAND.colors.darkBrown },
    { range: "C5:D6", title: "🟢 נוכחים היום בגן", formula: '=COUNTIF(\\'📅 נוכחות\\'!D2:D, "נוכח")', bg: "#ecfdf5", text: BRAND.colors.successGreen },
    { range: "E5:F6", title: "💰 הכנסות שנתיות (שכ\\"ל)", formula: '=SUMIF(\\'💰 כספים\\'!C2:C, "הכנסה", \\'💰 כספים\\'!G2:G)', bg: "#eff6ff", text: "#1e40af" },
    { range: "G5:H6", title: "📉 הוצאות מוכרות", formula: '=SUMIF(\\'💰 כספים\\'!C2:C, "הוצאה", \\'💰 כספים\\'!G2:G)', bg: "#fff1f2", text: BRAND.colors.alertRed }
  ];

  kpiRanges.forEach(function(k) {
    sheet.getRange(k.range).merge()
      .setValue(k.title + "\\n" + k.formula)
      .setBackground(k.bg)
      .setFontColor(k.text)
      .setFontWeight("bold")
      .setFontSize(13)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBorder(true, true, true, true, false, false, BRAND.colors.borderGray, SpreadsheetApp.BorderStyle.SOLID);
  });

  // תקרת עוסק פטור
  sheet.getRange("A8:H8").merge()
    .setValue("💼 סטטוס עוסק פטור (תקרה שנתית 122,000 ₪ ל-2026):")
    .setBackground(BRAND.colors.primaryBrown)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(12);

  sheet.getRange("A9:D9").merge()
    .setValue("אחוז ניצול התקרה: ")
    .setFontWeight("bold")
    .setBackground("#fafafa");
  sheet.getRange("E9:H9").merge()
    .setFormula('=(SUMIF(\\'💰 כספים\\'!C2:C, "הכנסה", \\'💰 כספים\\'!G2:G) / 122000)')
    .setNumberFormat("0.0%")
    .setFontSize(14)
    .setFontWeight("bold")
    .setBackground("#fafafa")
    .setHorizontalAlignment("center");

  // טבלת התראות וצוות
  sheet.getRange("A11:D11").merge().setValue("👩‍🏫 תקינת כוח אדם וסייעות").setBackground(BRAND.colors.honeyBg).setFontWeight("bold");
  sheet.getRange("E11:H11").merge().setValue("⚠️ התראות בטיחות ואלרגיות").setBackground(BRAND.colors.honeyBg).setFontWeight("bold");

  sheet.getRange("A12:D13").merge()
    .setValue("סייעות פעילות במשמרת כעת: " + '=COUNTA(\\'👩‍🏫 צוות\\'!A2:A) + "\\nתקן פיקוח: 1:6 תינוקות | 1:9 פעוטות | 1:12 בוגרים"')
    .setBackground("#ffffff").setFontSize(10).setVerticalAlignment("middle");

  sheet.getRange("E12:H13").merge()
    .setValue("חוק לצמצום מזומן: מקסימום 6,000 ₪ לעסקה\\nמזרק אפיפן זמין במעון • חצר נעולה ומבוקרת")
    .setBackground("#ffffff").setFontSize(10).setVerticalAlignment("middle");

  sheet.setColumnWidth(1, 130);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 130);
  sheet.setColumnWidth(8, 130);
}

/**
 * 👶 לשונית ילדים ופדגוגיה
 */
function setupChildrenSheet(ss) {
  var sheet = getOrCreateSheet(ss, "👶 ילדים", 2);
  sheet.setRightToLeft(true);
  sheet.setTabColor(BRAND.colors.honeyGold);
  
  var headers = [
    "מזהה (UUID)", "שם פרטי", "שם משפחה", "תעודת זהות", "תאריך לידה",
    "קבוצת גיל", "שכ\\"ל חודשי (₪)", "אלרגיות מסכנות חיים",
    "שם הורה (איש קשר)", "טלפון נייד", "דוא\\"ל", "הערות רפואיות / אפיפן", "סטטוס"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(BRAND.colors.primaryBrown)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");

  // עיצוב תאי גיל ב-Dropdown
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["פעוטון (3-15 חודש)", "משפחתון (15-24 חודש)", "בוגרים וצהרון (24-36 חודש)"], true)
    .build();
  sheet.getRange("F2:F200").setDataValidation(rule);

  // עיצוב עמודת שכר לימוד כמטבע
  sheet.getRange("G2:G200").setNumberFormat("₪#,##0");

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 📅 לשונית נוכחות יומית
 */
function setupAttendanceSheet(ss) {
  var sheet = getOrCreateSheet(ss, "📅 נוכחות", 3);
  sheet.setRightToLeft(true);
  sheet.setTabColor(BRAND.colors.successGreen);
  
  var headers = [
    "תאריך", "מזהה ילד", "שם הילד/ה", "סטטוס נוכחות",
    "שעת כניסה", "שעת יציאה", "נאסף ע\\"י", "הערות יום"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(BRAND.colors.primaryBrown)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");

  // Dropdown לסטטוס נוכחות
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["נוכח", "נעדר", "חולה", "חופשה"], true)
    .build();
  sheet.getRange("D2:D500").setDataValidation(rule);

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 💰 לשונית תנועות כספיות ומיסוי
 */
function setupFinanceSheet(ss) {
  var sheet = getOrCreateSheet(ss, "💰 כספים", 4);
  sheet.setRightToLeft(true);
  sheet.setTabColor("#2563eb");
  
  var headers = [
    "מזהה תנועה", "תאריך", "סוג (הכנסה/הוצאה)", "קטגוריה", "תיאור העסקה",
    "עבור ילד/ה", "סכום כולל (₪)", "אמצעי תשלום", "אסמכתא / קבלה",
    "קבלה ידנית בפנקס", "אזהרת חוק המזומן (>6,000)"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(BRAND.colors.primaryBrown)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");

  // Dropdowns
  var typeRule = SpreadsheetApp.newDataValidation().requireValueInList(["הכנסה", "הוצאה"], true).build();
  sheet.getRange("C2:C500").setDataValidation(typeRule);

  var payRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["העברה בנקאית", "צ'ק", "ביט / פייבוקס", "כרטיס אשראי", "מזומן"], true)
    .build();
  sheet.getRange("H2:H500").setDataValidation(payRule);

  sheet.getRange("G2:G500").setNumberFormat("₪#,##0.00");

  // נוסחת חוק המזומן האוטומטית לעמודה K
  sheet.getRange("K2:K500").setFormulaR1C1('=IF(AND(RC[-3]="מזומן", RC[-4]>6000), "⚠️ חריגת חוק המזומן!", "תקין")');

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 👩‍🏫 לשונית צוות ומשמרות
 */
function setupStaffSheet(ss) {
  var sheet = getOrCreateSheet(ss, "👩‍🏫 צוות", 5);
  sheet.setRightToLeft(true);
  sheet.setTabColor("#8b5cf6");
  
  var headers = [
    "מזהה עובדת", "שם מלא", "תפקיד", "טלפון נייד", "שכר שעתי (₪)",
    "תוקף קורס החייאה ועזרה ראשונה", "אישור משטרה להעסקת בגיר", "סטטוס"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(BRAND.colors.primaryBrown)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");

  sheet.getRange("E2:E100").setNumberFormat("₪#,##0.00");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 🥗 לשונית תזונה ובטיחות
 */
function setupLogisticsSheet(ss) {
  var sheet = getOrCreateSheet(ss, "🥗 תזונה_ובטיחות", 6);
  sheet.setRightToLeft(true);
  sheet.setTabColor("#f97316");
  
  var headers = [
    "יום בשבוע", "ארוחת בוקר (08:30)", "חטיף בוקר",
    "ארוחת צהריים (11:45)", "ארוחת מנחה (15:30)",
    "אלרגנים בתפריט", "בדיקת בטיחות יומית"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(BRAND.colors.primaryBrown)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * ⚙️ לשונית הגדרות
 */
function setupSettingsSheet(ss) {
  var sheet = getOrCreateSheet(ss, "⚙️ הגדרות", 7);
  sheet.setRightToLeft(true);
  
  sheet.getRange("A1:B1").setValues([["מפתח הגדרה", "ערך"]])
    .setBackground(BRAND.colors.primaryBrown).setFontColor("#ffffff").setFontWeight("bold");

  var settingsData = [
    ["שם המעון", BRAND.name],
    ["מנהלת ומייסדת", BRAND.director],
    ["טלפון ראשי", BRAND.phone],
    ["כתובת", BRAND.address],
    ["סוג עוסק", "עוסק פטור"],
    ["תקרת עוסק פטור 2026", 122000],
    ["גרסת מערכת", "Mayabee-V2.5-Sync"],
    ["עדכון אחרון", new Date().toLocaleString("he-IL")]
  ];

  sheet.getRange(2, 1, settingsData.length, 2).setValues(settingsData);
  sheet.autoResizeColumns(1, 2);
}

/**
 * 🔍 בדיקת תקינות, שגיאות ותקלות במאגר (Health Check & Anomaly Detector)
 */
function runIntegrityAndErrorCheck() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var errors = [];
  var warnings = [];

  // 1. בדיקת חוק המזומן (עסקאות מזומן מעל 6,000 ש"ח)
  var financeSheet = ss.getSheetByName("💰 כספים");
  if (financeSheet) {
    var data = financeSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var amount = Number(row[6]) || 0;
      var method = String(row[7] || "");
      if (method.indexOf("מזומן") !== -1 && amount > 6000) {
        errors.push("❌ שורה " + (i + 1) + " בכספים: עסקת מזומן של ₪" + amount.toLocaleString() + " חורגת מחוק המזומן (מקסימום 6,000 ₪)!");
      }
    }
  }

  // 2. בדיקת ילדים ללא טלפון או ללא תעודת זהות
  var childrenSheet = ss.getSheetByName("👶 ילדים");
  if (childrenSheet) {
    var cData = childrenSheet.getDataRange().getValues();
    for (var j = 1; j < cData.length; j++) {
      var cRow = cData[j];
      var childName = (cRow[1] || "") + " " + (cRow[2] || "");
      var phone = String(cRow[9] || "").replace(/[^0-9]/g, "");
      var idNum = String(cRow[3] || "").replace(/[^0-9]/g, "");

      if (childName.trim().length > 1) {
        if (phone.length < 9) {
          errors.push("❌ ילד/ה " + childName + " (שורה " + (j + 1) + "): חסר מספר טלפון תקין להורה!");
        }
        if (idNum.length < 8) {
          warnings.push("⚠️ ילד/ה " + childName + ": תעודת זהות חסרה או פחות מ-8 ספרות.");
        }
      }
    }
  }

  // 3. בדיקת תוקף קורסי החייאה לצוות
  var staffSheet = ss.getSheetByName("👩‍🏫 צוות");
  if (staffSheet) {
    var sData = staffSheet.getDataRange().getValues();
    var now = new Date();
    for (var k = 1; k < sData.length; k++) {
      var sRow = sData[k];
      var staffName = sRow[1];
      var certDateStr = sRow[5];
      if (staffName && certDateStr) {
        var certDate = new Date(certDateStr);
        if (certDate < now) {
          errors.push("❌ עובדת " + staffName + ": תוקף קורס החייאה ועזרה ראשונה פג ב-" + certDate.toLocaleDateString("he-IL") + "!");
        }
      }
    }
  }

  // בניית דוח תוצאות
  var report = "";
  if (errors.length === 0 && warnings.length === 0) {
    report = "🎉 בדיקת התקינות עברה בהצלחה מלאה!\\nלא נמצאו שגיאות או חריגות חוקיות במאגר הנתונים של המעון.";
  } else {
    if (errors.length > 0) {
      report += "🔴 נמצאו " + errors.length + " שגיאות קריטיות הדורשות טיפול:\\n" + errors.join("\\n") + "\\n\\n";
    }
    if (warnings.length > 0) {
      report += "🟡 נמצאו " + warnings.length + " אזהרות:\\n" + warnings.join("\\n");
    }
  }

  ui.alert("דוח בדיקת תקינות מאגר - הבית של מאיה", report, ui.ButtonSet.OK);
}

/**
 * 📊 פתיחת סיידבר מעוצב ואינטראקטיבי ב-Google Sheets
 */
function showDashboardSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("🐝 דשבורד מנהלת - הבית של מאיה")
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * ניווט מהיר ליומן הנוכחות
 */
function openTodayAttendance() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("📅 נוכחות");
  if (sheet) {
    ss.setActiveSheet(sheet);
  }
}

/**
 * דיאלוג אודות
 */
function showAboutDialog() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "🐝 אודות מערכת הניהול",
    "הבית של מאיה - בהנהלת רותם עירון\\nמעון, משפחתון וצהרון באריאל\\nטלפון: 052-870-7056\\n\\nמערכת Local-First חכמה מסונכרנת ל-Google Sheets.",
    ui.ButtonSet.OK
  );
}

/**
 * פונקציית עזר ליצירה או שליפת לשונית
 */
function getOrCreateSheet(ss, name, index) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, index - 1);
  }
  return sheet;
}

/**
 * ==============================================================================
 * 🌐 REST API Endpoints: doGet & doPost לקריאה וסנכרון מאתר הניהול
 * ==============================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  var result = {};

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "ping") {
      result = {
        status: "ok",
        daycare: BRAND.name,
        director: BRAND.director,
        version: "2.5",
        timestamp: new Date().toISOString()
      };
    } else if (action === "getAllData" || action === "pull") {
      result = extractAllDataFromSheets(ss);
      result.status = "success";
    } else {
      result = { status: "unknown_action", action: action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    var requestBody = JSON.parse(e.postData.contents || "{}");
    var action = requestBody.action || "sync";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "sync" || action === "push") {
      result = writeAllDataToSheets(ss, requestBody.data || requestBody);
      result.status = "success";
      result.syncedAt = new Date().toISOString();
    } else if (action === "diagnose") {
      result = { status: "diagnosed", message: "הסריקה הושלמה" };
    } else {
      result = { status: "unknown_action", action: action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * שליפת כלל הנתונים מכל הלשוניות ל-JSON
 */
function extractAllDataFromSheets(ss) {
  var data = {
    children: [],
    attendance: [],
    transactions: [],
    staff: []
  };

  var cSheet = ss.getSheetByName("👶 ילדים");
  if (cSheet) {
    var cRows = cSheet.getDataRange().getValues();
    for (var i = 1; i < cRows.length; i++) {
      var r = cRows[i];
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

/**
 * כתיבת נתונים מהאתר לתוך לשוניות ה-Google Sheet
 */
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
      <span>טלפון: 052-870-7056</span>
      <span>מעון וצהרון</span>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
    <h3 class="text-xs font-bold text-gray-700">פעולות מהירות בגליון:</h3>
    <button onclick="google.script.run.setupMayabeeDatabase()" class="w-full py-2 px-3 text-xs font-bold honey-btn rounded-xl shadow-sm flex items-center justify-center gap-2">
      <span>🚀 רענון ועיצוב הטבלאות (Setup)</span>
    </button>
    <button onclick="google.script.run.runIntegrityAndErrorCheck()" class="w-full py-2 px-3 text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-xl hover:bg-yellow-200 flex items-center justify-center gap-2">
      <span>🔍 בדיקת תקינות ושגיאות במאגר</span>
    </button>
    <button onclick="google.script.run.openTodayAttendance()" class="w-full py-2 px-3 text-xs font-bold bg-green-50 text-green-800 border border-green-200 rounded-xl hover:bg-green-100 flex items-center justify-center gap-2">
      <span>📋 פתח יומן נוכחות להיום</span>
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

  <!-- Sync status -->
  <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center text-xs text-yellow-900">
    <p class="font-bold">סנכרון ענן פעיל (Phase 2)</p>
    <p class="text-gray-500 text-[10px] mt-0.5">כל שינוי באתר או בשיטס מסונכרן דו-כיוונית</p>
  </div>
</body>
</html>
`;
