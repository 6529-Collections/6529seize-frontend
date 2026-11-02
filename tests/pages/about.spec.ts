import {
  expect,
  expectKeyboardFocusOutline,
  expectNoHorizontalOverflow,
  expectNoOutlineOnPointerFocus,
  test,
  waitForRouteReady,
} from "../testHelpers";

test.describe("About Pages @smoke @medium @large", () => {
  test("shows direct desktop downloads and independent macOS 12 recovery", async ({
    page,
  }) => {
    await page.route(
      "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/**",
      async (route) => {
        const url = route.request().url();
        if (url.endsWith(".json")) {
          await route.fulfill({ json: { version: "0.3.18", files: [] } });
          return;
        }
        const legacy = url.endsWith("latest-macos-12.yml");
        const version = legacy ? "0.3.15" : "0.3.18";
        const file = url.includes("/win/")
          ? `6529-DESKTOP-win-x64-${version}.exe`
          : url.includes("/linux/")
            ? `6529-DESKTOP-linux-x86_64-${version}.AppImage`
            : `6529-DESKTOP-mac-arm64-${version}.dmg`;
        await route.fulfill({
          json: {
            version,
            files: [{ url: file }],
            minimumSystemVersion: legacy ? "21.0.0" : "22.0.0",
          },
        });
      }
    );
    await page.goto("/about/6529-apps", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const mac = page.getByRole("group").filter({
      has: page.getByText("macOS", { exact: true }),
    });
    const macSummary = page
      .getByText("macOS", { exact: true })
      .locator("xpath=ancestor::summary");
    await expect(macSummary).toHaveText("macOS");
    await expect(mac.getByText("Requires macOS 13 or later")).toBeVisible();
    await expect(mac.getByText("For macOS 12 Monterey")).toBeVisible();
    await expect(
      mac.getByRole("link", { name: /version 0.3.15, Apple silicon/ })
    ).toHaveAttribute("href", /6529-DESKTOP-mac-arm64-0\.3\.15\.dmg$/);
    await expect(mac.getByText(/Keep your existing app data/)).toBeVisible();
    const windows = page
      .getByText("Windows", { exact: true })
      .locator("xpath=ancestor::summary");
    await windows.focus();
    await page.keyboard.press("Enter");
    await expect(mac).not.toHaveAttribute("open");
    await expect(
      page.getByRole("link", { name: /Windows, version 0.3.18, x64/ })
    ).toHaveAttribute("href", /win-x64-0\.3\.18\.exe$/);
    await expectNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoHorizontalOverflow(page);
  });

  test("should load the about index page", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveTitle("About");
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /prenodes/i, includeHidden: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "About 6529" })
    ).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("heading", { level: 2, name: "Safe Collecting" })
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
    await expect(contentsMenu).toBeVisible();
    await expect(
      contentsMenu.getByRole("menuitem", { name: /prenodes/i })
    ).toHaveCount(0);
    await expect(
      contentsMenu.getByText("About", { exact: true })
    ).toBeVisible();
    await expect(
      contentsMenu.getByRole("group", { name: "Safe Collecting", exact: true })
    ).toBeVisible();
    await expect(
      contentsMenu.getByRole("menuitem", { name: /Go to page: GDRC/i })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps About contents inactive until hydration makes the first click usable", async ({
    page,
  }) => {
    let releaseScripts = () => {};
    const scriptsReady = new Promise<void>((resolve) => {
      releaseScripts = resolve;
    });
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "script") await scriptsReady;
      await route.continue();
    });
    try {
      await page.goto("/about/subscriptions", { waitUntil: "commit" });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Subscription Minting",
          exact: true,
        })
      ).toBeVisible();
      const contents = page.getByRole("button", {
        name: /Open About contents navigation/i,
      });
      await expect(contents).toBeDisabled();
      releaseScripts();
      await expect(contents).toBeEnabled();
      await contents.click();
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(contents).toHaveAttribute("aria-expanded", "true");
    } finally {
      releaseScripts();
    }
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

    await page.getByRole("button", { name: "Toggle right sidebar" }).click();
    await expect(layoutRoot).toHaveAttribute("data-offcanvas", "true");

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

  test("should paint a keyboard focus outline on button links", async ({
    page,
  }) => {
    await page.goto("/about/minting", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    const mintLink = page.getByRole("link", {
      name: "Mint the latest Meme Card",
    });
    await expect(mintLink).toBeVisible();

    // The global link reset used to cancel every focus-visible:tw-outline-*
    // utility, so a Tab stop on a ButtonLink painted no indicator at all.
    await expectKeyboardFocusOutline(page, mintLink);
  });

  test("should not paint a focus outline on button links for pointer focus", async ({
    page,
  }) => {
    await page.goto("/about/minting", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    const mintLink = page.getByRole("link", {
      name: "Mint the latest Meme Card",
    });
    await expect(mintLink).toBeVisible();

    await expectNoOutlineOnPointerFocus(page, mintLink);
  });
});
