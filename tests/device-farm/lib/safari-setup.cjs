"use strict";

const SETTINGS_BUNDLE_ID = "com.apple.Preferences";
const SAFARI_BUNDLE_ID = "com.apple.mobilesafari";
const INSPECTOR_PREDICATE =
  'type == "XCUIElementTypeSwitch" AND (name == "Web Inspector" OR label == "Web Inspector")';

/** Return Settings to its root without assuming the previous allocation's screen. */
async function openSettingsRoot(driver) {
  await driver.execute("mobile: launchApp", { bundleId: SETTINGS_BUNDLE_ID });
  const rootSelector =
    '-ios predicate string:type == "XCUIElementTypeNavigationBar" AND name == "Settings"';
  for (let depth = 0; depth <= 8; depth += 1) {
    if (await (await driver.$(rootSelector)).isDisplayed()) return;
    if (depth === 8) break;
    await (
      await driver.$(
        "-ios class chain:**/XCUIElementTypeNavigationBar/XCUIElementTypeButton[1]"
      )
    ).click();
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
    await driver.execute("mobile: launchApp", { bundleId: SAFARI_BUNDLE_ID });
  } catch (error) {
    error.code = "SAFARI_WEB_INSPECTOR_SETUP";
    error.deviceFarmDiagnostics = { startupStage: "web-inspector-setup" };
    throw error;
  }
}

module.exports = { ensureSafariWebInspector };
