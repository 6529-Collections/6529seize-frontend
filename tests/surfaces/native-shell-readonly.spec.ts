import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../testHelpers";
import { gotoReady } from "../support/routeReadiness";
import {
  isCapacitorSimulationProject,
  isElectronSimulationProject,
} from "../support/surfaceSimulation";

type ShellRuntime = {
  readonly capacitorIsNative?: unknown;
  readonly capacitorPlatform?: unknown;
  readonly appPluginAvailable?: unknown;
  readonly customPlatform?: unknown;
  readonly devicePluginAvailable?: unknown;
  readonly keyboardPluginAvailable?: unknown;
  readonly navigatorStandalone?: unknown;
  readonly surface?: unknown;
  readonly userAgentHasElectron: boolean;
};

const COUNTRY_CHECK_PATTERN = "**/api/policies/country-check";
const PUBLIC_WAVE_PATH =
  process.env["TARGET_WAVE_PATH"] ??
  (process.env["PLAYWRIGHT_COMPOSER_SANDBOX"] === "1"
    ? "/waves/00000000-0000-4000-8000-000000000529"
    : "/waves/05b14183-e153-4e47-bc66-42a0f49102d4");

async function forceExpandedDesktopSidebar(page: Page) {
  await page.addInitScript(() => {
    if (globalThis.self !== globalThis.top) {
      return;
    }
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

async function waitForCountryCheck(page: Page) {
  // Call without awaiting before navigation so the listener observes route load requests.
  try {
    return await page.waitForResponse(
      (response) => response.url().includes("/api/policies/country-check"),
      { timeout: 10_000 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Expected /api/policies/country-check while loading /open-data: ${message}`
    );
  }
}

async function readShellRuntime(page: Page): Promise<ShellRuntime> {
  return page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & {
      Capacitor?: {
        getPlatform?: () => unknown;
        isPluginAvailable?: (pluginName: string) => unknown;
        isNativePlatform?: () => unknown;
      };
      CapacitorCustomPlatform?: { name?: unknown };
      __PLAYWRIGHT_SURFACE__?: unknown;
    };

    return {
      capacitorIsNative: runtime.Capacitor?.isNativePlatform?.(),
      capacitorPlatform: runtime.Capacitor?.getPlatform?.(),
      appPluginAvailable: runtime.Capacitor?.isPluginAvailable?.("App"),
      customPlatform: runtime.CapacitorCustomPlatform?.name,
      devicePluginAvailable: runtime.Capacitor?.isPluginAvailable?.("Device"),
      keyboardPluginAvailable:
        runtime.Capacitor?.isPluginAvailable?.("Keyboard"),
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

async function expectUsableNotificationTarget(dock: Locator) {
  const bell = dock.getByRole("link", { name: "Notifications", exact: true });
  await expect(bell).toBeVisible();
  await expect(dock.getByRole("link")).toHaveCount(7);

  const target = await bell.evaluate((link) => {
    const box = link.getBoundingClientRect();
    const icon = link.querySelector("svg");
    if (!icon) {
      throw new Error("Expected a visible notification bell icon.");
    }
    const iconBox = icon.getBoundingClientRect();
    const dockElement = link.closest('[data-mobile-bottom-nav-dock="true"]');
    if (!dockElement) {
      throw new Error("Expected the notification link inside the mobile dock.");
    }
    const dockBox = dockElement.getBoundingClientRect();
    const center = {
      x: iconBox.x + iconBox.width / 2,
      y: iconBox.y + iconBox.height / 2,
    };
    // Sample the visible icon's center, edges, and corners one pixel inside
    // its 48px target. Bounding boxes alone miss rounded clipping and overlays.
    const hits = [-23, 0, 23].flatMap((offsetX) =>
      [-23, 0, 23].map((offsetY) => ({
        offsetX,
        offsetY,
        hitsBell:
          document
            .elementFromPoint(center.x + offsetX, center.y + offsetY)
            ?.closest("a") === link,
      }))
    );

    return {
      center,
      dockRightClearance: dockBox.right - center.x,
      width: box.width,
      height: box.height,
      horizontalOffset: Math.abs(center.x - (box.x + box.width / 2)),
      topClearance: center.y - box.top,
      bottomClearance: box.bottom - center.y,
      missedPoints: hits.filter((hit) => !hit.hitsBell),
    };
  });
  expect(target.width).toBeGreaterThanOrEqual(48);
  expect(target.height).toBeGreaterThanOrEqual(48);
  expect(target.horizontalOffset).toBeLessThanOrEqual(0.5);
  expect(target.topClearance).toBeGreaterThanOrEqual(24 - 0.01);
  expect(target.bottomClearance).toBeGreaterThanOrEqual(24 - 0.01);
  expect(target.dockRightClearance).toBeGreaterThanOrEqual(24 - 0.01);
  expect(target.missedPoints).toEqual([]);

  const overlappingLinks = await dock.getByRole("link").evaluateAll((links) => {
    const boxes = links.map((link) => ({
      name: link.getAttribute("aria-label"),
      left: link.getBoundingClientRect().left,
      right: link.getBoundingClientRect().right,
    }));
    return boxes.filter((box, index) => {
      const previous = boxes[index - 1];
      return previous !== undefined && box.left < previous.right - 0.01;
    });
  });
  expect(overlappingLinks).toEqual([]);

  return target.center;
}

async function scrollAboutToCompact(page: Page) {
  const position = await page.evaluate(async () => {
    const element =
      Array.from(
        document.querySelectorAll(
          '[data-mobile-bottom-nav-scroll-target="true"]'
        )
      ).find((candidate) => candidate.scrollHeight > candidate.clientHeight) ??
      document.scrollingElement;
    if (!element) {
      throw new Error("Expected a scrollable About page.");
    }
    // Give the dock's scroll tracker a real initial position before crossing
    // its threshold; /about supplies the content, without injected spacers.
    element.scrollTo({ top: 1, behavior: "instant" });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    element.scrollTo({ top: 240, behavior: "instant" });
    return element.scrollTop;
  });
  expect(position).toBeGreaterThan(100);
}

async function resetNotificationHistoryPushCount(page: Page) {
  await page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & {
      __notificationHistoryPushCount?: number;
      __notificationHistoryPushWrapped?: boolean;
    };
    runtime.__notificationHistoryPushCount = 0;
    if (runtime.__notificationHistoryPushWrapped) return;

    const originalPushState = globalThis.history.pushState.bind(
      globalThis.history
    );
    globalThis.history.pushState = (data, unused, url) => {
      if (
        url !== undefined &&
        new URL(String(url), globalThis.location.href).pathname ===
          "/notifications"
      ) {
        runtime.__notificationHistoryPushCount =
          (runtime.__notificationHistoryPushCount ?? 0) + 1;
      }
      originalPushState(data, unused, url);
    };
    runtime.__notificationHistoryPushWrapped = true;
  });
}

async function readNotificationHistoryPushCount(page: Page) {
  return page.evaluate(
    () =>
      (
        globalThis as typeof globalThis & {
          __notificationHistoryPushCount?: number;
        }
      ).__notificationHistoryPushCount ?? 0
  );
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
      appPluginAvailable: true,
      customPlatform: platform,
      devicePluginAvailable: true,
      keyboardPluginAvailable: true,
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
    const countryCheck = waitForCountryCheck(page);

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

  test("iOS native simulation keeps US subscription downloads visible", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-ios-sim",
      "iOS subscription visibility is covered on the iOS Capacitor simulation"
    );

    await mockCountryCheck(page, "US");
    const countryCheck = waitForCountryCheck(page);

    await gotoReady(page, "/open-data");
    await countryCheck;

    await expect(
      page.getByRole("heading", { level: 1, name: "Open Data" })
    ).toBeVisible();
    const subscriptionsLink = page.getByRole("link", {
      name: "Meme Subscriptions",
    });
    await expect(subscriptionsLink).toBeVisible();
    await expect(subscriptionsLink).toHaveAttribute(
      "href",
      "/open-data/meme-subscriptions"
    );
  });

  test("Android native simulation keeps subscription downloads visible", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-android-sim",
      "Android subscription visibility is covered on the Android Capacitor simulation"
    );

    await mockCountryCheck(page, "FR");
    const countryCheck = waitForCountryCheck(page);

    await gotoReady(page, "/open-data");
    await countryCheck;

    await expect(
      page.getByRole("heading", { level: 1, name: "Open Data" })
    ).toBeVisible();
    const subscriptionsLink = page.getByRole("link", {
      name: "Meme Subscriptions",
    });
    await expect(subscriptionsLink).toBeVisible();
    await expect(subscriptionsLink).toHaveAttribute(
      "href",
      "/open-data/meme-subscriptions"
    );
  });

  test("Android notification bell accepts first taps across phone dock sizes", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-android-sim",
      "Notification touch targets are covered on the Android Capacitor simulation"
    );

    await mockCountryCheck(page, "FR");

    for (const width of [320, 360, 412]) {
      await page.setViewportSize({ width, height: 780 });
      await gotoReady(page, "/about");
      await expect(page.locator("body")).toHaveClass(/capacitor-native/);
      const heading = page.getByRole("heading", {
        level: 1,
        name: "About 6529",
      });
      await expect(heading).toBeVisible();
      const dock = page.locator('[data-mobile-bottom-nav-dock="true"]');
      const bell = dock.getByRole("link", {
        name: "Notifications",
        exact: true,
      });
      await expect(bell).toBeVisible();
      for (const compact of [false, true]) {
        await test.step(`${width}px ${compact ? "compact" : "expanded"}`, async () => {
          if (compact) {
            await scrollAboutToCompact(page);
          }
          await expect
            .poll(() =>
              dock.evaluate((element) => element.getBoundingClientRect().height)
            )
            .toBe(compact ? 54 : 64);

          const center = await expectUsableNotificationTarget(dock);
          // Use trusted touchscreen input at the outer corner, where the
          // original capsule-shaped link silently dropped the first tap.
          const point = { x: center.x + 23, y: center.y + 23 };
          await resetNotificationHistoryPushCount(page);
          if (width === 360 && !compact) {
            const touch = await page.context().newCDPSession(page);
            try {
              await touch.send("Input.dispatchTouchEvent", {
                type: "touchStart",
                touchPoints: [point],
              });
              await expect(bell).toHaveAttribute("data-pressed", "true");
              await expect(bell.locator(":scope > div")).toHaveCSS(
                "opacity",
                "0.5"
              );
              await scrollAboutToCompact(page);
              // Release as soon as the transition moves the target, without
              // Playwright relocating the input to the moving link.
              await expect
                .poll(() =>
                  dock.evaluate(
                    (element) => element.getBoundingClientRect().height
                  )
                )
                .toBeLessThan(64);
              await touch.send("Input.dispatchTouchEvent", {
                type: "touchEnd",
                touchPoints: [],
              });
            } finally {
              await touch
                .send("Input.dispatchTouchEvent", {
                  type: "touchCancel",
                  touchPoints: [],
                })
                .catch(() => undefined);
              await touch.detach();
            }
          } else {
            await page.touchscreen.tap(point.x, point.y);
          }
          await expect(page).toHaveURL(/\/notifications$/);
          await expect
            .poll(() => readNotificationHistoryPushCount(page))
            .toBe(1);
          await expect(
            dock.getByRole("link", { name: "Notifications", exact: true })
          ).toHaveAttribute("aria-current", "page");
          const activePill = dock.getByTestId("mobile-dock-active-pill");
          await expect(activePill).toHaveCSS("opacity", "1");
          const activePillOffset = await activePill.evaluate((pill) => {
            const pillBox = pill.getBoundingClientRect();
            const activeIcon = pill
              .closest('[data-mobile-bottom-nav-dock="true"]')
              ?.querySelector('a[aria-current="page"] svg');
            if (!activeIcon) {
              throw new Error("Expected an active mobile navigation icon.");
            }
            const iconBox = activeIcon.getBoundingClientRect();
            return Math.abs(
              pillBox.x + pillBox.width / 2 - (iconBox.x + iconBox.width / 2)
            );
          });
          expect(activePillOffset).toBeLessThanOrEqual(0.5);
          if (width === 360 && !compact) {
            await expect(bell).not.toHaveAttribute("data-pressed");
            await page.keyboard.press("Tab");
            await bell.focus();
            await expect(bell).toBeFocused();
            await expect(bell).toHaveCSS("outline-style", "solid");
            await expect(bell).toHaveCSS("outline-width", "2px");
          }
          await page.goBack();
          await expect(page).toHaveURL(/\/about$/);
          await expect(heading).toBeVisible();
        });
      }
    }
  });

  test("Android notification bell distinguishes dock movement from a drag", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-android-sim",
      "Notification transition gestures are covered on the Android Capacitor simulation"
    );

    await mockCountryCheck(page, "FR");
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoReady(page, "/about");
    const dock = page.locator('[data-mobile-bottom-nav-dock="true"]');
    const bell = dock.getByRole("link", {
      name: "Notifications",
      exact: true,
    });
    await expect
      .poll(() =>
        dock.evaluate((element) => element.getBoundingClientRect().height)
      )
      .toBe(64);
    const center = await expectUsableNotificationTarget(dock);
    const point = { x: center.x - 23, y: center.y };
    await resetNotificationHistoryPushCount(page);
    const touch = await page.context().newCDPSession(page);
    try {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      await scrollAboutToCompact(page);
      await expect
        .poll(() =>
          dock.evaluate((element) => element.getBoundingClientRect().height)
        )
        .toBeLessThan(64);
      expect(
        await bell.evaluate((link, releasePoint) => {
          const bounds = link.getBoundingClientRect();
          return (
            releasePoint.x >= bounds.left &&
            releasePoint.x <= bounds.right &&
            releasePoint.y >= bounds.top &&
            releasePoint.y <= bounds.bottom
          );
        }, point)
      ).toBe(true);
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    } finally {
      await touch
        .send("Input.dispatchTouchEvent", {
          type: "touchCancel",
          touchPoints: [],
        })
        .catch(() => undefined);
      await touch.detach();
    }

    await expect(page).toHaveURL(/\/notifications$/);
    await expect.poll(() => readNotificationHistoryPushCount(page)).toBe(1);
    await page.goBack();
    await expect(page).toHaveURL(/\/about$/);
    await expect
      .poll(() =>
        dock.evaluate((element) => element.getBoundingClientRect().height)
      )
      .toBe(54);

    const dragCenter = await expectUsableNotificationTarget(dock);
    await resetNotificationHistoryPushCount(page);
    const dragTouch = await page.context().newCDPSession(page);
    try {
      await dragTouch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [dragCenter],
      });
      await dragTouch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: dragCenter.x - 20, y: dragCenter.y }],
      });
      await dragTouch.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    } finally {
      await dragTouch
        .send("Input.dispatchTouchEvent", {
          type: "touchCancel",
          touchPoints: [],
        })
        .catch(() => undefined);
      await dragTouch.detach();
    }

    await expect(page).toHaveURL(/\/about$/);
    expect(await readNotificationHistoryPushCount(page)).toBe(0);
    await expect(bell).not.toHaveAttribute("data-pressed");

    await bell.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/notifications$/);
    await expect.poll(() => readNotificationHistoryPushCount(page)).toBe(1);
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

  test("Capacitor messages shell renders native app chrome", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Capacitor messages shell is covered only on Capacitor simulation projects"
    );

    await gotoReady(page, "/messages");

    await expect(page.locator("body")).toHaveClass(/capacitor-native/);
    // Native messages can render the authenticated page or its wallet/profile
    // gate depending on available local auth, but it must stay inside native chrome.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /connected wallets|profile to continue|messages/i,
      })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "DMs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "DMs" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  test("Electron app-wallet shell remains unsupported without native storage", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isElectronSimulationProject(testInfo.project.name),
      "Electron app-wallet unsupported copy is covered only on the Electron shell simulation"
    );

    await gotoReady(page, "/tools/app-wallets");
    await expect(await readShellRuntime(page)).toEqual(
      expect.objectContaining({
        capacitorIsNative: false,
        capacitorPlatform: "web",
        customPlatform: undefined,
        navigatorStandalone: undefined,
        surface: "electron-shell-sim",
        userAgentHasElectron: true,
      })
    );

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

test.describe("Native iPad drop actions @surface @medium @readonly", () => {
  test.use({
    hasTouch: true,
    isMobile: false,
    viewport: { width: 1194, height: 834 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });

  test("keeps the touch action button usable when the WebView reports desktop input", async ({
    page,
  }, testInfo) => {
    const runsOnIosCapacitor =
      isCapacitorSimulationProject(testInfo.project.name) &&
      expectedCapacitorPlatform(testInfo.project.name) === "ios";
    test.skip(
      // NOSONAR -- This shared cross-project spec runs the iPad regression only in its iOS simulation.
      !runsOnIosCapacitor,
      "Native iPad drop actions are covered on the iOS Capacitor simulation"
    );

    await page.addInitScript(() => {
      globalThis.localStorage.setItem("6529-fine-pointer", "1");
    });

    await gotoReady(page, PUBLIC_WAVE_PATH);

    await expect(page.locator("body")).toHaveClass(/capacitor-native/);
    await expect(page.locator("body")).toHaveAttribute(
      "data-fine-pointer",
      "true"
    );
    await expect(page.locator("[data-wave-drop-id]").first()).toBeVisible({
      timeout: 30_000,
    });

    const actionButton = page
      .getByRole("button", { name: "Open drop actions" })
      .first();
    await expect(actionButton).toBeVisible({ timeout: 30_000 });
    await actionButton.click();

    const copyTextAction = page
      .getByRole("button", { name: /copy text/i })
      .first();
    await expect(copyTextAction).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("Escape");
    await expect(copyTextAction).toBeHidden({ timeout: 10_000 });
  });
});
