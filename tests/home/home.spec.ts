import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { getAppEnvironment } from "../../config/appEnvironment";
import { isDesktopWebProject } from "../support/surfaceSimulation";

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

  if (process.env["PLAYWRIGHT_ENV"] === "production") {
    test("does not render an environment badge in production", async ({
      page,
    }) => {
      await expect(page.locator('[aria-label^="Environment:"]')).toHaveCount(0);
    });
  }
});

test("desktop account updates do not move utilities, including in short expanded sidebars @smoke @medium @large", async ({
  page,
}, testInfo) => {
  // Mobile uses its own drawer; this checks persistent desktop sidebar geometry.
  test.skip(
    !isDesktopWebProject(testInfo.project.name),
    "Desktop sidebar geometry contract"
  );
  let releaseVersion!: () => void;
  const versionReady = new Promise<void>((resolve) => {
    releaseVersion = resolve;
  });
  await page.route("**/api/version", async (route) => {
    await versionReady;
    await route.fulfill({ json: { stale: true } });
  });
  try {
    const response = await page.goto("/about", {
      waitUntil: "domcontentloaded",
    });
    const environment = getAppEnvironment(page.url());
    const serverHtml = await response!.text();
    if (environment.badge) {
      expect(serverHtml).toContain(
        `aria-label="Environment: ${environment.badge} (${environment.host})"`
      );
    } else {
      expect(serverHtml).not.toContain('aria-label="Environment:');
    }
    const sidebar = page.getByLabel("Primary sidebar", { exact: true });
    const search = sidebar.getByRole("button", {
      name: "Search",
      exact: true,
    });
    const account = page
      .getByLabel("Primary sidebar", { exact: true })
      .locator("[data-sidebar-account]");
    await expect(account).toHaveAttribute("data-sidebar-account", "signed-out");
    await expect(search).toBeVisible();
    const beforeSearch = await search.boundingBox();
    const beforeAccount = await account.boundingBox();
    expect(beforeSearch).not.toBeNull();
    expect(beforeAccount).not.toBeNull();
    // Search is usable even though update availability is unresolved.
    await search.click();
    await expect(
      page.getByRole("combobox", { name: "Search 6529", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    releaseVersion();
    const update = sidebar.getByRole("button", {
      name: "Update",
      exact: true,
    });
    await expect(update).toBeVisible();
    const updateContent = sidebar
      .getByRole("button", { name: "Update", exact: true })
      .locator(":scope > div");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(updateContent).toHaveCSS("animation-duration", "0.125s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(updateContent).toHaveCSS("animation-name", "none");
    await expect(updateContent).toHaveCSS("opacity", "1");
    expect(await search.boundingBox()).toEqual(beforeSearch);
    expect(await account.boundingBox()).toEqual(beforeAccount);
    await expect(
      page
        .getByLabel("Primary sidebar", { exact: true })
        .locator('[data-sidebar-section="utilities"]')
        .getByRole("button", { name: "Update", exact: true })
    ).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 460 });
    await sidebar.getByRole("button", { name: "Toggle right sidebar" }).click();
    const nav = sidebar.getByRole("navigation", {
      name: "Desktop navigation",
    });
    await nav.getByRole("button", { name: "About", exact: true }).click();
    await expect(search).toBeInViewport();
    await expect(update).toBeInViewport();
    await expect(account).toBeInViewport();
    const navigationBox = await page
      .getByLabel("Primary sidebar", { exact: true })
      .locator('[data-sidebar-scroll="true"]')
      .boundingBox();
    const utilitiesBox = await page
      .getByLabel("Primary sidebar", { exact: true })
      .locator('[data-sidebar-section="utilities"]')
      .boundingBox();
    expect(navigationBox).not.toBeNull();
    expect(utilitiesBox).not.toBeNull();
    expect(navigationBox!.y + navigationBox!.height).toBeLessThanOrEqual(
      utilitiesBox!.y + 1
    );
    await expectNoHorizontalOverflow(page);

    // Unsupported Share routes keep Update directly above Search, with no hole.
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(
      sidebar.getByRole("button", { name: "Share this page", exact: true })
    ).toHaveCount(0);
    await expect(update).toBeVisible();
    const searchBox = await search.boundingBox();
    const updateBox = await update.boundingBox();
    expect(searchBox).not.toBeNull();
    expect(updateBox).not.toBeNull();
    expect(searchBox!.y).toBeCloseTo(updateBox!.y + updateBox!.height, 0);
  } finally {
    releaseVersion();
  }
});
