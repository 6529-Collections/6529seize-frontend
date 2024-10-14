import { test, expect } from '../testHelpers';

test.describe("About Pages", () => {
  test("should load the about/the-memes page", async ({ page }) => {
    await page.goto("/about/the-memes");
    await expect(page).toHaveTitle("About - THE MEMES | 6529 SEIZE");
    const text = page.getByText("large edition, CCO (public domain) NFTs");
    await expect(text).toBeVisible();
  });

  test("should display AboutGradients Page", async ({ page }) => {
    await page.goto("/about/6529-gradient");
    await expect(page).toHaveTitle("About - 6529 GRADIENT | 6529 SEIZE");

    const gradients = page.locator('[src="/gradients-preview.png"]');
    await expect(gradients).toBeVisible();

    const text = page.getByText("We encourage social experimentation");
    await expect(text).toBeVisible();
  });

  test("should display AboutSubscriptions Page", async ({ page }) => {
    await page.goto("/about/subscriptions");
    await expect(page).toHaveTitle("About - SUBSCRIPTIONS | 6529 SEIZE");

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
