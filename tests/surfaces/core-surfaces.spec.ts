import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import type { Page } from "@playwright/test";
import {
  isCapacitorSimulationProject,
  isChromiumDesktopWebProject,
  isDesktopWebProject,
  isMobileWebProject,
  isMobileSurfaceProject,
} from "../support/surfaceSimulation";

const LEGACY_WAVE_ID = "test-wave-123";

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

test.describe("Core app surface coverage @surface @medium @large", () => {
  test("desktop header search opens the Wave Score page", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "desktop header search is covered on the desktop web shell"
    );

    await page.addInitScript(() => {
      globalThis.sessionStorage.setItem("sidebarCollapsed", "false");
    });
    await gotoReady(page, "/");

    await page
      .locator('[aria-label="Primary sidebar"]')
      .getByRole("button", { name: "Search" })
      .click();
    await page.locator("#header-search-input").fill("wave score");
    await page
      .getByRole("link", { name: /Wave Score.*Network/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/network\/wave-score$/);
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Wave score transparency",
      })
    ).toBeVisible();
  });

  test("desktop sidebar navigates Network to TDH", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "desktop sidebar expansion is covered on the desktop web shell"
    );

    await page.addInitScript(() => {
      globalThis.sessionStorage.setItem("sidebarCollapsed", "false");
    });
    await gotoReady(page, "/");

    const nav = page.getByRole("navigation", { name: "Desktop navigation" });
    await nav.getByRole("button", { name: "Network" }).click();
    await nav.getByRole("link", { name: "TDH", exact: true }).click();

    await expect(page).toHaveURL(/\/network\/tdh$/);
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "TDH" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "How TDH is computed" })
    ).toBeVisible();
  });

  test("mobile menu navigates Collections to The Memes", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileWebProject(testInfo.project.name),
      "mobile slide-out navigation is covered on the mobile web shell"
    );

    await gotoReady(page, "/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: "Desktop navigation" });
    await nav.getByRole("button", { name: "Collections" }).click();
    await nav
      .getByLabel("Collections items")
      .getByRole("link", { name: "The Memes", exact: true })
      .click();

    await expect(page).toHaveURL((url) => url.pathname === "/the-memes");
    await waitForRouteReady(page);
    await expect(
      page.getByRole("button", { name: "Collection: The Memes" })
    ).toBeVisible();
  });

  test("mobile header search opens the Wave Score page", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileSurfaceProject(testInfo.project.name),
      "mobile header search is covered on mobile and Capacitor simulation projects"
    );

    await gotoReady(page, "/");

    await page.getByRole("button", { name: "Search" }).click();
    await page.locator("#header-search-input").fill("wave score");
    await page
      .getByRole("link", { name: /Wave Score.*Network/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/network\/wave-score$/);
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Wave score transparency",
      })
    ).toBeVisible();
  });

  test("Capacitor simulations apply native viewport setup", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Capacitor setup is covered only on Capacitor simulation projects"
    );

    await gotoReady(page, "/");

    await expect(page.locator("body")).toHaveClass(/capacitor-native/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /viewport-fit=cover/
    );
  });

  test("Wave Score calculator validates short input", async ({ page }) => {
    await gotoReady(page, "/network/wave-score?returnTo=/waves/test-wave");

    await expect(
      page.getByRole("link", { name: "Back to wave" })
    ).toHaveAttribute("href", "/waves/test-wave");
    await page.locator("#wave-score-calculator-input").fill("x");
    await page.getByRole("button", { name: "Score" }).click();

    await expect(page.locator("#wave-score-calculator-error")).toContainText(
      "Enter a wave name, wave id, or wave URL."
    );
  });

  test("TDH explainer links to network reference pages", async ({ page }) => {
    await gotoReady(page, "/network/tdh");

    await expect(
      page.getByRole("heading", { level: 1, name: "TDH" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "How TDH is computed" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /TDH 1\.4/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Definitions" })
    ).toHaveAttribute("href", "/network/definitions");
    await expect(
      page.getByRole("link", { name: "View Network Stats" })
    ).toHaveAttribute("href", "/network/health/network-tdh");
    await expect(
      page.getByRole("link", { name: "View Levels" })
    ).toHaveAttribute("href", "/network/levels");
  });

  test("Delegation Center renders disconnected-safe choices", async ({
    page,
  }) => {
    await gotoReady(page, "/delegation/delegation-center");

    await expect(
      page.getByRole("heading", { level: 1, name: "Delegation Center" })
    ).toBeVisible();
    await expect(
      page.getByText("These actions do not transfer NFTs.")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Register Delegation", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Register Consolidation",
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Register Delegation Manager",
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Manage by Collection" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /The Memes/ })).toBeVisible();
  });

  test("Delegation FAQ child article renders article navigation", async ({
    page,
  }) => {
    await gotoReady(page, "/delegation/delegation-faq/register-delegation");

    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "How to Register a Delegation?" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Delegation FAQ" })
    ).toHaveAttribute("href", "/delegation/delegation-faq");
    await expect(
      page.getByRole("navigation", {
        name: "Delegation FAQ article navigation",
      })
    ).toBeVisible();
  });

  test("legacy Waves query redirects to the canonical wave route", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isChromiumDesktopWebProject(testInfo.project.name) &&
        testInfo.project.name !== "electron-shell-sim",
      "legacy redirect behavior is covered by Chromium web and Electron shells"
    );

    await page.goto(`/waves?wave=${LEGACY_WAVE_ID}&serialNo=42&divider=7`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveURL(
      new RegExp(`/waves/${LEGACY_WAVE_ID}\\?serialNo=42&divider=7$`)
    );
  });
});
