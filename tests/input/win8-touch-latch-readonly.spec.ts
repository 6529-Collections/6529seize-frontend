import type { Page } from "@playwright/test";

import { expect, test } from "../testHelpers";

/**
 * Win 8-sequence regression pack for the behavioral fine-pointer latch
 * (helpers/touch-first.helpers.ts).
 *
 * Legacy Windows touch stacks synthesize TRUSTED mouse events from taps at
 * the OS level. Playwright's real input APIs (touchscreen/mouse) drive
 * Chromium's actual input pipeline, so the events they produce are trusted
 * too — which lets this spec replay the sequence that shipped the regression
 * (wave reply / three-dots unreachable on Win 8 touch hardware) through real
 * listener registration, real event objects, the latch, and the
 * `data-fine-pointer` CSS hook — none of which jsdom unit tests reach.
 *
 * Emulation honesty note: reproducing the Win 8 media-query posture
 * (touch + `hover: none`) in Playwright requires `isMobile: true`, which
 * additionally sets the `userAgentData.mobile` client hint — so the app's
 * phone UA override also shields this profile, unlike the real hardware.
 * The decisive assertion is therefore `body[data-fine-pointer]`: the latch
 * sets it independent of any UA override, and its CSS variants are what
 * remove touch affordances (`touch-only:`/`touch-select-none`) on every
 * device class when it fires wrongly.
 *
 * Read-only: opens and dismisses the long-press sheet, posts nothing.
 */

const WIN8_CHROME_UA =
  "Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

const bodyHasFinePointer = (page: Page) =>
  page.evaluate(() => document.body.hasAttribute("data-fine-pointer"));

async function openFirstWaveWithRows(page: Page) {
  await page.goto("/waves", { waitUntil: "domcontentloaded" });
  const waveLink = page.locator('a[href^="/waves/"]').first();
  await expect(waveLink).toBeVisible({ timeout: 30000 });
  const href = await waveLink.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!, { waitUntil: "domcontentloaded" });
  // `.touch-select-none` marks rows whose selection is disabled in favor of
  // long-press — it is only styled away when the device is (mis)classified,
  // so its presence participates in the assertion.
  await expect(page.locator(".touch-select-none").last()).toBeAttached({
    timeout: 60000,
  });
}

async function longPressViaTouchEvents(page: Page) {
  // The long-press hook (useLongPressInteraction) reads React touch events;
  // dispatching TouchEvents at the row is engine-accurate enough here — the
  // classification state under test is what decides whether the hook is
  // armed at all.
  await page.evaluate(() => {
    const rows = document.querySelectorAll(".touch-select-none");
    const el = rows[rows.length - 1] as HTMLElement;
    const rect = el.getBoundingClientRect();
    const touch = new Touch({
      identifier: 1,
      target: el,
      clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2,
    });
    el.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch],
      })
    );
  });
  await page.waitForTimeout(1100); // > longPressDuration
  await page.evaluate(() => {
    const rows = document.querySelectorAll(".touch-select-none");
    const el = rows[rows.length - 1] as HTMLElement;
    const touch = new Touch({
      identifier: 1,
      target: el,
      clientX: 0,
      clientY: 0,
    });
    el.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        cancelable: true,
        touches: [],
        targetTouches: [],
        changedTouches: [touch],
      })
    );
  });
}

test.describe("Win 8 touch emulation vs the fine-pointer latch", () => {
  // Touch present, hover absent (the lying-media-queries posture of the
  // reported hardware), desktop-era Windows UA string.
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 1366, height: 768 },
    userAgent: WIN8_CHROME_UA,
  });

  test("taps followed by synthesized mouse moves never flip the device to desktop", async ({
    page,
  }) => {
    await openFirstWaveWithRows(page);

    // The Win 8 sequence, three times over: a real (trusted) touch tap, then
    // trusted mouse moves milliseconds later. Chromium's own touch pipeline
    // additionally emits compatibility mouse events after each tap — exactly
    // like the legacy OS — and none of it may latch.
    for (let round = 0; round < 3; round++) {
      const row = page.locator(".touch-select-none").last();
      const box = await row.boundingBox();
      expect(box).toBeTruthy();
      await page.touchscreen.tap(
        box!.x + box!.width / 2,
        box!.y + Math.min(10, box!.height / 2)
      );
      await page.mouse.move(200 + round * 50, 300, { steps: 3 });
    }

    expect(await bodyHasFinePointer(page)).toBe(false);

    // The touch affordance must still be alive: long-press opens the sheet.
    // Assert on the action button itself — the HeadlessUI dialog wrapper is
    // a zero-size positioning shell that Playwright's visibility heuristic
    // reports as hidden even while its content is on screen.
    await longPressViaTouchEvents(page);
    await expect(
      page.getByRole("button", { name: /copy text/i }).first()
    ).toBeVisible({ timeout: 15000 });

    await page.keyboard.press("Escape");
  });
});

test.describe("genuine mouse control (guards the #3099 Surface fix)", () => {
  // Plain desktop context — no touch anywhere. The guards must not neuter
  // the latch itself: a real cursor glide must still latch and tag <body>.
  test.use({ viewport: { width: 1366, height: 768 } });

  test("a genuine mouse glide with no touch still latches desktop capabilities", async ({
    page,
  }) => {
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href^="/waves/"]').first()).toBeVisible({
      timeout: 30000,
    });

    await page.mouse.move(100, 200);
    await page.mouse.move(400, 350, { steps: 4 });

    await expect
      .poll(() => bodyHasFinePointer(page), { timeout: 5000 })
      .toBe(true);
  });
});
