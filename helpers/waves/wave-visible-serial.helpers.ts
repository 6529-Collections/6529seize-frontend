/**
 * Capture "where the reader is" in a wave chat so a full page reload (e.g.
 * the new-version toast) can put them back, instead of dumping them at the
 * bottom of the feed.
 *
 * No new state is invented: drop rows already carry `id="drop-<serial_no>"`
 * (components/drops/view/DropsList.tsx) and `?serialNo=<n>` on a wave URL is
 * the long-standing deep-link contract — on load the app fetches around that
 * serial and scrolls it to viewport center (MyStreamWaveChat +
 * useWaveDropsSerialScroll), then cleans the param from the URL. This module
 * only bridges the two: read the centered row, write the param, reload.
 */

/** Marks the wave chat's scroll container (WaveDropsReverseContainer). */
export const WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE =
  "data-wave-drops-scroll-container";

export const WAVE_SERIAL_QUERY_PARAM = "serialNo";

const DROP_ROW_ID_PREFIX = "drop-";

// Within this distance of the newest message the reader is in "live" mode:
// the default post-reload behavior (bottom of the feed, following new drops)
// is what they want, so no position is pinned.
const AT_BOTTOM_EPSILON_PX = 48;

const getDistanceFromBottom = (container: HTMLElement): number => {
  const scrollRange = Math.max(
    0,
    container.scrollHeight - container.clientHeight
  );
  // The wave feed scrolls in column-reverse (scrollTop 0 = bottom, negative
  // when scrolled up); read the inline style first like
  // useWaveDropsSerialScroll does, then fall back to computed style.
  const flexDirection =
    container.style.flexDirection ||
    globalThis.getComputedStyle?.(container).flexDirection;
  if (flexDirection === "column-reverse") {
    return Math.abs(container.scrollTop);
  }
  return scrollRange - container.scrollTop;
};

const getVisibleWaveScrollContainer = (): HTMLElement | null => {
  const doc = (globalThis as typeof globalThis & { document?: Document })
    .document;
  if (!doc) {
    return null;
  }
  const containers = [
    ...doc.querySelectorAll<HTMLElement>(
      `[${WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE}]`
    ),
  ].filter((container) => container.clientHeight > 0);
  if (containers.length === 0) {
    return null;
  }
  // A drop side-panel can mount a second chat; the reading position worth
  // preserving is the dominant one on screen.
  return containers.reduce((largest, candidate) =>
    candidate.clientWidth * candidate.clientHeight >
    largest.clientWidth * largest.clientHeight
      ? candidate
      : largest
  );
};

const parseRowSerial = (row: Element): number | null => {
  const raw = row.id.slice(DROP_ROW_ID_PREFIX.length);
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const serial = Number.parseInt(raw, 10);
  return Number.isFinite(serial) ? serial : null;
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
  if (getDistanceFromBottom(container) <= AT_BOTTOM_EPSILON_PX) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const containerCenterY = containerRect.top + containerRect.height / 2;

  let bestSerial: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const row of container.querySelectorAll(
    `[id^="${DROP_ROW_ID_PREFIX}"]`
  )) {
    const rect = row.getBoundingClientRect();
    if (rect.bottom <= containerRect.top || rect.top >= containerRect.bottom) {
      continue;
    }
    const distance = Math.abs((rect.top + rect.bottom) / 2 - containerCenterY);
    if (distance >= bestDistance) {
      continue;
    }
    const serial = parseRowSerial(row);
    if (serial === null) {
      continue;
    }
    bestDistance = distance;
    bestSerial = serial;
  }
  return bestSerial;
};

/**
 * Before a full reload, pin the reader's current wave position into the URL
 * via history.replaceState so the deep-link restore path picks it up. A
 * no-op when there is no position worth preserving.
 */
export const preserveWaveScrollPositionForReload = (): void => {
  const serial = captureVisibleWaveDropSerial();
  if (serial === null) {
    return;
  }
  const url = new URL(globalThis.location.href);
  url.searchParams.set(WAVE_SERIAL_QUERY_PARAM, String(serial));
  globalThis.history.replaceState(globalThis.history.state, "", url);
};
