import type { Page, TestInfo } from "@playwright/test";

import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

const SOURCE_COMMIT =
  process.env["MUSEUM_PUBLICATION_EXPECTED_COMMIT"]?.trim() || null;
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const MUSEUM_WAVE_ID = "5f207393-5418-4a75-8738-e40edb44a94d";
const MAGNUM_DROP_ID = "002bfa4f-8416-48bf-b35e-38f354e9a9f0";
const MAGNUM_WAVE_CONTEXT_HREF = `https://6529.io/waves/${MUSEUM_WAVE_ID}?drop=${MAGNUM_DROP_ID}`;

if (SOURCE_COMMIT !== null && !EXACT_COMMIT_PATTERN.test(SOURCE_COMMIT)) {
  throw new Error("museum_publication_expected_commit_not_exact");
}

async function openRoute(page: Page, path: string) {
  const response = await gotoDocumentWithTransientRetry(page, path);
  expect(response?.status(), `${path} did not return a document response`).toBe(
    200
  );
  await waitForRouteReady(page);
  await expect(page).toHaveURL((url) => url.pathname === path);
}

async function retainScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: testInfo.project.name !== MOBILE_PROJECT,
  });
}

async function expectMuseumNavigation(page: Page, activeLabel: string | null) {
  const navigation = page.locator('nav[aria-label="Museum sections"]');
  await expect(navigation).toBeVisible();
  await expect(navigation.locator("a")).toHaveText([
    "Collection",
    "Artists",
    "Acquisitions",
    "Research",
    "About",
  ]);
  await expect(navigation.locator('a[aria-current="page"]')).toHaveText(
    activeLabel === null ? [] : [activeLabel]
  );
}

async function expectNoDeadLinks(page: Page) {
  const deadLinks = await page
    .locator("a")
    .evaluateAll((anchors) =>
      anchors
        .map((anchor) => anchor.getAttribute("href"))
        .filter(
          (href) => href === null || href.trim().length === 0 || href === "#"
        )
    );
  expect(deadLinks).toEqual([]);
}

test.describe("Museum public IA rendered contract @surface @readonly", () => {
  test.skip(
    SOURCE_COMMIT === null,
    "Requires the exact WP-1 source commit selected by the publication test harness."
  );
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("keeps hubs, active navigation, canonical work context, and media intent bounded", async ({
    page,
  }, testInfo) => {
    const hubRoutes = [
      ["/museum/network", null],
      ["/museum/network/collection", "Collection"],
      ["/museum/network/artists", "Artists"],
      ["/museum/network/acquisitions", "Acquisitions"],
      ["/museum/network/research", "Research"],
      ["/museum/network/about", "About"],
      ["/museum/network/works", null],
      ["/museum/network/organizations", null],
    ] as const;

    for (const [path, activeLabel] of hubRoutes) {
      await openRoute(page, path);
      await expectMuseumNavigation(page, activeLabel);
      await expectNoHorizontalOverflow(page);
      await expectNoDeadLinks(page);
    }

    await openRoute(page, "/museum/network");
    await expect(
      page.getByText("Seven works by Casey Reas", { exact: true })
    ).toBeVisible();
    const acquisitionStories = page.getByLabel(
      "Three ways a work enters the Museum's public record"
    );
    for (const title of [
      "The System in Seven States",
      "Keys and Gates",
      "Conflict at Its Edges",
    ]) {
      await expect(
        acquisitionStories.getByRole("link", { name: title, exact: true })
      ).toBeVisible();
    }
    await retainScreenshot(page, testInfo, "museum-network-home");

    await openRoute(page, "/museum/network/collection");
    const collectionWorkHrefs = await page
      .locator('a[href^="/museum/network/works/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((link) => link.getAttribute("href"))),
      ]);
    expect(collectionWorkHrefs).toHaveLength(7);
    expect(
      collectionWorkHrefs.every(
        (href): href is string =>
          typeof href === "string" &&
          /^\/museum\/network\/works\/6529NM-W-\d{4}$/u.test(href)
      )
    ).toBe(true);

    await openRoute(page, "/museum/network/artists");
    const artistHrefs = await page
      .locator('a[href^="/museum/network/artists/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((link) => link.getAttribute("href"))),
      ]);
    expect(artistHrefs).toHaveLength(21);

    await openRoute(page, "/museum/network/acquisitions");
    await expect(page.locator("article")).toHaveCount(3);
    await retainScreenshot(page, testInfo, "museum-network-acquisitions");

    for (const [path, status] of [
      [
        "/museum/network/works/6529NM-W-0001",
        "Accessioned into the permanent Collection",
      ],
      [
        "/museum/network/works/6529NM-W-0008",
        "Selected through an acquisition program; acquisition pending",
      ],
      [
        "/museum/network/works/6529NM-W-0024",
        "Selected by Museum Wave; acquisition review in progress",
      ],
    ] as const) {
      await openRoute(page, path);
      await expectMuseumNavigation(page, null);
      await expect(page.getByText(status, { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoDeadLinks(page);
    }

    await openRoute(page, "/museum/network/works/6529NM-W-0001");
    await expect(page.getByText("By", { exact: true })).toBeVisible();
    await expect(page.getByText("Part of", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Acquired through", { exact: true })
    ).toBeVisible();
    await retainScreenshot(page, testInfo, "museum-work-casey");

    await openRoute(page, "/museum/network/works/6529NM-W-0008");
    await expect(
      page.getByText("Selected through", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("No public image is available for this record.", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /historical proposal image/u })
    ).toHaveCount(0);
    await retainScreenshot(page, testInfo, "museum-work-keys-and-gates");

    await openRoute(page, "/museum/network/works/6529NM-W-0028");
    await expectMuseumNavigation(page, null);
    await expect(
      page.getByText("No public image is available for this record.", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Selected by Museum Wave; acquisition review in progress",
        {
          exact: true,
        }
      )
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Historical Wave proposal presentation",
        exact: true,
      })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /historical proposal image/u })
    ).toHaveCount(0);
    await expect(
      page.locator('[aria-labelledby="canonical-work-media-title"] img')
    ).toHaveCount(0);
    await expect(
      page.locator('[aria-labelledby="canonical-work-presentation-title"] img')
    ).toHaveCount(0);
    await expect(page.locator("[download]")).toHaveCount(0);
    await expect(
      page.locator(`a[href="${MAGNUM_WAVE_CONTEXT_HREF}"]`)
    ).toHaveCount(2);
    await expect(
      page.getByRole("link", {
        name: "Open Wave proposal context",
        exact: true,
      })
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Wave proposal, part 6", exact: true })
    ).toHaveCount(1);
    await retainScreenshot(page, testInfo, "museum-work-magnum-metadata-only");
    await expectNoHorizontalOverflow(page);

    await openRoute(page, "/museum/network/works/6529NM-W-0027");
    await expect(
      page.getByText(/apparently young person/iu).first()
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /\bchild\b|\bchildren\b/iu
    );
  });

  test("keeps representative Museum templates free of automated WCAG A and AA violations", async ({
    page,
  }) => {
    for (const path of [
      "/museum/network",
      "/museum/network/acquisitions/keys-and-gates",
      "/museum/network/works/6529NM-W-0008",
    ]) {
      await openRoute(page, path);
      await expectAxeClean(page, { route: path });
    }
  });

  test("keeps Museum section navigation keyboard-visible and touch-sized", async ({
    page,
  }) => {
    await openRoute(page, "/museum/network");
    const links = page.locator('nav[aria-label="Museum sections"] a');

    await links.first().focus();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();

    const focusAndTarget = await links.nth(1).evaluate((link) => {
      const style = getComputedStyle(link);
      const bounds = link.getBoundingClientRect();
      return {
        hasVisibleFocus:
          style.outlineStyle !== "none" || style.boxShadow !== "none",
        height: bounds.height,
      };
    });
    expect(focusAndTarget.hasVisibleFocus).toBe(true);
    expect(focusAndTarget.height).toBeGreaterThanOrEqual(44);
  });
});
