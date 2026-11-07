import type { Locator } from "@playwright/test";
import { expect } from "../testHelpers";

/**
 * Chat windowing (WAVES-PLAN 0.11). Sandbox packs build with
 * NEXT_PUBLIC_FEATURE_CHAT_WINDOWING on (tests/support/composerSandboxServer.cjs);
 * a run with the variable set to "false" covers the reversed chat, where
 * every loaded row stays in the DOM.
 *
 * With windowing on, only rows near the viewport are mounted. A row far
 * from the viewport is not in the DOM until the chat scrolls to it, so a
 * locator for it must scroll the chat first; `scrollIntoViewIfNeeded` alone
 * waits for an element that never mounts.
 */
export const CHAT_WINDOWING =
  process.env["NEXT_PUBLIC_FEATURE_CHAT_WINDOWING"] !== "false";

/**
 * With windowing on, scrolls the chat's scroller (the element carrying
 * `data-wave-drops-scroll-container`) toward older or newer rows until
 * `target` is in the DOM. Does nothing with windowing off, where every
 * loaded row is mounted, or when the row already is.
 */
export async function revealChatRow(
  scroller: Locator,
  target: Locator,
  direction: "older" | "newer",
  { timeout = 15000 }: { readonly timeout?: number } = {}
): Promise<void> {
  if (!CHAT_WINDOWING) return;
  let older = direction === "older";
  await expect(async () => {
    if ((await target.count()) > 0) return;
    // The windowed chat is in normal order: a smaller scrollTop is older.
    const moved = await scroller.evaluate((element, towardOlder) => {
      const before = element.scrollTop;
      element.scrollTop += (towardOlder ? -0.8 : 0.8) * element.clientHeight;
      return element.scrollTop !== before;
    }, older);
    // History can load on the other side of the reader (a gap filling in
    // below the oldest loaded post): turn around at either end.
    if (!moved) older = !older;
    throw new Error("The chat row is not mounted yet.");
  }).toPass({ timeout, intervals: [150] });
}

/** Distance in pixels between the chat's viewport and its newest message. */
export function chatDistanceFromNewest(scroller: Locator): Promise<number> {
  return scroller.evaluate((element) =>
    element.getAttribute("data-wave-drops-scroll-container") === "end-anchored"
      ? Math.max(
          0,
          element.scrollHeight - element.clientHeight - element.scrollTop
        )
      : Math.abs(element.scrollTop)
  );
}

/**
 * The chat is at its newest message: scrollTop 0 in the reversed chat, the
 * end of the scroll range in the windowed one.
 */
export async function expectChatAtNewest(scroller: Locator): Promise<void> {
  if (CHAT_WINDOWING) {
    await expect
      .poll(() => chatDistanceFromNewest(scroller))
      .toBeLessThanOrEqual(1);
    return;
  }
  await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBe(0);
}

/** Drop rows mounted in the chat right now. */
export function countMountedChatRows(scroller: Locator): Promise<number> {
  return scroller.evaluate(
    (element) => element.querySelectorAll("[data-drop-serial-no]").length
  );
}
