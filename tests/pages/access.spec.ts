import type { Locator, Page } from "@playwright/test";
import { test, expect } from "../testHelpers";

const STAGING_DEPLOYMENT_HOSTNAME = /^[a-z0-9-]*staging\.6529\.io$/;

function isStagingDeployment(baseURL: string | undefined): boolean {
  return (
    baseURL !== undefined &&
    STAGING_DEPLOYMENT_HOSTNAME.test(new URL(baseURL).hostname)
  );
}

async function openAccessGate(page: Page, entry: string): Promise<void> {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/" &&
        response.status() === 401
    ),
    page.goto(entry),
  ]);
  await expect(page).toHaveTitle("Access Page");
}

async function submitStagingCode(input: Locator, code: string): Promise<void> {
  // Playwright can snapshot the text field on failure even with tracing off.
  await input.evaluate((element: HTMLInputElement, value) => {
    element.focus();
    element.value = value;
    try {
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
    } finally {
      element.value = "";
    }
  }, code);
}

// The staging check enters a real team access code.
test.use({ trace: "off", screenshot: "off", video: "off" });

test.describe("Access Page", () => {
  test("preserves the requested page through API access when required", async ({
    context,
    baseURL,
  }) => {
    const page = await context.newPage();
    const path = "/the-memes?accessReturnCheck=1";
    const hash = "#access-return-check";

    if (!isStagingDeployment(baseURL)) {
      await page.goto(path + hash);
      await expect(page).toHaveURL(path + hash);
      return;
    }

    const accessCode =
      process.env["PLAYWRIGHT_STAGING_ACCESS_CODE"] ??
      process.env["STAGING_AUTH"];
    if (!accessCode) throw new Error("Staging access code is required.");

    await context.clearCookies();
    await openAccessGate(page, path + hash);
    const gateUrl = new URL(page.url());
    expect(gateUrl.pathname).toBe("/access");
    expect(gateUrl.searchParams.get("returnTo")).toBe(path);

    const input = page.getByLabel("Team Login", { exact: true });
    await expect(page.getByText("Team Login", { exact: true })).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", "Enter password");
    await expect(input).toHaveAttribute("type", "text");
    await input.focus();
    await expect(input).toHaveCSS("border-top-color", "rgb(209, 209, 209)");
    await input.fill("invalid-test-access-code");
    const inputPosition = await input.boundingBox();
    expect(inputPosition).not.toBeNull();
    await input.press("Enter");
    await expect(
      page.getByRole("alert").filter({ hasText: /^Access Denied!$/ })
    ).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveCSS("border-top-color", "rgb(255, 170, 164)");
    expect(await input.boundingBox()).toEqual(inputPosition);

    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.dismiss();
    });
    await test.step("keeps the field locked until the requested page opens", async () => {
      const isDestination = (url: URL) => url.pathname + url.search === path;
      // A 204 ends the navigation without replacing the current document.
      await page.route(
        isDestination,
        (route) => route.fulfill({ status: 204 }),
        { times: 1 }
      );
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().isNavigationRequest() &&
            isDestination(new URL(response.url())) &&
            response.status() === 204
        ),
        submitStagingCode(input, accessCode),
      ]);

      const openingStatus = page
        .getByRole("status")
        .filter({ hasText: /^Opening page…$/ });
      await expect(openingStatus).toBeVisible();
      await expect(input).not.toBeEditable();
      await expect(input).toHaveValue("");
      await page.keyboard.press("Enter");
      await expect(openingStatus).toBeVisible();
      await expect(input).not.toBeEditable();
    });

    await test.step("opens the original path, query and fragment", async () => {
      await context.clearCookies();
      await openAccessGate(page, path + hash);
      await submitStagingCode(input, accessCode);
      await expect(page).toHaveURL(path + hash);
      expect(dialogs).toEqual([]);
    });

    await test.step("opens the home page when accessed directly", async () => {
      await context.clearCookies();
      await openAccessGate(page, "/access");
      await submitStagingCode(input, accessCode);
      await expect(page).toHaveURL("/");
      expect(dialogs).toEqual([]);
    });
  });
});
