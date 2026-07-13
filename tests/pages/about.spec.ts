import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

test.describe("About Pages @smoke @medium @large", () => {
  test("should load the about index page", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveTitle("About");
    await expectNoHorizontalOverflow(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "About 6529" })
    ).toBeVisible();
    await expect(
      page.locator("main").getByText("Delegation & Wallets")
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open page: GDRC" })
    ).toHaveAttribute("href", "/about/gdrc1");
    await expect(
      page.getByText(/Global Delegation Rights Contract/i)
    ).toHaveCount(0);
  });

  test("should load the about/the-memes page", async ({ page }) => {
    await page.goto("/about/the-memes", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveTitle("The Memes | About");
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
    await expect(page).toHaveTitle("Subscription Minting | About");
    await expectNoHorizontalOverflow(page);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Subscription Minting",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "How it Works",
      })
    ).toBeVisible();
    await expect(page.getByText("Fill Balance", { exact: true })).toBeVisible();

    await page
      .getByRole("button", { name: /Open About contents navigation/i })
      .click();
    const contentsMenu = page.getByRole("menu");
    await expect(
      contentsMenu.getByText("About", { exact: true })
    ).toBeVisible();
    await expect(
      contentsMenu.getByText("Delegation & Wallets", { exact: true })
    ).toBeVisible();
    await expect(
      contentsMenu.getByRole("menuitem", { name: /Go to page: GDRC/i })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
