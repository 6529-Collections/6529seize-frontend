import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

test.describe("About Pages @smoke @medium @large", () => {
  test("should load the about/the-memes page", async ({ page }) => {
    await page.goto("/about/the-memes", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveTitle(/^The Memes( \| About)?$/);
    await expectNoHorizontalOverflow(page);
    const text = page.getByText("large edition, CCO (public domain) NFTs");
    await expect(text).toBeVisible();
  });

  test("should display AboutGradients Page", async ({ page }) => {
    await page.goto("/about/6529-gradient", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveTitle("6529 Gradient | About");
    await expectNoHorizontalOverflow(page);

    const gradients = page.locator('[src="/gradients-preview.png"]');
    await expect(gradients).toBeVisible();

    const text = page.getByText("We encourage social experimentation");
    await expect(text).toBeVisible();
  });

  test("should display AboutSubscriptions Page", async ({ page }) => {
    await page.goto("/about/subscriptions", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveTitle("Subscriptions | About");
    await expectNoHorizontalOverflow(page);

    // Look for the specific paragraph containing "Remote Minting"
    const remoteMintingParagraph = page.getByText("Remote Minting", {
      exact: true,
    });
    await expect(remoteMintingParagraph).toBeVisible();

    // Additionally, check for some content specific to the Subscriptions page
    const subscriptionContent = page.getByText(
      "It is better to think about subscriptions as"
    );
    await expect(subscriptionContent).toBeVisible();
  });
});
