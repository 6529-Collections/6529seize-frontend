import type { Page } from "@playwright/test";

import { expect, test } from "../testHelpers";
import { gotoReady } from "../support/routeReadiness";
import {
  isCapacitorSimulationProject,
  isElectronSimulationProject,
} from "../support/surfaceSimulation";

type ShellRuntime = {
  readonly capacitorIsNative?: unknown;
  readonly capacitorPlatform?: unknown;
  readonly customPlatform?: unknown;
  readonly navigatorStandalone?: unknown;
  readonly surface?: unknown;
  readonly userAgentHasElectron: boolean;
};

const COUNTRY_CHECK_PATTERN = "**/api/policies/country-check";

async function forceExpandedDesktopSidebar(page: Page) {
  await page.addInitScript(() => {
    globalThis.sessionStorage.setItem("sidebarCollapsed", "false");
  });
}

async function mockCountryCheck(page: Page, country: string) {
  await page.route(COUNTRY_CHECK_PATTERN, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        country,
        is_consent: false,
        is_eu: country !== "US",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
}

async function readShellRuntime(page: Page): Promise<ShellRuntime> {
  return page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & {
      Capacitor?: {
        getPlatform?: () => unknown;
        isNativePlatform?: () => unknown;
      };
      CapacitorCustomPlatform?: { name?: unknown };
      __PLAYWRIGHT_SURFACE__?: unknown;
    };

    return {
      capacitorIsNative: runtime.Capacitor?.isNativePlatform?.(),
      capacitorPlatform: runtime.Capacitor?.getPlatform?.(),
      customPlatform: runtime.CapacitorCustomPlatform?.name,
      navigatorStandalone: (
        globalThis.navigator as Navigator & {
          standalone?: unknown;
        }
      ).standalone,
      surface: runtime.__PLAYWRIGHT_SURFACE__,
      userAgentHasElectron: globalThis.navigator.userAgent.includes("Electron"),
    };
  });
}

function expectedCapacitorPlatform(projectName: string) {
  if (projectName === "capacitor-ios-sim") {
    return "ios";
  }
  if (projectName === "capacitor-android-sim") {
    return "android";
  }
  throw new Error(`Unexpected Capacitor simulation project: ${projectName}`);
}

test.describe("Native and Electron simulated shell read-only coverage @surface @medium @readonly", () => {
  test("Capacitor simulations expose native runtime signals", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Capacitor runtime signals are covered only on Capacitor simulation projects"
    );

    const platform = expectedCapacitorPlatform(testInfo.project.name);

    await gotoReady(page, "/");

    await expect(page.locator("body")).toHaveClass(/capacitor-native/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /viewport-fit=cover/
    );
    await expect(await readShellRuntime(page)).toEqual({
      capacitorIsNative: true,
      capacitorPlatform: platform,
      customPlatform: platform,
      navigatorStandalone: true,
      surface: `capacitor-${platform}-sim`,
      userAgentHasElectron: false,
    });
  });

  test("iOS native simulation hides non-US subscription downloads", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-ios-sim",
      "iOS subscription visibility is covered on the iOS Capacitor simulation"
    );

    await mockCountryCheck(page, "FR");
    const countryCheck = page.waitForResponse((response) =>
      response.url().includes("/api/policies/country-check")
    );

    await gotoReady(page, "/open-data");
    await countryCheck;

    await expect(
      page.getByRole("heading", { level: 1, name: "Open Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Network Metrics" })
    ).toHaveAttribute("href", "/open-data/network-metrics");
    await expect(
      page.getByRole("link", { name: "Meme Subscriptions" })
    ).toHaveCount(0);
  });

  test("Android native simulation keeps subscription downloads visible", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-android-sim",
      "Android subscription visibility is covered on the Android Capacitor simulation"
    );

    await mockCountryCheck(page, "FR");
    const countryCheck = page.waitForResponse((response) =>
      response.url().includes("/api/policies/country-check")
    );

    await gotoReady(page, "/open-data");
    await countryCheck;

    await expect(
      page.getByRole("heading", { level: 1, name: "Open Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Meme Subscriptions" })
    ).toHaveAttribute("href", "/open-data/meme-subscriptions");
  });

  test("Capacitor app-wallet shell renders the simulated empty wallet state", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Capacitor app-wallet shell is covered only on Capacitor simulation projects"
    );

    await gotoReady(page, "/tools/app-wallets");

    await expect(
      page.getByRole("heading", { level: 1, name: "App Wallets" })
    ).toBeVisible();
    await expect(page.getByText("No wallets found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Wallet" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Import Wallet" })
    ).toBeVisible();
  });

  test("Electron app-wallet shell remains unsupported without native storage", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isElectronSimulationProject(testInfo.project.name),
      "Electron app-wallet unsupported copy is covered only on the Electron shell simulation"
    );

    await gotoReady(page, "/tools/app-wallets");

    await expect(
      page.getByRole("heading", { level: 1, name: "App Wallets" })
    ).toBeVisible();
    await expect(
      page.getByText("App Wallets are not supported on this platform")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Wallet" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Import Wallet" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "TAKE ME HOME" })
    ).toHaveAttribute("href", "/");
  });

  test("Electron shell suppresses desktop handoff inside share modal", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isElectronSimulationProject(testInfo.project.name),
      "Electron handoff behavior is covered only on the Electron shell simulation"
    );

    await forceExpandedDesktopSidebar(page);
    await gotoReady(page, "/");

    await expect(await readShellRuntime(page)).toEqual(
      expect.objectContaining({
        surface: "electron-shell-sim",
        userAgentHasElectron: true,
      })
    );

    await page
      .locator('[aria-label="Primary sidebar"]')
      .getByRole("button", { name: "QR Code" })
      .click();

    const modal = page.getByTestId("header-share-modal");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "Current URL" })
    ).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "6529 Apps" })
    ).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "6529 Mobile" })
    ).toBeVisible();
    await expect(modal.getByRole("button", { name: "Browser" })).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "6529 Desktop" })
    ).toHaveCount(0);
  });
});
