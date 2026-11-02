import { test, expect } from "../testHelpers";

// Mirrors lib/proxy/accessProbe.ts: the gate runs only on staging deployments.
const STAGING_DEPLOYMENT_HOSTNAME = /^[a-z0-9-]*staging\.6529\.io$/;

function isStagingDeployment(baseURL: string | undefined): boolean {
  try {
    return STAGING_DEPLOYMENT_HOSTNAME.test(new URL(baseURL ?? "").hostname);
  } catch {
    return false;
  }
}

test.describe("Access Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/access");
  });

  test("should load with correct title and input state", async ({ page }) => {
    await expect(page).toHaveTitle("Access Page");
  });

  test("should show input as disabled when logged in", async ({ page }) => {
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
  });

  test("should redirect from home when logged out on staging", async ({
    browser,
    baseURL,
  }) => {
    // proxy.ts ACCESS_GATE_ENABLED: only staging deployments run the gate.
    test.skip(
      !isStagingDeployment(baseURL),
      "The access gate runs only on staging deployments."
    );
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL("/access");
    await context.close();
  });

  test("should not gate home outside staging deployments", async ({
    browser,
    baseURL,
  }) => {
    // Staging targets are covered by the redirect check above instead.
    test.skip(
      isStagingDeployment(baseURL),
      "Staging deployments keep the access gate."
    );
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/access(?:[?#]|$)/);
    await context.close();
  });
});
