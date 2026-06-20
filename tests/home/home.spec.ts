import { test, expect } from "../testHelpers";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the home landing content", async ({ page }) => {
    await expect(page).toHaveTitle("6529.io");

    await expect(page.getByText("Latest Drop", { exact: true })).toBeVisible();
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

  test("should navigate to network health from the hero heart link", async ({
    page,
  }) => {
    const healthLink = page.getByRole("link", {
      name: "Open network health dashboard",
    });

    await expect(healthLink).toBeVisible();
    await healthLink.click();
    await expect(page).toHaveURL(/\/network\/health\/?$/);
  });
});
