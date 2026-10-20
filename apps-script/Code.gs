/**
 * WE Timeline: check results collector.
 * Paste this into Extensions > Apps Script in a Google Sheet, then deploy it as a web app
 * (see README.md). Every submitted check adds one row to the "Results" tab.
 */
const SHEET_NAME = "Results";
const HEADERS = ["Received", "Student", "Hour", "Level", "Level name", "Score", "Out of", "Percent", "Time (sec)", "Detail", "Submitted (student clock)"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // a whole class may submit at once
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }
    sheet.appendRow([
      new Date(), clean(d.student), clean(d.hour), Number(d.level), clean(d.levelName),
      Number(d.score), Number(d.total), Number(d.percent), Number(d.seconds),
      clean(d.detail), clean(d.submittedAt)
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Keeps a typed name like "=SUM(...)" from being treated as a formula.
function clean(v) {
  const s = String(v == null ? "" : v).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
