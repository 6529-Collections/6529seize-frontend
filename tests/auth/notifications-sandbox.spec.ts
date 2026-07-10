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
      page.getByRole("button", { name: "All", exact: true })
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

    await page.getByRole("button", { name: "Reactions", exact: true }).click();
    await expect(page.getByText("New reactions").first()).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("mentioned you")).toHaveCount(0);

    await page.getByRole("button", { name: "Invites", exact: true }).click();
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

  test("captures reply composer visual states", async (
    { baseURL, page },
    testInfo
  ) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByText("mentioned you")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    const mentionedDropText =
      "Mentioned @playwright inside the sandbox notification flow.";
    await page.getByText(mentionedDropText).hover();

    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-before"
    );
    await clickReplyForDropText(page, mentionedDropText);
    await page.waitForTimeout(140);
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-opening"
    );
    await expect(page.getByText("Replying to")).toBeVisible({ timeout: 1500 });
    await expect(page.getByLabel("Post a reply")).toBeVisible({
      timeout: 1500,
    });
    await page.waitForTimeout(300);
    await captureSafeScreenshot(
      page,
      testInfo,
      "notifications-reply-composer-open"
    );

    await page.getByRole("button", { name: "Cancel reply" }).click();
    await expect(page.getByLabel("Post a reply")).toHaveCount(0, {
      timeout: 1500,
    });
    await page.waitForTimeout(300);
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
