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

  // ---- transport ------------------------------------------------------------
  function send(payload) {
    payload.ts = new Date().toISOString();
    payload.app = APP;
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

  document.addEventListener(
    "click",
    function (e) {
      var raw = e.target;
      if (!raw || raw.nodeType !== 1) return;
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
    trackPageview();
    initScreenTracking();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
