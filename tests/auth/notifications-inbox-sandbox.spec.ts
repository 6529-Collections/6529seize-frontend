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

test.describe("Notifications inbox sandbox @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Notifications inbox requires the local mock API runner."
  );

  test("desktop preview preserves the route and unread state, restores focus, and opens a destination", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const trigger = page.getByRole("button", {
      name: "Notifications",
      exact: true,
    });
    await expect(trigger).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const route = page.url();
    await trigger.click();
    const inbox = page.getByRole("dialog", {
      name: "Notifications",
      exact: true,
    });
    await expect(
      inbox.getByText("sandbox-alice mentioned you", { exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(inbox.getByText("Unread", { exact: true })).toHaveCount(5);
    expect(page.url()).toBe(route);
    const requestsBefore = await fetchSandboxRequests(baseURL);
    expect(
      requestsBefore.filter(
        (request) =>
          request.method === "POST" &&
          /\/notifications\/(?:read|\d+\/read)$/.test(request.path)
      )
    ).toHaveLength(0);
    await expectNoHorizontalOverflow(page);
    const accessibility = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();
    expect(accessibility.violations).toEqual([]);
    const box = await inbox.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await captureSafeScreenshot(page, testInfo, "desktop-notifications-inbox");
    await page.keyboard.press("Escape");
    await expect(inbox).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await inbox.getByRole("button", { name: "Close notifications" }).click();
    await expect(inbox).not.toBeVisible();
    await trigger.click();
    await trigger.click();
    await expect(inbox).not.toBeVisible();
    await trigger.click();
    await page.getByRole("main").click({ position: { x: 500, y: 30 } });
    await expect(inbox).not.toBeVisible();
    await trigger.click();
    const destination = inbox
      .getByRole("link")
      .filter({ hasText: "sandbox-alice mentioned you" });
    const href = await destination.getAttribute("href");
    await destination.click();
    expect(href).toBeTruthy();
    await expect(page).toHaveURL(new URL(href ?? "", route).href, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(inbox).not.toBeVisible();
    await expect
      .poll(async () =>
        (await fetchSandboxRequests(baseURL)).some(
          (request) =>
            request.method === "POST" &&
            request.path === "/api/notifications/1001/read"
        )
      )
      .toBe(true);
    const requestsAfter = await fetchSandboxRequests(baseURL);
    expect(
      requestsAfter.some(
        (request) =>
          request.method === "POST" &&
          request.path === "/api/notifications/read"
      )
    ).toBe(false);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("desktop mark-all is explicit and View all opens the full feed", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop sidebar inbox"
    );
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const trigger = page.getByRole("button", {
      name: "Notifications",
      exact: true,
    });
    await trigger.click();
    const inbox = page.getByRole("dialog", {
      name: "Notifications",
      exact: true,
    });
    const markAll = inbox.getByRole("button", { name: "Mark all as read" });
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
    await inbox.getByRole("link", { name: "View all notifications" }).click();
    await expect(page).toHaveURL(/\/notifications$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByText("mentioned you", { exact: true }).first()
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("mobile bell keeps full-page navigation", async ({ page }, testInfo) => {
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
      page.getByRole("dialog", { name: "Notifications", exact: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "mobile-notifications-page");
  });
});
