import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

async function swipeCompetition(page: Page, x: number, y: number) {
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 6; step++) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - step * 40 }],
      });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await touch.detach();
  }
}

export async function expectCompetitionScroll(
  page: Page,
  content: Locator,
  lastItem: Locator
) {
  await expect(lastItem).toBeAttached();
  await expect(lastItem).not.toBeInViewport();
  await expect
    .poll(() =>
      content.evaluate((element) => element.scrollHeight - element.clientHeight)
    )
    .toBeGreaterThan(100);
  const box = await content.boundingBox();
  if (!box) throw new Error("Competition scroll region is not rendered.");
  expect(box.y + box.height).toBeLessThanOrEqual(
    await page.evaluate(() => innerHeight + 1)
  );
  const browserName = page.context().browser()?.browserType().name();
  const touchScreen = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (browserName === "chromium" && touchScreen) {
    await swipeCompetition(page, box.x + box.width / 2, box.y + 300);
    await expect
      .poll(() => content.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(100);
  }
  if (browserName === "webkit") {
    // Playwright mobile WebKit has neither wheel nor swipe input. This extra
    // project proves scroll geometry; Chromium above exercises trusted touch.
    await content.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  } else {
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 100_000);
        return content.evaluate(
          (element) =>
            element.scrollHeight - element.clientHeight - element.scrollTop
        );
      })
      .toBeLessThanOrEqual(1);
  }
  await expect
    .poll(() => content.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(100);
  await expect(lastItem).toBeInViewport({ ratio: 1 });
}
