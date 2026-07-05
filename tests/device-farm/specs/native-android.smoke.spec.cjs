"use strict";

/**
 * Native Android shell smoke pack — validates the 6529 Capacitor shell
 * (6529-Collections/6529-core-mobile) on AWS Device Farm real devices.
 *
 * The shell is a thin WebView that loads https://6529.io remotely, so the
 * contract under test is the shell itself: it launches, boots the remote
 * frontend inside its WebView, and honours mobile6529:// deep links.
 * Read-only: no authentication and no mutations against production.
 */

const assert = require("node:assert");
const {
  APP_PACKAGE,
  DEEP_LINK_SCHEME,
  assertNoCrashMarkers,
  saveScreenshot,
  startNativeAndroidSession,
  waitForDocumentReady,
  waitForWebviewContext,
} = require("../lib/driver.cjs");

const EXPECTED_WEB_HOST = process.env.EXPECTED_WEB_HOST || "6529.io";
const WEBVIEW_BOOT_TIMEOUT_MS = 180000;
const DEEP_LINK_TIMEOUT_MS = 90000;

describe("6529 native Android shell smoke (real device)", function () {
  let driver;

  before(async function () {
    driver = await startNativeAndroidSession();
  });

  after(async function () {
    if (driver) {
      await driver.deleteSession().catch(() => {});
    }
  });

  afterEach(async function () {
    if (driver && this.currentTest && this.currentTest.state === "failed") {
      await saveScreenshot(driver, `native-failed-${this.currentTest.title.replace(/[^a-z0-9]+/gi, "-")}`);
    }
  });

  it("launches the shell app", async function () {
    const currentPackage = await driver.getCurrentPackage();
    assert.strictEqual(
      currentPackage,
      APP_PACKAGE,
      `foreground package is ${currentPackage}, expected ${APP_PACKAGE}`
    );
  });

  it("boots the remote 6529 frontend inside the WebView", async function () {
    const webviewContext = await waitForWebviewContext(
      driver,
      WEBVIEW_BOOT_TIMEOUT_MS
    );
    await driver.switchContext(webviewContext);
    await waitForDocumentReady(driver, WEBVIEW_BOOT_TIMEOUT_MS);

    await driver.waitUntil(
      async () => {
        const host = await driver.execute(() => window.location.hostname);
        return host === EXPECTED_WEB_HOST || host.endsWith(`.${EXPECTED_WEB_HOST}`);
      },
      {
        timeout: WEBVIEW_BOOT_TIMEOUT_MS,
        interval: 3000,
        timeoutMsg: `WebView never loaded a ${EXPECTED_WEB_HOST} page`,
      }
    );

    const bodyText = await driver.execute(() => document.body.innerText || "");
    assertNoCrashMarkers(assert, bodyText, "the shell WebView");
    assert.ok(bodyText.trim().length > 0, "the shell WebView rendered an empty body");
    await saveScreenshot(driver, "native-webview-home");
  });

  it(`navigates via ${DEEP_LINK_SCHEME}:// deep links`, async function () {
    await driver.switchContext("NATIVE_APP");
    await driver.execute("mobile: deepLink", {
      url: `${DEEP_LINK_SCHEME}://navigate/the-memes`,
      package: APP_PACKAGE,
    });

    const webviewContext = await waitForWebviewContext(
      driver,
      DEEP_LINK_TIMEOUT_MS
    );
    await driver.switchContext(webviewContext);
    await driver.waitUntil(
      async () => {
        const pathname = await driver.execute(() => window.location.pathname);
        return pathname.startsWith("/the-memes");
      },
      {
        timeout: DEEP_LINK_TIMEOUT_MS,
        interval: 3000,
        timeoutMsg: "deep link did not navigate the WebView to /the-memes",
      }
    );
    await saveScreenshot(driver, "native-deeplink-the-memes");
  });
});
