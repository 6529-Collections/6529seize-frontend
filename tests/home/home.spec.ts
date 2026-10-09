import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { devices } from "@playwright/test";
import { getAppEnvironment } from "../../config/appEnvironment";
import {
  isDesktopWebProject,
  isMobileWebProject,
} from "../support/surfaceSimulation";
import { gateSidebarHydration } from "../support/sidebarHydration";
import { installSectionTrackingFixture } from "../support/sectionTrackingFixture";
import { installReadonlyMutationGuard } from "../support/readonlyMutationGuard";

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

test("mobile web starts with its header and full-width content before hydration @smoke @medium @large", async ({
  browser,
  browserName,
  baseURL,
  context: authenticatedContext,
}, testInfo) => {
  // Phone emulation supports Chromium/WebKit. Native simulations exercise a
  // different shell and Firefox has no supported mobile device context.
  test.skip(
    browserName === "firefox" ||
      (!isDesktopWebProject(testInfo.project.name) &&
        !isMobileWebProject(testInfo.project.name)),
    "Mobile browser startup contract"
  );
  if (!baseURL) throw new Error("The homepage test requires a base URL");
  // The PR smoke lane selects desktop Chromium. A separate phone context keeps
  // this mobile first-paint contract in that lane without expanding its pack.
  const context = await browser.newContext({
    ...devices[browserName === "webkit" ? "iPhone 14" : "Pixel 7"],
    baseURL,
    // Preserve fixture-seeded staging access without navigating or hydrating
    // before the first-paint assertions.
    storageState: await authenticatedContext.storageState(),
  });
  const guard = await installReadonlyMutationGuard(context, baseURL);
  const page = await context.newPage();
  const hydration = await gateSidebarHydration(page);
  const main = page.getByRole("main").first();
  const header = page.getByRole("banner");
  const sidebar = page.getByLabel("Primary sidebar", { exact: true });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-small-web-startup",
      "true"
    );
    await expect(page.getByRole("main").first().locator("..")).toHaveAttribute(
      "data-small",
      "false"
    );
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByRole("status", { name: "Loading navigation…" })
    ).toBeVisible();
    await expect(
      header.getByRole("button", { name: "Open menu" })
    ).toBeDisabled();
    await expect(sidebar).toBeHidden();
    const initial = await main.boundingBox();
    expect(initial?.x).toBe(0);
    expect(initial?.width).toBe(await page.evaluate(() => innerWidth));
    await expectNoHorizontalOverflow(page);
    await hydration.waitForDownloads();
    hydration.release();
    await expect(page.getByRole("main").first().locator("..")).toHaveAttribute(
      "data-small",
      "true"
    );
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-small-web-startup",
      "true"
    );
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute("aria-busy", "false");
    await expect(header.getByRole("status")).toHaveCount(0);
    await expect(
      header.getByRole("button", { name: "Open menu" })
    ).toBeEnabled();
    await expect(sidebar).toBeHidden();
    const hydrated = await main.boundingBox();
    expect(hydrated?.x).toBe(initial?.x);
    expect(hydrated?.width).toBe(initial?.width);
  } finally {
    hydration.release();
    await hydration.attachEvidence(testInfo);
    await context.close();
    guard.assertNoBlockedRequests();
  }
});

test("homepage tracking follows nested scrolling and loaded sections @smoke @medium @large", async ({
  page,
}) => {
  // Exercise the production observer with real browser geometry, without
  // contacting Mixpanel or requiring production analytics configuration.
  const { seen, clicked } = await installSectionTrackingFixture(
    page,
    `
    <main aria-label="Homepage test" style="height:240px;overflow:auto">
      <section data-home-section="Introduction" style="height:180px">
        <h1>Introduction</h1>
      </section>
      <div style="height:700px"></div>
      <section aria-label="Loading section" style="height:180px">
        <button data-home-action="Open wave">Open wave</button>
      </section>
    </main>
  `,
    `
        import { observeHomepageSections, getHomepageClick } from './components/home/homepageTracking';
        const root = document.querySelector('main');
        observeHomepageSections(root, section => append('Sections seen', section), new Set());
        root.addEventListener('click', event => {
          const click = getHomepageClick(root, event.target);
          if (click) append('Actions clicked', click.section + ': ' + click.action);
        }, true);
        root.querySelector('button').addEventListener('click', event => event.stopPropagation());
      `
  );
  await expect(seen).toHaveText(["Introduction"]);
  const loading = page.getByRole("region", { name: "Loading section" });
  await loading.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Open wave", exact: true }).click();
  await expect(clicked).toHaveCount(0);
  await loading.evaluate((element) =>
    element.setAttribute("data-home-section", "Explore waves")
  );
  await expect(seen).toHaveText(["Introduction", "Explore waves"]);
  await page.getByRole("button", { name: "Open wave", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(clicked).toHaveText(["Explore waves: Open wave"]);
  await page
    .getByRole("heading", { name: "Introduction" })
    .scrollIntoViewIfNeeded();
  await expect(seen).toHaveText(["Introduction", "Explore waves"]);
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
    const sidebarToggle = sidebar.getByRole("button", {
      name: "Toggle right sidebar",
    });
    const logo = sidebar.getByRole("img", { name: "6529Seize" });
    await search.blur();
    await page.mouse.move(1000, 400);
    await expect(sidebarToggle).toHaveCSS("opacity", "0");
    // Hovering a distant menu control reveals the header toggle too.
    await search.hover();
    await expect(sidebarToggle).toHaveCSS("opacity", "1");
    const railBox = await sidebar.boundingBox();
    const toggleBox = await sidebarToggle.boundingBox();
    expect(railBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.x + toggleBox!.width).toBeLessThanOrEqual(
      railBox!.x + railBox!.width
    );
    expect(toggleBox!.width).toBe(20);
    expect(toggleBox!.y + toggleBox!.height / 2).toBeCloseTo(
      railBox!.y + railBox!.height / 2,
      0
    );
    const about = sidebar.getByRole("button", { name: "About", exact: true });
    await about.hover();
    await expect(
      page.getByRole("navigation", { name: "About sub-navigation" })
    ).toBeVisible();
    await expect(sidebarToggle).toBeHidden();
    await page.keyboard.press("Escape");
    await search.hover();
    await expect(sidebarToggle).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await logo.hover();
    await expect(logo).not.toHaveCSS("box-shadow", "none");
    await expect(logo).not.toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(logo).toHaveCSS("transform", "none");
    await page.mouse.move(1000, 400);
    await sidebarToggle.focus();
    await expect(sidebarToggle).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter");
    await expect(sidebarToggle).toHaveAttribute("aria-expanded", "true");
    await expect(sidebarToggle).toHaveCSS("width", "20px");
    const expandedToggleBox = await sidebarToggle.boundingBox();
    expect(expandedToggleBox).not.toBeNull();
    expect(expandedToggleBox!.y + expandedToggleBox!.height / 2).toBeCloseTo(
      railBox!.y + railBox!.height / 2,
      0
    );
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

for (const { width, stored, expectedWidth } of [
  { width: 1440, stored: "false", expectedWidth: 275 },
  { width: 1440, stored: "true", expectedWidth: 80 },
  { width: 1100, stored: "false", expectedWidth: 80 },
]) {
  test(`restores sidebar ${stored} at ${width}px before hydration @smoke @medium @large`, async ({
    page,
  }, testInfo) => {
    // This contract covers desktop-web session restoration; native/mobile
    // layouts deliberately ignore the saved desktop sidebar width.
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "Saved desktop sidebar width does not apply to native or mobile layouts"
    );
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((value) => {
      globalThis.sessionStorage.setItem("sidebarCollapsed", value);
    }, stored);
    const hydration = await gateSidebarHydration(page);
    const sidebar = page.getByLabel("Primary sidebar", { exact: true });
    const layout = page.getByRole("main").first().locator("..");
    try {
      const documentResponse = await page.goto("/", { waitUntil: "commit" });
      await expect(layout).toHaveAttribute("data-sidebar-ready", "false");
      await expect(sidebar).toHaveCSS("width", `${expectedWidth}px`);
      await expect(page.getByRole("main").first()).toHaveCSS(
        "padding-left",
        `${expectedWidth}px`
      );
      await expect(page.getByRole("main").first()).toBeVisible();
      if (width >= 1280 && stored === "false") {
        await expect(
          page
            .getByLabel("Primary sidebar", { exact: true })
            .locator("[data-sidebar-content]")
        ).toHaveCSS("visibility", "hidden");
      }
      expect(documentResponse).not.toBeNull();
      expect(await documentResponse?.finished()).toBeNull();
      await hydration.waitForDownloads();
      hydration.release();
      await hydration.waitForReady();
    } finally {
      hydration.release();
      await hydration.attachEvidence(testInfo);
    }
    await expect(layout).toHaveAttribute("data-sidebar-ready", "true");
    await expect(sidebar).toHaveCSS("width", `${expectedWidth}px`);
    await expect(page.getByRole("main").first()).toHaveCSS(
      "padding-left",
      `${expectedWidth}px`
    );
    await expect(
      sidebar.getByRole("button", { name: "Toggle right sidebar" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
