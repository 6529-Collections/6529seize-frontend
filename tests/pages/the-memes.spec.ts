import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { isMobileSurfaceProject } from "../support/surfaceSimulation";

test.describe("The Memes Page @smoke @medium @large", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/the-memes", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
  });

  test("should load with correct title and heading", async ({
    page,
  }, testInfo) => {
    await expect(page).toHaveTitle("The Memes");
    await expectNoHorizontalOverflow(page);

    if (isMobileSurfaceProject(testInfo.project.name)) {
      await expect(
        page.getByRole("button", { name: "Collection: The Memes" })
      ).toBeVisible();
      return;
    }

    await expect(page.locator("h1", { hasText: "The Memes" })).toBeVisible();
  });
});
