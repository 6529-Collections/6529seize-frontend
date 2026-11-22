import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

// The unlinked on-chain Museum preview reads the Sepolia ProvenanceRegistry
// and 6529 IPFS on the server. A cold load reads the whole registry, so the
// first navigation gets a long timeout.
const INDEX_PATH = "/museum/network-onchain";
const TEXTS_PATH = "/museum/network-onchain/texts";
const COLD_LOAD_TIMEOUT_MS = 120_000;
const MOBILE_PROJECT = "web-mobile-chromium";
const RECORD_URL_PATTERN =
  /\/museum\/network-onchain\/records\/0x[0-9a-f]{64}$/u;

test.describe("on-chain Museum preview", () => {
  test.describe.configure({ timeout: 240_000 });

  test("verifies every record against the chain and opens a verified record", async ({
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

    const verification = page.getByRole("region", { name: "Verification" });
    await expect(verification.getByText(/: Passed$/u)).toHaveCount(4);
    await expect(verification.getByText(/: Failed$/u)).toHaveCount(0);

    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }

    const works = page.getByRole("list", { name: /^Works/u });
    await works.getByRole("link").first().click();
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
      page.getByText("PUBLIC_ENTITY", { exact: true }).first()
    ).toBeVisible();
    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }
  });

  test("renders a verified text from release 2", async ({ page }, testInfo) => {
    page.setDefaultNavigationTimeout(COLD_LOAD_TIMEOUT_MS);
    await gotoDocumentWithTransientRetry(page, TEXTS_PATH);
    await waitForRouteReady(page, { timeout: COLD_LOAD_TIMEOUT_MS });

    await page
      .getByRole("list", { name: /^docs\// })
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
      page.getByText("PUBLIC_DOCUMENT", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("LF_NORMALIZED", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Text" })).toBeVisible();
    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }
  });
});
