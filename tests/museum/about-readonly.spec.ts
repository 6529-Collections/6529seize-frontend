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

const ABOUT_PATH = "/museum/network/about";
const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const SOURCE_REPOSITORY = "6529-Collections/6529networkmuseum";
const EXACT_COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const REQUIRED_SOURCE_COMMIT =
  process.env["MUSEUM_PUBLICATION_EXPECTED_COMMIT"]?.trim() || null;
const EXACT_SOURCE_PATTERN = new RegExp(
  `^https://github\\.com/${SOURCE_REPOSITORY}/blob/[a-f0-9]{40}/docs/open-museum\\.md$`,
  "u"
);
const EXACT_CONTRIBUTOR_GUIDE_PATTERN = new RegExp(
  `^https://github\\.com/${SOURCE_REPOSITORY}/blob/[a-f0-9]{40}/CONTRIBUTING\\.md$`,
  "u"
);
const ALLOWED_CONSOLE_ERROR_PATTERNS = [
  /^Analytics SDK: TypeError: Failed to fetch(?:\n|$)/u,
  /^Error checking Cross-Origin-Opener-Policy: Failed to fetch(?: \(6529\.io\))?(?:\n|$)/u,
  /^Failed to fetch seize settings TypeError: Failed to fetch(?:\n|$)/u,
  /^Failed to fetch cookie consent status Error: Network request failed\./u,
];

if (
  REQUIRED_SOURCE_COMMIT !== null &&
  !EXACT_COMMIT_PATTERN.test(REQUIRED_SOURCE_COMMIT)
) {
  throw new Error("museum_publication_expected_commit_not_exact");
}

function parseRgb(value: string): [number, number, number] | null {
  const match = value.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/u
  );
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function luminance(value: string): number {
  const rgb = parseRgb(value);
  if (rgb === null) {
    return -1;
  }
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

async function expectSafeLinks(page: Page) {
  const problems = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.flatMap((anchor) => {
      const href = anchor.getAttribute("href") ?? "";
      const target = anchor.getAttribute("target") ?? "";
      const rel = new Set(
        (anchor.getAttribute("rel") ?? "").toLowerCase().split(/\s+/u)
      );
      const issues: string[] = [];
      if (/^javascript:/iu.test(href)) issues.push(`javascript URL: ${href}`);
      if (/^http:/iu.test(href)) issues.push(`insecure URL: ${href}`);
      if (/^https?:/iu.test(href)) {
        const parsed = new URL(href);
        if (parsed.username || parsed.password) {
          issues.push(`credential-bearing URL: ${parsed.origin}`);
        }
      }
      if (
        target === "_blank" &&
        (!rel.has("noopener") || !rel.has("noreferrer"))
      ) {
        issues.push(`unsafe new-tab link: ${href}`);
      }
      return issues;
    })
  );
  expect(problems, problems.join("\n")).toEqual([]);
}

async function openAbout(page: Page) {
  const response = await gotoDocumentWithTransientRetry(page, ABOUT_PATH);
  expect(response?.status()).toBe(200);
  await waitForRouteReady(page);
  await expect(page).toHaveURL((url) => url.pathname === ABOUT_PATH);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "The 6529 Network Museum",
      exact: true,
    })
  ).toBeVisible({ timeout: 20_000 });
}

test.describe("Museum About proposition @surface @readonly", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("keeps the proposition readable, inspectable, and free of browser failures", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    let primaryError: unknown = null;
    try {
      await openAbout(page);
      await expectNoHorizontalOverflow(page);
      await expectSafeLinks(page);

      const hierarchy = await page.evaluate(() => {
        const heading = document.querySelector("header h1");
        const lead = document.querySelector("header h1 + p");
        const museumSection = document.querySelector(
          '[aria-labelledby="museum-collection-purpose-title"]'
        );
        const sectionHeading = museumSection?.querySelector("h2");
        const sectionBody = museumSection?.querySelector("p");
        if (!heading || !lead || !sectionHeading || !sectionBody) {
          throw new Error("museum_about_readability_elements_missing");
        }
        const style = (element: Element) => {
          const computed = getComputedStyle(element);
          return {
            color: computed.color,
            fontSize: Number.parseFloat(computed.fontSize),
            lineHeight: Number.parseFloat(computed.lineHeight),
          };
        };
        return {
          heading: style(heading),
          lead: style(lead),
          sectionHeading: style(sectionHeading),
          sectionBody: style(sectionBody),
        };
      });

      expect(hierarchy.heading.fontSize).toBeGreaterThanOrEqual(32);
      expect(hierarchy.heading.lineHeight).toBeGreaterThanOrEqual(
        hierarchy.heading.fontSize
      );
      expect(hierarchy.lead.fontSize).toBeGreaterThanOrEqual(16);
      expect(hierarchy.lead.lineHeight).toBeGreaterThanOrEqual(
        hierarchy.lead.fontSize * 1.35
      );
      expect(hierarchy.sectionHeading.fontSize).toBeGreaterThanOrEqual(28);
      expect(hierarchy.sectionBody.fontSize).toBeGreaterThanOrEqual(16);
      expect(hierarchy.sectionBody.lineHeight).toBeGreaterThanOrEqual(
        hierarchy.sectionBody.fontSize * 1.35
      );
      expect(luminance(hierarchy.heading.color)).toBeGreaterThan(
        luminance(hierarchy.sectionBody.color)
      );
      expect(luminance(hierarchy.sectionHeading.color)).toBeGreaterThan(
        luminance(hierarchy.sectionBody.color)
      );

      const sourcePanel = page.locator(
        'aside[aria-labelledby="museum-open-source-title"]'
      );
      await expect(sourcePanel).toBeVisible();
      await expect(sourcePanel).toContainText(
        "Published from the Museum's public record."
      );
      await expect(
        sourcePanel.getByRole("link", { name: "Read the source", exact: true })
      ).toHaveAttribute(
        "href",
        REQUIRED_SOURCE_COMMIT === null
          ? EXACT_SOURCE_PATTERN
          : `https://github.com/${SOURCE_REPOSITORY}/blob/${REQUIRED_SOURCE_COMMIT}/docs/open-museum.md`
      );
      await expect(
        sourcePanel.getByRole("link", { name: "Propose an edit", exact: true })
      ).toHaveAttribute(
        "href",
        `https://github.com/${SOURCE_REPOSITORY}/edit/main/docs/open-museum.md`
      );
      await expect(
        sourcePanel.getByRole("link", {
          name: "Contributor guide",
          exact: true,
        })
      ).toHaveAttribute(
        "href",
        REQUIRED_SOURCE_COMMIT === null
          ? EXACT_CONTRIBUTOR_GUIDE_PATTERN
          : `https://github.com/${SOURCE_REPOSITORY}/blob/${REQUIRED_SOURCE_COMMIT}/CONTRIBUTING.md`
      );
    } catch (error) {
      primaryError = error;
    }
    const diagnosticErrors: unknown[] = [];
    try {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
    } catch (error) {
      diagnosticErrors.push(error);
    }
    try {
      assertNoFailedResponses(diagnostics);
    } catch (error) {
      diagnosticErrors.push(error);
    }
    if (primaryError !== null && diagnosticErrors.length > 0) {
      throw new AggregateError(
        [primaryError, ...diagnosticErrors],
        "Museum About assertion and browser diagnostics failed"
      );
    }
    if (primaryError !== null) {
      throw primaryError;
    }
    if (diagnosticErrors.length > 0) {
      throw new AggregateError(
        diagnosticErrors,
        "Museum About browser diagnostics failed"
      );
    }
  });
});
