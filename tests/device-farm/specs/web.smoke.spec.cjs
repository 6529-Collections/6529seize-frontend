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
  saveScreenshot,
  startWebSession,
  targetUrl,
  waitForDocumentReady,
} = require("../lib/driver.cjs");

const PAGE_LOAD_TIMEOUT_MS = 90000;

const PAGES = [
  { name: "home", path: "/", expectBodyText: null },
  { name: "the-memes", path: "/the-memes", expectBodyText: "meme" },
  { name: "network", path: "/network", expectBodyText: null },
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
      await driver.url(new URL(page.path, targetUrl()).toString());
      await waitForDocumentReady(driver, PAGE_LOAD_TIMEOUT_MS);

      const bodyText = await driver.execute(() => document.body.innerText || "");
      assertNoCrashMarkers(assert, bodyText, page.path);
      assert.ok(
        bodyText.trim().length > 0,
        `${page.path} rendered an empty body`
      );
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
    await driver.url(targetUrl());
    await waitForDocumentReady(driver, PAGE_LOAD_TIMEOUT_MS);

    const title = await driver.getTitle();
    assert.ok(
      title.toLowerCase().includes("6529"),
      `home page title "${title}" does not mention 6529`
    );

    const hasNavigationChrome = await driver.execute(() =>
      Boolean(document.querySelector("header, nav, [role='navigation']"))
    );
    assert.ok(hasNavigationChrome, "home page has no header/nav chrome");
  });

  it("keeps the mobile viewport free of horizontal overflow", async function () {
    await driver.url(targetUrl());
    await waitForDocumentReady(driver, PAGE_LOAD_TIMEOUT_MS);

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
});
