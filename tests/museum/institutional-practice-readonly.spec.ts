import type { Page } from "@playwright/test";

import {
  expect,
  expectKeyboardFocusVisibleWithinTabs,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  assertNoConsoleErrors,
  attachPageDiagnostics,
} from "../support/pageAssertions";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

const STUDY_PATH = "/museum/network/stories/a-field-of-practice";
const SOURCE_REPOSITORY = "6529-Collections/6529networkmuseum";
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS = [
  /^Analytics SDK: TypeError: Failed to fetch(?:\n|$)/,
];

type StudyRoute = {
  readonly path: string;
  readonly sourcePath: string;
  readonly title: string;
};

const PROFILES = [
  ["met", "The Metropolitan Museum of Art"],
  ["getty", "Getty"],
  ["moma", "The Museum of Modern Art"],
  ["whitney", "Whitney Museum of American Art"],
  ["tate", "Tate"],
  ["centre-pompidou", "Centre Pompidou"],
  ["sfmoma", "San Francisco Museum of Modern Art"],
  ["guggenheim", "Solomon R. Guggenheim Museum"],
  ["zkm", "ZKM | Center for Art and Media"],
  ["ars-electronica", "Ars Electronica"],
  ["rhizome-new-museum", "Rhizome and the New Museum"],
  ["serpentine-arts-technologies", "Serpentine Arts Technologies"],
  ["v-and-a", "Victoria and Albert Museum"],
  ["lacma", "Los Angeles County Museum of Art"],
] as const;

const INDEX_ROUTE: StudyRoute = {
  path: STUDY_PATH,
  sourcePath: "records/institutional-practice/a-field-of-practice.md",
  title: "A field of practice",
};

const SOURCE_ROUTE: StudyRoute = {
  path: `${STUDY_PATH}/sources`,
  sourcePath: "records/institutional-practice/source-register.md",
  title: "Source register: A field of practice",
};

const PROFILE_ROUTES: readonly StudyRoute[] = PROFILES.map(([slug, title]) => ({
  path: `${STUDY_PATH}/${slug}`,
  sourcePath: `records/institutional-practice/profiles/${slug}.md`,
  title,
}));

async function expectSafeLinks(page: Page) {
  const problems = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.flatMap((anchor) => {
      const href = anchor.getAttribute("href") ?? "";
      const target = anchor.getAttribute("target") ?? "";
      const rel = new Set(
        (anchor.getAttribute("rel") ?? "").toLowerCase().split(/\s+/u)
      );
      const linkProblems: string[] = [];

      if (/^javascript:/iu.test(href)) {
        linkProblems.push(`javascript URL: ${href}`);
      }

      if (/^http:/iu.test(href)) {
        linkProblems.push(`insecure external URL: ${href}`);
      }

      if (/^https?:/iu.test(href)) {
        const url = new URL(href);
        if (url.username || url.password) {
          linkProblems.push(`credential-bearing URL: ${url.origin}`);
        }
      }

      if (
        target === "_blank" &&
        (!rel.has("noopener") || !rel.has("noreferrer"))
      ) {
        linkProblems.push(`unsafe target=_blank link: ${href}`);
      }

      return linkProblems;
    })
  );

  expect(problems, problems.join("\n")).toEqual([]);
}

async function expectFreshExactSource(
  page: Page,
  route: StudyRoute,
  expectedCommit: string | null
) {
  const sourcePanel = page.locator(
    'aside[aria-labelledby="museum-open-source-title"]'
  );
  await expect(sourcePanel).toBeVisible();
  await expect(sourcePanel).toContainText(
    /Published from the Museum's public record at commit [a-f0-9]{12}\./u
  );
  await expect(sourcePanel).not.toContainText(
    /latest verified release|temporarily unavailable|Page-level source: unassigned/iu
  );

  const sourceLink = sourcePanel.getByRole("link", {
    name: "Read the source",
    exact: true,
  });
  const sourceHref = await sourceLink.getAttribute("href");
  expect(sourceHref).not.toBeNull();

  const sourceUrl = new URL(sourceHref ?? "https://invalid.example");
  const sourcePrefix = `/${SOURCE_REPOSITORY}/blob/`;
  expect(sourceUrl.origin).toBe("https://github.com");
  expect(sourceUrl.pathname.startsWith(sourcePrefix)).toBe(true);

  const sourceRemainder = sourceUrl.pathname.slice(sourcePrefix.length);
  const separator = sourceRemainder.indexOf("/");
  const commit = sourceRemainder.slice(0, separator);
  const sourcePath = decodeURIComponent(sourceRemainder.slice(separator + 1));
  expect(commit).toMatch(EXACT_COMMIT_PATTERN);
  expect(sourcePath).toBe(route.sourcePath);
  if (expectedCommit !== null) {
    expect(commit).toBe(expectedCommit);
  }

  await expect(
    sourcePanel.getByRole("link", { name: "Propose an edit", exact: true })
  ).toHaveAttribute(
    "href",
    `https://github.com/${SOURCE_REPOSITORY}/edit/main/${route.sourcePath}`
  );
  await expect(
    sourcePanel.getByRole("link", { name: "Contributor guide", exact: true })
  ).toHaveAttribute(
    "href",
    `https://github.com/${SOURCE_REPOSITORY}/blob/main/CONTRIBUTING.md`
  );

  return commit;
}

async function expectStudyRoute(
  page: Page,
  route: StudyRoute,
  expectedCommit: string | null
) {
  const diagnostics = attachPageDiagnostics(page);

  try {
    const response = await gotoDocumentWithTransientRetry(page, route.path);
    expect(
      response,
      `${route.path} did not return a document response`
    ).not.toBeNull();
    expect(response?.status()).toBe(200);
    await waitForRouteReady(page);

    await expect(page).toHaveURL((url) => url.pathname === route.path);
    await expect(page).not.toHaveTitle(/404|PAGE NOT FOUND/iu);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title, exact: true })
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /The Museum publication is temporarily unavailable|PAGE NOT FOUND/iu
    );

    const commit = await expectFreshExactSource(page, route, expectedCommit);
    await expectNoHorizontalOverflow(page);
    await expectSafeLinks(page);

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await expectKeyboardFocusVisibleWithinTabs(page, { maxTabs: 12 });

    return commit;
  } finally {
    assertNoConsoleErrors(diagnostics, {
      allowedConsoleErrorPatterns: LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
    });
  }
}

test.describe("Museum institutional-practice publication @surface @large @readonly", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);
  let sourceCommit: string | null = null;

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("publishes the study index and all fourteen profile links", async ({
    page,
  }) => {
    sourceCommit = await expectStudyRoute(page, INDEX_ROUTE, sourceCommit);

    for (const profile of PROFILE_ROUTES) {
      await expect(
        page.locator(`a[href="${profile.path}"]`).first()
      ).toBeVisible();
    }
    await expect(
      page.locator(`a[href="${SOURCE_ROUTE.path}"]`).first()
    ).toBeVisible();
  });

  for (const profile of PROFILE_ROUTES) {
    test(`publishes ${profile.title} with lessons and limits`, async ({
      page,
    }) => {
      sourceCommit = await expectStudyRoute(page, profile, sourceCommit);
      await expect(
        page.getByText("What the Museum should adopt", { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText("Where the analogy ends", { exact: true })
      ).toBeVisible();
      await expect(
        page.locator(`a[href="${SOURCE_ROUTE.path}"]`).first()
      ).toBeVisible();
    });
  }

  test("publishes the complete primary-source register", async ({ page }) => {
    sourceCommit = await expectStudyRoute(page, SOURCE_ROUTE, sourceCommit);
    await expect(page.locator("main table").first()).toBeVisible();
    expect(
      await page.locator('main a[href^="https://"]').count()
    ).toBeGreaterThan(50);
  });
});
