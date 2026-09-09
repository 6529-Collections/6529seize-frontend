import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectKeyboardFocusVisibleWithinTabs,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  assertNoConsoleErrors,
  assertNoFailedResponses,
  attachPageDiagnostics,
} from "../support/pageAssertions";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

const STUDY_PATH = "/museum/network/research/institutional-practice";
const SOURCE_REPOSITORY = "6529-Collections/6529networkmuseum";
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const REQUIRED_SOURCE_COMMIT =
  process.env["MUSEUM_PUBLICATION_EXPECTED_COMMIT"]?.trim() || null;
const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const CASEY_WORK_HREFS = Array.from(
  { length: 7 },
  (_, index) =>
    `/museum/network/works/6529NM-W-${String(index + 1).padStart(4, "0")}`
);
const LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS = [
  /^Analytics SDK: TypeError: Failed to fetch(?:\n|$)/,
];

async function revealTieredContent(target: Locator): Promise<void> {
  await target.evaluate((element) => {
    let ancestor = element.parentElement;

    while (ancestor) {
      if (ancestor instanceof HTMLDetailsElement) {
        ancestor.open = true;
      }
      ancestor = ancestor.parentElement;
    }
  });
}

if (
  REQUIRED_SOURCE_COMMIT !== null &&
  !EXACT_COMMIT_PATTERN.test(REQUIRED_SOURCE_COMMIT)
) {
  throw new Error("museum_publication_expected_commit_not_exact");
}

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
  ["hek-basel", "HEK Basel"],
  ["li-ma", "LI-MA"],
  ["v2", "V2_"],
  ["transmediale", "transmediale"],
  ["acmi", "ACMI — Collecting and Preserving Screen Culture"],
  ["m-plus", "M+ — Collecting Digital and Moving-Image Culture"],
  [
    "nam-june-paik-art-center",
    "Nam June Paik Art Center — Collection, Archive, and Media-Art Scholarship",
  ],
  [
    "ntt-icc",
    "NTT InterCommunication Center [ICC] — Media-Art Collection and Archive",
  ],
  [
    "centro-multimedia",
    "Centro Multimedia, CENART — Research and Production Center",
  ],
  [
    "laboratorio-arte-alameda",
    "Laboratorio Arte Alameda — Research and Documentation Center",
  ],
  ["dia", "Dia Art Foundation"],
  ["walker-art-center", "Walker Art Center"],
  ["mca-chicago", "Museum of Contemporary Art Chicago"],
] as const;

const INDEX_ROUTE: StudyRoute = {
  path: STUDY_PATH,
  sourcePath: "records/institutional-practice/a-field-of-practice.md",
  title: "Museums to learn from",
};

const SOURCE_ROUTE: StudyRoute = {
  path: `${STUDY_PATH}/sources`,
  sourcePath: "records/institutional-practice/source-register.md",
  title: "Source register: A field of practice",
};

const ADJACENT_ROUTE: StudyRoute = {
  path: `${STUDY_PATH}/adjacent-practice`,
  sourcePath:
    "records/institutional-practice/adjacent-chain-native-practice.md",
  title:
    "Adjacent practice: platforms, archives, festivals, and chain-native systems",
};

const EDITORIAL_ROUTE: StudyRoute = {
  path: "/museum/network/research/scholarship-and-writing",
  sourcePath: "docs/curatorial-publication-standard.md",
  title: "Writing the 6529 Network Museum",
};

const CASEY_ARTIST_ROUTE: StudyRoute = {
  path: "/museum/network/artists/casey-reas",
  sourcePath:
    "records/accessions/6529NM.2026.001/public/casey-reas-artist-practice.md",
  title: "Casey Reas",
};

const CASEY_GIFT_ROUTE: StudyRoute = {
  path: "/museum/network/acquisitions/the-system-in-seven-states",
  sourcePath: "records/entities/6529NM-CA-2026-001.json",
  title: "The System in Seven States",
};

const CASEY_SOURCE_ROUTE: StudyRoute = {
  path: "/museum/network/research/sources-and-chronology",
  sourcePath:
    "records/accessions/6529NM.2026.001/public/source-and-chronology-matrix.md",
  title: "Casey Reas: Sources and chronology",
};

const KEYS_AND_GATES_ROUTE: StudyRoute = {
  path: "/museum/network/acquisition-programs/keys-and-gates",
  sourcePath: "records/entities/6529NM-AP-ENT-0002.json",
  title: "Keys and Gates",
};

const KEYS_AND_GATES_OBJECT_ROUTE: StudyRoute = {
  path: "/museum/network/works/6529NM-W-0008",
  sourcePath: "records/entities/6529NM-W-0008.json",
  title: "Take the Key!",
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
    "Published from the Museum's public record."
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
    `https://github.com/${SOURCE_REPOSITORY}/blob/${commit}/CONTRIBUTING.md`
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
    assertNoFailedResponses(diagnostics);
  }
}

test.describe("Museum institutional-practice publication @surface @large @readonly", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("publishes the study index, all twenty-seven profiles, and its research apparatus", async ({
    page,
  }) => {
    await expectStudyRoute(page, INDEX_ROUTE, REQUIRED_SOURCE_COMMIT);

    for (const profile of PROFILE_ROUTES) {
      const profileLink = page.locator(`a[href="${profile.path}"]`).first();
      await revealTieredContent(profileLink);
      await expect(profileLink).toBeVisible();
    }
    const supportingLinks = [SOURCE_ROUTE, ADJACENT_ROUTE, EDITORIAL_ROUTE].map(
      (route) => page.locator(`a[href="${route.path}"]`).first()
    );
    for (const supportingLink of supportingLinks) {
      await revealTieredContent(supportingLink);
      await expect(supportingLink).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText(
      /For this edition|retains fourteen|adds thirteen/iu
    );
  });

  for (const profile of PROFILE_ROUTES) {
    test(`publishes ${profile.title} with lessons and limits`, async ({
      page,
    }) => {
      await expectStudyRoute(page, profile, REQUIRED_SOURCE_COMMIT);
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

  test("publishes the adjacent digital-art and chain-native study", async ({
    page,
  }) => {
    await expectStudyRoute(page, ADJACENT_ROUTE, REQUIRED_SOURCE_COMMIT);
    await expect(page.locator("main table").first()).toBeVisible();
    await expect(page.locator(`a[href="${STUDY_PATH}"]`).first()).toBeVisible();
  });

  test("publishes the Museum scholarship and writing standard", async ({
    page,
  }) => {
    await expectStudyRoute(page, EDITORIAL_ROUTE, REQUIRED_SOURCE_COMMIT);
    const demonstratedForms = page.getByText(
      "3.3 Forms demonstrated in the comparative study",
      { exact: true }
    );
    await revealTieredContent(demonstratedForms);
    await expect(demonstratedForms).toBeVisible();
    await expect(page.locator(`a[href="${STUDY_PATH}"]`).first()).toBeVisible();
  });

  test("publishes the complete primary-source register", async ({ page }) => {
    await expectStudyRoute(page, SOURCE_ROUTE, REQUIRED_SOURCE_COMMIT);
    await expect(page.locator("main table").first()).toBeVisible();
    expect(
      await page.locator('main a[href^="https://"]').count()
    ).toBeGreaterThan(50);
  });

  test("publishes the Casey artist and gift without production labels", async ({
    page,
  }) => {
    await expectStudyRoute(page, CASEY_ARTIST_ROUTE, REQUIRED_SOURCE_COMMIT);
    await expect(page.locator("body")).not.toContainText(/Standfirst/iu);
    await expect(page.locator("main figure img")).toHaveCount(7);
    for (const href of CASEY_WORK_HREFS) {
      await expect(
        page.locator(`main figure:has(img):has(a[href="${href}"])`)
      ).toHaveCount(1);
    }

    await expectStudyRoute(page, CASEY_GIFT_ROUTE, REQUIRED_SOURCE_COMMIT);
    await expect(page.locator("body")).not.toContainText(/Standfirst/iu);
    await expect(page.locator("main figure")).toHaveCount(7);
    await expect(page.locator("main figure img")).toHaveCount(7);
    for (const href of CASEY_WORK_HREFS) {
      await expect(
        page.locator(`main figure:has(img):has(a[href="${href}"])`)
      ).toHaveCount(1);
    }
  });

  test("publishes the edited Casey source and chronology record", async ({
    page,
  }) => {
    await expectStudyRoute(page, CASEY_SOURCE_ROUTE, REQUIRED_SOURCE_COMMIT);
    await expect(page.locator("body")).not.toContainText(
      /shared source, chronology, and factual-boundary matrix/iu
    );
    const sourceTable = page.locator("main table").first();
    await revealTieredContent(sourceTable);
    await expect(sourceTable).toBeVisible();
  });

  test("publishes Keys and Gates as an art-led program", async ({ page }) => {
    await expectStudyRoute(page, KEYS_AND_GATES_ROUTE, REQUIRED_SOURCE_COMMIT);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Works acquired or selected through this program",
      })
    ).toBeVisible();
    await expect(
      page.getByText("Selected through an acquisition program; unminted", {
        exact: true,
      })
    ).toHaveCount(16);
    await expect(
      page.getByText(
        "Selected and unminted. Acquisition and accession remain pending.",
        { exact: true }
      )
    ).toHaveCount(16);
    await expect(page.locator("main figure img")).toHaveCount(16);
    await expect(
      page.locator(
        'main figure:has(img):has(a[href^="/museum/network/works/"])'
      )
    ).toHaveCount(16);
  });

  test("publishes each Keys and Gates selection as a complete work page", async ({
    page,
  }) => {
    await expectStudyRoute(
      page,
      KEYS_AND_GATES_OBJECT_ROUTE,
      REQUIRED_SOURCE_COMMIT
    );
    await expect(page.locator("main figure img")).toHaveCount(1);
    await expect(
      page.getByRole("img", {
        name: "A lone figure stands before a tall blue patterned gate as sunlight casts long geometric shadows across a stone hall.",
      })
    ).toBeVisible();
    await expect(
      page.getByText("Selected through an acquisition program; unminted", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Selected and unminted. Acquisition and accession remain pending.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      page.getByText("No public image is available for this record.", {
        exact: true,
      })
    ).toHaveCount(0);
  });
});
