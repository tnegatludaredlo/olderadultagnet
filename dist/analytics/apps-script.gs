/**
 * Google Apps Script collector for the prototype experiment analytics.
 *
 * - doPost: appends each incoming event as a row in the "events" sheet.
 *   Columns are matched by header NAME and auto-extended, so adding new fields
 *   in track.js (e.g. "participant") never misaligns existing rows.
 * - rebuildSummary: builds a "sessions" sheet — ONE ROW PER VISIT
 *   (participant + session), with the full ordered click path.
 * - onOpen: adds a "埋点" menu in the Sheet so you can refresh the summary.
 *
 * Deploy as a Web App (Execute as: Me, Who has access: Anyone). After editing
 * this code you must redeploy a NEW VERSION for the live endpoint to update.
 */

// Canonical column order used when the sheet is first created. Any extra keys
// sent later are appended as new columns automatically.
var HEADERS = [
  "ts",
  "event",
  "app",
  "participant",
  "demand",
  "demandlevel",
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
  "scroll_depth",
  "scroll_depth_max",
  "scroll_y",
  "doc_height",
  "dwell_ms",
  "visible_ms",
  "leave_reason",
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

    // Read current headers; add any new keys (e.g. participant) as columns.
    var headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    Object.keys(data).forEach(function (key) {
      if (headers.indexOf(key) === -1) {
        headers.push(key);
        sheet.getRange(1, headers.length).setValue(key);
      }
    });

    var row = headers.map(function (key) {
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

/**
 * Build the "sessions" summary: one row per (participant, session_id) with the
 * ordered path of pages and clicked buttons. Run via the 埋点 menu.
 */
function rebuildSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheetByName("events");
  if (!src || src.getLastRow() < 2) return;

  var values = src.getDataRange().getValues();
  var headers = values.shift();
  var col = {};
  headers.forEach(function (h, i) {
    col[h] = i;
  });

  var groups = {};
  var order = [];
  values.forEach(function (r) {
    var participant = r[col.participant] || "(none)";
    var session = r[col.session_id] || "";
    var key = participant + "||" + session;
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(r);
  });

  var out = [
    [
      "participant",
      "demand",
      "demandlevel",
      "app",
      "session_id",
      "start",
      "end",
      "duration_s",
      "events",
      "pages_visited",
      "max_scroll_depth",
      "total_dwell_ms",
      "total_visible_ms",
      "path",
    ],
  ];

  order.forEach(function (key) {
    var rows = groups[key].slice().sort(function (a, b) {
      return String(a[col.ts]).localeCompare(String(b[col.ts]));
    });
    var first = rows[0];
    var last = rows[rows.length - 1];
    var start = first[col.ts];
    var end = last[col.ts];
    var duration = "";
    if (start && end) {
      duration = Math.round((new Date(end) - new Date(start)) / 1000);
    }

    var pages = {};
    var maxScrollDepth = 0;
    var totalDwellMs = 0;
    var totalVisibleMs = 0;
    var path = rows.map(function (r) {
      var ev = r[col.event];
      var page = r[col.page];
      var scrollDepth = col.scroll_depth_max === undefined ? "" : r[col.scroll_depth_max];
      var dwellMs = col.dwell_ms === undefined ? "" : r[col.dwell_ms];
      var visibleMs = col.visible_ms === undefined ? "" : r[col.visible_ms];
      pages[page] = 1;
      if (scrollDepth !== "" && !isNaN(Number(scrollDepth))) {
        maxScrollDepth = Math.max(maxScrollDepth, Number(scrollDepth));
      }
      if (ev === "page_leave" && dwellMs !== "" && !isNaN(Number(dwellMs))) {
        totalDwellMs += Number(dwellMs);
      }
      if (ev === "page_leave" && visibleMs !== "" && !isNaN(Number(visibleMs))) {
        totalVisibleMs += Number(visibleMs);
      }
      if (ev === "click") {
        var label = r[col.target_text] || r[col.target_selector] || "?";
        return page + ":点[" + label + "]";
      }
      if (ev === "scroll_depth") {
        return page + ":滚动到[" + (r[col.scroll_depth] || "?") + "%]";
      }
      if (ev === "page_leave") {
        return page + ":停留[" + Math.round((Number(dwellMs) || 0) / 1000) + "s]";
      }
      return "→" + page; // pageview / screen_view
    });

    out.push([
      first[col.participant] || "(none)",
      first[col.demand] || "",
      (col.demandlevel === undefined ? "" : first[col.demandlevel]) || first[col.demand] || "",
      first[col.app] || "",
      first[col.session_id] || "",
      start,
      end,
      duration,
      rows.length,
      Object.keys(pages).join(", "),
      maxScrollDepth || "",
      totalDwellMs || "",
      totalVisibleMs || "",
      path.join("  "),
    ]);
  });

  var dst = ss.getSheetByName("sessions") || ss.insertSheet("sessions");
  dst.clear();
  dst.getRange(1, 1, out.length, out[0].length).setValues(out);
  dst.setFrozenRows(1);
}

// Adds a menu in the Sheet UI (reload the sheet once for it to appear).
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("埋点")
    .addItem("刷新汇总表 (sessions)", "rebuildSummary")
    .addToUi();
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
