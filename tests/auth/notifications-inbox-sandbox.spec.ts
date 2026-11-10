import { installArtworkNotificationImage } from "../support/artworkNotification";
import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  fetchSandboxRequests,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import AxeBuilder from "@axe-core/playwright";
import { ApiNotificationCause } from "../../generated/models/ApiNotificationCause";
import type { ApiNotificationsResponseV2 } from "../../generated/models/ApiNotificationsResponseV2";
import type { Locator } from "@playwright/test";
import { ApiVotingCreditReleaseReason } from "../../generated/models/ApiVotingCreditReleaseReason";

async function expectCenteredCloseControl(inbox: Locator) {
  const close = inbox.getByRole("button", { name: "Close notifications" });
  await expect(close).toBeVisible();
  const geometry = await close.evaluate((button) => {
    const target = button.getBoundingClientRect();
    const icon = button.querySelector("svg")!.getBoundingClientRect();
    return {
      width: target.width,
      height: target.height,
      horizontalOffset: icon.x + icon.width / 2 - target.x - target.width / 2,
      verticalOffset: icon.y + icon.height / 2 - target.y - target.height / 2,
    };
  });
  expect(geometry.width).toBeGreaterThanOrEqual(32);
  expect(geometry.height).toBe(geometry.width);
  expect(Math.abs(geometry.horizontalOffset)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(geometry.verticalOffset)).toBeLessThanOrEqual(0.5);
}

test.describe("Notifications inbox sandbox @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Notifications inbox requires the local mock API runner."
  );
  test.beforeEach(async ({ page }) => {
    await installArtworkNotificationImage(page);
    await page.route("**/api/profile-cms/assets?*", async (route) => {
      const source =
        new URL(route.request().url()).searchParams.get("url") ?? "";
      if (source.endsWith("/6529-emoji/emoji-list.json")) {
        await route.fulfill({ json: ["6529"] });
      } else if (source.endsWith("/6529-emoji/6529.webp")) {
        await route.fulfill({
          path: "public/favicon.png",
          contentType: "image/png",
        });
      } else {
        await route.fallback();
      }
    });
  });
  test("desktop preview marks notifications read, preserves the route, restores focus, and opens a destination", async ({
    page,
    baseURL,
  }, testInfo) => {
    // The shared pack runs both projects; the mobile scenario below covers its full-page bell.
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    await page.route("**/api/v2/notifications?*", async (route) => {
      const response = await route.fetch();
      const data = (await response.json()) as ApiNotificationsResponseV2;
      const relatedWave = data.notifications.find(
        (notification) => notification.related_wave
      )?.related_wave;
      if (!relatedWave)
        throw new Error("Sandbox notifications need a related wave");
      const wave = { ...relatedWave, pfp: "/favicon.png" };
      data.notifications = data.notifications.map((notification) => ({
        ...notification,
        related_wave: wave,
        additional_context: {
          ...notification.additional_context,
          ...(notification.cause === ApiNotificationCause.DropReacted && {
            reactors: [
              { handle: "sandbox-bob", pfp: "/favicon.png", subscribed: false },
              {
                handle: "sandbox-carol",
                pfp: "/favicon.png",
                subscribed: false,
              },
            ],
          }),
        },
      }));
      const customReaction = data.notifications.find(
        (notification) =>
          notification.cause === ApiNotificationCause.DropReacted
      );
      if (!customReaction) throw new Error("Sandbox needs a reaction");
      data.notifications.push({
        ...customReaction,
        id: 2000,
        additional_context: {
          ...customReaction.additional_context,
          reaction: ":6529:",
        },
      });
      data.notifications.push({
        id:
          Math.max(
            ...data.notifications.map((notification) => notification.id)
          ) + 1,
        cause: ApiNotificationCause.VotingCreditsReturned,
        created_at: Date.now(),
        read_at: 1,
        related_identity: null,
        related_drops: [],
        related_wave: wave,
        additional_context: {
          event_id: "sandbox-credit-release",
          reason: ApiVotingCreditReleaseReason.AuthorDeleted,
          wave_id: wave.id,
          competition_id: "sandbox-competition",
          competition_title: "Sandbox Main Stage",
          entry_id: "sandbox-entry",
          drop_id: "deleted-drop",
          submission_title: "Sandbox artwork",
          credit_type: "TDH",
          amount: 10,
          released_at: Date.now(),
        },
      });
      await route.fulfill({ response, json: data });
    });
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const trigger = page.getByRole("link", {
      name: "Notifications",
      exact: true,
    });
    await expect(trigger).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const route = page.url();
    await trigger.hover();
    const inbox = page.getByRole("region", {
      name: "Notifications",
      exact: true,
    });
    await expect(
      inbox.getByText("sandbox-alice mentioned you", { exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expectCenteredCloseControl(inbox);
    await expect(
      inbox.getByText("New reactions to your drop", { exact: true })
    ).toHaveCount(1);
    const reactionRow = inbox.getByRole("link").filter({
      hasText: "New reactions to your drop",
    });
    for (const handle of ["sandbox-bob", "sandbox-carol"]) {
      await expect(
        reactionRow.getByRole("img", { name: handle, exact: true })
      ).toHaveCount(1);
    }
    await expect(
      reactionRow.getByRole("img", { name: "Thumbs Up", exact: true })
    ).toHaveCount(1);
    await expect(reactionRow.getByText("👍", { exact: true })).toBeVisible();
    const customEmoji = reactionRow.getByRole("img", {
      name: "6529",
      exact: true,
    });
    await expect(customEmoji).toBeVisible();
    await expect
      .poll(() =>
        customEmoji
          .getByAltText("6529")
          .evaluate((img: HTMLImageElement) => img.naturalWidth)
      )
      .toBeGreaterThan(0);
    for (const summary of [
      "New reactions to your drop",
      "10 voting credits returned in Sandbox Main Stage",
    ]) {
      const picture = inbox
        .getByRole("link")
        .filter({ hasText: summary })
        .locator('img[alt=""]')
        .first();
      await expect(picture).toHaveAttribute("src", "/favicon.png");
      await expect(picture).toBeVisible();
      await expect
        .poll(() =>
          picture.evaluate((img: HTMLImageElement) => img.naturalWidth)
        )
        .toBeGreaterThan(0);
    }
    await expect(
      inbox.getByText("A sandbox drop with grouped reactions.", { exact: true })
    ).toHaveCount(1);
    await expect(
      inbox.getByText("reacted to your drop", { exact: false })
    ).toHaveCount(0);
    await expect(
      inbox.getByText("@playwright and #QUORUM", { exact: true })
    ).toBeVisible();
    await expect(
      inbox.getByText("@[playwright]", { exact: false })
    ).toHaveCount(0);
    await expect(inbox.getByText("#[QUORUM]", { exact: false })).toHaveCount(0);
    await expect(inbox.getByText("Unread", { exact: true })).toHaveCount(0);
    const artwork = inbox.getByRole("link", {
      name: /^sandbox-alice submitted Sandbox artwork to The Memes – Main Stage\./,
    });
    await expect(artwork).toBeVisible();
    const thumbnail = artwork.getByRole("presentation");
    await expect(thumbnail).toBeVisible();
    await expect
      .poll(() =>
        thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth)
      )
      .toBeGreaterThan(0);
    await expect(artwork).toHaveAttribute(
      "href",
      "/waves/00000000-0000-4000-8000-000000000533/decisions/10000000-0000-4000-8000-000000000001?drop=00000000-0000-4000-8000-000000000560"
    );
    expect(page.url()).toBe(route);
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" &&
              request.path === "/api/notifications/read"
          ).length
      )
      .toBe(1);
    await expect(trigger).not.toHaveAccessibleDescription("Unread");
    await expectNoHorizontalOverflow(page);
    const accessibility = await new AxeBuilder({ page })
      .include('section[aria-label="Notifications"]')
      .analyze();
    expect(accessibility.violations).toEqual([]);
    const box = await inbox.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await captureSafeScreenshot(page, testInfo, "desktop-notifications-inbox");
    await reactionRow.scrollIntoViewIfNeeded();
    await captureSafeScreenshot(page, testInfo, "distinct-notification-reactors");
    await inbox
      .getByRole("heading", { name: "Notifications", exact: true })
      .hover();
    await expect(inbox).toBeVisible();
    await page.setViewportSize({ width: 1100, height: 540 });
    await expectCenteredCloseControl(inbox);
    await expect(inbox).toBeVisible();
    await expect
      .poll(async () => {
        const bounds = await inbox.boundingBox();
        return (
          bounds !== null &&
          bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= 1100 &&
          bounds.y + bounds.height <= 540
        );
      })
      .toBe(true);
    await captureSafeScreenshot(
      page,
      testInfo,
      "narrow-desktop-notifications-inbox"
    );
    await page.keyboard.press("Escape");
    await expect(inbox).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.press("ArrowDown");
    await inbox.getByRole("button", { name: "Close notifications" }).click();
    await expect(inbox).not.toBeVisible();
    const readsBeforeKeyboardOpen = (
      await fetchSandboxRequests(baseURL)
    ).filter(
      (request) =>
        request.method === "POST" && request.path === "/api/notifications/read"
    ).length;
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(inbox).toBeFocused();
    // Each opening marks the inbox read; let that request settle before Tab.
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" &&
              request.path === "/api/notifications/read"
          ).length
      )
      .toBe(readsBeforeKeyboardOpen + 1);
    await expect(
      inbox.getByRole("button", { name: "Mark all as read" })
    ).toBeEnabled();
    await page.keyboard.press("Tab");
    await expect(
      inbox.getByRole("button", { name: "Mark all as read" })
    ).toBeFocused();
    await inbox.getByRole("link", { name: "View all notifications" }).focus();
    await page.keyboard.press("Tab");
    await expect(inbox).not.toBeVisible();
    const readsBeforeReopening = (await fetchSandboxRequests(baseURL)).filter(
      (request) =>
        request.method === "POST" && request.path === "/api/notifications/read"
    ).length;
    await trigger.hover();
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" &&
              request.path === "/api/notifications/read"
          ).length
      )
      .toBe(readsBeforeReopening + 1);
    await expect(
      inbox.getByRole("button", { name: "Mark all as read" })
    ).toBeEnabled();
    const requestsBeforeDismissal = await fetchSandboxRequests(baseURL);
    await page.getByRole("main").click({ position: { x: 500, y: 30 } });
    await expect(inbox).not.toBeVisible();
    const requestsAfterDismissal = await fetchSandboxRequests(baseURL);
    expect(
      requestsAfterDismissal.filter(
        (request) =>
          request.method === "POST" &&
          /\/notifications\/(?:read|\d+\/read)$/.test(request.path)
      )
    ).toHaveLength(
      requestsBeforeDismissal.filter(
        (request) =>
          request.method === "POST" &&
          /\/notifications\/(?:read|\d+\/read)$/.test(request.path)
      ).length
    );
    await trigger.hover();
    const destination = inbox
      .getByRole("link")
      .filter({ hasText: "sandbox-alice mentioned you" });
    const href = await destination.getAttribute("href");
    expect(href).toBe("/waves/00000000-0000-4000-8000-000000000533?serialNo=2");
    await destination.click();
    // Shared-post navigation consumes serialNo; the target must remain in view.
    const targetPath = new URL(href ?? "", route).pathname;
    await expect(page).toHaveURL((url) => url.pathname === targetPath, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page
        .getByText(
          "Mentioned @playwright inside the sandbox notification flow.",
          { exact: true }
        )
        .last()
    ).toBeInViewport({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(inbox).not.toBeVisible();
    const requestsAfter = await fetchSandboxRequests(baseURL);
    expect(
      requestsAfter.some(
        (request) =>
          request.method === "POST" &&
          request.path === "/api/notifications/read"
      )
    ).toBe(true);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("desktop bell navigates directly, including with the preview open", async ({
    page,
    baseURL,
  }, testInfo) => {
    // The shared pack runs desktop and mobile; the mobile scenario below
    // preserves direct navigation without a desktop hover preview.
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    for (const previewOpen of [false, true]) {
      await page.goto("/waves", { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page);
      const bell = page
        .getByLabel("Primary sidebar", { exact: true })
        .getByRole("link", { name: "Notifications", exact: true });
      await expect(bell).toHaveAttribute("href", "/notifications");
      if (previewOpen) {
        await bell.hover();
        await expect(
          page.getByRole("region", { name: "Notifications", exact: true })
        ).toBeVisible();
      }
      await bell.click();
      await expect(page).toHaveURL(/\/notifications$/, {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await expect(
        page.getByRole("region", { name: "Notifications", exact: true })
      ).not.toBeVisible();
    }
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("desktop artwork alert opens the single submission", async ({
    page,
    baseURL,
  }, testInfo) => {
    // The sidebar inbox exists only on desktop; notifications-sandbox covers
    // single-artwork navigation from the full feed on every platform.
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await page
      .getByRole("link", { name: "Notifications", exact: true })
      .hover();
    const inbox = page.getByRole("region", {
      name: "Notifications",
      exact: true,
    });
    await inbox
      .getByRole("link", { name: /^sandbox-alice submitted Sandbox artwork/ })
      .click();
    await expect(inbox).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close panel", exact: true })
    ).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("heading", { name: "Sandbox artwork", exact: true })
    ).toBeVisible();
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  for (const state of ["empty", "error"] as const) {
    test(`desktop close stays centered during loading and ${state} states`, async ({
      page,
      baseURL,
    }, testInfo) => {
      // The floating inbox is desktop-only; mobile's full-page flow is covered below.
      test.skip(
        testInfo.project.name !== "web-desktop-chromium",
        "Desktop sidebar inbox"
      );
      let release: (() => void) | undefined;
      const responseReady = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/api/v2/notifications?*", async (route) => {
        await responseReady;
        if (state === "error") {
          await route.fulfill({ status: 400, json: { error: "Unavailable" } });
        } else {
          await route.fulfill({ json: { notifications: [], unread_count: 0 } });
        }
      });
      try {
        await page.goto("/waves", { waitUntil: "domcontentloaded" });
        await waitForRouteReady(page);
        const trigger = page.getByRole("link", {
          name: "Notifications",
          exact: true,
        });
        await trigger.hover();
        const inbox = page.getByRole("region", {
          name: "Notifications",
          exact: true,
        });
        await expectCenteredCloseControl(inbox);
        await expect(inbox.getByText("Loading notifications…")).toBeVisible();
        release?.();
        await expect(
          inbox.getByText(
            state === "empty"
              ? "No notifications yet"
              : "Couldn't load notifications.",
            { exact: true }
          )
        ).toBeVisible();
        await expectCenteredCloseControl(inbox);
        const close = inbox.getByRole("button", {
          name: "Close notifications",
        });
        await close.hover();
        await expect(close).toHaveCSS("background-color", "rgb(38, 39, 43)");
        await close.focus();
        await page.keyboard.press("ArrowRight");
        await expect(close).toBeFocused();
        await expect(close).toHaveCSS("outline-width", "2px");
        await captureSafeScreenshot(
          page,
          testInfo,
          `notifications-close-${state}`
        );
        await page.keyboard.press("Enter");
        await expect(inbox).not.toBeVisible();
        await expect(trigger).toBeFocused();
        await expectNoUnsafeSandboxMutations(baseURL);
      } finally {
        release?.();
      }
    });
  }

  test("desktop mark-all retries an automatic read failure and View all opens the full feed", async ({
    page,
    baseURL,
  }, testInfo) => {
    // This desktop-only action is intentionally absent from mobile's full-page navigation.
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    let failNextRead = true;
    await page.route("**/api/notifications/read", async (route) => {
      if (failNextRead) {
        failNextRead = false;
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Temporary read failure" }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const trigger = page.getByRole("link", {
      name: "Notifications",
      exact: true,
    });
    await trigger.hover();
    const inbox = page.getByRole("region", {
      name: "Notifications",
      exact: true,
    });
    const markAll = inbox.getByRole("button", { name: "Mark all as read" });
    await expect(inbox.getByRole("alert")).toBeVisible();
    await expect(inbox.getByText("Unread", { exact: true })).toHaveCount(5);
    await expect(markAll).toBeEnabled({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await markAll.click();
    await expect
      .poll(async () =>
        (await fetchSandboxRequests(baseURL)).some(
          (request) =>
            request.method === "POST" &&
            request.path === "/api/notifications/read"
        )
      )
      .toBe(true);
    await expect(inbox.getByText("Unread", { exact: true })).toHaveCount(0);
    await expect(inbox.getByRole("alert")).toHaveCount(0);
    await inbox.getByRole("link", { name: "View all notifications" }).click();
    await expect(page).toHaveURL(/\/notifications$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByText("mentioned you", { exact: true }).first()
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("desktop unread row still marks its notification read after an automatic read failure", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    await page.route("**/api/notifications/read", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Temporary read failure" }),
      })
    );
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await page
      .getByRole("link", { name: "Notifications", exact: true })
      .hover();
    const inbox = page.getByRole("region", {
      name: "Notifications",
      exact: true,
    });
    await expect(inbox.getByRole("alert")).toBeVisible();
    await inbox
      .getByRole("link")
      .filter({ hasText: "sandbox-alice mentioned you" })
      .click();
    await expect
      .poll(async () =>
        (await fetchSandboxRequests(baseURL)).some(
          (request) =>
            request.method === "POST" &&
            request.path === "/api/notifications/1001/read"
        )
      )
      .toBe(true);
    await expect(inbox).not.toBeVisible();
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("mobile bell keeps full-page navigation", async ({ page }, testInfo) => {
    // Desktop navigation and read actions are exercised by the two scenarios above.
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Mobile navigation"
    );
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const bell = page
      .getByRole("link", { name: "Notifications", exact: true })
      .last();
    await expect(bell).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await bell.click();
    await expect(page).toHaveURL(/\/notifications$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByText("mentioned you", { exact: true }).first()
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(
      page.getByRole("region", { name: "Notifications", exact: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "mobile-notifications-page");
  });
});
