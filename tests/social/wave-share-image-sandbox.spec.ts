import type { Locator, Page } from "@playwright/test";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "../../hooks/useLongPressInteraction";
import { expect, test } from "../testHelpers";
import { useLocalSandboxMutationGuard } from "../support/localSandbox";
import {
  findTouchMessage,
  longPressTouchMessage,
} from "../input/waveTouchTarget";

const WAVE = "00000000-0000-4000-8000-000000000529";

/**
 * Share as image: start a selection from a post and export a PNG rendered in
 * the browser. Browser-only risks: the selection overlay over real post rows,
 * the native dialog, the preview fitting the dialog without sideways
 * scrolling, and html-to-image producing a downloadable PNG with UTC times
 * rather than the device zone.
 */

async function mockSandboxGaps(page: Page) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  // The mock API has no drop curations; the post menu asks for them.
  await page.route("**/api/drops/*/curations**", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route(`**/api/waves/${WAVE}/curations**`, (route) =>
    route.fulfill({ json: [] })
  );
}

/** The scaled card must fit the preview area: no sideways scrolling. */
async function expectPreviewFits(dialog: Locator) {
  const area = dialog
    .getByRole("region", { name: "Preview" })
    .locator(":scope > div")
    .first();
  await expect(area).toBeVisible();
  await expect
    .poll(() =>
      area.evaluate((element) => element.scrollWidth - element.clientWidth)
    )
    .toBeLessThanOrEqual(1);
}
test.describe("Share posts as image @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Share as image uses the isolated local mock API."
  );
  test.use({ timezoneId: "America/New_York", locale: "en-US" });

  test("selects a post, previews UTC times and downloads a PNG", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop opens the post menu from the hover actions; phones use the long-press sheet."
    );
    await mockSandboxGaps(page);
    await page.goto(`/waves/${WAVE}`);

    const rows = page.getByRole("main").locator("[data-wave-drop-id]");
    await expect(rows.first()).toBeVisible();
    const lastRow = rows.last();
    await lastRow.hover();
    await lastRow.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("button", { name: "Share as image" }).click();

    // The sandbox wave holds a single post, so the starting post is the whole
    // range; choosing wider ranges is covered by the selection unit tests.
    await expect(page.getByText("1 post selected")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Select post by / }).last()
    ).toHaveAttribute("aria-pressed", "true");

    await page
      .getByRole("region", { name: "Share as image" })
      .getByRole("button", { name: "Next" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Share as image" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /^UTC/ })).toBeChecked();
    await expect(dialog.getByText(/ UTC$/).first()).toBeVisible();
    await expectPreviewFits(dialog);

    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download image" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/-\d{4}-\d{2}-\d{2}\.png$/);
    await expect(dialog.getByRole("status")).toContainText("Downloaded");

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(/posts? selected/)).toHaveCount(0);
  });

  test("fits the preview on a phone from the press-and-hold menu", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Phones open Share as image from the press-and-hold post menu."
    );
    await mockSandboxGaps(page);
    await page.goto(`/waves/${WAVE}`);

    const row = await findTouchMessage(page);
    await longPressTouchMessage(row, DEFAULT_LONG_PRESS_DURATION_MS + 600);
    await page.getByRole("button", { name: "Share as image" }).click();
    await expect(page.getByText("1 post selected")).toBeVisible();

    await page
      .getByRole("region", { name: "Share as image" })
      .getByRole("button", { name: "Next" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Share as image" });
    await expect(dialog).toBeVisible();
    await expectPreviewFits(dialog);

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
