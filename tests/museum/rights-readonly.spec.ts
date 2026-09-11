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

const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS = [
  /^Analytics SDK: TypeError: Failed to fetch(?:\n|$)/,
];

async function openRightsRoute(page: Page, path: string, heading: string) {
  const response = await gotoDocumentWithTransientRetry(page, path);
  expect(response?.status()).toBe(200);
  await waitForRouteReady(page);
  await expect(page).toHaveURL((url) => url.pathname === path);
  await expect(
    page.getByRole("heading", { level: 1, name: heading, exact: true })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
}

test.describe("Museum rights education @surface @readonly", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("teaches ownership, copyright, and the public domain in ordinary language", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      await openRightsRoute(
        page,
        "/museum/network/research/rights",
        "Rights in digital art"
      );
      await expect(
        page.getByRole("heading", {
          name: "Buying the artwork usually does not buy its copyright",
          exact: true,
        })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "The public domain is where much of art history lives",
          exact: true,
        })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Read the guide" })
      ).toHaveCount(2);
      await page
        .locator("details")
        .filter({ hasText: "Browse rights and license terms" })
        .locator("summary")
        .click();
      await expect(
        page.getByRole("link", { name: "Read this rights entry" })
      ).toHaveCount(22);
      await expect(
        page
          .locator('aside[aria-labelledby="museum-open-source-title"]')
          .getByRole("link", { name: "Read the source", exact: true })
      ).toHaveAttribute(
        "href",
        /\/blob\/[a-f0-9]{40}\/records\/institutional-practice\/rights-and-licenses\.md$/u
      );
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });

  test("keeps practical guidance distinct from the exact legal code", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      await openRightsRoute(
        page,
        "/museum/network/research/rights/cc-by-nc-4.0",
        "Creative Commons Attribution-NonCommercial 4.0 International"
      );
      const practice = page.locator(
        'section[aria-labelledby="museum-rights-use-table"] dl'
      );
      await expect(practice.locator("dt")).toHaveCount(6);
      await expect(practice.locator("dd")).toHaveCount(6);
      await expect(practice.locator("[class*='rounded-full']")).toHaveCount(0);
      await expect(
        page.getByText("Make preservation copies", { exact: true })
      ).toBeVisible();
      await page
        .getByText("Read the complete legal code", { exact: true })
        .click();
      await expect(page.locator("details pre")).toContainText(
        "Attribution-NonCommercial 4.0 International"
      );
      const sourceAside = page.locator(
        'aside[aria-labelledby="museum-open-source-title"]'
      );
      await sourceAside
        .getByText("Related works and context", { exact: true })
        .click();
      await expect(
        sourceAside.getByRole("link", {
          name: "Exact legal text",
          exact: true,
        })
      ).toHaveAttribute(
        "href",
        /\/blob\/[a-f0-9]{40}\/docs\/rights\/legal-texts\/cc-by-nc-4\.0\.txt$/u
      );
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });

  test("takes an accessioned work to the Museum's recorded rights term", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      const objectPath = "/museum/network/collection/6529NM.2026.001.01";
      const response = await gotoDocumentWithTransientRetry(page, objectPath);
      expect(response?.status()).toBe(200);
      await waitForRouteReady(page);
      await expect(page.locator("body")).toContainText(
        "Licensed CC BY-NC 4.0.",
        { timeout: 45_000 }
      );
      await expect(page.locator("body")).toContainText(
        "Title, rights, and accession review",
        { timeout: 45_000 }
      );
      await expectNoHorizontalOverflow(page);
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: LOCAL_SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });
});
