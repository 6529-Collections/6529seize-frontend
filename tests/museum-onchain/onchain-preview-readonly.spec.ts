import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

// The unlinked on-chain Museum preview reads the Sepolia ProvenanceRegistry
// and 6529 IPFS on the server. A cold load reads the whole registry, so the
// first navigation gets a long timeout. A server started with
// MUSEUM_ONCHAIN_FIXTURE_ROOT reads a local copy of the release instead.
const INDEX_PATH = "/museum/network-onchain";
const TEXTS_PATH = "/museum/network-onchain/texts";
const COLD_LOAD_TIMEOUT_MS = 120_000;
const MOBILE_PROJECT = "web-mobile-chromium";
const RECORD_URL_PATTERN =
  /\/museum\/network-onchain\/records\/0x[0-9a-f]{64}$/u;

test.describe("on-chain Museum preview", () => {
  test.describe.configure({ timeout: 240_000 });

  test("verifies every profile record against the chain and opens a verified work", async ({
    page,
  }, testInfo) => {
    page.setDefaultNavigationTimeout(COLD_LOAD_TIMEOUT_MS);
    await gotoDocumentWithTransientRetry(page, INDEX_PATH);
    await waitForRouteReady(page, { timeout: COLD_LOAD_TIMEOUT_MS });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "The Museum, read from the chain",
      })
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/u
    );

    const summary = page.getByText(/^[\d,]+ of [\d,]+ records verified$/u);
    await expect(summary).toBeVisible();
    const [verified, total] = ((await summary.textContent()) ?? "")
      .match(/[\d,]+/gu)!
      .map((value) => Number(value.replaceAll(",", "")));
    expect(total).toBeGreaterThan(0);
    expect(verified).toBe(total);

    const verification = page.getByRole("region", {
      name: "How this is checked",
    });
    // Six checks pass; on fixtures the three contract checks are not run.
    await expect(
      verification.getByText(/: (?:Passed|Not checked: read from fixtures)$/u)
    ).toHaveCount(6);
    await expect(verification.getByText(/: Passed$/u)).not.toHaveCount(0);
    await expect(verification.getByText(/: Failed$/u)).toHaveCount(0);
    await expect(
      verification.getByRole("heading", { name: "Registry declaration" })
    ).toBeVisible();
    await expect(
      verification.getByText("6529networkmuseum", { exact: true })
    ).toBeVisible();

    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }

    const works = page
      .getByRole("list", { name: /^Works in the collection/u })
      .first();
    // Work cards load their images as they near the viewport, and show them
    // only after the browser checks their SHA-256.
    const molnar = works.getByRole("link", {
      name: "Vera Molnár and Martin Grasser, Themes and Variations #210",
    });
    await molnar.scrollIntoViewIfNeeded();
    await expect(
      works.getByRole("img", { name: /cobalt blue and warm white/u })
    ).toBeVisible({ timeout: 60_000 });
    await molnar.click();
    // A development server compiles the record route on first use.
    await page.waitForURL(RECORD_URL_PATTERN, {
      timeout: COLD_LOAD_TIMEOUT_MS,
    });
    await waitForRouteReady(page);
    await expect(
      page.getByText("Verified", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "On-chain facts" })
    ).toBeVisible();
    await expect(
      page.getByText("PRV_ENTITY", { exact: true }).first()
    ).toBeVisible();
    const figure = page.getByRole("figure");
    await expect(
      figure.getByRole("img", { name: /cobalt blue and warm white/u })
    ).toBeVisible({ timeout: 60_000 });
    // The credit names the license; the rights line says some uses are
    // refused and links to the PRV_RIGHTS record.
    await expect(
      figure.getByText(/^CC BY-NC 4\.0, with some uses refused\./u)
    ).toBeVisible();
    await expect(
      figure.getByRole("link", { name: "Full rights statement" })
    ).toBeVisible();
    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }
  });

  test("renders a verified text that a PRV_DOCUMENT record names", async ({
    page,
  }, testInfo) => {
    page.setDefaultNavigationTimeout(COLD_LOAD_TIMEOUT_MS);
    await gotoDocumentWithTransientRetry(page, TEXTS_PATH);
    await waitForRouteReady(page, { timeout: COLD_LOAD_TIMEOUT_MS });

    await page
      .getByRole("list", { name: /^Policies/u })
      .getByRole("link")
      .first()
      .click();
    await page.waitForURL(RECORD_URL_PATTERN, {
      timeout: COLD_LOAD_TIMEOUT_MS,
    });
    await waitForRouteReady(page);
    await expect(
      page.getByText("Verified", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("PRV_DOCUMENT", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("Text content ID").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Text" })).toBeVisible();
    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }
  });
});
