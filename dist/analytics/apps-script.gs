/**
 * Google Apps Script collector for the prototype experiment analytics.
 *
 * Receives events beaconed from track.js and appends each one as a row in the
 * bound Google Sheet. Deploy this as a Web App (see analytics/README.md), then
 * paste the resulting /exec URL into track.js (the ENDPOINT constant).
 */

// Columns written to the sheet, in order.
var HEADERS = [
  "ts",
  "event",
  "app",
  "page",
  "user_id",
  "session_id",
  "path",
  "url",
  "referrer",
  "title",
  "viewport",
  "target_text",
  "target_tag",
  "target_id",
  "target_classes",
  "target_href",
  "target_name",
  "target_data",
  "target_selector",
  "click_x",
  "click_y",
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var row = HEADERS.map(function (key) {
      var v = data[key];
      return v === undefined || v === null ? "" : v;
    });
    sheet.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm it is live.
function doGet() {
  return json({ ok: true, service: "prototype-analytics" });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("events");
  if (!sheet) {
    sheet = ss.insertSheet("events");
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
