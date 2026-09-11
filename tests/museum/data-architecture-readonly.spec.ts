import type { Page } from "@playwright/test";

import {
  expect,
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
import {
  MUSEUM_DATA_ARCHITECTURE_CASEY_AUDIT_TITLE,
  MUSEUM_DATA_ARCHITECTURE_STANDARDS,
} from "@/lib/museum/publication/dataArchitectureContract";

const BASE_PATH = "/museum/network/research/data-architecture";
const SOURCE_REPOSITORY = "6529-Collections/6529networkmuseum";
const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const DEPLOYED_ENVIRONMENT =
  process.env["PLAYWRIGHT_ENV"] === "staging" ||
  process.env["PLAYWRIGHT_ENV"] === "production";
const SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS = [
  // These exact shell transport diagnostics are unrelated to Museum content;
  // HTTP 5xx responses and every other console error still fail.
  /^Error checking Cross-Origin-Opener-Policy: Failed to fetch(?: \(6529\.io\))?(?:\n|$)/,
  /^Failed to fetch seize settings TypeError: Failed to fetch(?:\n|$)/,
  /^Failed to fetch cookie consent status Error: Network request failed\. Please check your connection and try again\. \(https:\/\/api(?:\.staging)?\.6529\.io\/api\/policies\/country-check\)(?:\n|$)/,
  ...(DEPLOYED_ENVIRONMENT
    ? []
    : [
        /^Analytics SDK: TypeError: Failed to fetch(?:\n|$)/,
        /^Failed to fetch seize settings Error: HTTP error! status: 429(?:\n|$)/,
        /^Failed to fetch cookie consent status Rate limit exceeded(?:\n|$)/,
        /^Failed to load resource: the server responded with a status of 429 \(\)$/,
      ]),
];

type ArchitectureRoute = {
  readonly path: string;
  readonly sourcePath: string;
  readonly title: string;
};

const OVERVIEW: ArchitectureRoute = {
  path: BASE_PATH,
  sourcePath: "docs/data-architecture.md",
  title: "How the Museum knows and cares for art",
};

const STANDARD_ROUTES: readonly ArchitectureRoute[] =
  MUSEUM_DATA_ARCHITECTURE_STANDARDS.map(({ slug, title }) => ({
    path: `${BASE_PATH}/${slug}`,
    sourcePath: `docs/data-architecture/${slug}.md`,
    title,
  }));

const CASEY: ArchitectureRoute = {
  path: `${BASE_PATH}/casey-reas-implementation`,
  sourcePath: "docs/data-architecture/casey-reas-implementation.md",
  title: MUSEUM_DATA_ARCHITECTURE_CASEY_AUDIT_TITLE,
};

async function expectExactSource(
  page: Page,
  route: ArchitectureRoute,
  expectedCommit: string | null
) {
  const panel = page.locator(
    'aside[aria-labelledby="museum-open-source-title"]'
  );
  await expect(panel).toBeVisible();
  const sourceLink = panel.getByRole("link", {
    name: "Read the source",
    exact: true,
  });
  const href = await sourceLink.getAttribute("href");
  expect(href).not.toBeNull();
  const source = new URL(href ?? "https://invalid.example");
  const prefix = `/${SOURCE_REPOSITORY}/blob/`;
  expect(source.origin).toBe("https://github.com");
  expect(source.pathname.startsWith(prefix)).toBe(true);
  const remainder = source.pathname.slice(prefix.length);
  const separator = remainder.indexOf("/");
  const commit = remainder.slice(0, separator);
  expect(commit).toMatch(EXACT_COMMIT_PATTERN);
  expect(decodeURIComponent(remainder.slice(separator + 1))).toBe(
    route.sourcePath
  );
  if (expectedCommit !== null) expect(commit).toBe(expectedCommit);
  return commit;
}

async function openArchitectureRoute(
  page: Page,
  route: ArchitectureRoute,
  expectedCommit: string | null
) {
  const response = await gotoDocumentWithTransientRetry(page, route.path);
  expect(response?.status()).toBe(200);
  await waitForRouteReady(page);
  await expect(page).toHaveURL((url) => url.pathname === route.path);
  await expect(
    page.getByRole("heading", { level: 1, name: route.title, exact: true })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  return expectExactSource(page, route, expectedCommit);
}

async function readJsonDisclosure(page: Page, label: string) {
  const summary = page.getByText(label, { exact: true });
  await expect(summary).toBeVisible();
  await summary.click();
  const details = page.locator("details").filter({ has: summary });
  await expect(details).toHaveCount(1);
  const text = await details.locator("pre").textContent();
  expect(text).not.toBeNull();
  return JSON.parse(text ?? "null") as Record<string, unknown>;
}

test.describe("Museum data architecture @surface @readonly", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("publishes the overview and complete machine profile", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      await openArchitectureRoute(page, OVERVIEW, null);
      const profile = await readJsonDisclosure(
        page,
        "Read the publication profile"
      );
      expect(profile["profile_id"]).toBe("6529NM_DATA_ARCHITECTURE_V1");
      expect(profile["profile_version"]).toBe("1.0.0");
      expect(profile["implementation_states"]).toEqual([
        "conceptual_mapping",
        "source_fields_present",
        "serialized",
        "validated",
        "operational",
      ]);
      expect(profile["standards"]).toHaveLength(
        MUSEUM_DATA_ARCHITECTURE_STANDARDS.length
      );
      expect(profile["stream_convergence"]).toEqual({
        normative_for_profile: false,
        status: "deferred_until_museum_profile_release",
        document_path: "docs/stream-interoperability.md",
      });
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });

  test("publishes all eleven standards from one exact source edition", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      const exactCommit = await openArchitectureRoute(page, OVERVIEW, null);
      for (const route of STANDARD_ROUTES) {
        const routeLink = page.locator(`a[href="${route.path}"]:visible`);
        await expect(routeLink).toHaveCount(1);
        await routeLink.click();
        await expect(page).toHaveURL((url) => url.pathname === route.path);
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: route.title,
            exact: true,
          })
        ).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectExactSource(page, route, exactCommit);

        const returnLink = page.getByRole("link", {
          name: "Back to the data architecture",
          exact: true,
        });
        await returnLink.click();
        await expect(page).toHaveURL((url) => url.pathname === OVERVIEW.path);
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: OVERVIEW.title,
            exact: true,
          })
        ).toBeVisible();
      }
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });

  test("publishes the Casey audit and exact seven-object schedule", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      await openArchitectureRoute(page, CASEY, null);
      const schedule = await readJsonDisclosure(
        page,
        "Read the seven-object machine schedule"
      );
      expect(schedule["profile_id"]).toBe("6529NM_DATA_ARCHITECTURE_V1");
      expect(schedule["accession_lot_id"]).toBe("6529NM.2026.001");
      expect(schedule["objects"]).toHaveLength(7);
      for (const object of schedule["objects"] as Record<string, unknown>[]) {
        expect(object["caip19"]).toMatch(
          /^eip155:1\/erc721:0x[0-9a-f]{40}\/[0-9]+$/u
        );
        expect(object["accession_state"]).toBe("accessioned");
        expect(object["preservation_state"]).toBe("in_progress");
      }
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });
});
