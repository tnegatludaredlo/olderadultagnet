/*
 * Lightweight experiment analytics for the static prototypes.
 *
 * Covers three apps deployed on GitHub Pages:
 *   - activesg     (multi-page, <a> navigation)
 *   - supermarket  (single-page, JS screen switching)
 *   - mobile-plan  (multi-page, <a> navigation)
 *
 * Captures three event types and beacons each one to a Google Apps Script
 * endpoint that appends it as a row in a Google Sheet:
 *   - pageview     : which page was opened
 *   - click        : which button / link was clicked (text, target, position)
 *   - screen_view  : which in-app screen became active (supermarket SPA path)
 *   - scroll_depth : deepest scroll thresholds reached on a page
 *   - page_leave   : time spent on the page before it was hidden/unloaded
 *
 * Privacy: never records the *value* a user types. Form fields are logged by
 * name / placeholder only.
 */
(function () {
  "use strict";

  // 1) PASTE YOUR APPS SCRIPT WEB APP URL HERE (see analytics/README.md).
  //    It looks like: https://script.google.com/macros/s/AKfyc.../exec
  //    You can also set window.ANALYTICS_ENDPOINT before this script loads.
  var ENDPOINT = window.ANALYTICS_ENDPOINT || "https://script.google.com/macros/s/AKfycbypd7_bG0ESJmBoluOf74Er0k_Is_foYP5xVzEqu3IE9nXiGGT6Y3RPUEadI1rCR9a-rg/exec";

  var CONFIGURED = ENDPOINT && ENDPOINT.indexOf("__PASTE") === -1;
  var SCROLL_THRESHOLDS = [25, 50, 75, 100];
  var PAGE_START_MS = Date.now();
  var visibleStartMs = document.visibilityState === "hidden" ? 0 : Date.now();
  var accumulatedVisibleMs = 0;
  var maxScrollDepth = 0;
  var sentScrollDepths = {};
  var leaveTracked = false;

  // ---- identity: persistent anonymous user + rolling 30-min session --------
  var SESSION_GAP_MS = 30 * 60 * 1000;

  function rid() {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* private mode / disabled storage */
    }
  }
  function load(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storeSession(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      /* private mode / disabled storage */
    }
  }
  function loadSession(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function clearSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      /* private mode / disabled storage */
    }
  }

  var userId = load("exp_uid");
  if (!userId) {
    userId = rid();
    store("exp_uid", userId);
  }

  function currentSession() {
    var now = Date.now();
    var sid = load("exp_sid");
    var last = parseInt(load("exp_sid_ts") || "0", 10);
    if (!sid || !last || now - last > SESSION_GAP_MS) {
      sid = rid();
      store("exp_sid", sid);
    }
    store("exp_sid_ts", String(now));
    return sid;
  }

  // ---- experiment entry: participant id + task demand, prompted once -------
  var PARTICIPANT_KEY = "exp_participant";
  var DEMAND_KEY = "exp_demand"; // "low" | "high"
  var OVERLAY_ID = "exp-participant-overlay";

  (function resetEntryOnReload() {
    try {
      var navEntries = performance.getEntriesByType
        ? performance.getEntriesByType("navigation")
        : [];
      var navType = navEntries && navEntries[0] ? navEntries[0].type : "";
      if (navType === "reload") {
        clearSession(PARTICIPANT_KEY);
        clearSession(DEMAND_KEY);
      }
    } catch (e) {
      /* ignore performance API issues */
    }
  })();

  (function seedEntryFromUrl() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("resetp")) {
        clearSession(PARTICIPANT_KEY); // ?resetp=1 -> re-prompt everything
        clearSession(DEMAND_KEY);
      }
      var p = q.get("p"); // ?p=Alice -> set participant directly
      if (p) storeSession(PARTICIPANT_KEY, p.trim());
      var d = (q.get("demandlevel") || q.get("demand") || "").toLowerCase(); // ?demandlevel=low|high
      if (d === "low" || d === "high") storeSession(DEMAND_KEY, d);
      notifyEntryChanged();
    } catch (e) {
      /* URLSearchParams unavailable */
    }
  })();

  function getParticipant() {
    return loadSession(PARTICIPANT_KEY) || "";
  }
  function getDemand() {
    return loadSession(DEMAND_KEY) || "";
  }
  function getDemandLevel() {
    return getDemand();
  }

  function notifyEntryChanged() {
    try {
      window.dispatchEvent(
        new CustomEvent("experiment-entry-change", {
          detail: {
            participant: getParticipant(),
            demand: getDemand(),
            demandlevel: getDemandLevel(),
          },
        })
      );
    } catch (e) {
      /* ignore CustomEvent issues */
    }
  }

  function ensureEntry(done) {
    if (getParticipant() && getDemand()) return done();

    var overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute(
      "style",
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;" +
        "justify-content:center;background:rgba(0,0,0,.55);" +
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"
    );
    var btnStyle =
      "flex:1;padding:14px 8px;font-size:15px;font-weight:600;border-radius:10px;cursor:pointer;" +
      "border:2px solid #0b64d6;background:#fff;color:#0b64d6";
    overlay.innerHTML =
      '<div style="width:min(88vw,340px);background:#fff;border-radius:16px;padding:22px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.3);text-align:center">' +
      '<div style="font-size:16px;font-weight:700;color:#111;margin-bottom:6px">实验开始</div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:16px">参与者编号 Participant ID</div>' +
      '<input id="exp-participant-input" type="text" autocomplete="off" placeholder="例如 P01 / Alice" ' +
      'style="width:100%;box-sizing:border-box;padding:12px;font-size:15px;border:1px solid #ccc;' +
      'border-radius:10px;outline:none;margin-bottom:18px" />' +
      '<div style="font-size:13px;color:#666;margin-bottom:10px">选择任务类型 Task demand</div>' +
      '<div style="display:flex;gap:10px">' +
      '<button id="exp-demand-low" type="button" style="' + btnStyle + '">Low demand</button>' +
      '<button id="exp-demand-high" type="button" style="' + btnStyle + '">High demand</button>' +
      "</div>" +
      '<div id="exp-entry-hint" style="font-size:12px;color:#c0392b;margin-top:12px;min-height:14px"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector("#exp-participant-input");
    var hint = overlay.querySelector("#exp-entry-hint");
    if (input) {
      input.value = getParticipant(); // prefill if set via ?p=
      input.focus();
    }

    function choose(demand) {
      var val = (input.value || "").trim();
      if (!val) {
        if (hint) hint.textContent = "请先输入参与者编号 Enter participant ID first";
        input.focus();
        return;
      }
      storeSession(PARTICIPANT_KEY, val);
      storeSession(DEMAND_KEY, demand);
      notifyEntryChanged();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      done();
    }

    overlay
      .querySelector("#exp-demand-low")
      .addEventListener("click", function () {
        choose("low");
      });
    overlay
      .querySelector("#exp-demand-high")
      .addEventListener("click", function () {
        choose("high");
      });
  }

  // ---- which app / page are we on ------------------------------------------
  function detectApp() {
    var b = document.body;
    if (b && b.dataset && b.dataset.activesgPage) return "activesg";
    if (b && b.dataset && b.dataset.mobilePlanPage) return "mobile-plan";
    var p = location.pathname;
    if (p.indexOf("/activesg") !== -1) return "activesg";
    if (p.indexOf("/supermarket") !== -1) return "supermarket";
    if (p.indexOf("/mobile-plan") !== -1) return "mobile-plan";
    return "unknown";
  }

  function detectPage(app) {
    var b = document.body;
    if (app === "activesg" && b && b.dataset && b.dataset.activesgPage) {
      return b.dataset.activesgPage;
    }
    if (app === "mobile-plan" && b && b.dataset && b.dataset.mobilePlanPage) {
      return b.dataset.mobilePlanPage;
    }
    // Fall back to the folder name in the URL, e.g. .../topup/index.html -> topup
    var parts = location.pathname.replace(/\/index\.html?$/, "").split("/");
    var last = parts[parts.length - 1] || app;
    return last || "home";
  }

  var APP = detectApp();

  // ---- describing a clicked element ----------------------------------------
  var INTERACTIVE =
    "a, button, [role='button'], [data-view], [data-icon], input, select, textarea, label, .nav-item, .activesg-card, .activesg-accordion__trigger, .mobile-plan-action-link, .mobile-plan-drawer__link";

  function shortText(el) {
    var t = (el.getAttribute && el.getAttribute("aria-label")) || el.textContent || "";
    t = t.replace(/\s+/g, " ").trim();
    return t.length > 120 ? t.slice(0, 120) + "…" : t;
  }

  function selectorFor(el) {
    var path = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 4) {
      var seg = node.tagName.toLowerCase();
      if (node.id) {
        seg += "#" + node.id;
        path.unshift(seg);
        break;
      }
      if (node.className && typeof node.className === "string") {
        var cls = node.className.trim().split(/\s+/).slice(0, 2).join(".");
        if (cls) seg += "." + cls;
      }
      path.unshift(seg);
      node = node.parentElement;
      depth++;
    }
    return path.join(" > ");
  }

  function dataAttrs(el) {
    var out = {};
    if (!el.attributes) return out;
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      // data-* and aria-label help identify the control; values are safe here.
      if (a.name.indexOf("data-") === 0 || a.name === "aria-label") {
        out[a.name] = a.value;
      }
    }
    return out;
  }

  function currentPageKey() {
    return APP + "::" + detectPage(APP) + "::" + location.pathname + location.search;
  }

  function documentScrollHeight() {
    var doc = document.documentElement;
    var body = document.body;
    return Math.max(
      doc ? doc.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      doc ? doc.clientHeight : 0,
      window.innerHeight || 0
    );
  }

  function currentScrollDepth() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = Math.max(
      window.pageYOffset || 0,
      doc ? doc.scrollTop || 0 : 0,
      body ? body.scrollTop || 0 : 0
    );
    var viewportHeight = window.innerHeight || (doc ? doc.clientHeight : 0) || 0;
    var scrollHeight = documentScrollHeight();
    if (!scrollHeight) return 0;

    var denominator = Math.max(scrollHeight - viewportHeight, 1);
    var ratio = denominator <= 1 ? 100 : ((scrollTop + viewportHeight) / scrollHeight) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
  }

  function refreshScrollDepth() {
    var depth = currentScrollDepth();
    if (depth > maxScrollDepth) {
      maxScrollDepth = depth;
    }
    return depth;
  }

  function pauseVisibleTimer() {
    if (visibleStartMs) {
      accumulatedVisibleMs += Date.now() - visibleStartMs;
      visibleStartMs = 0;
    }
  }

  function resumeVisibleTimer() {
    if (!visibleStartMs) {
      visibleStartMs = Date.now();
    }
  }

  function visibleDurationMs() {
    return accumulatedVisibleMs + (visibleStartMs ? Date.now() - visibleStartMs : 0);
  }

  // ---- transport ------------------------------------------------------------
  function send(payload) {
    payload.ts = new Date().toISOString();
    payload.app = APP;
    payload.participant = getParticipant();
    payload.demand = getDemand();
    payload.demandlevel = getDemandLevel();
    payload.user_id = userId;
    payload.session_id = currentSession();
    payload.path = location.pathname + location.search;
    payload.url = location.href;
    payload.referrer = document.referrer || "";
    payload.title = document.title || "";
    payload.viewport = window.innerWidth + "x" + window.innerHeight;

    if (!CONFIGURED) {
      // Endpoint not set yet: log to console so it can be verified locally.
      if (window.console) console.debug("[track]", payload);
      return;
    }

    var body = JSON.stringify(payload);
    try {
      var blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) {
        return;
      }
    } catch (e) {
      /* fall through to fetch */
    }
    try {
      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: body,
      });
    } catch (e2) {
      /* give up silently */
    }
  }

  // ---- events ---------------------------------------------------------------
  function trackPageview() {
    send({ event: "pageview", page: detectPage(APP) });
  }

  function trackScrollDepth() {
    var page = detectPage(APP);
    var pageKey = currentPageKey();
    var depth = refreshScrollDepth();

    for (var i = 0; i < SCROLL_THRESHOLDS.length; i++) {
      var threshold = SCROLL_THRESHOLDS[i];
      var hitKey = pageKey + "::" + threshold;
      if (depth >= threshold && !sentScrollDepths[hitKey]) {
        sentScrollDepths[hitKey] = true;
        send({
          event: "scroll_depth",
          page: page,
          scroll_depth: threshold,
          scroll_depth_max: depth,
          scroll_y: Math.round(window.pageYOffset || window.scrollY || 0),
          doc_height: documentScrollHeight(),
        });
      }
    }
  }

  function trackPageLeave(reason) {
    if (leaveTracked) return;
    leaveTracked = true;
    send({
      event: "page_leave",
      page: detectPage(APP),
      leave_reason: reason || "unknown",
      dwell_ms: Date.now() - PAGE_START_MS,
      visible_ms: visibleDurationMs(),
      scroll_depth_max: refreshScrollDepth(),
      scroll_y: Math.round(window.pageYOffset || window.scrollY || 0),
      doc_height: documentScrollHeight(),
    });
  }

  document.addEventListener(
    "click",
    function (e) {
      var raw = e.target;
      if (!raw || raw.nodeType !== 1) return;
      if (raw.closest("#" + OVERLAY_ID)) return; // ignore the participant prompt
      var el = raw.closest(INTERACTIVE) || raw;

      var isFormField = /^(input|select|textarea)$/i.test(el.tagName);
      var payload = {
        event: "click",
        page: detectPage(APP),
        target_text: isFormField ? "" : shortText(el), // never log typed values
        target_tag: el.tagName.toLowerCase(),
        target_id: el.id || "",
        target_classes:
          typeof el.className === "string" ? el.className : "",
        target_href: el.getAttribute ? el.getAttribute("href") || "" : "",
        target_name: el.getAttribute ? el.getAttribute("name") || "" : "",
        target_data: JSON.stringify(dataAttrs(el)),
        target_selector: selectorFor(el),
        click_x: e.clientX,
        click_y: e.clientY,
      };
      send(payload);
    },
    true // capture phase: fires before <a> navigation begins
  );

  window.addEventListener(
    "scroll",
    function () {
      trackScrollDepth();
    },
    { passive: true }
  );

  window.addEventListener("pagehide", function () {
    trackPageLeave("pagehide");
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      pauseVisibleTimer();
    } else {
      resumeVisibleTimer();
    }
  });

  // ---- SPA screen tracking (supermarket) -----------------------------------
  function initScreenTracking() {
    var screens = document.querySelectorAll(".screen");
    if (!screens.length) return;

    var lastScreen = "";
    function activeScreen() {
      for (var i = 0; i < screens.length; i++) {
        if (screens[i].classList.contains("is-active")) {
          return screens[i].id || screens[i].getAttribute("aria-label") || "screen";
        }
      }
      return "";
    }
    function report() {
      var now = activeScreen();
      if (now && now !== lastScreen) {
        lastScreen = now;
        send({ event: "screen_view", page: now.replace(/-screen$/, "") });
      }
    }

    var observer = new MutationObserver(report);
    for (var i = 0; i < screens.length; i++) {
      observer.observe(screens[i], {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    report(); // initial screen
  }

  // ---- boot -----------------------------------------------------------------
  function boot() {
    ensureEntry(function () {
      trackPageview();
      refreshScrollDepth();
      trackScrollDepth();
      initScreenTracking();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
