import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  expectNoUnsafeSandboxMutations,
  fetchSandboxRequests,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { devices, type Locator, type Page } from "@playwright/test";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "../../hooks/useLongPressInteraction";

async function expectTooltipBesideButton(page: Page, button: Locator) {
  await button.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS("opacity", "1");
  await expect(tooltip).toHaveCSS("pointer-events", "none");
  expect(
    await tooltip.evaluate((element) => element.parentElement === document.body)
  ).toBe(true);
  await expect
    .poll(
      async () => {
        const anchor = await button.boundingBox();
        const label = await tooltip.boundingBox();
        const viewport = page.viewportSize();
        if (!anchor || !label || !viewport) return false;
        const aboveGap = anchor.y - label.y - label.height;
        const belowGap = label.y - anchor.y - anchor.height;
        return (
          label.x >= 0 &&
          label.y >= 0 &&
          label.x + label.width <= viewport.width &&
          label.y + label.height <= viewport.height &&
          label.x < anchor.x + anchor.width &&
          label.x + label.width > anchor.x &&
          ((aboveGap >= 0 && aboveGap <= 16) ||
            (belowGap >= 0 && belowGap <= 16))
        );
      },
      {
        message:
          "Tooltip must stay beside its button without overlap or viewport clipping",
      }
    )
    .toBe(true);
  return tooltip;
}

async function clickReplyForDropText(page: Page, dropText: string) {
  const drop = page
    .locator(".tw-group", {
      hasText: dropText,
    })
    .first();
  await drop.hover();
  await drop.getByRole("button", { name: "Reply to drop" }).click();
}

test.describe("Notifications local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Notifications sandbox requires the local mock API runner."
  );

  test("renders positive notification states and keeps mark-read local", async ({
    baseURL,
    page,
  }) => {
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("button", { name: "Filter notifications: All" })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText("mentioned you")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("New reactions").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sandbox Notifications Wave" }).last()
    ).toBeVisible();

    await clickReplyForDropText(
      page,
      "Mentioned @playwright inside the sandbox notification flow."
    );
    await expect(page.getByText("Replying to")).toBeVisible({ timeout: 1500 });
    await expect(page.getByLabel("Post a reply")).toBeVisible({
      timeout: 1500,
    });

    await page.getByRole("button", { name: /^Filter notifications:/ }).click();
    await page
      .getByRole("menuitemcheckbox", { name: "Reactions", exact: true })
      .click();
    await expect(page.getByText("New reactions").first()).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("mentioned you")).toHaveCount(0);

    await page
      .getByRole("menuitemcheckbox", { name: "Invites", exact: true })
      .click();
    await expect(page.getByText("created a wave you can access:")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("button", { name: "Join wave", exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Follow creator", exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sandbox Notifications Wave" }).first()
    ).toHaveAttribute("href", "/waves/00000000-0000-4000-8000-000000000533");
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.path === "/api/notifications/read" &&
          request.kind === "allowed-sandbox-mutation"
      )
    ).toBe(true);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("switches filter presentation at the mobile layout boundary", async ({
    baseURL,
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    const trigger = page.getByRole("button", {
      name: /^Filter notifications:/,
    });
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await trigger.click();

    const dialog = page.getByRole("dialog", {
      name: "Filter notifications",
    });
    await expect(
      dialog.getByRole("heading", { name: "Filter notifications" })
    ).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => globalThis.getComputedStyle(document.documentElement).overflow
        )
      )
      .toBe("hidden");

    await dialog.getByText("Mentions", { exact: true }).click();
    await dialog.getByText("Reactions", { exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: "Filter notifications" })
    ).toBeVisible();
    await expect(trigger).toHaveAccessibleName(
      "Filter notifications: 2 selected"
    );
    await expect(
      dialog.getByRole("checkbox", { name: "Mentions" })
    ).toBeChecked();
    await expect(
      dialog.getByRole("checkbox", { name: "Reactions" })
    ).toBeChecked();
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-mobile-filter-sheet"
    );

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    const reopenedDialog = page.getByRole("dialog", {
      name: "Filter notifications",
    });
    await expect(
      reopenedDialog.getByRole("checkbox", { name: "Mentions" })
    ).toBeChecked();
    await reopenedDialog.getByText("All", { exact: true }).click();
    await expect(trigger).toHaveAccessibleName("Filter notifications: All");

    await page.setViewportSize({ width: 1023, height: 768 });
    await expect(
      reopenedDialog.getByRole("heading", { name: "Filter notifications" })
    ).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(reopenedDialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");

    await trigger.click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-desktop-filter-menu"
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("captures reply composer visual states", async ({
    baseURL,
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(page.getByText("mentioned you")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const mentionedDropText =
      "Mentioned @playwright inside the sandbox notification flow.";
    await page.getByText(mentionedDropText).hover();

    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-before"
    );
    await clickReplyForDropText(page, mentionedDropText);
    await expect(page.getByText("Replying to")).toBeVisible({ timeout: 1500 });
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-opening"
    );
    await expect(page.getByLabel("Post a reply")).toBeVisible({
      timeout: 1500,
    });
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-open"
    );

    await page.getByRole("button", { name: "Cancel reply" }).click();
    await expect(page.getByLabel("Post a reply")).toHaveCount(0, {
      timeout: 1500,
    });
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-closed"
    );

    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("opens reply composer for following drop notifications", async ({
    baseURL,
    page,
  }) => {
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByText("Sandbox following notification drop.")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });

    await clickReplyForDropText(page, "Sandbox following notification drop.");

    await expect(page.getByText("Replying to")).toBeVisible({ timeout: 1500 });
    await expect(page.getByLabel("Post a reply")).toBeVisible({
      timeout: 1500,
    });
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps action tooltips beside notifications across the scroll clipping edge", async ({
    baseURL,
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const cards = page.locator("[data-wave-drop-id]");
    await expect(cards).toHaveCount(3, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await dismissNextDevTools(page);
    await expect(page.locator(".layout-main")).toHaveCSS(
      "will-change",
      "transform"
    );

    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await expect(card).toHaveCSS("background-color", "rgb(19, 19, 22)");
      for (const name of [
        "Click to react",
        "Add reaction to drop",
        "Reply to drop",
        "Edit",
        "More actions",
      ]) {
        const button = card.getByRole("button", { name, exact: true }).first();
        await expectTooltipBesideButton(page, button);
        await page.keyboard.press("Escape");
        await expect(page.getByRole("tooltip")).toHaveCount(0);
      }
    }

    const middleCard = cards.nth(1);
    await middleCard.scrollIntoViewIfNeeded();
    const reply = middleCard.getByRole("button", { name: "Reply to drop" });
    await reply.evaluate((button) => {
      const scroller = button.closest("[data-wave-drops-scroll-container]");
      if (!(scroller instanceof HTMLElement))
        throw new Error("Missing notifications scroller");
      scroller.scrollTop +=
        button.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top -
        4;
    });
    await middleCard.hover();
    const tooltip = await expectTooltipBesideButton(page, reply);
    const scroller = page.locator("[data-wave-drops-scroll-container]");
    const scrollBounds = await scroller.boundingBox();
    const tooltipBounds = await tooltip.boundingBox();
    expect(scrollBounds).not.toBeNull();
    expect(tooltipBounds).not.toBeNull();
    expect(tooltipBounds!.y).toBeLessThan(scrollBounds!.y);
    await captureSafeScreenshot(
      page,
      testInfo,
      "notification-tooltip-above-scroll-edge"
    );

    await scroller.evaluate((element) => {
      element.scrollTop -= 30;
    });
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test.describe("touch action tooltips", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "Long-press touch input uses Chromium CDP."
    );
    test.use({
      hasTouch: true,
      isMobile: true,
      userAgent: devices["Pixel 7"].userAgent,
      deviceScaleFactor: devices["Pixel 7"].deviceScaleFactor,
      viewport: { width: 390, height: 844 },
    });

    test("keeps the long-press menu available without stuck tooltip labels", async ({
      baseURL,
      page,
    }, testInfo) => {
      // The shared sandbox predates the menu's drop-curation membership query.
      await page.route("**/api/drops/*/curations", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({ json: [] });
        } else {
          await route.fallback();
        }
      });
      await page.goto("/notifications", { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page);
      await dismissNextDevTools(page);
      const card = page
        .locator("[data-wave-drop-id]")
        .filter({ hasText: "Sandbox following notification drop." });
      await expect(card).toBeVisible({
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await card.tap({ position: { x: 10, y: 8 } });
      await expect(page.getByRole("tooltip")).toHaveCount(0);

      const replyAction = page.getByRole("button", {
        name: "Reply",
        exact: true,
      });
      const content = card.getByRole("button", {
        name: "Sandbox following notification drop.",
        exact: true,
      });
      await content.scrollIntoViewIfNeeded();
      const bounds = await content.boundingBox();
      expect(bounds).not.toBeNull();
      const touch = await page.context().newCDPSession(page);
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          {
            x: bounds!.x + bounds!.width / 2,
            y: bounds!.y + bounds!.height / 2,
          },
        ],
      });
      // Keep contact through the real long-press threshold before releasing it.
      await page.waitForTimeout(DEFAULT_LONG_PRESS_DURATION_MS + 150);
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await touch.detach();
      await expect(replyAction).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await captureSafeScreenshot(
        page,
        testInfo,
        "notification-touch-menu-without-tooltip"
      );
      await page.keyboard.press("Escape");
      await expect(replyAction).toBeHidden();
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await expectNoUnsafeSandboxMutations(baseURL);
    });
  });
});
