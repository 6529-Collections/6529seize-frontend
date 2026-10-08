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
  test("native profile artwork opens above the app header and closes back to the profile", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Native profile artwork geometry is covered on Capacitor simulations"
    );
    const dropId =
      process.env["TARGET_DROP_ID"] ??
      (process.env["PLAYWRIGHT_COMPOSER_SANDBOX"] === "1"
        ? "00000000-0000-4000-8000-000000000530"
        : "74b13174-b34f-43e5-b302-23680f0d0b05");
    await gotoReady(page, `/punk6529?drop=${dropId}`);
    const artwork = page.getByRole("main").locator("[data-video-viewport]");
    await expect(artwork).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(() =>
        artwork.evaluate((element) => element.getBoundingClientRect().top)
      )
      .toBe(0);
    await expect
      .poll(() =>
        artwork.evaluate(
          (element) =>
            element.getBoundingClientRect().height - window.innerHeight
        )
      )
      .toBe(0);
    const close = artwork.getByRole("button", {
      name: "Close panel",
      exact: true,
    });
    await expect(close).toBeInViewport({ ratio: 1 });
    const share = artwork.getByRole("button", {
      name: "Share drop",
      exact: true,
    });
    await expect(share).toBeInViewport({ ratio: 1 });
    await share.click({ trial: true });
    await page.screenshot({
      path: testInfo.outputPath("native-profile-artwork.png"),
    });
    await close.click();
    await expect(artwork).toHaveCount(0);
    await expect(page).toHaveURL((url) => !url.searchParams.has("drop"));
    await expect(
      page.getByRole("navigation", { name: "Profile sections" })
    ).toBeVisible();
  });

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
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /maximum-scale=1(?:,|$)/);
    await expect(viewport).toHaveAttribute("content", /user-scalable=no/);
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

    // A client-side navigation must not restore the web zoom limits.
    await page
      .getByRole("link", { name: "Open network health dashboard" })
      .click();
    await expect(page).toHaveURL(/\/network\/health$/, { timeout: 15_000 });
    await expect(viewport).toHaveAttribute("content", /maximum-scale=1(?:,|$)/);
    await expect(viewport).toHaveAttribute("content", /user-scalable=no/);
  });

  for (const reducedMotion of [false, true]) {
    test(`iOS Waves navigation ${reducedMotion ? "respects reduced motion" : "moves into and out of a wave"}`, async ({
      page,
    }, testInfo) => {
      // This flow exercises the native iOS layout, not the web/Electron shells.
      test.skip(
        testInfo.project.name !== "capacitor-ios-sim",
        "Wave content navigation uses the native app layout"
      );
      await page.emulateMedia({
        reducedMotion: reducedMotion ? "reduce" : "no-preference",
      });
      await gotoReady(page, "/waves");
      const surface = page.getByTestId("wave-navigation-content");
      await expect(surface).toHaveAttribute(
        "data-wave-navigation-screen",
        "list"
      );
      const waveList = page.getByRole("region", {
        name: "All recent waves list",
        exact: true,
      });
      const waveLink = waveList.getByRole("link").first();
      await expect(waveLink).toBeVisible();

      const waitForMotion = (snapshots = false) =>
        page.waitForFunction((useSnapshots) => {
          const animations = useSnapshots
            ? document
                .getAnimations()
                .filter(
                  (animation) =>
                    animation.effect instanceof KeyframeEffect &&
                    animation.effect.pseudoElement?.includes("wave-navigation")
                )
            : (document
                .querySelector("[data-wave-navigation-screen]")
                ?.getAnimations() ?? []);
          const animation = useSnapshots
            ? animations.find(
                (item) =>
                  item.effect instanceof KeyframeEffect &&
                  item.effect.pseudoElement ===
                    "::view-transition-new(wave-navigation)"
              )
            : animations[0];
          if (!animation || animation.playState !== "running") return null;
          const effect = animation.effect;
          if (!(effect instanceof KeyframeEffect)) return null;
          const frames = effect.getKeyframes();
          for (const item of animations) {
            item.pause();
            item.currentTime = 100;
          }
          return {
            transform: frames[0]?.["transform"],
            duration: effect.getTiming().duration,
            outgoingVisible: animations.some(
              (item) =>
                item.effect instanceof KeyframeEffect &&
                item.effect.pseudoElement ===
                  "::view-transition-old(wave-navigation)"
            ),
          };
        }, snapshots);
      const finishMotion = () =>
        page.evaluate(() => {
          for (const animation of document.getAnimations()) {
            if (
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement?.includes("wave-navigation")
            )
              animation.finish();
          }
          document
            .querySelector("[data-wave-navigation-screen]")
            ?.getAnimations()
            .forEach((animation) => animation.finish());
        });
      const listHeight = await surface.evaluate(
        (element) => element.getBoundingClientRect().height
      );
      const readHeaderGeometry = () =>
        surface.evaluate((element) => {
          const header = element.previousElementSibling;
          if (!header)
            throw new Error("Expected header outside the animated content");
          const { x, y, width, height } = header.getBoundingClientRect();
          return {
            x,
            y,
            width,
            height,
            transform: getComputedStyle(header).transform,
          };
        });
      const headerGeometry = await readHeaderGeometry();
      const opening = reducedMotion ? null : waitForMotion(true);
      // Read the clicked destination at activation: live activity can reorder rows.
      const clickedDestination = page.evaluate(
        () =>
          new Promise<string | null>((resolve) => {
            document.addEventListener(
              "click",
              (event) => {
                const target = event.target;
                resolve(
                  target instanceof Element
                    ? (target.closest("a")?.getAttribute("href") ?? null)
                    : null
                );
              },
              { once: true, capture: true }
            );
          })
      );
      await waveLink.click();
      const path = await clickedDestination;
      if (!path) throw new Error("Expected a clicked wave destination");
      await expect(page).toHaveURL(new URL(path, page.url()).toString());
      await expect(surface).toHaveAttribute(
        "data-wave-navigation-screen",
        "wave"
      );
      if (opening) {
        expect(await (await opening).jsonValue()).toEqual({
          transform: "scale(0.98)",
          duration: 260,
          outgoingVisible: true,
        });
        expect(
          await page.evaluate(() =>
            Number.parseFloat(
              getComputedStyle(
                document.documentElement,
                "::view-transition-group(wave-navigation)"
              ).height
            )
          )
        ).toBeGreaterThanOrEqual(listHeight);
        expect(await readHeaderGeometry()).toEqual(headerGeometry);
        await page.screenshot({
          path: testInfo.outputPath("wave-opening.png"),
        });
        await finishMotion();
      } else {
        expect(
          await surface.evaluate((element) => element.getAnimations().length)
        ).toBe(0);
      }
      await expect
        .poll(() =>
          surface.evaluate((element) => getComputedStyle(element).transform)
        )
        .toBe("none");
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-wave-navigation-transition"
      );
      const returning = reducedMotion ? null : waitForMotion();
      await page.goBack();
      await expect(surface).toHaveAttribute(
        "data-wave-navigation-screen",
        "list"
      );
      if (returning) {
        expect(await (await returning).jsonValue()).toEqual({
          transform: "scale(1.02)",
          duration: 240,
          outgoingVisible: false,
        });
        await finishMotion();
      } else {
        expect(
          await surface.evaluate((element) => element.getAnimations().length)
        ).toBe(0);
      }
      await expect(
        page.getByRole("button", { name: "Find a wave…", exact: true })
      ).toBeVisible();
      if (!reducedMotion) {
        const reopened = waitForMotion(true);
        await waveLink.click();
        await reopened;
        await finishMotion();
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-wave-navigation-transition"
        );
        const closing = waitForMotion(true);
        await page.getByRole("button", { name: "Back", exact: true }).click();
        expect(await (await closing).jsonValue()).toEqual({
          transform: "scale(1)",
          duration: 260,
          outgoingVisible: true,
        });
        expect(await readHeaderGeometry()).toEqual(headerGeometry);
        await page.screenshot({
          path: testInfo.outputPath("wave-returning.png"),
        });
        await finishMotion();
        await expect(surface).toHaveAttribute(
          "data-wave-navigation-screen",
          "list"
        );
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-wave-navigation-transition"
        );
      }
    });
  }

  test("iOS Waves search stays above the keyboard and restores its list height", async ({
    page,
  }, testInfo) => {
    // Native keyboard overlay geometry differs from web and Electron layouts.
    test.skip(
      testInfo.project.name !== "capacitor-ios-sim",
      "Keyboard geometry is covered on the iOS Capacitor simulation"
    );
    await gotoReady(page, "/waves");
    const scrollport = page
      .getByRole("region", { name: "Wave discovery", exact: true })
      .locator(
        'xpath=ancestor::div[@data-mobile-bottom-nav-scroll-target="true"][1]'
      )
      .filter({ visible: true });
    await expect(scrollport).toBeVisible();
    const searchToggle = page.getByRole("button", {
      name: "Find a wave…",
      exact: true,
    });
    await expect(searchToggle).toBeVisible();
    await expect
      .poll(() =>
        scrollport.evaluate(
          (element) => element.scrollHeight - element.clientHeight
        )
      )
      .toBeGreaterThan(500);
    await scrollport.evaluate(async (element) => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
      element.scrollTo({ top: 1000, behavior: "instant" });
    });
    await expect
      .poll(() => scrollport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(500);
    await page.screenshot({ path: testInfo.outputPath("sticky-search.png") });
    await expect
      .poll(() =>
        searchToggle.evaluate((element) => {
          const controls = element.closest(".tw-sticky");
          const scrollport = element.closest(
            '[data-mobile-bottom-nav-scroll-target="true"]'
          );
          if (!controls || !scrollport) return Number.POSITIVE_INFINITY;
          return Math.abs(
            controls.getBoundingClientRect().top -
              scrollport.getBoundingClientRect().top
          );
        })
      )
      .toBeLessThanOrEqual(1);
    // Compare the same layout measurement before and after the keyboard cycle.
    const restingHeight = await scrollport.evaluate(
      (element) => element.clientHeight
    );
    await searchToggle.click();
    const input = page.getByRole("searchbox", { name: "Find a wave…" });
    await expect(input).toBeFocused();

    // Match native overlay mode: the visual viewport shrinks while the layout
    // viewport stays full height. The shared keyboard hook owns the CSS inset.
    await page.evaluate(() => {
      const viewport = globalThis.visualViewport;
      if (!viewport) throw new Error("Expected a visual viewport");
      Object.defineProperty(viewport, "height", {
        configurable: true,
        value: globalThis.innerHeight - 320,
      });
      viewport.dispatchEvent(new Event("resize"));
    });
    await expect
      .poll(() => scrollport.evaluate((element) => element.clientHeight))
      .toBeLessThan(restingHeight - 250);
    await expect
      .poll(() =>
        input.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const scrollport = element.closest(
            '[data-mobile-bottom-nav-scroll-target="true"]'
          );
          if (!scrollport) return false;
          const visible = scrollport.getBoundingClientRect();
          return bounds.top >= visible.top && bounds.bottom <= visible.bottom;
        })
      )
      .toBe(true);
    await input.fill("xx");
    await expect(input).toHaveValue("xx");
    await page.getByRole("button", { name: "Close wave search" }).click();
    await page.evaluate(() => {
      const viewport = globalThis.visualViewport;
      if (!viewport) throw new Error("Expected a visual viewport");
      Reflect.deleteProperty(viewport, "height");
      viewport.dispatchEvent(new Event("resize"));
    });
    await expect
      .poll(() => scrollport.evaluate((element) => element.clientHeight))
      .toBeCloseTo(restingHeight, 0);
    await expect(page.getByText("All Waves", { exact: true })).toBeVisible();
  });

  test("Network filter keeps the focused input and action above the keyboard", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Keyboard geometry is covered on the Capacitor simulation projects"
    );
    await gotoReady(page, "/network");
    const openFilters = page.getByRole("button", {
      name: "Open group filters",
      exact: true,
    });
    await openFilters.click();
    const filter = page.getByRole("dialog", {
      name: "Filter Network",
      exact: true,
    });
    await filter
      .getByRole("group", { name: "Filter Network", exact: true })
      .getByRole("button", { name: "Level", exact: true })
      .click();
    const input = filter.getByRole("spinbutton", {
      name: "Level at least",
      exact: true,
    });
    const summary = filter.getByText("After editing", { exact: true });
    const action = filter.getByRole("button", {
      name: "Create and use new group",
      exact: true,
    });
    await input.fill("10");
    await expect(input).toBeFocused();
    await expect(summary).toBeVisible();

    // Exercise the same native overlay geometry as the Waves search contract.
    await page.evaluate(() => {
      const viewport = globalThis.visualViewport;
      if (!viewport) throw new Error("Expected a visual viewport");
      Object.defineProperty(viewport, "height", {
        configurable: true,
        value: globalThis.innerHeight - 320,
      });
      viewport.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator("html")).toHaveAttribute(
      "data-native-keyboard-visible",
      "true"
    );
    await expect(summary).toBeHidden();
    await expect
      .poll(() =>
        input.evaluate((element) => {
          const viewport = globalThis.visualViewport;
          if (!viewport) return false;
          const bounds = element.getBoundingClientRect();
          let top = viewport.offsetTop;
          let bottom = top + viewport.height;
          for (
            let parent = element.parentElement;
            parent;
            parent = parent.parentElement
          ) {
            if (
              !/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)
            )
              continue;
            const clip = parent.getBoundingClientRect();
            top = Math.max(top, clip.top);
            bottom = Math.min(bottom, clip.bottom);
          }
          return bounds.top >= top && bounds.bottom <= bottom;
        })
      )
      .toBe(true);
    await expect
      .poll(() =>
        action.evaluate((element) => {
          const viewport = globalThis.visualViewport;
          if (!viewport) return false;
          const bounds = element.getBoundingClientRect();
          return (
            bounds.top >= viewport.offsetTop &&
            bounds.bottom <= viewport.offsetTop + viewport.height
          );
        })
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("network-keyboard.png"),
    });

    await page.evaluate(() => {
      const viewport = globalThis.visualViewport;
      if (!viewport) throw new Error("Expected a visual viewport");
      Reflect.deleteProperty(viewport, "height");
      viewport.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-native-keyboard-visible",
      "true"
    );
    await expect(summary).toBeVisible();
    await expect(input).toHaveValue("10");
    await filter.getByRole("button", { name: "Close", exact: true }).click();
    await expect(openFilters).toBeFocused();
    await expect(page).toHaveURL((url) => !url.searchParams.has("group"));
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

  test("Capacitor primary tabs stay usable across phone and tablet orientations", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Primary-tab responsive behavior is covered on Capacitor simulations"
    );

    const viewports = [
      { name: "phone portrait", width: 390, height: 844 },
      { name: "phone landscape", width: 844, height: 390 },
      { name: "tablet portrait", width: 834, height: 1194 },
      { name: "tablet landscape", width: 1194, height: 834 },
    ] as const;

    await page.setViewportSize(viewports[0]);
    await gotoReady(page, "/about");

    for (const viewport of viewports) {
      await test.step(viewport.name, async () => {
        await page.setViewportSize(viewport);

        const dock = page.locator('[data-mobile-bottom-nav-dock="true"]');
        await expect(dock).toBeVisible();
        await expectUsableNotificationTarget(dock);
      });
    }
  });

  test("Capacitor primary tabs keep the latest delayed destination without restyling icons", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Primary-tab transition feedback is covered on Capacitor simulations"
    );

    let notificationRequests = 0;
    let collectionRequests = 0;
    let releaseNotifications!: () => void;
    let releaseCollections!: () => void;
    const notificationsReleased = new Promise<void>((resolve) => {
      releaseNotifications = resolve;
    });
    const collectionsReleased = new Promise<void>((resolve) => {
      releaseCollections = resolve;
    });

    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.has("_rsc")) {
        if (url.pathname === "/notifications") {
          notificationRequests += 1;
          await notificationsReleased;
        } else if (url.pathname === "/the-memes") {
          collectionRequests += 1;
          await collectionsReleased;
        }
      }

      await route.continue();
    });

    await gotoReady(page, "/about");
    const dock = page.locator('[data-mobile-bottom-nav-dock="true"]');
    const notifications = dock.getByRole("link", {
      name: "Notifications",
      exact: true,
    });
    const collections = dock.getByRole("link", {
      name: "Collections",
      exact: true,
    });

    try {
      await notifications.tap({ noWaitAfter: true });
      await expect.poll(() => notificationRequests).toBeGreaterThan(0);
      await expect(
        notifications.getByTestId("nav-item-pending-indicator")
      ).toHaveCount(0);

      await collections.tap({ noWaitAfter: true });
      await expect.poll(() => collectionRequests).toBeGreaterThan(0);
      await expect(
        collections.getByTestId("nav-item-pending-indicator")
      ).toHaveCount(0);

      releaseCollections();
      await expect(page).toHaveURL(/\/the-memes$/, { timeout: 20_000 });
      await expect(collections).toHaveAttribute("aria-current", "page", {
        timeout: 20_000,
      });
    } finally {
      releaseCollections();
      releaseNotifications();
    }
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
