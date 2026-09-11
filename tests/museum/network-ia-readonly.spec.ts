import { writeFile } from "node:fs/promises";

import type { Page, TestInfo } from "@playwright/test";

import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";
import {
  expectAcquisitionsAcceptance,
  expectCollectionAcceptance,
  expectMuseumGeometryAcceptance,
  expectResearchAcceptance,
  MUSEUM_RELEASE_ACCEPTANCE_ROUTES,
  MUSEUM_RELEASE_ACCEPTANCE_VIEWPORTS,
  openMuseumAcceptanceRoute,
} from "../support/museumReleaseAcceptance";

const SOURCE_COMMIT =
  process.env["MUSEUM_PUBLICATION_EXPECTED_COMMIT"]?.trim() || null;
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const EVIDENCE_SCREENSHOT_TIMEOUT_MS = 15_000;
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
  const cdpSession = await page.context().newCDPSession(page);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const capture = await Promise.race([
      cdpSession.send("Page.captureScreenshot", {
        captureBeyondViewport: false,
        format: "png",
        fromSurface: true,
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `Museum viewport evidence capture timed out after ${EVIDENCE_SCREENSHOT_TIMEOUT_MS}ms: ${name}`
            )
          );
        }, EVIDENCE_SCREENSHOT_TIMEOUT_MS);
      }),
    ]);

    await writeFile(
      testInfo.outputPath(`${name}.png`),
      Buffer.from(capture.data, "base64")
    );
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    await cdpSession.detach().catch(() => undefined);
  }
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
    ({ browserName }) => browserName !== "chromium",
    "Retained Museum evidence uses the Chromium CDP in the exact desktop/mobile matrix."
  );
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
      page
        .getByText(
          "Vera Molnár, in collaboration with Martin Grasser · Themes and Variations",
          { exact: true }
        )
        .first()
    ).toBeVisible();
    const acquisitionStories = page.locator(
      '[aria-labelledby="museum-acquisition-stories-title"]'
    );
    for (const title of [
      "The System in Seven States",
      "Keys and Gates",
      "Conflict at Its Edges",
      "A Gift of Themes and Variations #210",
    ]) {
      await expect(
        acquisitionStories.getByRole("link", { name: title, exact: true })
      ).toBeVisible();
    }
    await retainScreenshot(page, testInfo, "museum-network-home");

    await openRoute(page, "/museum/network/collection");
    const permanentHoldings = page.getByTestId("museum-permanent-holdings");
    const collectionWorkHrefs = await permanentHoldings
      .locator('a[href^="/museum/network/works/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((link) => link.getAttribute("href"))),
      ]);
    expect(collectionWorkHrefs).toHaveLength(13);
    expect(
      collectionWorkHrefs.every(
        (href): href is string =>
          typeof href === "string" &&
          /^\/museum\/network\/works\/6529NM-W-\d{4}$/u.test(href)
      )
    ).toBe(true);
    const inProgressWorkHrefValues = await page
      .getByTestId("museum-in-progress-works")
      .locator('a[href^="/museum/network/works/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const inProgressWorkHrefs = [...new Set(inProgressWorkHrefValues)];
    expect(inProgressWorkHrefValues).toHaveLength(16);
    expect(inProgressWorkHrefs).toHaveLength(16);
    expect(
      inProgressWorkHrefs.every(
        (href): href is string =>
          typeof href === "string" &&
          /^\/museum\/network\/works\/6529NM-W-\d{4}$/u.test(href) &&
          !collectionWorkHrefs.includes(href)
      )
    ).toBe(true);
    for (const title of [
      "Patrolling the border between the Negev Desert and Jordan",
      "Government soldiers in a church, Suchitoto, El Salvador",
      "Demonstration, Western Wall, Jerusalem",
      "Tripoli, Libya",
      "Palmyra, Syria",
    ]) {
      const card = page
        .locator('[data-testid="museum-landing-media-card"]')
        .filter({ has: page.getByRole("link", { name: title, exact: true }) });
      await expect(card.locator("img")).toHaveCount(1);
      await expect(
        card.getByText(/does not currently include an image/iu)
      ).toHaveCount(0);
    }
    const firstMagnumCollectionCard = page
      .locator('[data-testid="museum-landing-media-card"]')
      .filter({
        has: page.getByRole("link", {
          name: "Patrolling the border between the Negev Desert and Jordan",
          exact: true,
        }),
      });
    await firstMagnumCollectionCard.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          firstMagnumCollectionCard
            .locator("img")
            .evaluate(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0
            ),
        { timeout: 20_000 }
      )
      .toBe(true);
    await retainScreenshot(page, testInfo, "museum-network-collection");
    await expectNoHorizontalOverflow(page);

    await openRoute(page, "/museum/network/projects");
    const magnumProjectCard = page.locator("article").filter({
      has: page.getByRole("link", { name: "Magnum Photos 75", exact: true }),
    });
    await expect(magnumProjectCard.locator("img")).toHaveCount(1);
    await expect(magnumProjectCard.getByText("0", { exact: true })).toHaveCount(
      0
    );
    await magnumProjectCard.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        magnumProjectCard
          .locator("img")
          .evaluate(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0
          )
      )
      .toBe(true);
    await retainScreenshot(page, testInfo, "museum-network-projects");
    await expectNoHorizontalOverflow(page);

    await openRoute(page, "/museum/network/artists");
    const artistHrefs = await page
      .locator('a[href^="/museum/network/artists/"]')
      .evaluateAll((links) => [
        ...new Set(links.map((link) => link.getAttribute("href"))),
      ]);
    expect(artistHrefs).toHaveLength(23);
    const artistMediaStages = page.getByTestId("museum-directory-media-stage");
    await expect(artistMediaStages).toHaveCount(23);
    const artistStageRatios = await artistMediaStages.evaluateAll((stages) =>
      stages.map((stage) => {
        const { width, height } = stage.getBoundingClientRect();
        return width / height;
      })
    );
    for (const ratio of artistStageRatios) {
      expect(ratio).toBeCloseTo(4 / 3, 2);
    }

    await openRoute(page, "/museum/network/acquisitions");
    await expect(page.locator("article")).toHaveCount(4);
    const acquisitionMediaStages = page.getByTestId(
      "museum-acquisition-media-stage"
    );
    await expect(acquisitionMediaStages).toHaveCount(4);
    const acquisitionStageRatios = await acquisitionMediaStages.evaluateAll(
      (stages) =>
        stages.map((stage) => {
          const { width, height } = stage.getBoundingClientRect();
          return width / height;
        })
    );
    expect(
      new Set(acquisitionStageRatios.map((ratio) => ratio.toFixed(3))).size
    ).toBe(1);
    for (const ratio of acquisitionStageRatios) {
      expect(
        [4 / 5, 4 / 3].some((expected) => Math.abs(ratio - expected) < 0.01)
      ).toBe(true);
    }
    await retainScreenshot(page, testInfo, "museum-network-acquisitions");

    for (const [path, status] of [
      [
        "/museum/network/works/6529NM-W-0001",
        "Accessioned into the permanent Collection",
      ],
      [
        "/museum/network/works/6529NM-W-0008",
        "Selected through an acquisition program; unminted",
      ],
      [
        "/museum/network/works/6529NM-W-0024",
        "Accessioned into the permanent Collection",
      ],
      [
        "/museum/network/works/6529NM-W-0029",
        "Accessioned into the permanent Collection",
      ],
    ] as const) {
      await openRoute(page, path);
      await expectMuseumNavigation(page, null);
      await expect(page.getByText(status, { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoDeadLinks(page);
    }

    await openRoute(page, "/museum/network/works/6529NM-W-0029");
    const veraWorkImage = page.locator(
      '[aria-labelledby="canonical-work-media-title"] img'
    );
    await expect(veraWorkImage).toHaveCount(1);
    await veraWorkImage.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          veraWorkImage.evaluate(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0
          ),
        { timeout: 20_000 }
      )
      .toBe(true);
    await expect(
      page.getByText("This image is temporarily unavailable.", { exact: true })
    ).toHaveCount(0);

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
      page.getByRole("img", {
        name: "A lone figure stands before a tall blue patterned gate as sunlight casts long geometric shadows across a stone hall.",
      })
    ).toBeVisible();
    await expect(
      page.getByText("No public image is available for this record.", {
        exact: true,
      })
    ).toHaveCount(0);
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
    ).toHaveCount(0);
    await expect(
      page.getByText("Accessioned into the permanent Collection", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "The work",
        exact: true,
      })
    ).toHaveCount(1);
    await expect(
      page.locator('[aria-labelledby="canonical-work-presentation-title"] img')
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: /loads 16\.9 MB/u })
    ).toHaveCount(0);
    await expect(page.locator("[download]")).toHaveCount(0);
    await expect(
      page.locator(`a[href="${MAGNUM_WAVE_CONTEXT_HREF}"]`)
    ).toHaveCount(2);
    await expect(
      page.getByRole("link", {
        name: "View Wave publication",
        exact: true,
      })
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Wave proposal, part 6", exact: true })
    ).toHaveCount(1);
    await retainScreenshot(page, testInfo, "museum-work-conflict-at-its-edges");
    await expectNoHorizontalOverflow(page);

    await openRoute(page, "/museum/network/acquisitions/keys-and-gates");
    await expect(
      page.getByRole("heading", { name: "Keys and Gates", exact: true })
    ).toBeVisible();
    await expect(page.locator("#acquisition-works figure img")).toHaveCount(16);
    await expect(
      page.getByRole("heading", { name: "Curatorial reading", exact: true })
    ).toBeVisible();
    await expect(
      page.locator("details#acquisition-record")
    ).not.toHaveAttribute("open");
    await page.evaluate(() => window.scrollTo(0, 0));
    await retainScreenshot(page, testInfo, "museum-acquisition-keys-and-gates");
    await page.locator("#acquisition-works-title").scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator("#acquisition-works figure img")
          .first()
          .evaluate(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0
          )
      )
      .toBe(true);
    await retainScreenshot(
      page,
      testInfo,
      "museum-acquisition-keys-and-gates-gallery"
    );
    await expectNoHorizontalOverflow(page);

    await openRoute(page, "/museum/network/acquisitions/conflict-at-its-edges");
    await expect(
      page.getByRole("heading", {
        name: "Conflict at Its Edges",
        exact: true,
        level: 1,
      })
    ).toBeVisible();
    await expect(page.locator("#acquisition-works figure")).toHaveCount(5);
    await expect(page.locator("#acquisition-works figure img")).toHaveCount(5);
    await expect(
      page.getByRole("heading", { name: "Curatorial reading", exact: true })
    ).toBeVisible();
    await expect(
      page.locator("details#acquisition-record")
    ).not.toHaveAttribute("open");
    await page.evaluate(() => window.scrollTo(0, 0));
    await retainScreenshot(
      page,
      testInfo,
      "museum-acquisition-conflict-at-its-edges"
    );
    await page.locator("#acquisition-works-title").scrollIntoViewIfNeeded();
    await expect(
      page.locator("#acquisition-works figure").first()
    ).toContainText(
      "Patrolling the border between the Negev Desert and Jordan"
    );
    await expect
      .poll(() =>
        page
          .locator("#acquisition-works figure img")
          .first()
          .evaluate(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0
          )
      )
      .toBe(true);
    await retainScreenshot(
      page,
      testInfo,
      "museum-acquisition-conflict-at-its-edges-gallery"
    );
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

test.describe("Museum deterministic release acceptance @surface @readonly", () => {
  test.setTimeout(180_000);

  test("accepts Collection media, lifecycle, derivatives, and geometry", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "The release acceptance matrix owns its explicit 1440/820/390 Chromium viewports."
    );
    for (const viewport of MUSEUM_RELEASE_ACCEPTANCE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await openMuseumAcceptanceRoute(
        page,
        MUSEUM_RELEASE_ACCEPTANCE_ROUTES.collection
      );
      await expectCollectionAcceptance(page);
      await expectMuseumGeometryAcceptance(page);
    }
  });

  test("accepts Acquisitions lifecycle, identifiers, media, and geometry", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "The release acceptance matrix owns its explicit 1440/820/390 Chromium viewports."
    );
    for (const viewport of MUSEUM_RELEASE_ACCEPTANCE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await openMuseumAcceptanceRoute(
        page,
        MUSEUM_RELEASE_ACCEPTANCE_ROUTES.acquisitions
      );
      await expectAcquisitionsAcceptance(page);
      await expectMuseumGeometryAcceptance(page);
    }
  });

  test("accepts Research coverage, title controls, media, and geometry", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "The release acceptance matrix owns its explicit 1440/820/390 Chromium viewports."
    );
    for (const viewport of MUSEUM_RELEASE_ACCEPTANCE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await openMuseumAcceptanceRoute(
        page,
        MUSEUM_RELEASE_ACCEPTANCE_ROUTES.research
      );
      await expectResearchAcceptance(page);
      await expectMuseumGeometryAcceptance(page);
    }
  });
});
