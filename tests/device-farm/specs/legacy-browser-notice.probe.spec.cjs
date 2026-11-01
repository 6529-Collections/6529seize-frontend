"use strict";

/**
 * Legacy-browser notice probe: checks on real devices that the "update iOS"
 * gate (fixtures/legacy-browser-gate.json) shows its notice on engines that
 * cannot parse class static blocks (iOS < 16.4) and stays hidden elsewhere.
 *
 * The gate is not deployed where a farm device can reach it, so the probe
 * reproduces the real document parse: it loads the signed-out production
 * home page (whose CSP allows inline script and style) and, from a deferred
 * page task, replaces the document with document.open/write/close. The
 * written page holds the gate's styles and three scripts in <head> and the
 * notice plus a stand-in app root in <body>, so the scripts are
 * parser-inserted and run exactly as they would in the real layout.
 *
 * A data collector, not a gate: the outcome is recorded and never fails the
 * run. Read-only against production; the replacement exists only in the
 * device's tab.
 *
 * Output: one `LEGACY_NOTICE_RESULT {json}` line on stdout and
 * `legacy-notice-result.json` plus a screenshot in $DEVICEFARM_LOG_DIR.
 *
 * Not wired into the QA workflow. To run it, render a test spec from
 * testspecs/web-<platform>.yml with __TARGET_URL__ substituted and
 * `npm run test:web` replaced by `npm run test:legacy-notice-probe`, then
 * schedule an APPIUM_WEB_NODE run with the packaged bundle.
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  openPage,
  saveScreenshot,
  startWebSession,
  targetUrl,
} = require("../lib/driver.cjs");

const GATE = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "fixtures", "legacy-browser-gate.json"),
    "utf8"
  )
);

const PAGE_LOAD_TIMEOUT_MS = 90000;
const PAGE_SETTLE_MS = 3000;
const WRITE_TIMEOUT_MS = 30000;
const RESULT_SETTLE_MS = 2000;

// Probe instrument, written before the gate's own markup: records window
// error events (the syntax script's parse error must surface here on old
// engines) and marks that the replacement document was parsed. It never
// touches the gate's flag. It lives inside the written document because
// document.open() erases listeners registered on the window beforehand.
const RECORDER_SCRIPT =
  "window.__legacyProbeWritten=true;window.__legacyProbeErrors=[];" +
  "window.addEventListener('error',function(e){" +
  "window.__legacyProbeErrors.push(String(e.message)+' (line '+e.lineno+':'+e.colno+')')});";

function buildHtml(gate) {
  return [
    "<!DOCTYPE html><html><head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<script>${RECORDER_SCRIPT}</script>`,
    `<style>${gate.styles}</style>`,
    `<script>${gate.flagScript}</script>`,
    `<script>${gate.syntaxScript}</script>`,
    `<script>${gate.noticeScript}</script>`,
    "</head><body>",
    gate.noticeHtml,
    '<div id="app-root">app</div>',
    "</body></html>",
  ].join("");
}

/**
 * Runs in the page. Deferred with setTimeout so the write happens in an
 * ordinary page task rather than inside the remote debugger's evaluation.
 */
function replaceDocument(html) {
  setTimeout(function () {
    document.open();
    document.write(html);
    document.close();
  }, 50);
  return "scheduled";
}

/** Runs in the page; returns the outcome as a JSON string. */
function measure(attribute) {
  function display(selector) {
    var element = document.querySelector(selector);
    return element ? getComputedStyle(element).display : "missing";
  }
  var notice = document.getElementById("legacy-browser-notice");
  var noticeDisplay = display("#legacy-browser-notice");
  var rect = notice ? notice.getBoundingClientRect() : null;
  var flag = window.__6529LegacyBrowser;
  return JSON.stringify({
    written: window.__legacyProbeWritten === true,
    flag: flag === undefined ? "undefined" : flag,
    attribute: document.documentElement.getAttribute(attribute),
    noticeDisplay: noticeDisplay,
    appRootDisplay: display("#app-root"),
    variants: notice
      ? Array.prototype.map.call(
          notice.querySelectorAll("[data-legacy-variant]"),
          function (element) {
            return (
              element.getAttribute("data-legacy-variant") +
              ":" +
              getComputedStyle(element).display
            );
          }
        )
      : [],
    // innerText of an unrendered element falls back to all its text, so
    // only report text when the notice is actually displayed.
    visibleNoticeText:
      notice && noticeDisplay !== "none" ? notice.innerText.trim() : "",
    noticeCoversViewport: rect
      ? rect.width >= window.innerWidth - 1 &&
        rect.height >= window.innerHeight - 1
      : false,
    errors: window.__legacyProbeErrors || null,
    bodyChildren: document.body
      ? Array.prototype.map.call(document.body.children, function (element) {
          return element.tagName.toLowerCase() + (element.id ? "#" + element.id : "");
        })
      : null,
    userAgent: navigator.userAgent,
  });
}

/**
 * openPage, falling back to in-page navigation: on a Device Farm iPhone 12 /
 * iOS 26.6 the XCUITest driver's url() failed with "'Page.navigate' was not
 * found" from the Safari remote debugger.
 */
async function openPageWithFallback(driver, pageUrl) {
  try {
    await openPage(driver, pageUrl, PAGE_LOAD_TIMEOUT_MS);
    return "webdriver-url";
  } catch (error) {
    console.warn(
      `url() navigation failed (${error.message}); using location.assign`
    );
    await driver.execute((url) => {
      window.location.assign(url);
    }, pageUrl);
    await driver.waitUntil(
      async () =>
        (await driver.execute(() => window.location.href)).startsWith(pageUrl),
      {
        timeout: PAGE_LOAD_TIMEOUT_MS,
        interval: 2000,
        timeoutMsg: `location.assign never reached ${pageUrl}`,
      }
    );
    await driver.waitUntil(
      async () =>
        (await driver.execute(() => document.readyState)) === "complete",
      { timeout: PAGE_LOAD_TIMEOUT_MS, interval: 2000 }
    );
    return "location-assign";
  }
}

function deviceInfo() {
  return {
    name: process.env.DEVICEFARM_DEVICE_NAME || null,
    platform: process.env.DEVICEFARM_DEVICE_PLATFORM_NAME || null,
    os: process.env.DEVICEFARM_DEVICE_OS_VERSION || null,
  };
}

function writeArtifact(result) {
  try {
    const dir = process.env.DEVICEFARM_LOG_DIR || ".";
    fs.writeFileSync(
      path.join(dir, "legacy-notice-result.json"),
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    console.warn(`Could not write the probe artifact: ${error.message}`);
  }
}

describe("Legacy-browser notice probe (real device)", function () {
  let driver;

  before(async function () {
    driver = await startWebSession();
  });

  after(async function () {
    if (driver) {
      await driver.deleteSession().catch(() => {});
    }
  });

  it("records whether the legacy-browser notice shows", async function () {
    const navigation = await openPageWithFallback(
      driver,
      new URL("/", targetUrl()).toString()
    );
    await driver.pause(PAGE_SETTLE_MS);

    await driver.execute(replaceDocument, buildHtml(GATE));

    let raw = null;
    try {
      await driver.waitUntil(
        async () => {
          raw = await driver.execute(measure, GATE.attribute);
          return JSON.parse(raw).written === true;
        },
        { timeout: WRITE_TIMEOUT_MS, interval: 1000 }
      );
    } catch {
      // Recorded below as written: false.
    }
    await driver.pause(RESULT_SETTLE_MS);
    raw = await driver.execute(measure, GATE.attribute).catch(() => raw);

    const result = {
      device: deviceInfo(),
      target: targetUrl(),
      navigation,
      outcome: raw ? JSON.parse(raw) : null,
    };
    console.log(`LEGACY_NOTICE_RESULT ${JSON.stringify(result)}`);
    writeArtifact(result);
    await saveScreenshot(driver, "legacy-notice");
  });
});
