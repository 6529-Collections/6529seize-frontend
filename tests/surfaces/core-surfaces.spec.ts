import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import type { Locator, Page } from "@playwright/test";
import {
  isCapacitorSimulationProject,
  isDesktopWebProject,
  isMobileWebProject,
  isMobileSurfaceProject,
} from "../support/surfaceSimulation";

const NAVIGATION_TIMEOUT_MS = 15000;
const WAVE_SCORE_RESULT = /Wave Score.*About.*Network Data/i;
const WAVE_SCORE_HEADING = "Wave score transparency";
const REQUIRED_DELEGATION_ACTIONS = [
  "Register Delegation",
  "Register Consolidation",
  "Register Delegation Manager",
];

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function forceExpandedDesktopSidebar(page: Page) {
  await page.addInitScript(() => {
    globalThis.sessionStorage.setItem("sidebarCollapsed", "false");
  });
}

async function openWaveScoreFromSearch(page: Page, searchButton: Locator) {
  await searchButton.click();
  const searchInput = page.locator("#header-search-input");
  await expect(searchInput).toBeVisible();
  await searchInput.fill("wave score");
  const result = page.getByRole("link", { name: WAVE_SCORE_RESULT }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expectWaveScorePage(page);
}

async function expectWaveScorePage(page: Page) {
  await expect(page).toHaveURL(/\/network\/wave-score$/, {
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("heading", { level: 1, name: WAVE_SCORE_HEADING })
  ).toBeVisible();
}

async function expectTdhExplainer(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: "TDH" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "How TDH is computed" })
  ).toBeVisible();
}

async function expectLinkHref(page: Page, name: string, href: string) {
  await expect(page.getByRole("link", { name })).toHaveAttribute("href", href);
}

test.describe("Core app surface coverage @surface @medium @large", () => {
  test("desktop header search opens the Wave Score page", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "desktop header search is covered on the desktop web shell"
    );

    await forceExpandedDesktopSidebar(page);
    await gotoReady(page, "/");
    await openWaveScoreFromSearch(
      page,
      page
        .locator('[aria-label="Primary sidebar"]')
        .getByRole("button", { name: "Search" })
    );
  });

  test("desktop sidebar navigates About Network Data to TDH", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "desktop sidebar expansion is covered on the desktop web shell"
    );

    await forceExpandedDesktopSidebar(page);
    await gotoReady(page, "/");

    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await nav.getByRole("button", { name: "About" }).click();
    await nav.getByRole("button", { name: "Network Data" }).click();
    await nav.getByRole("link", { name: "TDH", exact: true }).click();

    await expect(page).toHaveURL(/\/network\/tdh$/);
    await waitForRouteReady(page);
    await expectTdhExplainer(page);
  });

  test("mobile menu navigates NFTs to The Memes", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileWebProject(testInfo.project.name),
      "mobile slide-out navigation is covered on the mobile web shell"
    );

    await gotoReady(page, "/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: "Desktop navigation" });
    await nav.getByRole("button", { name: "NFTs" }).click();
    await nav
      .getByLabel("NFTs items")
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
    await openWaveScoreFromSearch(
      page,
      page.getByRole("button", { name: "Search" })
    );
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

    await expectTdhExplainer(page);
    await expect(page.getByRole("heading", { name: /TDH 1\.4/ })).toBeVisible();
    await expectLinkHref(page, "Definitions", "/network/definitions");
    await expectLinkHref(
      page,
      "View Network Stats",
      "/network/health/network-tdh"
    );
    await expectLinkHref(page, "View Levels", "/network/levels");
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
    for (const name of REQUIRED_DELEGATION_ACTIONS) {
      await expect(
        page.getByRole("button", { name, exact: true })
      ).toBeVisible();
    }
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
});
