import {
  expect,
  captureSafeScreenshot,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import type { Locator, Page } from "@playwright/test";
import { hideNextDevTools } from "../support/localSandbox";
import {
  isCapacitorSimulationProject,
  isDesktopWebProject,
  isMobileWebProject,
  isMobileSurfaceProject,
} from "../support/surfaceSimulation";

const NAVIGATION_TIMEOUT_MS = 15000;
const WAVE_SCORE_RESULT = /Wave Score.*About.*Network & Reputation/i;
const WAVE_SCORE_HEADING = "Wave score transparency";
const REQUIRED_DELEGATION_ACTIONS = [
  "Delegation",
  "Consolidation",
  "Delegation Manager",
];

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function forceExpandedDesktopSidebar(page: Page) {
  await page.addInitScript(() => {
    if (globalThis.self !== globalThis.top) {
      return;
    }
    globalThis.sessionStorage.setItem("sidebarCollapsed", "false");
  });
}

async function openWaveScoreFromSearch(page: Page, searchButton: Locator) {
  await searchButton.click();
  const searchInput = page.locator("#header-search-input");
  await expect(searchInput).toBeVisible();
  await searchInput.fill("wave score");
  const result = page.getByRole("option", { name: WAVE_SCORE_RESULT }).first();
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
    page.getByRole("heading", {
      level: 1,
      name: "How TDH is calculated",
      exact: true,
    })
  ).toBeVisible();
}

async function expectLinkHref(page: Page, name: string, href: string) {
  await expect(page.getByRole("link", { name })).toHaveAttribute("href", href);
}

test.describe("Core app surface coverage @surface @medium @large", () => {
  test("main sidebar bottom control keeps the desktop click target in place", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "Desktop rail geometry"
    );
    await page.setViewportSize({ width: 1342, height: 600 });
    await gotoReady(page, "/messages");
    await hideNextDevTools(page);

    const expand = page.getByRole("button", {
      name: "Expand main sidebar",
      exact: true,
    });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    const before = await expand.boundingBox();
    expect(before).not.toBeNull();
    if (!before) throw new Error("Sidebar toggle has no visible box");
    expect(before.height).toBe(46);
    expect(before.y + before.height).toBe(592);
    const icon = await page
      .getByRole("button", { name: "Expand main sidebar", exact: true })
      .locator("svg")
      .boundingBox();
    expect(icon?.width).toBe(20);
    expect(icon?.height).toBe(20);
    expect(icon && icon.y + icon.height / 2).toBe(before.y + before.height / 2);
    await expand.hover();
    await expect(page.getByRole("tooltip")).toHaveText("Expand");

    const clickPoint = {
      x: before.x + before.width / 2,
      y: before.y + before.height / 2,
    };
    await page.mouse.click(clickPoint.x, clickPoint.y);
    const collapse = page.getByRole("button", {
      name: "Collapse main sidebar",
      exact: true,
    });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await expect
      .poll(async () => (await collapse.boundingBox())?.width)
      .toBeGreaterThan(before.width);
    const after = await collapse.boundingBox();
    expect(after?.x).toBe(before.x);
    expect(after?.y).toBe(before.y);
    expect(after?.height).toBe(before.height);
    const expandedIcon = await page
      .getByRole("button", { name: "Collapse main sidebar", exact: true })
      .locator("svg")
      .boundingBox();
    const label = await collapse
      .getByText("Collapse", { exact: true })
      .boundingBox();
    await expect(collapse.getByText("Collapse", { exact: true })).toHaveCSS(
      "font-size",
      "14px"
    );
    expect(expandedIcon && expandedIcon.y + expandedIcon.height / 2).toBe(
      label && label.y + label.height / 2
    );
    await page.mouse.click(clickPoint.x, clickPoint.y);
    await expect(expand).toBeVisible();

    await expand.focus();
    await page.keyboard.press("Enter");
    await expect(collapse).toBeFocused();
    await expect(collapse).toHaveCSS("--tw-ring-offset-width", "2px");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(collapse).toBeVisible();

    await page.setViewportSize({ width: 1342, height: 320 });
    await expect(collapse).toBeInViewport({ ratio: 1 });
    const nav = page.getByRole("navigation", { name: "Desktop navigation" });
    await nav.getByRole("button", { name: "NFTs", exact: true }).click();
    await expect(collapse).toBeInViewport({ ratio: 1 });
    const sidebar = page.getByLabel("Primary sidebar", { exact: true });
    await expect(
      sidebar.getByRole("button", { name: "Connect", exact: true })
    ).toBeInViewport({ ratio: 1 });
    await expectNoHorizontalOverflow(page);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(sidebar).toHaveCSS("transition-property", "none");
  });

  test("main sidebar bottom control closes web overlays", async ({
    page,
  }, testInfo) => {
    const isMobile = isMobileWebProject(testInfo.project.name);
    test.skip(
      !isMobile && !isDesktopWebProject(testInfo.project.name),
      "Web overlay controls"
    );
    if (!isMobile) await page.setViewportSize({ width: 1100, height: 600 });
    await gotoReady(page, "/messages");
    await hideNextDevTools(page);
    const open = page.getByRole("button", {
      name: isMobile ? "Open menu" : "Expand main sidebar",
      exact: true,
    });
    const close = page.getByRole("button", {
      name: "Close main sidebar",
      exact: true,
    });
    await open.click();
    await expect(close).toHaveAttribute("aria-expanded", "true");
    await expect(close).toBeInViewport({ ratio: 1 });
    await captureSafeScreenshot(page, testInfo, "sidebar-overlay");
    await close.click();
    await expect(close).not.toBeVisible();
    await open.click();
    await page.keyboard.press("Escape");
    await expect(close).not.toBeVisible();
    await open.click();
    await page
      .getByRole("button", { name: "Close menu overlay", exact: true })
      .click({ position: { x: 350, y: 100 } });
    await expect(close).not.toBeVisible();
    await open.click();
    await page
      .getByRole("navigation", { name: "Desktop navigation" })
      .getByRole("link", { name: "Waves", exact: true })
      .click();
    await expect(page).toHaveURL(/\/waves$/, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await expect(close).not.toBeVisible();
    if (!isMobile) {
      await expect(page.getByRole("main").first()).toHaveCSS(
        "transform",
        "none"
      );
    }
    await expectNoHorizontalOverflow(page);
  });

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

    const nav = page.getByRole("navigation", { name: "Desktop navigation" });
    await nav.getByRole("button", { name: "About", exact: true }).click();
    await nav.getByRole("button", { name: "Network & Reputation" }).click();
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
    await page.getByRole("button", { name: "Score", exact: true }).click();

    await expect(page.locator("#wave-score-calculator-error")).toContainText(
      "Enter a wave name, wave id, or wave URL."
    );
  });

  test("TDH explainer links to network reference pages", async ({ page }) => {
    await gotoReady(page, "/network/tdh");

    await expectTdhExplainer(page);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Current boosts & the full schedule",
        exact: true,
      })
    ).toBeVisible();
    await expectLinkHref(page, "Definitions", "/network/definitions");
    await expectLinkHref(
      page,
      "Network TDH Stats",
      "/network/health/network-tdh"
    );
    await expectLinkHref(page, "Levels", "/network/levels");
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
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "How to Register a Delegation?" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "All FAQ topics" })
    ).toHaveAttribute("href", "/delegation/delegation-faq");
    await expect(
      page.getByRole("navigation", {
        name: "Delegation FAQ article navigation",
      })
    ).toBeVisible();
  });
});
