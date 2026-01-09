import type { Page } from "@playwright/test";
import { test as baseTest, expect } from "@playwright/test";

// Extend the base test to include a global beforeEach hook
export const test = baseTest.extend({
  page: async ({ page }, use, testInfo) => {
    // Use testDelay from metadata or default to 0 if undefined
    const delay = testInfo.project.metadata?.["testDelay"] ?? 0;
    await page.waitForTimeout(delay);
    await use(page);
  },
});

// Re-export expect
export { expect };

async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}
