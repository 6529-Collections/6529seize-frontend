import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

const WAVE = "00000000-0000-4000-8000-000000000529";
const TITLE = "Local Composer Sandbox Wave";
const BROADCAST = "Receive @all and @contributors notifications";
const ALL = "Receive notifications for all messages";

async function installPreferences(
  page: Page,
  baseURL: string | undefined,
  waveId = WAVE
) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("https://www.googletagmanager.com/gtag/js?**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" })
  );
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/waves/${waveId}`
  );
  expect(response.ok()).toBe(true);
  const wave = await response.json();
  wave.subscribed_actions = ["DROP_CREATED"];
  await page.route(`**/api/waves/${waveId}`, (route) =>
    route.fulfill({ json: wave })
  );
  let preferences = { subscribed: false, enabled_group_notifications: ["ALL"] };
  let fail = false;
  let failRead = false;
  let delay = 0;
  const writes: (typeof preferences)[] = [];
  await page.route(
    `**/api/notifications/wave-subscription/${waveId}`,
    async (route) => {
      if (route.request().method() === "POST") {
        writes.push(route.request().postDataJSON());
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        if (fail)
          return route.fulfill({
            status: 500,
            json: { error: "Preference update failed" },
          });
        preferences = route.request().postDataJSON();
      } else if (failRead)
        return route.fulfill({
          status: 500,
          json: { error: "Preferences unavailable" },
        });
      await route.fulfill({ json: preferences });
    }
  );
  return {
    writes,
    failUpdate: () => {
      fail = true;
    },
    delayUpdate: () => {
      delay = 1000;
    },
    failRead: () => {
      failRead = true;
    },
    recoverRead: () => {
      failRead = false;
    },
  };
}

async function openAbout(page: Page) {
  await page
    .getByRole("button", { name: `About ${TITLE}`, exact: true })
    .first()
    .click();
  return page.getByRole("dialog", { name: `About ${TITLE}`, exact: true });
}

async function expectReachable(
  page: Page,
  role: "checkbox" | "menuitemcheckbox"
) {
  for (const name of [BROADCAST, ALL]) {
    const choice = page.getByRole(role, { name, exact: true });
    await expect(choice).toBeInViewport({ ratio: 1 });
    // Trial pointer action verifies stacking and modal inertness, not only DOM visibility.
    await choice.click({ trial: true });
  }
  await expectNoHorizontalOverflow(page);
}

test.describe("Wave notification settings @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Notification settings use the isolated local API."
  );
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  for (const surface of ["web", "ios", "android"] as const) {
    test(`opens and dismisses reachable notification choices in the ${surface} About sheet`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "This case covers the touch sheet."
      );
      if (surface !== "web")
        await installSurfaceSimulation(
          page.context(),
          surface === "ios" ? "capacitor-ios-sim" : "capacitor-android-sim",
          baseURL
        );
      const api = await installPreferences(page, baseURL);
      await page.goto(`/waves/${WAVE}`);
      if (surface !== "web") {
        // Native phone headers hide the description; the title must center on the avatar.
        const title = page
          .getByRole("button", { name: `About ${TITLE}`, exact: true })
          .first();
        await expect(title).toBeVisible();
        await expect
          .poll(() =>
            title.evaluate((button) => {
              const text = button.firstElementChild?.getBoundingClientRect();
              const avatar =
                button.parentElement?.previousElementSibling?.getBoundingClientRect();
              if (!text || !avatar) return Number.POSITIVE_INFINITY;
              return Math.abs(
                text.y + text.height / 2 - avatar.y - avatar.height / 2
              );
            })
          )
          .toBeLessThanOrEqual(1);
      }
      const about = await openAbout(page);
      const originalHeight = await about
        .getByRole("heading", { name: `About ${TITLE}`, exact: true })
        .evaluate(
          (heading) =>
            heading.closest(".mobile-wrapper-dialog")?.getBoundingClientRect()
              .height
        );
      expect(originalHeight).toBeGreaterThan(0);
      const bell = about.getByRole("button", {
        name: "Open notification settings",
      });
      await bell.tap();
      const choices = page.getByRole("dialog", {
        name: "Notification settings",
        exact: true,
        includeHidden: true,
      });
      await expect(
        choices.getByRole("heading", {
          name: "Notification settings",
          exact: true,
        })
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: "Open notification settings",
          includeHidden: true,
        })
      ).toHaveAttribute("aria-expanded", "true");
      await expectReachable(page, "checkbox");
      await expect(page.getByRole("dialog")).toHaveCount(1);
      expect(
        await choices
          .getByRole("heading", { name: "Notification settings", exact: true })
          .evaluate(
            (heading) =>
              heading.closest(".mobile-wrapper-dialog")?.getBoundingClientRect()
                .height
          )
      ).toBeLessThan((originalHeight ?? 0) / 2);
      await expect(
        choices.getByRole("button", { name: "Back", exact: true })
      ).toBeVisible();
      await expect(choices.getByRole("list").getByRole("listitem")).toHaveCount(
        2
      );
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath(`notification-choices-${surface}.png`),
      });
      await page.keyboard.press("Escape");
      await expect(choices).toHaveCount(0);
      await expect(
        about.getByRole("heading", { name: `About ${TITLE}`, exact: true })
      ).toBeVisible();
      await expect(bell).toBeFocused();
      expect(
        await about
          .getByRole("heading", { name: `About ${TITLE}`, exact: true })
          .evaluate(
            (heading) =>
              heading.closest(".mobile-wrapper-dialog")?.getBoundingClientRect()
                .height
          )
      ).toBeCloseTo(originalHeight ?? 0, 0);
      await bell.tap();
      await page.goBack();
      await expect(choices).toHaveCount(0);
      await expect(
        about.getByRole("heading", { name: `About ${TITLE}`, exact: true })
      ).toBeVisible();
      await expect(bell).toBeFocused();
      await bell.tap();
      await choices.getByRole("button", { name: "Back", exact: true }).tap();
      await expect(choices).toHaveCount(0);
      await expect(bell).toBeFocused();
      await bell.tap();
      await choices.getByRole("button", { name: "Close", exact: true }).tap();
      await expect(choices).toHaveCount(0);
      await expect(about).toHaveCount(0);
      await openAbout(page);
      await bell.tap();
      await choices.getByRole("checkbox").first().click({ trial: true });
      await page.touchscreen.tap(8, 12);
      await expect(choices).toHaveCount(0);
      await expect(about).toHaveCount(0);
      await openAbout(page);
      await bell.tap();
      api.delayUpdate();
      await choices.getByRole("checkbox", { name: ALL }).tap();
      await expect(bell).toBeDisabled();
      await expect(choices).toHaveCount(0);
      await expect(bell).toBeEnabled();
      await expect(bell).toBeFocused();
      expect(api.writes).toEqual([
        { subscribed: true, enabled_group_notifications: ["ALL"] },
      ]);
      await bell.tap();
      await expect(choices.getByRole("checkbox", { name: ALL })).toBeChecked();
      await choices.getByRole("checkbox", { name: BROADCAST }).tap();
      await expect(bell).toBeEnabled();
      await bell.tap();
      await expect(
        choices.getByRole("checkbox", { name: BROADCAST })
      ).not.toBeChecked();
      await page.keyboard.press("Escape");
      await expect(
        about.getByRole("heading", { name: `About ${TITLE}`, exact: true })
      ).toBeVisible();
      await page.goBack();
      await expect(about).toHaveCount(0);
    });
  }

  test("keeps desktop and tablet overlay choices reachable with keyboard navigation", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop and tablet use the anchored menu."
    );
    await installPreferences(page, baseURL);
    for (const width of [1600, 1100]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/waves/${WAVE}`);
      await page
        .getByRole("button", { name: `About ${TITLE}`, exact: true })
        .first()
        .click();
      const bell = page.getByRole("button", {
        name: "Open notification settings",
      });
      await expect(bell).toHaveAttribute("aria-haspopup", "menu");
      await expect(bell).toHaveAttribute("aria-expanded", "false");
      await bell.focus();
      await page.keyboard.press("Enter");
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(bell).toHaveAttribute("aria-expanded", "true");
      await expect(bell).toHaveAttribute(
        "aria-controls",
        (await menu.getAttribute("id")) ?? ""
      );
      await expectReachable(page, "menuitemcheckbox");
      await page.keyboard.press("ArrowDown");
      await expect(menu).toHaveAttribute("aria-activedescendant", /.+/);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(bell).toHaveAttribute("aria-expanded", "false");
      await expect(bell).toBeFocused();
    }
  });

  test("keeps DM notification choices usable at phone and touch-tablet widths", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Touch DM layouts."
    );
    const dmId = "00000000-0000-4000-8000-000000000532";
    const api = await installPreferences(page, baseURL, dmId);
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/messages/${dmId}`);
      await page
        .getByRole("button", {
          name: "About Sandbox Direct Message",
          exact: true,
        })
        .first()
        .tap();
      const bell = page.getByRole("button", {
        name: "Open notification settings",
      });
      await bell.tap();
      // The phone uses About; the tablet retains its Wave details sidebar.
      const choiceRole = width === 390 ? "checkbox" : "menuitemcheckbox";
      await expect(page.getByRole("dialog")).toHaveCount(1);
      await expectReachable(page, choiceRole);
      const choice = page.getByRole(choiceRole, { name: BROADCAST });
      const box = await choice.boundingBox();
      expect(box).not.toBeNull();
      if (!box) throw new Error("Notification choice has no touch target.");
      const cdp = await page.context().newCDPSession(page);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - 55 }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
      await expect(choice).toBeVisible();
      expect(api.writes).toHaveLength(0);
      await page.keyboard.press("Escape");
      await expect(bell).toBeFocused();
    }
  });

  test("keeps About open on update failure and lets failed preference reads retry", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "This case covers sheet recovery."
    );
    const api = await installPreferences(page, baseURL);
    api.failRead();
    await page.goto(`/waves/${WAVE}`);
    const about = await openAbout(page);
    const retry = about.getByRole("button", { name: /retry/i });
    await expect(retry).toBeVisible({ timeout: 15000 });
    api.recoverRead();
    await retry.tap();
    const bell = about.getByRole("button", {
      name: "Open notification settings",
    });
    await expect(bell).toBeEnabled();
    api.failUpdate();
    await bell.tap();
    await page.getByRole("checkbox", { name: ALL }).tap();
    await expect(
      page.getByRole("dialog", {
        name: "Notification settings",
        exact: true,
        includeHidden: true,
      })
    ).toHaveCount(0);
    await expect(
      about.getByRole("heading", { name: `About ${TITLE}`, exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Couldn't update notification settings.", {
        exact: true,
      })
    ).toBeVisible();
    await expect(bell).toBeEnabled();
    await bell.tap();
    await expect(page.getByRole("checkbox", { name: ALL })).not.toBeChecked();
  });
});
