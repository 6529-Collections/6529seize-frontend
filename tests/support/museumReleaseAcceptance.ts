import type { Page } from "@playwright/test";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  expect,
  expectNoHorizontalOverflow,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "./routeReadiness";

export const MUSEUM_RELEASE_ACCEPTANCE_VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "tablet-820", width: 820, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

export const MUSEUM_RELEASE_ACCEPTANCE_ROUTES = {
  collection: "/museum/network/collection",
  acquisitions: "/museum/network/acquisitions",
  research: "/museum/network/research",
} as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

const unresolvedMediaPatternSource = [
  t(DEFAULT_LOCALE, "museum.network.media.loading"),
  t(DEFAULT_LOCALE, "museum.network.media.unavailable"),
  t(DEFAULT_LOCALE, "museum.network.media.error"),
  t(DEFAULT_LOCALE, "museum.network.media.metadataOnly"),
  "The public record does not currently include an image for this work.",
]
  .map(escapeRegExp)
  .join("|");

type MuseumAcceptanceRoute =
  (typeof MUSEUM_RELEASE_ACCEPTANCE_ROUTES)[keyof typeof MUSEUM_RELEASE_ACCEPTANCE_ROUTES];

function museumMain(page: Page) {
  return page.locator("main").last();
}

export async function openMuseumAcceptanceRoute(
  page: Page,
  path: MuseumAcceptanceRoute
) {
  const response = await gotoDocumentWithTransientRetry(page, path);
  expect(response?.status(), `${path} did not return a document response`).toBe(
    200
  );
  await waitForRouteReady(page);
  await expect(page).toHaveURL((url) => url.pathname === path);
  await expect(page.locator("main").first()).toBeVisible();
}

async function settleImages(page: Page, selector: string) {
  const images = page.locator(selector);
  const imageCount = await images.count();
  for (let index = 0; index < imageCount; index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded();
  }
  await Promise.all(
    Array.from({ length: imageCount }, async (_, index) => {
      const image = images.nth(index);
      await expect
        .poll(
          () =>
            image.evaluate((element) => {
              if (!(element instanceof HTMLImageElement)) return false;
              return element.complete && element.naturalWidth > 0;
            }),
          { timeout: 20_000 }
        )
        .toBe(true);
    })
  );
}

export async function expectNoUnresolvedMuseumMedia(
  page: Page,
  root = "main",
  imageSelector = "img"
) {
  await settleImages(page, `${root} ${imageSelector}`);
  const problems = await page.locator(root).evaluateAll(
    (roots, options) => {
      const unresolvedMediaPattern = new RegExp(options.patternSource, "iu");
      const isVisible = (element: Element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const failures: string[] = [];
      for (const root of roots) {
        for (const element of root.querySelectorAll(options.imageSelector)) {
          if (!isVisible(element)) continue;
          if (!(element instanceof HTMLImageElement)) continue;
          if (!element.complete || element.naturalWidth === 0) {
            failures.push(`unresolved image: ${element.alt || element.src}`);
          }
        }
        for (const element of root.querySelectorAll("[role=alert], p, span")) {
          if (!isVisible(element)) continue;
          const text = element.textContent?.replace(/\s+/gu, " ").trim() ?? "";
          if (unresolvedMediaPattern.test(text)) failures.push(text);
        }
      }
      return [...new Set(failures)];
    },
    { imageSelector, patternSource: unresolvedMediaPatternSource }
  );
  expect(problems, problems.join("\n")).toEqual([]);
}

export async function expectCollectionAcceptance(page: Page) {
  const holdings = page.locator(
    'section[aria-labelledby="collection-holdings-title"]'
  );
  const holdingCards = holdings.locator(
    '[data-testid="museum-landing-media-card"]'
  );
  await expect(holdingCards).toHaveCount(13);
  const veraCard = holdingCards.filter({
    has: page.getByRole("link", {
      name: "Themes and Variations #210",
      exact: true,
    }),
  });
  await expect(
    veraCard,
    "Missing Collection card: Themes and Variations #210"
  ).toHaveCount(1);
  await expect(
    veraCard.getByRole("link", {
      name: "Themes and Variations #210",
      exact: true,
    })
  ).toHaveAttribute("href", "/museum/network/works/6529NM-W-0029");
  await expectNoUnresolvedMuseumMedia(
    page,
    'section[aria-labelledby="collection-holdings-title"]',
    "img"
  );

  const magnumTitles = [
    "Patrolling the border between the Negev Desert and Jordan",
    "Government soldiers in a church, Suchitoto, El Salvador",
    "Demonstration, Western Wall, Jerusalem",
    "Tripoli, Libya",
    "Palmyra, Syria",
  ];
  for (const title of magnumTitles) {
    const card = holdingCards.filter({
      has: page.getByRole("link", { name: title, exact: true }),
    });
    await expect(card, `Missing Collection card: ${title}`).toHaveCount(1);
    await expect(card.locator("img")).toHaveCount(1);
    await expect
      .poll(() =>
        card.locator("img").evaluate((element) => {
          return (
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0 &&
            element.naturalHeight > 0
          );
        })
      )
      .toBe(true);

    const derivative = await card.locator("img").evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error("Collection media must render as an image");
      }
      const srcSet = element.getAttribute("srcset") ?? "";
      const candidates = srcSet
        .split(",")
        .map((candidate) => candidate.trim().split(/\s+/u))
        .filter((candidate) => candidate.length === 2)
        .map((candidate) => ({
          url: candidate[0] ?? "",
          width: Number.parseInt(candidate[1] ?? "", 10),
        }))
        .filter((candidate) => Number.isFinite(candidate.width))
        .sort((left, right) => left.width - right.width);
      return {
        currentSrc: element.currentSrc,
        currentCandidateWidth:
          candidates.find(
            (candidate) =>
              new URL(candidate.url, document.baseURI).href ===
              new URL(element.currentSrc, document.baseURI).href
          )?.width ?? null,
        viewportWidth: window.innerWidth,
        sizes: element.getAttribute("sizes") ?? "",
        candidates,
      };
    });
    expect(
      derivative.candidates.length,
      `${title} must expose responsive derivative candidates`
    ).toBeGreaterThanOrEqual(2);
    expect(
      derivative.sizes,
      `${title} is missing an accurate sizes hint`
    ).not.toBe("");
    expect(
      derivative.currentCandidateWidth,
      `${title} must load one of its responsive derivative candidates`
    ).not.toBeNull();
    expect(
      derivative.currentCandidateWidth ?? Number.POSITIVE_INFINITY,
      `${title} must load a derivative bounded to the active viewport`
    ).toBeLessThanOrEqual(derivative.viewportWidth * 2);
  }

  const inProgressHeading = page.getByRole("heading", {
    name: "Acquisitions in progress",
    exact: true,
  });
  await expect(inProgressHeading).toBeVisible();
  const inProgress = inProgressHeading.locator("xpath=ancestor::section[1]");
  await expect(inProgress).toContainText("Keys and Gates");
  await expect(inProgress).toContainText(/selection|acquisition|accession/iu);
  await expect(holdings).not.toContainText("Keys and Gates");
}

export async function expectAcquisitionsAcceptance(page: Page) {
  const acquisitionArticles = page.locator("main article").filter({
    has: page.locator('h2 a[href^="/museum/network/acquisitions/"]'),
  });
  await expect(acquisitionArticles).toHaveCount(4);

  const expectedStatuses = [
    [
      "The System in Seven States",
      /Accessioned into the permanent Collection/u,
    ],
    ["Conflict at Its Edges", /Accessioned into the permanent Collection/u],
    [
      "A Gift of Themes and Variations #210",
      /Accessioned into the permanent Collection/u,
    ],
    [
      "Keys and Gates",
      /Selected through an acquisition program; unminted|acquisition.*in progress|selection.*complete/iu,
    ],
  ] as const;
  for (const [title, status] of expectedStatuses) {
    const article = acquisitionArticles.filter({ hasText: title });
    await expect(article, `Missing acquisition article: ${title}`).toHaveCount(
      1
    );
    await expect(article).toContainText(status);
  }

  const acquisitionHrefs = await acquisitionArticles
    .locator('h2 a[href^="/museum/network/acquisitions/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(acquisitionHrefs).size).toBe(4);

  const identifiers = await museumMain(page).evaluate((main) => {
    const internalIdentifierPattern = /\b6529NM-(?:AP|CA)-[A-Z0-9.-]+\b/gu;
    const text = main.textContent ?? "";
    const counts = new Map<string, number>();
    for (const identifier of text.match(internalIdentifierPattern) ?? []) {
      counts.set(identifier, (counts.get(identifier) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([identifier, count]) => `${identifier} (${count})`);
  });
  expect(
    identifiers,
    `Duplicate visible acquisition identifiers: ${identifiers.join(", ")}`
  ).toEqual([]);

  const articleSources = await acquisitionArticles
    .locator("img")
    .evaluateAll((images) =>
      images.map((image) =>
        image instanceof HTMLImageElement ? image.currentSrc || image.src : ""
      )
    );
  expect(new Set(articleSources).size).toBe(4);
  await expectNoUnresolvedMuseumMedia(page, "main article", "img");
}

export async function expectResearchAcceptance(page: Page) {
  await expectNoUnresolvedMuseumMedia(page, "main", "img");
  const section = (id: string) =>
    page.locator(`section:has(> header > #museum-research-section-${id})`);
  const acquisitions = section("acquisition-scholarship");
  const artists = section("artists");
  const works = section("works");
  const contexts = section("contexts");
  const practice = section("museum-practice");

  await expect(acquisitions.locator("article")).toHaveCount(4);
  await expect(acquisitions).toContainText("The System in Seven States");
  await expect(acquisitions).toContainText("Conflict at Its Edges");
  await expect(acquisitions).toContainText(
    "A Gift of Themes and Variations #210"
  );
  await expect(acquisitions).toContainText("Access, Control, and Exit");
  await expect(
    acquisitions.getByText("Permanent Collection", { exact: true })
  ).toHaveCount(3);
  await expect(
    acquisitions.getByText("Acquisition in progress", { exact: true })
  ).toHaveCount(1);

  await expect(artists.locator("article")).toHaveCount(8);
  await expect(artists).toContainText("Vera Molnár");
  await expect(artists).toContainText("Martin Grasser");
  await expect(artists).toContainText("Casey Reas");
  await expect(artists).toContainText("Larry Towell");
  await expect(artists).toContainText("Moisés Saman");
  await expect(artists).toContainText("HugoFaz");
  await expect(works.locator("article")).toHaveCount(7);
  await expect(works).toContainText("Themes and Variations #210");
  await expect(contexts.locator("article")).toHaveCount(2);
  await expect(contexts).toContainText("Magnum Photos");
  await expect(contexts).toContainText("Keys and Gates");
  await expect(practice.locator("article")).toHaveCount(4);
  await expect(practice).toContainText("Museums to learn from");
  await expect(practice).toContainText("Scholarship and writing");
  await expect(practice).toContainText("The Open Museum");
  await expect(practice).toContainText("From repository to chain");

  const imageArticles = await page.locator("main article").evaluateAll(
    (articles) =>
      articles.flatMap((article) => {
        const image = article.querySelector("img");
        if (!(image instanceof HTMLImageElement)) return [];
        const source = image.currentSrc || image.src;
        if (source.length === 0) return [];
        return [
          {
            source,
            text: (article.textContent ?? "").replace(/\s+/gu, " ").trim(),
          },
        ];
      })
  );
  const articlesBySource = new Map<string, string[]>();
  for (const { source, text } of imageArticles) {
    const articles = articlesBySource.get(source) ?? [];
    articles.push(text);
    articlesBySource.set(source, articles);
  }
  const repeatedSources = [...articlesBySource.entries()].filter(
    ([, articles]) => articles.length > 1
  );
  expect(
    repeatedSources,
    "Only the accession essay and Work study may share their subject image"
  ).toHaveLength(1);
  const sharedImageArticles = repeatedSources[0]?.[1] ?? [];
  expect(sharedImageArticles).toHaveLength(2);
  expect(
    sharedImageArticles.some(
      (text) =>
        text.includes("A Gift of Themes and Variations #210") &&
        text.includes("Acquisition essay")
    )
  ).toBe(true);
  expect(
    sharedImageArticles.some(
      (text) =>
        text.includes("Themes and Variations #210") &&
        text.includes("Work study")
    )
  ).toBe(true);

  const publicText = await museumMain(page).innerText();
  expect(publicText).not.toMatch(/\b6529NM-(?:RP|CA|AP|W|ART|ORG)-/u);
  expect(publicText).not.toMatch(/(?:records|notes|docs)\/[a-z0-9_./-]+/iu);
  expect(publicText).not.toMatch(
    /Start with the art|Then follow the record|connected work/iu
  );
}

export async function expectMuseumGeometryAcceptance(page: Page) {
  await settleImages(page, "main img");
  await expectNoHorizontalOverflow(page, { tolerancePx: 1 });
  const issues = await museumMain(page).evaluate((root) => {
    const content =
      root.querySelector("div.tw-mx-auto.tw-w-full.tw-min-w-0") ?? root;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const contentWidth = content.getBoundingClientRect().width;
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const hasBorder = (element: Element) => {
      const style = getComputedStyle(element);
      return [
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ].some((width) => Number.parseFloat(width) > 0);
    };
    const allIssues: string[] = [];

    for (const element of root.querySelectorAll("*")) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        allIssues.push(
          `horizontal overflow: ${element.tagName.toLowerCase()} ${Math.round(rect.left)}..${Math.round(rect.right)}`
        );
      }
    }

    for (const image of root.querySelectorAll("img")) {
      if (!visible(image) || !(image instanceof HTMLImageElement)) continue;
      if (!image.complete || image.naturalWidth === 0) {
        allIssues.push(`unresolved principal media: ${image.alt || image.src}`);
      }
      const frame = image.closest("figure, [class*='tw-overflow-hidden']");
      if (frame !== null) {
        const imageRect = image.getBoundingClientRect();
        const frameRect = frame.getBoundingClientRect();
        if (
          imageRect.left < frameRect.left - 1 ||
          imageRect.right > frameRect.right + 1 ||
          imageRect.top < frameRect.top - 1 ||
          imageRect.bottom > frameRect.bottom + 1
        ) {
          allIssues.push(`clipped principal media: ${image.alt || image.src}`);
        }
      }
    }

    for (const figure of root.querySelectorAll("figure")) {
      if (!visible(figure) || !hasBorder(figure)) continue;
      const caption = figure.querySelector("figcaption");
      if (caption !== null && hasBorder(caption)) {
        allIssues.push(
          "bordered caption nested inside a bordered artwork card"
        );
      }
      const rect = figure.getBoundingClientRect();
      if (
        rect.width > contentWidth * 0.6 &&
        rect.height > viewportHeight * 0.4
      ) {
        allIssues.push("oversized decorative framed artwork region");
      }
    }

    for (const element of root.querySelectorAll("*")) {
      if (!visible(element)) continue;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const leftOnlyBorder =
        Number.parseFloat(style.borderLeftWidth) > 0 &&
        Number.parseFloat(style.borderTopWidth) === 0 &&
        Number.parseFloat(style.borderRightWidth) === 0 &&
        Number.parseFloat(style.borderBottomWidth) === 0;
      if (leftOnlyBorder && rect.height > 120) {
        allIssues.push("decorative left rail exceeds 120px");
      }
      if (
        element.tagName.toLowerCase() === "article" &&
        hasBorder(element) &&
        element.querySelector("figure") !== null &&
        [...element.classList].some((name) => name.includes("tw-rounded"))
      ) {
        const roundedNested = element.querySelector(
          "figure[class*='tw-rounded'], article[class*='tw-rounded'], section[class*='tw-rounded']"
        );
        if (roundedNested !== null && hasBorder(roundedNested)) {
          allIssues.push("nested rounded bordered editorial surfaces");
        }
      }
    }

    for (const paragraph of root.querySelectorAll("p")) {
      if (!visible(paragraph)) continue;
      if (
        paragraph.closest("footer, figcaption, dl") !== null ||
        paragraph.textContent?.trim().length === undefined ||
        (paragraph.textContent?.trim().length ?? 0) < 80
      ) {
        continue;
      }
      const style = getComputedStyle(paragraph);
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const minimumFontSize =
        (paragraph.textContent?.trim().length ?? 0) >= 160 ? 16 : 14;
      if (fontSize < minimumFontSize) {
        allIssues.push(
          `body or secondary copy below type floor: ${fontSize}px`
        );
      }
      if (Number.isFinite(lineHeight) && lineHeight / fontSize < 1.6) {
        allIssues.push("body or secondary copy below line-height floor");
      }
      const previous = paragraph.previousElementSibling;
      if (
        previous !== null &&
        /^(H1|H2|H3|H4|H5|H6)$/u.test(previous.tagName) &&
        Number.parseFloat(style.marginTop) < 8
      ) {
        allIssues.push("heading-to-copy spacing below 8px");
      }
    }

    for (const grid of root.querySelectorAll("[class*='tw-grid']")) {
      if (!visible(grid)) continue;
      const style = getComputedStyle(grid);
      if (
        style.display !== "grid" ||
        grid.querySelector("article, figure") === null
      ) {
        continue;
      }
      const rect = grid.getBoundingClientRect();
      const columns = style.gridTemplateColumns
        .split(" ")
        .map((column) => Number.parseFloat(column))
        .filter((column) => Number.isFinite(column));
      if (
        rect.width >= 640 &&
        columns.length > 1 &&
        columns.some((column) => column < 320)
      ) {
        allIssues.push("desktop grid retains a column narrower than 20rem");
      }
    }
    return [...new Set(allIssues)];
  });
  expect(issues, issues.join("\n")).toEqual([]);
}
