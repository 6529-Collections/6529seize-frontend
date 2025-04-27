import { test as baseTest, expect, Page } from "@playwright/test";

// Extend the base test to include a global beforeEach hook
export const test = baseTest.extend({
  page: async ({ page }, use, testInfo) => {
    // Use testDelay from metadata or default to 0 if undefined
    const delay = testInfo.project.metadata?.testDelay ?? 0;
    await page.waitForTimeout(delay);
    await use(page);
  },
});

// Re-export expect
export { expect };

export async function login(page: Page, baseURL: string) {
  console.log(
    "No auth context yet for this worker, attempting to reach the home page..."
  );
  await page.goto(baseURL);

  if (page.url().includes("/access")) {
    console.log("Redirected to /access, attempting login...");

    const password = process.env.STAGING_PASSWORD || "";
    console.log(
      `Using password: ${
        password ? "*".repeat(password.length) : "ERROR: NOT SET IN ENV"
      }`
    );

    const inputField = page.locator('input[type="text"]');

    console.log("Filling in and submitting password...");
    await inputField.fill(password);
    await inputField.press("Enter");

    console.log("Waiting for redirect after dismissing confirmation dialog");
    await page.waitForSelector("nav");

    // Check if we're no longer on the /access page
    if (!page.url().includes("/access")) {
      console.log(`Successfully logged in. Current URL: ${page.url()}`);
    } else {
      throw new Error(
        "Login failed: Still on /access page after submitting password"
      );
    }
  } else {
    console.log(
      `Successfully reached ${page.url()}, no additional login required.`
    );
  }
}

async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}
