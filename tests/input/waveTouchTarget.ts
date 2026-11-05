import { expect, type Locator, type Page } from "@playwright/test";

/** Select once; subsequent actions follow the message across DOM replacements. */
export async function findTouchMessage(page: Page): Promise<Locator> {
  const candidate = page
    .getByRole("main")
    .locator("[data-serial-no].touch-select-none")
    .last();
  await expect(candidate).toBeVisible({ timeout: 20000 });
  const serialNo = await candidate.getAttribute("data-serial-no");
  expect(serialNo).toMatch(/^\d+$/u);
  return page
    .getByRole("main")
    .locator(`[data-serial-no="${serialNo}"].touch-select-none`);
}

/** Tap neutral row padding, never an author link, embedded control, or quote. */
export async function tapTouchMessage(row: Locator) {
  await row.tap({ trial: true, position: { x: 1, y: 1 } });
  const position = await row.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const xs = [rect.width - 2, rect.width / 2, 1];
    const ys = [rect.height - 2, rect.height / 2, 1];
    const interactive =
      'a, button, input, textarea, select, summary, [role="button"], [contenteditable="true"]';
    const controls = Array.from(
      element.querySelectorAll("a, button, input, textarea, select, summary")
    ).map((control) => control.getBoundingClientRect());
    // Chromium can adjust a finger tap onto a nearby link even when the exact
    // point hits padding. Keep clearance, not just an elementFromPoint check.
    const nearControl = (x: number, y: number) =>
      controls.some(
        (control) =>
          x >= control.left - 24 &&
          x <= control.right + 24 &&
          y >= control.top - 24 &&
          y <= control.bottom + 24
      );
    for (const x of xs) {
      for (const y of ys) {
        const hit = document.elementFromPoint(rect.left + x, rect.top + y);
        if (
          hit &&
          element.contains(hit) &&
          hit.closest("[data-serial-no]") === element &&
          !hit.closest(interactive) &&
          !nearControl(rect.left + x, rect.top + y)
        ) {
          return { x, y };
        }
      }
    }
    throw new Error("Message has no visible non-interactive padding to tap");
  });
  await row.tap({ position });
}

/** Pair synthetic hold events on one node; trusted taps are tested separately. */
export async function longPressTouchMessage(row: Locator, durationMs: number) {
  // Let Playwright scroll and reacquire a replaced row before starting a gesture.
  await row.tap({ trial: true, position: { x: 10, y: 8 } });
  await row.evaluate(async (element, duration) => {
    const rect = element.getBoundingClientRect();
    const touch = new Touch({
      identifier: 1,
      target: element,
      clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2,
    });
    element.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch],
      })
    );
    try {
      await new Promise((resolve) => setTimeout(resolve, duration));
    } finally {
      // Never reselect `.last()` mid-gesture: touchend belongs to its start node,
      // even if a new message arrives or the original node has been removed.
      element.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: [touch],
        })
      );
    }
  }, durationMs);
}
