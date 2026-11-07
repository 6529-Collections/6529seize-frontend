import type { Page } from "@playwright/test";

import { DEFAULT_LONG_PRESS_DURATION_MS } from "../../hooks/useLongPressInteraction";
import { expect, test } from "../testHelpers";
import {
  findTouchMessage,
  longPressTouchMessage,
  tapTouchMessage,
} from "./waveTouchTarget";

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

/** Find one anonymously readable wave with a hydrated long-pressable message. */
async function openWaveWithRows(page: Page) {
  await page.goto("/waves", { waitUntil: "domcontentloaded" });
  const waveLinks = page.locator('a[href^="/waves/"]');
  await expect(waveLinks.first()).toBeVisible({ timeout: 30000 });
  // Wave content varies per environment; anonymously-readable waves with
  // message rows exist on both production and staging, but a specific wave's
  // rows are not guaranteed — walk the first few listed waves until one
  // yields long-pressable rows instead of pinning the pack to a single wave.
  const candidates = (
    await waveLinks.evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href))
    )
  )
    .filter((href, index, all) => all.indexOf(href) === index)
    .slice(0, 5);
  for (const href of candidates) {
    await page.goto(href, { waitUntil: "domcontentloaded" });
    // Wait for a hydrated row. The class exists on desktop too, so the
    // classification and visible action sheet must still be asserted below.
    try {
      return await findTouchMessage(page);
    } catch {
      // next candidate
    }
  }
  throw new Error(
    `none of the first ${candidates.length} anonymously-listed waves rendered long-pressable rows`
  );
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
    // Wave discovery may walk up to five candidates (30s listing + 20s per
    // candidate ≈ 130s worst case), which exceeds the project's default test
    // timeout — raise it so the helper's descriptive error surfaces instead
    // of a generic timeout.
    test.setTimeout(180_000);
    const row = await openWaveWithRows(page);
    const waveUrl = page.url();

    // The Win 8 sequence, three times over: a real (trusted) touch tap, then
    // trusted mouse moves milliseconds later. Chromium's own touch pipeline
    // additionally emits compatibility mouse events after each tap — exactly
    // like the legacy OS — and none of it may latch. Element-relative tap()
    // follows replacements between rounds. Hit-test neutral row padding so
    // the input sequence cannot activate the author avatar or a message link.
    for (let round = 0; round < 3; round++) {
      await tapTouchMessage(row);
      await expect(page).toHaveURL(waveUrl);
      await page.mouse.move(200 + round * 50, 300, { steps: 3 });
    }

    expect(await bodyHasFinePointer(page)).toBe(false);

    // The touch affordance must still be alive: long-press opens the sheet.
    // Assert on the action button itself — the HeadlessUI dialog wrapper is
    // a zero-size positioning shell that Playwright's visibility heuristic
    // reports as hidden even while its content is on screen.
    await longPressTouchMessage(row, DEFAULT_LONG_PRESS_DURATION_MS + 600);
    await expect(page).toHaveURL(waveUrl);
    const copyTextAction = page
      .getByRole("button", { name: /copy text/i })
      .first();
    await expect(copyTextAction).toBeVisible({ timeout: 15000 });

    // Read-only hygiene: verify the sheet actually closed again.
    await page.keyboard.press("Escape");
    await expect(copyTextAction).toBeHidden({ timeout: 10000 });
  });
});

test.describe("Touch target harness", () => {
  test.use({ hasTouch: true });

  /** Match the row/header/content geometry that exposed the live regression. */
  async function installRows(page: Page) {
    await page.setContent(`
      <main>
        <article data-serial-no="1" class="touch-select-none"
          style="position:relative;width:300px;height:100px">
          <a href="#author" aria-label="Author profile"
            style="position:absolute;left:8px;top:4px;width:48px;height:48px">Author</a>
          <div style="margin-left:64px;padding-top:12px">Message one</div>
        </article>
      </main>
      <output role="status"></output>
      <script>
        document.addEventListener('touchstart', (event) => {
          if (event.isTrusted) {
            const row = event.target.closest('[data-serial-no]');
            if (row) document.querySelector('output').textContent = row.dataset.serialNo;
          }
        });
      </script>
    `);
  }

  test("tap follows a message replaced between removal and insertion", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    await row.evaluate((element) => {
      const replacement = element.cloneNode(true);
      const parent = element.parentElement;
      element.remove();
      setTimeout(() => parent?.appendChild(replacement), 50);
    });
    await tapTouchMessage(row);
    await expect(page.getByRole("status")).toHaveText("1");
  });

  test("tap stays on the selected message when a newer row arrives", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    await row.evaluate((element) => {
      const newer = element.cloneNode(true) as HTMLElement;
      newer.dataset["serialNo"] = "2";
      element.after(newer);
    });
    await tapTouchMessage(row);
    await expect(page.getByRole("status")).toHaveText("1");
  });

  test("tap reacquires the message when scrolling replaces its row", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    await row.evaluate((element) => {
      element.setAttribute(
        "style",
        "margin-top:1500px;width:300px;height:100px"
      );
      document.addEventListener(
        "scroll",
        () => {
          const replacement = element.cloneNode(true);
          replacement.textContent = "Replacement message";
          element.replaceWith(replacement);
        },
        { once: true, capture: true }
      );
    });
    await tapTouchMessage(row);
    await expect(row).toHaveText("Replacement message");
    await expect(page.getByRole("status")).toHaveText("1");
  });

  test("trusted taps avoid the author link in the message header", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    // Confirm that the previous coordinates really activate the header link.
    await row.tap({ position: { x: 10, y: 8 } });
    await expect(page).toHaveURL(/#author$/u);
    await page.goto("about:blank");
    await installRows(page);
    const correctedRow = await findTouchMessage(page);
    for (let round = 0; round < 3; round++) await tapTouchMessage(correctedRow);
    await expect(page).toHaveURL("about:blank");
    await expect(page.getByRole("status")).toHaveText("1");
  });

  test("tap refuses a replacement inserted after safe-position selection", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    await row.evaluate((element) => {
      const hitTest = document.elementFromPoint.bind(document);
      document.elementFromPoint = (x, y) => {
        const hit = hitTest(x, y);
        if (hit && element.contains(hit) && !hit.closest("a")) {
          document.elementFromPoint = hitTest;
          // Run after the helper returns its safe offset, but before its
          // separate trusted input call can start. The same serial now has
          // entirely different interactive geometry.
          queueMicrotask(() => {
            const replacement = element.cloneNode(true) as HTMLElement;
            replacement
              .querySelector("a")
              ?.setAttribute(
                "style",
                "position:absolute;inset:0;width:100%;height:100%"
              );
            element.replaceWith(replacement);
            const status = document.querySelector("output");
            if (status) status.textContent = "replaced";
          });
        }
        return hit;
      };
    });
    await expect(tapTouchMessage(row)).rejects.toThrow(/not attached/u);
    await expect(page.getByRole("status")).toHaveText("replaced");
    await expect(page).toHaveURL("about:blank");
  });

  test("long press ends on its original node when a newer row arrives", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    await row.evaluate((element) => {
      const status = document.querySelector("output");
      element.addEventListener("touchstart", () => {
        const newer = element.cloneNode(true) as HTMLElement;
        newer.dataset["serialNo"] = "2";
        element.after(newer);
      });
      element.addEventListener("touchend", (event) => {
        if (status) status.textContent = String(event.target === element);
      });
    });
    await longPressTouchMessage(row, 30);
    await expect(page.getByRole("status")).toHaveText("true");
  });

  test("tap refuses a message fully covered by an interactive link", async ({
    page,
  }) => {
    await installRows(page);
    const row = await findTouchMessage(page);
    await page
      .getByRole("link", { name: "Author profile" })
      .evaluate((link) => {
        link.setAttribute(
          "style",
          "position:absolute;inset:0;width:100%;height:100%"
        );
      });
    await expect(tapTouchMessage(row)).rejects.toThrow(
      "Message has no visible non-interactive padding to tap"
    );
    await expect(page).toHaveURL("about:blank");
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

    // Two-sided guard: nothing may have latched from page load alone.
    expect(await bodyHasFinePointer(page)).toBe(false);

    await page.mouse.move(100, 200);
    await page.mouse.move(400, 350, { steps: 4 });

    await expect
      .poll(() => bodyHasFinePointer(page), { timeout: 5000 })
      .toBe(true);
  });
});
