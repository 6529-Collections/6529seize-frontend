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

  test("desktop preview marks notifications read, preserves the route, restores focus, and opens a destination", async ({
    page,
    baseURL,
  }, testInfo) => {
    // The shared pack runs both projects; the mobile scenario below covers its full-page bell.
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
    const inbox = page.getByRole("region", {
      name: "Notifications",
      exact: true,
    });
    await expect(
      inbox.getByText("sandbox-alice mentioned you", { exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(inbox.getByText("Unread", { exact: true })).toHaveCount(0);
    const artwork = inbox.getByRole("link", {
      name: /^sandbox-alice submitted Sandbox artwork to The Memes – Main Stage\./,
    });
    await expect(artwork).toBeVisible();
    await expect(artwork).toHaveAttribute(
      "href",
      "/waves/00000000-0000-4000-8000-000000000533/competitions/10000000-0000-4000-8000-000000000001?entry=20000000-0000-4000-8000-000000000001"
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
      .include('[role="region"][aria-label="Notifications"]')
      .analyze();
    expect(accessibility.violations).toEqual([]);
    const box = await inbox.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await captureSafeScreenshot(page, testInfo, "desktop-notifications-inbox");
    await page.setViewportSize({ width: 1100, height: 540 });
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
    await trigger.click();
    await inbox.getByRole("button", { name: "Close notifications" }).click();
    await expect(inbox).not.toBeVisible();
    await trigger.click();
    await trigger.click();
    await expect(inbox).not.toBeVisible();
    await trigger.click();
    await inbox.getByRole("link", { name: "View all notifications" }).focus();
    await page.keyboard.press("Tab");
    await expect(inbox).not.toBeVisible();
    const readsBeforeReopening = (await fetchSandboxRequests(baseURL)).filter(
      (request) =>
        request.method === "POST" && request.path === "/api/notifications/read"
    ).length;
    await trigger.click();
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
    await trigger.click();
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
    const trigger = page.getByRole("button", {
      name: "Notifications",
      exact: true,
    });
    await trigger.click();
    const inbox = page.getByRole("region", {
      name: "Notifications",
      exact: true,
    });
    const markAll = inbox.getByRole("button", { name: "Mark all as read" });
    await expect(inbox.getByRole("alert")).toBeVisible();
    await expect(inbox.getByText("Unread", { exact: true })).toHaveCount(6);
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
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
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
