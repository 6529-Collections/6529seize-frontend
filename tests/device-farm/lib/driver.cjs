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

const APP_PACKAGE = "com.core6529.app";
const APP_ACTIVITY = ".MainActivity";
const DEEP_LINK_SCHEME = "mobile6529";

// Body-text markers that indicate the frontend crashed rather than rendered.
const CRASH_MARKERS = [
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

async function connect(capabilities) {
  return remote({
    hostname: APPIUM_HOSTNAME,
    port: APPIUM_PORT,
    path: "/",
    logLevel: "warn",
    connectionRetryTimeout: 300000,
    connectionRetryCount: 2,
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
  return connect(capabilities);
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
    async () => (await driver.execute(() => document.readyState)) === "complete",
    { timeout, interval: 2000, timeoutMsg: "document never reached readyState=complete" }
  );
}

/**
 * Navigate and wait until the browser is really on the requested page with
 * rendered content. Safari's WebDriver `url()` can return before navigation
 * starts (observed on Device Farm iPhones: the previous page's readyState
 * satisfies a naive readiness check), so this waits for the expected pathname
 * and a non-empty body rather than trusting the first readyState=complete.
 */
async function openPage(driver, pageUrl, timeout) {
  const expectedPath = new URL(pageUrl).pathname.replace(/\/$/, "") || "/";
  await driver.url(pageUrl);
  await driver.waitUntil(
    async () => {
      const pathname = await driver.execute(() =>
        window.location.pathname.replace(/\/$/, "")
      );
      return (pathname || "/") === expectedPath;
    },
    {
      timeout,
      interval: 2000,
      timeoutMsg: `browser never navigated to ${expectedPath}`,
    }
  );
  await waitForDocumentReady(driver, timeout);
  await driver.waitUntil(
    async () =>
      (await driver.execute(() => (document.body.innerText || "").trim()))
        .length > 0,
    {
      timeout,
      interval: 2000,
      timeoutMsg: `${expectedPath} never rendered visible body content`,
    }
  );
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
  openPage,
  saveScreenshot,
  startNativeAndroidSession,
  startWebSession,
  targetUrl,
  waitForDocumentReady,
  waitForWebviewContext,
};
