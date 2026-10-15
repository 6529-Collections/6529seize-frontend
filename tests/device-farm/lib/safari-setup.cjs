"use strict";

const SETTINGS_BUNDLE_ID = "com.apple.Preferences";
const SAFARI_BUNDLE_ID = "com.apple.mobilesafari";
const INSPECTOR_PREDICATE =
  'type == "XCUIElementTypeSwitch" AND (name == "Web Inspector" OR label == "Web Inspector")';
const SETTINGS_ROOT_SELECTOR =
  '-ios predicate string:(type == "XCUIElementTypeNavigationBar" OR type == "XCUIElementTypeStaticText") AND name == "Settings"';
const BACK_SELECTOR =
  "-ios class chain:**/XCUIElementTypeNavigationBar/XCUIElementTypeButton[1]";

/** Observe readiness without replaying a failed native command. */
async function waitForNativeState(driver, observe, timeoutMsg) {
  let failure;
  await driver.waitUntil(
    async () => {
      try {
        return await observe();
      } catch (error) {
        failure = error;
        return true;
      }
    },
    { timeout: 10000, interval: 250, timeoutMsg }
  );
  if (failure) throw failure;
}

async function launchForegroundApp(driver, bundleId) {
  await driver.execute("mobile: launchApp", { bundleId });
  // launchApp can return while WDA still selects the preceding application's
  // hierarchy. Do not interpret that application's missing controls as Settings.
  await waitForNativeState(
    driver,
    async () =>
      (await driver.execute("mobile: activeAppInfo")).bundleId === bundleId,
    `App did not become active: ${bundleId}`
  );
}

async function settingsNavigation(driver) {
  let atRoot = false;
  let back;
  await waitForNativeState(
    driver,
    async () => {
      atRoot = await (await driver.$(SETTINGS_ROOT_SELECTOR)).isDisplayed();
      if (atRoot) return true;
      back = await driver.$(BACK_SELECTOR);
      return back.isDisplayed();
    },
    "Settings navigation did not become ready"
  );
  return { atRoot, back };
}

/** Return Settings to its root without assuming the previous allocation's screen. */
async function openSettingsRoot(driver) {
  await launchForegroundApp(driver, SETTINGS_BUNDLE_ID);
  for (let depth = 0; depth <= 8; depth += 1) {
    const { atRoot, back } = await settingsNavigation(driver);
    if (atRoot) return;
    if (depth === 8) break;
    if (!back) {
      throw new Error(
        "Settings back control is missing after navigation readiness"
      );
    }
    await back.click();
  }
  throw new Error("Could not reach the Settings root for Safari Web Inspector");
}

async function visibleSetting(driver, predicateString) {
  const selector = `-ios predicate string:${predicateString}`;
  let element = await driver.$(selector);
  if (!(await element.isDisplayed())) {
    await driver.execute("mobile: scroll", { predicateString });
    element = await driver.$(selector);
  }
  if (!(await element.isDisplayed())) {
    throw new Error(`Safari setup control is not visible: ${predicateString}`);
  }
  return element;
}

async function openSettingsCell(driver, name) {
  const cell = await visibleSetting(
    driver,
    `type == "XCUIElementTypeCell" AND (name == "${name}" OR label == "${name}")`
  );
  await cell.click();
}

/** Enable the real-device prerequisite before the first Web Inspector connection. */
async function ensureSafariWebInspector(driver, osVersion) {
  try {
    await openSettingsRoot(driver);
    // The pinned pools use English Settings. iOS 18 moved Safari under Apps.
    if (Number(osVersion.split(".")[0]) >= 18) {
      await openSettingsCell(driver, "Apps");
    }
    await openSettingsCell(driver, "Safari");
    await openSettingsCell(driver, "Advanced");
    const inspector = await visibleSetting(driver, INSPECTOR_PREDICATE);
    const initialValue = await inspector.getAttribute("value");
    if (initialValue !== "0" && initialValue !== "1") {
      throw new Error(`Unknown Web Inspector switch value: ${initialValue}`);
    }
    if (initialValue === "0") {
      if (!(await inspector.isEnabled())) {
        throw new Error("Web Inspector is disabled and its setting is locked");
      }
      await inspector.click();
    }
    // Read it back even when initially enabled. Never toggle blindly or retry.
    const verifiedValue = await (
      await driver.$(`-ios predicate string:${INSPECTOR_PREDICATE}`)
    ).getAttribute("value");
    if (verifiedValue !== "1") {
      throw new Error("Web Inspector did not remain enabled after setup");
    }
    console.log(
      `Safari Web Inspector verified enabled (initial value: ${initialValue})`
    );
    await launchForegroundApp(driver, SAFARI_BUNDLE_ID);
  } catch (error) {
    error.code = "SAFARI_WEB_INSPECTOR_SETUP";
    error.deviceFarmDiagnostics = { startupStage: "web-inspector-setup" };
    throw error;
  }
}

module.exports = { ensureSafariWebInspector };
