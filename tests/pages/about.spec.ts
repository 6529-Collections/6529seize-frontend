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

  test("should keep GDRC in view beside the narrow desktop menu", async ({
    page,
  }) => {
    // Reproduce the reported failure inside the narrow desktop sidebar band.
    await page.setViewportSize({ width: 1054, height: 900 });
    await page.goto("/about/gdrc1", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    const layoutRoot = page.locator(".layout-root");
    await expect(layoutRoot).toHaveAttribute("data-mobile", "false");
    await expect(layoutRoot).toHaveAttribute("data-narrow", "true");
    await expect(layoutRoot).toHaveAttribute("data-right-open", "false");

    const aboutRoute = layoutRoot.locator(".layout-main > div").first();
    await expect(aboutRoute).toHaveCount(1);
    const closedRouteWidth = await aboutRoute.evaluate(
      (route) => route.getBoundingClientRect().width
    );
    const menuWidthDelta = await layoutRoot.evaluate((root) => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;width:calc(var(--expanded-width) - var(--collapsed-width))";
      root.append(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    });
    expect(menuWidthDelta).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Toggle right sidebar" }).click();
    await expect(layoutRoot).toHaveAttribute("data-offcanvas", "true");

    await expect
      .poll(() =>
        aboutRoute.evaluate(
          (route, expectedWidth) =>
            Math.abs(route.getBoundingClientRect().width - expectedWidth) < 1,
          closedRouteWidth - menuWidthDelta
        )
      )
      .toBe(true);

    const gdrcArticle = layoutRoot.getByRole("article");
    await expect(gdrcArticle).toHaveCount(1);
    await expect
      .poll(() =>
        gdrcArticle.evaluate((article) => {
          const { left, right } = article.getBoundingClientRect();
          return left >= 0 && right <= document.documentElement.clientWidth;
        })
      )
      .toBe(true);
    await expectNoHorizontalOverflow(page);
  });
});
