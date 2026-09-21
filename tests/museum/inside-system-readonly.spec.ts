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
import { installLocalMuseumCountryCheck } from "../support/localMuseumCountryCheck";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";
import { MUSEUM_SETTINGS_FETCH_ERROR_PATTERN } from "../support/museumConsoleDiagnostics";

const MOBILE_PROJECT = "web-mobile-chromium";
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;
const STUDY_READY_TIMEOUT_MS = 20_000;
const SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS = [
  /^Analytics SDK: TypeError: Failed to fetch(?:\n|$)/,
  /^Error checking Cross-Origin-Opener-Policy: Failed to fetch(?: \(6529\.io\))?(?:\n|$)/,
  MUSEUM_SETTINGS_FETCH_ERROR_PATTERN,
  /^Failed to fetch cookie consent status Error: Network request failed\. Please check your connection and try again\. \(https:\/\/api(?:\.staging)?\.6529\.io\/api\/policies\/country-check\)(?:\n|$)/,
];

const PROJECTS = [
  { slug: "century", title: "CENTURY" },
  { slug: "pre-process", title: "Pre-Process" },
  { slug: "phototaxis", title: "Phototaxis" },
  { slug: "923-empty-rooms", title: "923 EMPTY ROOMS" },
  { slug: "ex-nihilo-cosmos", title: "Ex Nihilo (Cosmos)" },
] as const;

async function openStudy(page: Page, slug: string, title: string) {
  const path = `/museum/network/projects/${slug}/system`;
  const studyHeading = page.getByRole("heading", {
    level: 1,
    name: title,
    exact: true,
  });
  const notFoundHeading = page.getByRole("heading", {
    name: "404 | USER OR PAGE NOT FOUND",
    exact: true,
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await gotoDocumentWithTransientRetry(page, path);
    expect(response?.status()).toBe(200);
    await waitForRouteReady(page);
    await expect(page).toHaveURL((url) => url.pathname === path, {
      timeout: STUDY_READY_TIMEOUT_MS,
    });
    await studyHeading.or(notFoundHeading).waitFor({
      state: "visible",
      timeout: STUDY_READY_TIMEOUT_MS,
    });

    if (await studyHeading.isVisible()) {
      const comparisonRegion = page.getByRole("region", {
        name: "Hold the Museum work. Choose what sits beside it.",
        exact: true,
      });
      await expect(
        comparisonRegion.getByRole("heading", {
          name: "Hold the Museum work. Choose what sits beside it.",
          exact: true,
        })
      ).toBeVisible({ timeout: STUDY_READY_TIMEOUT_MS });
      await expect(comparisonRegion).toHaveAttribute(
        "data-client-ready",
        "true",
        { timeout: STUDY_READY_TIMEOUT_MS }
      );
      await expectNoHorizontalOverflow(page);
      return;
    }

    if (attempt === 2) {
      throw new Error(
        `Museum study ${path} remained on the application 404 page after retry.`
      );
    }
  }
}

test.describe("Museum Inside the System @surface @readonly", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    await installLocalMuseumCountryCheck(page, baseURL);
    if (testInfo.project.name === MOBILE_PROJECT) {
      await page.setViewportSize(MOBILE_VIEWPORT);
      expect(page.viewportSize()).toEqual(MOBILE_VIEWPORT);
    }
  });

  test("publishes all five project-owned studies", async ({ page }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      for (const project of PROJECTS) {
        await openStudy(page, project.slug, project.title);
        const modelMode =
          project.slug === "pre-process" || project.slug === "923-empty-rooms"
            ? "Restage a session"
            : "Try a variation";
        await expect(
          page.getByRole("button", { name: "Minted work", exact: true })
        ).toHaveAttribute("aria-pressed", "true");
        await expect(
          page.getByRole("button", { name: modelMode, exact: true })
        ).toHaveAttribute("aria-pressed", "false");
        await expect(
          page.getByRole("heading", {
            name: "Suggested minted comparisons",
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

  test("finds, filters, randomizes, and suggests minted CENTURY works", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      await openStudy(page, "century", "CENTURY");
      const lookup = page.getByLabel("Edition number or token ID");
      const viewButton = page.getByRole("button", {
        name: "View",
        exact: true,
      });
      const officialStill = page.getByRole("img", {
        name: "Official still for CENTURY #724",
      });
      await expect(
        page.getByRole("region", {
          name: "Hold the Museum work. Choose what sits beside it.",
          exact: true,
        })
      ).toHaveAttribute("data-client-ready", "true", {
        timeout: STUDY_READY_TIMEOUT_MS,
      });
      await lookup.fill("724");
      await viewButton.click();
      await expect(officialStill).toBeVisible({
        timeout: STUDY_READY_TIMEOUT_MS,
      });

      const beforeRandom = await lookup.inputValue();
      await page
        .getByRole("button", { name: "Random minted work", exact: true })
        .click();
      await expect(lookup).not.toHaveValue(beforeRandom);

      const trait = page.getByLabel("Filter trait");
      await trait.selectOption({ label: "Palette" });
      await page.getByLabel("Filter value").selectOption({ index: 0 });
      await expect(page.getByText(/Showing 1–12 of/u)).toBeVisible();
      await page
        .getByRole("navigation", { name: "Browse filtered results" })
        .getByRole("button", { name: "Next results", exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) => url.searchParams.get("page") === "2"
      );
      await expect(page.getByText(/Showing 13–24 of/u)).toBeVisible();
      await page
        .getByRole("button", { name: "Random from filter", exact: true })
        .click();

      const suggestions = page.locator(
        'section[aria-labelledby="suggested-comparisons-title"] button'
      );
      await expect(suggestions).toHaveCount(3);
      await expect(
        page.getByText("Most published traits in common")
      ).toBeVisible();
      await expect(
        page.getByText("Most published traits different")
      ).toBeVisible();
      await expect(
        page.getByText("Less often seen in this edition")
      ).toBeVisible();
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });

  test("opens project-specific counterfactual and session controls", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      await openStudy(page, "century", "CENTURY");
      await page
        .getByRole("button", { name: "Try a variation", exact: true })
        .click();
      await expect(
        page.getByText("Study variation", { exact: true })
      ).toBeVisible();
      await expect(page.getByLabel("Palette")).toBeVisible();
      await expect(page.getByLabel("Initial strip order")).toBeVisible();
      await expect(page.getByLabel("Oculi")).toBeVisible();
      await expect(
        page.getByRole("img", { name: "CENTURY #31" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "New variation", exact: true })
      ).toBeVisible();
      await page.getByLabel("Palette").selectOption("C");
      await expect(page).toHaveURL((url) => {
        return (
          url.searchParams.get("modelVersion") === "1" &&
          url.searchParams.get("mPalette") === "C"
        );
      });
      await page.reload();
      await waitForRouteReady(page);
      await expect(
        page.getByRole("button", { name: "Try a variation", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByLabel("Palette")).toHaveValue("C");

      await openStudy(page, "pre-process", "Pre-Process");
      await page
        .getByRole("button", { name: "Restage a session", exact: true })
        .click();
      await expect(page.getByRole("gridcell")).toHaveCount(120);
      await expect(
        page.getByRole("button", {
          name: "Restage",
          exact: true,
        })
      ).toBeVisible();

      await openStudy(page, "phototaxis", "Phototaxis");
      await page
        .getByRole("button", { name: "Try a variation", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: /7 Accumulated trace/u })
      ).toBeVisible();
      for (const label of [
        "Machine size",
        "Sensor response",
        "Alignment",
        "Magnification",
      ]) {
        await expect(page.getByLabel(label)).toBeVisible();
      }
      await expect(
        page.getByRole("img", { name: "Phototaxis #308" })
      ).toBeVisible();

      await openStudy(page, "923-empty-rooms", "923 EMPTY ROOMS");
      await page
        .getByRole("button", { name: "Restage a session", exact: true })
        .click();
      await expect(page.getByText("Museum model · new session")).toBeVisible();
      await expect(page.getByLabel("Color channel")).toBeVisible();

      await openStudy(page, "ex-nihilo-cosmos", "Ex Nihilo (Cosmos)");
      await page
        .getByRole("button", { name: "Try a variation", exact: true })
        .click();
      await expect(page.getByLabel("Display channel")).toBeVisible();
      await expect(page.getByLabel("CHUNK")).toBeVisible();
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });

  test("deep-links an accession into its continuing project study", async ({
    page,
  }) => {
    const diagnostics = attachPageDiagnostics(page);
    try {
      const objectPath = "/museum/network/collection/6529NM.2026.001.01";
      const response = await gotoDocumentWithTransientRetry(page, objectPath);
      expect(response?.status()).toBe(200);
      await waitForRouteReady(page);
      const link = page.getByRole("link", {
        name: "Locate this work in the full system",
        exact: true,
      });
      await expect(link).toHaveAttribute(
        "href",
        "/museum/network/projects/century/system?work=6529NM.2026.001.01#possibility-space",
        { timeout: 45_000 }
      );
      // Visible server HTML is not proof that Next's navigation handler is ready.
      // An early native navigation cancels the Work page's startup requests.
      await expect(link).toHaveAttribute("data-client-ready", "true", {
        timeout: STUDY_READY_TIMEOUT_MS,
      });
      const documentTimeOrigin = await page.evaluate(
        () => performance.timeOrigin
      );
      await link.click();
      await expect(page).toHaveURL((url) => {
        return (
          url.pathname === "/museum/network/projects/century/system" &&
          url.searchParams.get("work") === "6529NM.2026.001.01" &&
          url.hash === "#possibility-space"
        );
      });
      await expect(
        page.getByRole("button", { name: "#31", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        await page.evaluate(() => performance.timeOrigin),
        "The hydrated study link should preserve the document and its startup requests"
      ).toBe(documentTimeOrigin);
      await expectNoHorizontalOverflow(page);
    } finally {
      assertNoConsoleErrors(diagnostics, {
        allowedConsoleErrorPatterns: SHELL_ALLOWED_CONSOLE_ERROR_PATTERNS,
      });
      assertNoFailedResponses(diagnostics);
    }
  });
});
