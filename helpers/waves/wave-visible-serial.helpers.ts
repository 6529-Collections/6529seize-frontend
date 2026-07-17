/**
 * Capture "where the reader is" in a wave chat so a full page reload (e.g.
 * the new-version toast) can put them back, instead of dumping them at the
 * bottom of the feed.
 *
 * No new state is invented: drop rows carry `data-drop-serial-no`
 * (HighlightDropWrapper, set by DropsList) and `?serialNo=<n>` on a wave URL
 * is the long-standing deep-link contract — on load the app fetches around
 * that serial and scrolls it to viewport center (MyStreamWaveChat +
 * useWaveDropsSerialScroll), then cleans the param from the URL. This module
 * only bridges the two: read the centered row, write the param, reload.
 */

/**
 * Marks the wave chat's scroll container (WaveDropsReverseContainer). The
 * attribute is a contract: the element that carries it is a column-reverse
 * feed, so scrollTop is 0 at the bottom (newest message) and negative when
 * the reader scrolls up into history.
 */
export const WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE =
  "data-wave-drops-scroll-container";

/** Set on each drop row by HighlightDropWrapper via DropsList. */
export const DROP_SERIAL_ATTRIBUTE = "data-drop-serial-no";

export const WAVE_SERIAL_QUERY_PARAM = "serialNo";

// Within this distance of the newest message the reader is in "live" mode:
// the default post-reload behavior (bottom of the feed, following new drops)
// is what they want, so no position is pinned.
const AT_BOTTOM_EPSILON_PX = 48;

const getVisibleWaveScrollContainer = (): HTMLElement | null => {
  const doc = (globalThis as typeof globalThis & { document?: Document })
    .document;
  if (!doc) {
    return null;
  }
  // A drop side-panel can mount a second chat; the reading position worth
  // preserving is the dominant one on screen. Ties keep the first in
  // document order.
  let largest: HTMLElement | null = null;
  let largestArea = 0;
  for (const candidate of doc.querySelectorAll<HTMLElement>(
    `[${WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE}]`
  )) {
    const area = candidate.clientWidth * candidate.clientHeight;
    if (area > largestArea) {
      largestArea = area;
      largest = candidate;
    }
  }
  return largest;
};

const parseRowSerial = (row: Element): number | null => {
  const raw = row.getAttribute(DROP_SERIAL_ATTRIBUTE) ?? "";
  // Digits-only guarantees a finite integer, so no further numeric check.
  return /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : null;
};

/**
 * Serial of the drop nearest the scroll container's vertical center, or null
 * when there is nothing to preserve: no wave chat on screen, the reader is
 * at the bottom (live mode), or no identifiable row is in view. Center is
 * chosen because the restore path scrolls the target to center — capture and
 * restore are symmetric.
 */
export const captureVisibleWaveDropSerial = (): number | null => {
  const container = getVisibleWaveScrollContainer();
  if (!container) {
    return null;
  }
  // Column-reverse contract (see the container attribute doc): |scrollTop|
  // is the distance scrolled up from the newest message.
  if (Math.abs(container.scrollTop) <= AT_BOTTOM_EPSILON_PX) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const containerCenterY = containerRect.top + containerRect.height / 2;

  let bestSerial: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const row of container.querySelectorAll(
    `[${DROP_SERIAL_ATTRIBUTE}]`
  )) {
    const serial = parseRowSerial(row);
    if (serial === null) {
      continue;
    }
    const rect = row.getBoundingClientRect();
    if (rect.bottom <= containerRect.top || rect.top >= containerRect.bottom) {
      continue;
    }
    const distance = Math.abs((rect.top + rect.bottom) / 2 - containerCenterY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSerial = serial;
    }
  }
  return bestSerial;
};

/**
 * Before a full reload, pin the reader's current wave position into the URL
 * via history.replaceState so the deep-link restore path picks it up. A
 * no-op when there is no position worth preserving — and never throws, so
 * the caller's reload always proceeds.
 */
export const preserveWaveScrollPositionForReload = (): void => {
  try {
    const serial = captureVisibleWaveDropSerial();
    if (serial === null) {
      return;
    }
    const url = new URL(globalThis.location.href);
    url.searchParams.set(WAVE_SERIAL_QUERY_PARAM, String(serial));
    globalThis.history.replaceState(globalThis.history.state, "", url);
  } catch {
    // Position preservation is best-effort; the reload must never be blocked.
  }
};
