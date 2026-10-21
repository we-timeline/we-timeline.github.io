/**
 * WE Timeline: check results collector.
 *
 * One script, one sheet per teacher. Each submitted check goes to the sheet for the
 * teacher the student picked. The owner shares each sheet with its teacher.
 *
 * FIRST TIME / EACH NEW SCHOOL YEAR
 *   1. Update SCHOOL_YEAR and TEACHERS below.
 *   2. Choose "setup" in the function menu at the top and click Run.
 *   3. Open View > Execution log (or "Execution log" at the bottom) for the links to the new sheets.
 *   4. Share each sheet with its teacher.
 * Last year's sheets stay in your Drive untouched.
 */
const SCHOOL_YEAR = "2026-27";
const TEACHERS = ["STR", "LAF", "LYS"]; // must match the codes in app.js

const HEADERS = ["Received", "Student", "Hour", "Level", "Level name", "Score", "Out of", "Percent", "Time (sec)", "Detail", "Submitted (student clock)"];

function setup() {
  const lines = [];
  TEACHERS.forEach(code => {
    const ss = sheetFor_(code);
    lines.push(code + ": " + ss.getUrl());
  });
  Logger.log("WE Timeline sheets for " + SCHOOL_YEAR + ":\n" + lines.join("\n"));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // a whole class may submit at once
  try {
    const d = JSON.parse(e.postData.contents);
    const code = TEACHERS.indexOf(String(d.teacher)) >= 0 ? String(d.teacher) : "Unsorted";
    const sheet = sheetFor_(code).getSheets()[0];
    sheet.appendRow([
      new Date(), clean_(d.student), clean_(d.hour), Number(d.level), clean_(d.levelName),
      Number(d.score), Number(d.total), Number(d.percent), Number(d.seconds),
      clean_(d.detail), clean_(d.submittedAt)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Finds this year's sheet for a teacher, or creates it in your Drive the first time.
function sheetFor_(code) {
  const props = PropertiesService.getScriptProperties();
  const key = "sheet_" + SCHOOL_YEAR + "_" + code;
  const id = props.getProperty(key);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* deleted; make a new one */ }
  }
  const ss = SpreadsheetApp.create("WE Timeline: " + code + " (" + SCHOOL_YEAR + ")");
  const sheet = ss.getSheets()[0];
  sheet.setName("Results");
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  props.setProperty(key, ss.getId());
  return ss;
}

// Keeps a typed name like "=SUM(...)" from being treated as a formula.
function clean_(v) {
  const s = String(v == null ? "" : v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
