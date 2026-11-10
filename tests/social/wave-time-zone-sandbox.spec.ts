import type { Page } from "@playwright/test";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "../../hooks/useLongPressInteraction";
import { expect, test } from "../testHelpers";
import { useLocalSandboxMutationGuard } from "../support/localSandbox";
import {
  findTouchMessage,
  longPressTouchMessage,
} from "../input/waveTouchTarget";

const WAVE = "00000000-0000-4000-8000-000000000529";
// The sandbox seeds its drops at 2024-04-22T00:00:00Z: still April 21 in New
// York, so the day and the clock both change when times switch to UTC.
const SEED_INSTANT = "2024-04-22T00:00:00.000Z";

/**
 * Display time zone (privacy): wave times can show in UTC instead of the
 * device zone, from the wave header switch or the phone post menu (this tab
 * only) or from Preferences > Time Zone (saved on the device). Browser-only
 * risks covered here: a real non-UTC device zone, the stored choice applying
 * after hydration without errors, the switch surviving a reload in the tab,
 * and a phone header that keeps the wave title visible.
 */
/** The seeded post's time, found by its machine-readable UTC instant. */
function seededPostTime(page: Page) {
  return page
    .getByRole("main")
    .locator(`time[datetime="${SEED_INSTANT}"]`)
    .first();
}

test.describe("Display time zone @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "The display time zone checks use the isolated local mock API."
  );
  test.use({ timezoneId: "America/New_York", locale: "en-US" });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/open-graph**", (route) =>
      route.fulfill({ json: {} })
    );
  });

  test("wave switch shows UTC for this tab, survives a reload and undoes", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "The wide wave header holds the clock button; compact headers use the overflow menu."
    );
    await page.goto(`/waves/${WAVE}`);
    const seededTime = seededPostTime(page);
    await expect(seededTime).toHaveText("Apr 21, 2024 - 08:00 PM");

    await page
      .getByRole("button", { name: "Time display: local time" })
      .click();
    await expect(
      page.getByText(/Lasts until you close this tab or the app/)
    ).toBeVisible();
    await page.getByRole("radio", { name: /^UTC/ }).check();

    await expect(seededTime).toHaveText("Apr 22, 2024 - 12:00 AM UTC");
    await expect(page.getByText("Times in UTC")).toBeVisible();

    await page.reload();
    await expect(seededTime).toHaveText("Apr 22, 2024 - 12:00 AM UTC");

    await page
      .getByRole("button", { name: "Show times in local time again" })
      .click();
    await expect(seededTime).toHaveText("Apr 21, 2024 - 08:00 PM");
    await expect(page.getByText("Times in UTC")).toHaveCount(0);
  });

  test("phone post menu switches to UTC and back without crowding the header", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Phones switch from the press-and-hold post menu."
    );
    // The mock API has no curations; the post menu asks for them.
    await page.route("**/api/drops/*/curations**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route(`**/api/waves/${WAVE}/curations**`, (route) =>
      route.fulfill({ json: [] })
    );
    await page.goto(`/waves/${WAVE}`);
    const seededTime = seededPostTime(page);
    // Narrow screens show the date only for older posts.
    await expect(seededTime).toHaveText("Apr 21, 2024");

    const row = await findTouchMessage(page);
    await longPressTouchMessage(row, DEFAULT_LONG_PRESS_DURATION_MS + 600);
    await page
      .getByRole("button", { name: "Show times in UTC for now" })
      .click();
    await expect(seededTime).toHaveText("Apr 22, 2024");

    await longPressTouchMessage(row, DEFAULT_LONG_PRESS_DURATION_MS + 600);
    await page
      .getByRole("button", { name: "Show times in local time again" })
      .click();
    await expect(seededTime).toHaveText("Apr 21, 2024");
  });

  test("Preferences saves UTC on the device and waves use it after hydration", async ({
    page,
  }, testInfo) => {
    await page.goto("/preferences?tab=time-zone");
    await expect(
      page.getByRole("heading", { name: "Show times in" })
    ).toBeVisible();
    // The radio input is visually hidden; its row is the label to click.
    await page.getByText(/The same for everyone/).click();
    await expect(page.getByRole("radio", { name: "UTC" })).toBeChecked();

    await page.goto(`/waves/${WAVE}`);
    const seededTime = seededPostTime(page);
    const isPhone = testInfo.project.name === "web-mobile-chromium";
    await expect(seededTime).toHaveText(
      isPhone ? "Apr 22, 2024" : "Apr 22, 2024 - 12:00 AM UTC"
    );
    // A saved setting is not the temporary switch, so no chip is shown.
    await expect(page.getByText("Times in UTC")).toHaveCount(0);
  });
});
