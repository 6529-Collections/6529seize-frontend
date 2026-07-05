import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

test.describe("Home Page @smoke @medium @large", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
  });

  test("should display the home landing content", async ({ page }) => {
    // Prod serves "6529.io"; staging serves "6529 Staging".
    await expect(page).toHaveTitle(/^6529(\.io| Staging)$/);
    await expectNoHorizontalOverflow(page);

    await expect(page.getByText(/^(Latest|Next) Drop$/)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Building a decentralized network state",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "6529 is a network society",
      })
    ).toBeVisible();

    const waveLink = page.getByRole("link", { name: /^View wave / }).first();
    await expect(waveLink).toBeVisible();
  });

  test("should expose the network health route", async ({ page }) => {
    const healthLink = page.getByRole("link", {
      name: "Open network health dashboard",
    });

    await expect(healthLink).toBeVisible();
    await expect(healthLink).toHaveAttribute("href", "/network/health");
  });
});
