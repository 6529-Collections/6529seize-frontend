import type { Page } from "@playwright/test";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "../../hooks/useLongPressInteraction";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
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
      "The desktop More popover contains the time radio choices; phones use their existing overflow action."
    );
    await page.goto(`/waves/${WAVE}`);
    const seededTime = seededPostTime(page);
    await expect(seededTime).toHaveText("Apr 21, 2024 - 08:00 PM");

    const more = page.getByRole("button", { name: "More wave actions" });
    await more.click();
    await expect(more).toBeFocused();
    await expect(
      page.getByRole("radio", { name: /^Local time/ })
    ).not.toBeFocused();
    await page.keyboard.press("Escape");
    await more.press("Enter");
    await expect(more).toBeFocused();
    await more.press("Tab");
    const preferences = page.getByRole("dialog", {
      name: "More wave actions",
      exact: true,
    });
    await expect
      .poll(() =>
        preferences.evaluate((panel) => panel.contains(document.activeElement))
      )
      .toBe(true);
    await expect(
      page.getByText(/Lasts until you close this tab or the app/)
    ).toBeVisible();
    const utcChoice = page.getByRole("radio", { name: /^UTC/ });
    await expect(utcChoice).toHaveCSS("appearance", "none");
    await expect(utcChoice).toHaveCSS("background-color", "rgb(38, 39, 43)");
    await expect(utcChoice).toHaveCSS("border-color", "rgb(76, 76, 85)");
    await expect(page.getByRole("radio", { name: /^Local time/ })).toHaveCSS(
      "background-color",
      "rgb(82, 139, 255)"
    );
    await utcChoice.focus();
    await expect
      .poll(() =>
        utcChoice.evaluate((input) => getComputedStyle(input).boxShadow)
      )
      .toContain("rgb(19, 19, 22)");
    await utcChoice.check();

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

  test("condenses the Wave header beside the open sidebar and preserves the time switch", async ({
    page,
    baseURL,
  }, testInfo) => {
    const response = await page.request.get(
      `${getSandboxApiOrigin(baseURL)}/api/waves/${WAVE}`
    );
    expect(response.ok()).toBe(true);
    const wave = await response.json();
    wave.description_drop.parts = [
      {
        part_id: 1,
        content: "Local-only composer sandbox wave for Playwright.",
        media: [],
        quoted_drop: null,
      },
    ];
    wave.author = {
      ...wave.author,
      id: "00000000-0000-4000-8000-000000000536",
      handle: "header-author",
    };
    wave.wave_score = {
      ...wave.wave_score,
      visibility_score: 96,
      quality_score: 95,
      hotness_score: 98,
      rep_sort_score: 85,
    };
    wave.wave_rep = {
      ...wave.wave_rep,
      total_rep: 6529,
      authenticated_user_contribution: null,
    };
    await page.route(`**/api/waves/${WAVE}`, (route) =>
      route.fulfill({ json: wave })
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/waves/${WAVE}`);
    const name = page.getByRole("button", {
      name: "About Local Composer Sandbox Wave",
      exact: true,
    });
    const header = page
      .getByRole("main")
      .locator("header")
      .filter({ has: name });
    await name.click();
    await expect(
      header.getByRole("button", { name: "Hide right sidebar", exact: true })
    ).toBeVisible();
    await expect
      .poll(() =>
        name.evaluate((button) => button.scrollWidth <= button.clientWidth + 1)
      )
      .toBe(true);
    const originalHeaderWidth = (await header.boundingBox())!.width;
    const narrowViewportWidth = Math.round(1280 + 600 - originalHeaderWidth);
    await page.setViewportSize({ width: narrowViewportWidth, height: 900 });
    const score = header.getByRole("button", { name: /^Wave score/ });
    await expect(score).toBeVisible();
    await expect
      .poll(() =>
        name.evaluate((button) => {
          const row = button.closest("h1")?.parentElement;
          const score = row?.querySelector('button[aria-label^="Wave score"]');
          const avatar = row?.parentElement?.parentElement?.firstElementChild;
          if (!score || !avatar) return false;
          const nameBox = button.getBoundingClientRect();
          const scoreBox = score.getBoundingClientRect();
          const avatarBox = avatar.getBoundingClientRect();
          const center = nameBox.y + nameBox.height / 2;
          return (
            scoreBox.x >= nameBox.right &&
            Math.abs(center - scoreBox.y - scoreBox.height / 2) <= 1 &&
            Math.abs(center - avatarBox.y - avatarBox.height / 2) <= 1
          );
        })
      )
      .toBe(true);
    const rep = header.getByRole("button", {
      name: /Add Wave REP|Edit your Wave REP/,
    });
    await expect(rep.getByText("Add REP", { exact: true })).toBeVisible();
    await expect(rep).toHaveCSS("height", "32px");
    await expect(rep).toHaveCSS("padding-left", "10px");
    await expect(
      header.getByRole("button", { name: "Show wave description", exact: true })
    ).toHaveCount(0);
    await page.setViewportSize({
      width: Math.round(1280 + 700 - originalHeaderWidth),
      height: 900,
    });
    await expect(
      header.getByRole("button", { name: "Show wave description", exact: true })
    ).toBeVisible();
    await expect(rep.getByText("Add REP", { exact: true })).toBeVisible();
    await expect(score).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("medium-wave-header-description.png"),
    });
    await page.setViewportSize({ width: narrowViewportWidth, height: 900 });
    await expect(
      header.getByRole("button", { name: "Show wave description", exact: true })
    ).toHaveCount(0);
    const more = header.getByRole("button", {
      name: "More wave actions",
      exact: true,
    });
    await expect(more).toBeVisible();
    await expect(
      header.getByRole("button", {
        name: "Switch to gallery view",
        exact: true,
      })
    ).toHaveCount(0);
    const clock = header.getByRole("button", {
      name: "Time display: local time",
      exact: true,
    });
    await expect(clock).toHaveCount(0);
    await more.press("Enter");
    const preferences = page.getByRole("dialog", {
      name: "More wave actions",
      exact: true,
    });
    await expect(
      preferences.getByRole("button", {
        name: "Switch to gallery view",
        exact: true,
      })
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /^UTC/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await more.press("Enter");
    await page.getByRole("radio", { name: /^UTC/ }).check();
    await page.keyboard.press("Escape");
    await expect(seededPostTime(page)).toHaveText(
      "Apr 22, 2024 - 12:00 AM UTC"
    );
    await expect(
      header.getByText("Times in UTC", { exact: true })
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("desktop-more-active-time-override.png"),
    });
    await header
      .getByRole("button", {
        name: "Show times in local time again",
        exact: true,
      })
      .click();
    await expect(seededPostTime(page)).toHaveText("Apr 21, 2024 - 08:00 PM");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("compact-wave-header-sidebar.png"),
    });
    await header
      .getByRole("button", { name: "Hide right sidebar", exact: true })
      .click();
    await page.setViewportSize({ width: 1600, height: 900 });
    await expect(
      header.getByRole("button", {
        name: "Time display: local time",
        exact: true,
      })
    ).toHaveCount(0);
    await expect(more).toBeVisible();
    await expect(rep).toHaveCSS("padding-left", "10px");
    await expectNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(more).toBeVisible();
    const phoneWidths =
      testInfo.project.name === "web-mobile-chromium" ? [320, 375, 430] : [375];
    for (const width of phoneWidths) {
      await page.setViewportSize({ width, height: 900 });
      await expect(score).toBeInViewport({ ratio: 1 });
      await expect(
        header.getByRole("button", { name: "Wave details", exact: true })
      ).toBeInViewport({ ratio: 1 });
      await expect
        .poll(() =>
          name.evaluate((button) => {
            const row = button.closest("h1")?.parentElement;
            const score = row?.querySelector(
              'button[aria-label^="Wave score"]'
            );
            const avatar = row?.parentElement?.parentElement?.firstElementChild;
            if (!score || !avatar) return false;
            const nameBox = button.getBoundingClientRect();
            const scoreBox = score.getBoundingClientRect();
            const avatarBox = avatar.getBoundingClientRect();
            return (
              nameBox.width >= 16 &&
              scoreBox.x >= nameBox.right &&
              Math.abs(
                nameBox.y +
                  nameBox.height / 2 -
                  scoreBox.y -
                  scoreBox.height / 2
              ) <= 1 &&
              Math.abs(
                nameBox.y +
                  nameBox.height / 2 -
                  avatarBox.y -
                  avatarBox.height / 2
              ) <= 1
            );
          })
        )
        .toBe(true);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`phone-wave-score-${width}.png`),
      });
    }
    await expect(
      header.getByRole("button", {
        name: "Switch to gallery view",
        exact: true,
      })
    ).toHaveCount(0);
    await more.click();
    const actions = page.getByRole("dialog", {
      name: "More wave actions",
      exact: true,
    });
    await expect(
      actions.getByRole("button", {
        name: "Switch to gallery view",
        exact: true,
      })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(actions).toHaveCount(0);
    await more.click();
    await actions
      .getByRole("button", {
        name: "Search messages in this wave",
        exact: true,
      })
      .click();
    const searchInput = page.getByPlaceholder("Search messages", {
      exact: true,
    });
    await expect(actions).toHaveCount(0);
    await expect(searchInput).toBeFocused();
    // The search field first dismisses its operator suggestions, then Escape closes search.
    await expect(searchInput).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(searchInput).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Escape");
    await expect(searchInput).toBeHidden();
    await expect(more).toBeFocused();
    await header
      .getByRole("button", { name: "Wave details", exact: true })
      .click();
    await expect(actions).toHaveCount(0);
    await expect(
      page.getByRole(
        testInfo.project.name === "web-mobile-chromium" ? "tab" : "button",
        { name: "About", exact: true }
      )
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expectNoHorizontalOverflow(page);
  });

  test("desktop More switches gallery and chat and restores keyboard focus", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/waves/${WAVE}`);
    await expect(
      page.getByRole("button", {
        name: "Open account and profiles menu",
        exact: true,
      })
    ).toHaveText(/playwright/);
    await expect(seededPostTime(page)).toHaveText("Apr 21, 2024 - 08:00 PM");
    const more = page.getByRole("button", {
      name: "More wave actions",
      exact: true,
    });
    const preferences = page.getByRole("dialog", {
      name: "More wave actions",
      exact: true,
    });
    await more.press("Enter");
    await preferences
      .getByRole("button", { name: "Switch to gallery view", exact: true })
      .click();
    await expect(preferences).toHaveCount(0);
    await expect(more).toBeFocused();
    await more.press("Enter");
    await preferences
      .getByRole("button", { name: "Switch to chat view", exact: true })
      .click();
    await expect(preferences).toHaveCount(0);
    await expect(more).toBeFocused();
    await expect(seededPostTime(page)).toHaveText("Apr 21, 2024 - 08:00 PM");
    await expectNoHorizontalOverflow(page);
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
