import type { Page } from "@playwright/test";
import { test, expect, expectNoHorizontalOverflow } from "../testHelpers";
import {
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  expectNoUnsafeSandboxMutations,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import {
  FIXTURE_ASSET_ID,
  FIXTURE_FILE,
  installDocumentationSandbox,
} from "./sandbox";

// Production CSP deliberately rejects the plain-HTTP fixture API. This opt-in
// covers the production bundle's UI only; beforeEach still enforces loopback
// origins and blocks external mutations. Live acceptance keeps CSP enabled.
test.use({
  bypassCSP:
    process.env["PLAYWRIGHT_ARTWORK_DOCUMENTATION_PRODUCTION_SANDBOX"] ===
      "1" &&
    process.env["PLAYWRIGHT_COMPOSER_SANDBOX"] === "1" &&
    process.env["PLAYWRIGHT_ENV"] === "local",
});

useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_COMPOSER_SANDBOX",
  "Artwork documentation mutations require the isolated local sandbox."
);

async function chapter(page: Page, id: string, title: string) {
  const mobile = page.getByRole("combobox", {
    name: "Chapters in this record",
  });
  if (await mobile.isVisible()) await mobile.selectOption(id);
  else
    await page
      .getByRole("navigation", { name: "Chapters in this record" })
      .getByRole("button", { name: title, exact: true })
      .click();
}

for (const version of [2, 3] as const) {
  test(`profile v${version}: incomplete answer does not block saving another answer or survive refresh as saved`, async ({
    page,
    baseURL,
  }) => {
    const sandbox = await installDocumentationSandbox(page, baseURL, version);
    await page.goto(sandbox.path, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const title = page
      .getByRole("region", { name: "Artwork documentation", exact: true })
      .locator("#documentation-artwork-title");
    const capture = page
      .getByRole("region", { name: "Artwork documentation", exact: true })
      .locator("#documentation-artwork-capture_date");
    await expect(title).toHaveValue("Local browser study");
    await capture.fill("September");
    await title.fill("A saved browser study");
    await expect
      .poll(() => sandbox.context.modules["artwork"]!.answers["title"]?.value, {
        timeout: 15000,
      })
      .toBe("A saved browser study");
    expect(
      sandbox.patches.some(({ operations }) =>
        operations.some(({ field }) => field === "capture_date")
      )
    ).toBe(false);
    await expect(
      page
        .getByRole("region", { name: "Artwork documentation", exact: true })
        .locator("#documentation-artwork-capture_date-validation")
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(
      sandbox.context.modules["artwork"]!.answers["capture_date"]?.value
    ).toEqual({
      precision: "year",
      start: "2026",
      approximate: false,
    });
    await capture.fill("2027");
    await expect
      .poll(
        () => sandbox.context.modules["artwork"]!.answers["capture_date"]?.value
      )
      .toMatchObject({ start: "2027" });
    await page.reload();
    await expect(title).toHaveValue("A saved browser study");
    await expect(capture).toHaveValue("2027");
    expect(sandbox.unexpected).toEqual([]);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test(`profile v${version}: transfer survives responsive layout, chapter and reading navigation, attachment retries without retransfer, final selection persists`, async ({
    page,
    baseURL,
    isMobile,
  }) => {
    const sandbox = await installDocumentationSandbox(page, baseURL, version, {
      failFirstAttachment: true,
    });
    try {
      await page.goto(sandbox.path, {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await expect(
        page
          .getByRole("region", { name: "Artwork documentation", exact: true })
          .locator("#documentation-artwork-title")
      ).toHaveValue("Local browser study");
      await page
        .getByRole("region", { name: "Artwork documentation", exact: true })
        .locator("#documentation-artwork-capture_date")
        .fill("September");
      if (version === 3)
        await chapter(page, "materials", "Materials & versions");
      const upload = page
        .getByRole("region", { name: "Artwork documentation", exact: true })
        .locator("#documentation-upload");
      await page
        .getByRole("region", { name: "Artwork documentation", exact: true })
        .locator("#documentation-upload input[type=file]")
        .setInputFiles(FIXTURE_FILE);
      await upload
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await expect.poll(() => sandbox.counts.transfers).toBe(1);
      await chapter(
        page,
        "story",
        version === 3 ? "The artist’s account" : "The story & the making"
      );
      await page
        .getByRole("button", { name: "Read the draft", exact: true })
        .click();
      await expect(
        page
          .getByRole("region", { name: "Draft reading view" })
          .getByRole("button", { name: "Return to writing", exact: true })
      ).toBeVisible();
      // Touch devices cross the actual shell boundary at 1024px. Preserve
      // reading state and the in-flight transfer in both directions.
      const originalViewport = page.viewportSize()!;
      for (const width of [1100, 390, originalViewport.width]) {
        await page.setViewportSize({ width, height: originalViewport.height });
        await expect
          .poll(() =>
            page
              .getByRole("main")
              .evaluate((main) =>
                main.closest("[data-small]")?.getAttribute("data-small")
              )
          )
          .toBe(String(isMobile && width < 1024));
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve())
              );
            })
        );
        await expect(
          page
            .getByRole("region", { name: "Draft reading view" })
            .getByRole("button", { name: "Return to writing", exact: true })
        ).toBeVisible();
        await expect(page).toHaveURL(/section=story/u);
      }
      sandbox.releaseTransfer();
      await expect.poll(() => sandbox.counts.completes).toBe(1);
      await expect.poll(() => sandbox.counts.polls).toBeGreaterThan(0);
      sandbox.finishProcessing();
      await expect.poll(() => sandbox.counts.links, { timeout: 15000 }).toBe(1);
      await page
        .getByRole("region", { name: "Draft reading view" })
        .getByRole("button", { name: "Return to writing", exact: true })
        .click();
      await chapter(
        page,
        version === 3 ? "materials" : "artwork",
        version === 3 ? "Materials & versions" : "The work"
      );
      await upload
        .getByRole("button", {
          name: "Add checked file to record",
          exact: true,
        })
        .click();
      await expect.poll(() => sandbox.counts.links).toBe(2);
      await expect(
        upload.getByText(
          "local-browser-study.png has been checked and added to your record. You can now select it in the relevant file field below.",
          { exact: true }
        )
      ).toBeVisible();
      expect(sandbox.counts.starts).toBe(1);
      expect(sandbox.counts.transfers).toBe(1);
      expect(sandbox.counts.completes).toBe(1);
      expect(sandbox.counts.cancels).toBe(0);
      const finalFile = page
        .getByRole("region", { name: "Artwork documentation", exact: true })
        .locator("#documentation-artwork-canonical_asset_id");
      await expect(
        finalFile.getByRole("option", { name: FIXTURE_FILE.name, exact: true })
      ).toHaveText(FIXTURE_FILE.name);
      await finalFile.selectOption(FIXTURE_ASSET_ID);
      await expect
        .poll(
          () =>
            sandbox.context.modules["artwork"]!.answers["canonical_asset_id"]
              ?.value
        )
        .toBe(FIXTURE_ASSET_ID);
      await page.reload();
      await expect(finalFile).toHaveValue(FIXTURE_ASSET_ID);
      expect(sandbox.unexpected).toEqual([]);
      await expectNoUnsafeSandboxMutations(baseURL);
    } finally {
      sandbox.releaseTransfer();
    }
  });
}
