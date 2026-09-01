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
import type { Page } from "@playwright/test";

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
});
