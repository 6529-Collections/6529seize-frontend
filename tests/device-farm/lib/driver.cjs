"use strict";

/**
 * Session helpers for Appium runs on AWS Device Farm.
 *
 * All device coordinates come from the DEVICEFARM_* environment variables that
 * Device Farm exports on its test hosts:
 * https://docs.aws.amazon.com/devicefarm/latest/developerguide/custom-test-environment-variables.html
 *
 * The Appium server is started by the test spec file (tests/device-farm/testspecs)
 * before mocha runs, so this module only opens client sessions against it.
 */

const path = require("node:path");
const { remote } = require("webdriverio");

const APPIUM_HOSTNAME = "127.0.0.1";
const APPIUM_PORT = 4723;
const SAFARI_BUNDLE_ID = "com.apple.mobilesafari";

const APP_PACKAGE = "com.core6529.app";
const APP_ACTIVITY = ".MainActivity";
const DEEP_LINK_SCHEME = "mobile6529";

// Body-text markers that indicate the frontend crashed rather than rendered.
// "Page of Doom" is this app's own error boundary (components/error/Error.tsx)
// — an uncaught client exception renders it INSTEAD of Next.js's default
// "Application error" text, so the branded copy must be matched here or real
// crashes pass the smoke undetected (the default markers are kept for
// framework-level failures that bypass the boundary).
const CRASH_MARKERS = [
  "Welcome to the 6529 Page of Doom",
  "Application error: a client-side exception has occurred",
  "Internal Server Error",
];

function env(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function platformName() {
  return env("DEVICEFARM_DEVICE_PLATFORM_NAME", "Android");
}

function isIos() {
  return platformName().toLowerCase() === "ios";
}

function targetUrl() {
  return env("TARGET_URL", "https://6529.io");
}

function baseCapabilities() {
  const capabilities = {
    platformName: platformName(),
    "appium:deviceName": env("DEVICEFARM_DEVICE_NAME", "device"),
    "appium:newCommandTimeout": 300,
  };
  const osVersion = env("DEVICEFARM_DEVICE_OS_VERSION");
  if (osVersion) {
    capabilities["appium:platformVersion"] = osVersion;
  }
  // iOS 16 and below needs the hyphen-stripped UDID; the test spec exports
  // DEVICEFARM_DEVICE_UDID_FOR_APPIUM with that adjustment already applied.
  const udid = isIos()
    ? env("DEVICEFARM_DEVICE_UDID_FOR_APPIUM", env("DEVICEFARM_DEVICE_UDID"))
    : env("DEVICEFARM_DEVICE_UDID");
  if (udid) {
    capabilities["appium:udid"] = udid;
  }
  return capabilities;
}

async function connect(capabilities, connectionRetryCount = 2) {
  return remote({
    hostname: APPIUM_HOSTNAME,
    port: APPIUM_PORT,
    path: "/",
    logLevel: "warn",
    connectionRetryTimeout: 300000,
    connectionRetryCount,
    capabilities,
  });
}

/**
 * Browser session on the device under test: Chrome on Android, Safari on iOS.
 */
async function startWebSession() {
  const capabilities = baseCapabilities();
  if (isIos()) {
    capabilities.browserName = "Safari";
    capabilities["appium:automationName"] = "XCUITest";
    // Safari's remote debugger can take longer than the 5s driver default to
    // expose the page (session creation failed on a Device Farm iPhone 16 /
    // iOS 18.6.2 with "remote debugger did not return any connected web
    // applications after ~5s").
    capabilities["appium:webviewConnectTimeout"] = 30000;
    // Create a native Safari session first: WDA's initialDeeplinkUrl path
    // checks app.running immediately after opening the URL and raced Safari
    // startup on the SE in run 36123141853. The ordinary app launch waits for
    // XCTest startup; then we open the page and attach explicitly below.
    const [major, minor = 0] = env("DEVICEFARM_DEVICE_OS_VERSION", "")
      .split(".")
      .map(Number);
    if (major > 16 || (major === 16 && minor >= 4)) {
      delete capabilities.browserName;
      capabilities["appium:bundleId"] = SAFARI_BUNDLE_ID;
      capabilities["appium:autoWebview"] = false;
      capabilities["appium:includeSafariInWebviews"] = true;
      capabilities["appium:fullContextList"] = true;
    }
    capabilities["appium:showXcodeLog"] = true;
    const derivedDataPath = env("DEVICEFARM_APPIUM_WDA_DERIVED_DATA_PATH");
    if (derivedDataPath) {
      capabilities["appium:derivedDataPath"] = derivedDataPath;
      capabilities["appium:usePrebuiltWDA"] = true;
    }
  } else {
    capabilities.browserName = "Chrome";
    capabilities["appium:automationName"] = "UiAutomator2";
    const chromedriverDir = env("DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR");
    if (chromedriverDir) {
      capabilities["appium:chromedriverExecutableDir"] = chromedriverDir;
    }
  }
  // Surface the first failed session/command instead of replaying it silently.
  // Fresh Device Farm allocations are the unit of reliability validation.
  const driver = await connect(capabilities, 0);
  if (capabilities["appium:bundleId"] === SAFARI_BUNDLE_ID) {
    try {
      await attachSafariPage(driver);
    } catch (error) {
      // The caller never receives this session if attachment fails.
      await driver.deleteSession().catch(() => {});
      throw error;
    }
  }
  return driver;
}

async function attachSafariPage(driver) {
  const pageUrl = new URL(targetUrl());
  // mobile: deepLink requires iOS 16.4+. Safari is already running, so this
  // opens the page without coupling cold launch to WDA session creation.
  await driver.execute("mobile: deepLink", {
    url: pageUrl.toString(),
    bundleId: SAFARI_BUNDLE_ID,
  });
  let pageContext;
  await driver.waitUntil(
    async () => {
      const contexts = await driver.getContexts();
      pageContext = contexts.find((context) =>
        isSafariPageContext(context, pageUrl)
      );
      return Boolean(pageContext);
    },
    {
      timeout: 30000,
      interval: 1000,
      timeoutMsg: "Safari did not expose the target page context",
    }
  );
  await driver.switchContext(pageContext.id);
}

function isSafariPageContext(context, pageUrl) {
  if (
    context.bundleId !== SAFARI_BUNDLE_ID ||
    !context.id?.startsWith("WEBVIEW_") ||
    !URL.canParse(context.url)
  ) {
    return false;
  }
  const contextUrl = new URL(context.url);
  return (
    contextUrl.origin === pageUrl.origin &&
    contextUrl.pathname.replace(/\/$/, "") ===
      pageUrl.pathname.replace(/\/$/, "")
  );
}

/**
 * Native session against the 6529 Capacitor shell that Device Farm installed
 * on the device before this run started.
 */
async function startNativeAndroidSession() {
  const capabilities = baseCapabilities();
  capabilities["appium:automationName"] = "UiAutomator2";
  capabilities["appium:appPackage"] = APP_PACKAGE;
  capabilities["appium:appActivity"] = APP_ACTIVITY;
  capabilities["appium:appWaitActivity"] = "*";
  capabilities["appium:autoGrantPermissions"] = true;
  // Needed so Appium can attach chromedriver to the shell's WebView context.
  const chromedriverDir = env("DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR");
  if (chromedriverDir) {
    capabilities["appium:chromedriverExecutableDir"] = chromedriverDir;
  }
  return connect(capabilities);
}

async function waitForDocumentReady(driver, timeout) {
  await driver.waitUntil(
    async () =>
      (await driver.execute(() => document.readyState)) === "complete",
    {
      timeout,
      interval: 2000,
      timeoutMsg: "document never reached readyState=complete",
    }
  );
}

/**
 * Navigate and wait until the browser is really on the requested page with
 * rendered content. Safari's WebDriver `url()` can return before navigation
 * starts. Retire the previous document before loading each independent smoke
 * target so its hydration/router effects cannot race the next navigation.
 */
async function openPage(driver, pageUrl, timeout) {
  try {
    await navigateToPage(driver, pageUrl, timeout);
    const connectivity = await browserDiagnostics(driver);
    if (connectivity.online === false) {
      const error = new Error(
        "Device browser reports offline after navigation"
      );
      error.code = "DEVICE_OFFLINE";
      throw error;
    }
  } catch (error) {
    // Diagnostic failures must never replace the original navigation error.
    error.deviceFarmDiagnostics = await browserDiagnostics(driver);
    throw error;
  }
}

async function browserDiagnostics(driver) {
  try {
    return await driver.execute(() => ({
      online: navigator.onLine,
      readyState: document.readyState,
      origin: window.location.origin,
      pathname: window.location.pathname,
    }));
  } catch {
    return { unavailable: true };
  }
}

async function navigateToPage(driver, pageUrl, timeout) {
  const expectedUrl = new URL(pageUrl);
  const expectedPath = expectedUrl.pathname.replace(/\/$/, "") || "/";
  // In run 36099676558, /the-memes initialized its query parameters after
  // Appium accepted /network, leaving Safari on the old document. These are
  // independent direct-load checks, not tests of in-app route transitions.
  // Verify the neutral document has committed before issuing the target once.
  await driver.url("about:blank");
  await driver.waitUntil(
    async () =>
      await driver.execute(
        () =>
          window.location.href === "about:blank" &&
          document.readyState === "complete"
      ),
    {
      timeout,
      interval: 500,
      timeoutMsg: "previous document did not unload to about:blank",
    }
  );
  await driver.url(pageUrl);
  await driver.waitUntil(
    async () => {
      const state = await driver.execute(() => ({
        origin: window.location.origin,
        pathname: window.location.pathname.replace(/\/$/, "") || "/",
        ready: document.readyState === "complete",
        hasContent: Boolean(document.body?.innerText?.trim()),
      }));
      return (
        state.origin === expectedUrl.origin &&
        state.pathname === expectedPath &&
        state.ready &&
        state.hasContent
      );
    },
    {
      timeout,
      interval: 2000,
      timeoutMsg: `${expectedUrl.origin}${expectedPath} never loaded with visible body content`,
    }
  );
}

/**
 * Real-device long-press (W3C touch pointer: down, hold, up) on an element.
 * The hold must exceed the app's long-press threshold
 * (hooks/useLongPressInteraction.ts) with margin for device input latency.
 * W3C pointer actions address the VIEWPORT, so the element is scrolled into
 * view first and targeted via its client rect (not page coordinates).
 */
async function longPress(driver, element, holdMs = 900) {
  await element.scrollIntoView({ block: "center" });
  const { x, y } = await driver.execute((el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(rect.x + rect.width / 2),
      y: Math.round(rect.y + rect.height / 2),
    };
  }, element);
  await driver
    .action("pointer", { parameters: { pointerType: "touch" } })
    .move({ x, y })
    .down()
    .pause(holdMs)
    .up()
    .perform();
}

async function waitForWebviewContext(driver, timeout) {
  let webviewContext;
  await driver.waitUntil(
    async () => {
      const contexts = await driver.getContexts();
      webviewContext = contexts
        .map((context) => (typeof context === "string" ? context : context.id))
        .find((id) => id?.includes("WEBVIEW"));
      return Boolean(webviewContext);
    },
    { timeout, interval: 3000, timeoutMsg: "no WEBVIEW context appeared" }
  );
  return webviewContext;
}

function assertNoCrashMarkers(assert, bodyText, where) {
  for (const marker of CRASH_MARKERS) {
    assert.ok(
      !bodyText.includes(marker),
      `${where} shows the crash marker "${marker}"`
    );
  }
}

/**
 * Screenshots land in $DEVICEFARM_LOG_DIR so Device Farm collects them as
 * customer artifacts. Failures to capture never fail the test itself.
 */
async function saveScreenshot(driver, name) {
  try {
    const dir = env("DEVICEFARM_LOG_DIR", ".");
    await driver.saveScreenshot(path.join(dir, `${name}.png`));
  } catch (error) {
    console.warn(`Could not capture screenshot "${name}": ${error.message}`);
  }
}

module.exports = {
  APP_PACKAGE,
  DEEP_LINK_SCHEME,
  assertNoCrashMarkers,
  isIos,
  longPress,
  openPage,
  saveScreenshot,
  startNativeAndroidSession,
  startWebSession,
  targetUrl,
  waitForDocumentReady,
  waitForWebviewContext,
};
