"use strict";

/**
 * Mobile web smoke pack — runs the deployed 6529 frontend in a real device
 * browser (Chrome on Android, Safari on iOS) on AWS Device Farm.
 *
 * Read-only by design: navigation and DOM reads only, no authentication and
 * no mutations, so it is safe against production.
 */

const assert = require("node:assert");
const {
  assertNoCrashMarkers,
  longPress,
  openPage,
  saveScreenshot,
  startWebSession,
  targetUrl,
} = require("../lib/driver.cjs");

const PAGE_LOAD_TIMEOUT_MS = 90000;

// Public wave (6529 Releases) — readable logged-out, so the smoke can cover
// the wave surface: it runs websockets and the touch action sheet, both of
// which have shipped device-specific crashes/regressions that the static
// pages above cannot catch.
const PUBLIC_WAVE_PATH = "/waves/05b14183-e153-4e47-bc66-42a0f49102d4";

const PAGES = [
  { name: "home", path: "/", expectBodyText: null },
  { name: "the-memes", path: "/the-memes", expectBodyText: "meme" },
  { name: "network", path: "/network", expectBodyText: null },
  { name: "releases-wave", path: PUBLIC_WAVE_PATH, expectBodyText: null },
];

describe("6529 mobile web smoke (real device)", function () {
  let driver;

  before(async function () {
    driver = await startWebSession();
  });

  after(async function () {
    if (driver) {
      await driver.deleteSession().catch(() => {});
    }
  });

  afterEach(async function () {
    if (driver && this.currentTest && this.currentTest.state === "failed") {
      await saveScreenshot(driver, `web-failed-${this.currentTest.title.replace(/[^a-z0-9]+/gi, "-")}`);
    }
  });

  for (const page of PAGES) {
    it(`renders ${page.path} without crashing`, async function () {
      await openPage(
        driver,
        new URL(page.path, targetUrl()).toString(),
        PAGE_LOAD_TIMEOUT_MS
      );

      const bodyText = await driver.execute(() => document.body.innerText || "");
      assertNoCrashMarkers(assert, bodyText, page.path);
      if (page.expectBodyText) {
        assert.ok(
          bodyText.toLowerCase().includes(page.expectBodyText),
          `${page.path} body does not mention "${page.expectBodyText}"`
        );
      }
      await saveScreenshot(driver, `web-${page.name}`);
    });
  }

  it("serves the 6529 app shell on the home page", async function () {
    await openPage(driver, targetUrl(), PAGE_LOAD_TIMEOUT_MS);

    // The home page's own title mentions 6529; give SPA title effects a
    // moment to settle instead of asserting the first paint.
    await driver.waitUntil(
      async () => (await driver.getTitle()).toLowerCase().includes("6529"),
      {
        timeout: 30000,
        interval: 2000,
        timeoutMsg: "home page title never mentioned 6529",
      }
    );

    const hasNavigationChrome = await driver.execute(() =>
      Boolean(document.querySelector("header, nav, [role='navigation']"))
    );
    assert.ok(hasNavigationChrome, "home page has no header/nav chrome");
  });

  it("keeps the mobile viewport free of horizontal overflow", async function () {
    await openPage(driver, targetUrl(), PAGE_LOAD_TIMEOUT_MS);

    const overflowPx = await driver.execute(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    assert.ok(
      overflowPx <= 1,
      `home page overflows the viewport horizontally by ${overflowPx}px`
    );
  });

  // Regression net for the touch-affordance surface: real phones must keep
  // the long-press action sheet. Two shipped incidents motivate this exact
  // flow — an iOS-only crash class around the wave surface (branded "Page of
  // Doom" error boundary), and touch devices being misclassified as
  // mouse-driven (fine-pointer latch), which silently removes long-press and
  // leaves hover-only menus a finger cannot reach. Read-only: the sheet is
  // opened and dismissed, nothing is posted.
  it("long-press on a wave message opens the touch action sheet", async function () {
    await openPage(
      driver,
      new URL(PUBLIC_WAVE_PATH, targetUrl()).toString(),
      PAGE_LOAD_TIMEOUT_MS
    );

    // Wave messages hydrate after the shell; wait for a long-pressable row.
    // `.touch-select-none` is the app's own marker for rows whose text
    // selection is disabled in favor of the long-press interaction.
    const row = await driver.$(".touch-select-none:last-of-type");
    await row.waitForExist({ timeout: 60000 });

    await longPress(driver, row);

    // The sheet is a dialog listing drop actions; "Copy text" is present for
    // both signed-in and logged-out sheets since 4.69.0.
    await driver.waitUntil(
      async () =>
        await driver.execute(() => {
          const dialog = document.querySelector("dialog[open], [role='dialog']");
          return Boolean(dialog && dialog.textContent.includes("Copy text"));
        }),
      {
        timeout: 20000,
        interval: 1000,
        timeoutMsg:
          "long-press did not open the wave action sheet (touch affordances lost?)",
      }
    );
    await saveScreenshot(driver, "web-wave-action-sheet");

    // The page must have survived the interaction (no error boundary).
    const bodyText = await driver.execute(() => document.body.innerText || "");
    assertNoCrashMarkers(assert, bodyText, `${PUBLIC_WAVE_PATH} action sheet`);

    // Leave the page clean for subsequent tests.
    const closed = await driver.execute(() => {
      const dialog = document.querySelector("dialog[open], [role='dialog']");
      if (!dialog) return true;
      const cancel = [...dialog.querySelectorAll("button")].find((button) =>
        button.textContent.trim().toLowerCase().startsWith("cancel")
      );
      if (cancel) {
        cancel.click();
        return true;
      }
      return false;
    });
    assert.ok(closed, "could not dismiss the action sheet via Cancel");
  });
});
