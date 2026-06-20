import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

test.describe("The Memes Page @smoke @medium @large", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/the-memes", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("The Memes");
    await expectNoHorizontalOverflow(page);

    const heading = page.locator("h1", { hasText: "The Memes" });
    await expect(heading).toBeVisible();
  });
});
