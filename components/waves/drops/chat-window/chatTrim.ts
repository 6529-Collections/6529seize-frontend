import type { WaveDropsTrim } from "@/contexts/wave/hooks/types";
import type { Drop } from "@/helpers/waves/drop.helpers";

/** Drops a wave keeps loaded in the windowed chat. */
export const CHAT_RESIDENT_CAP = 500;
/** Trimming waits until the wave holds this many more than the cap. */
export const CHAT_RESIDENT_SLACK = 50;
/** The newest drops always stay, so the live end never reloads. */
const CHAT_LIVE_KEEP = 50;

interface ChatTrimLimits {
  readonly cap: number;
  readonly slack: number;
  readonly liveKeep: number;
}

const DEFAULT_LIMITS: ChatTrimLimits = {
  cap: CHAT_RESIDENT_CAP,
  slack: CHAT_RESIDENT_SLACK,
  liveKeep: CHAT_LIVE_KEEP,
};

const isPendingSend = (drop: Drop) => drop.id.startsWith("temp-");

/**
 * Which drops to release so the wave holds at most `cap`, keeping the ones
 * the reader is looking at.
 *
 * - Reader among the newest `cap` drops: the oldest ones go; paging brings
 *   them back.
 * - Reader deeper in history: the window of drops around the reader and the
 *   newest `liveKeep` stay. Older drops go to paging, and the drops between
 *   the window and the newest go behind a history gap.
 *
 * Pinned drops (the jump target, the unread divider's row, the focused row)
 * and pending sends are never released. The kept window grows to include
 * them, so what stays is contiguous apart from the one gap.
 *
 * @param orderedDrops Oldest first, as the windowed list shows them.
 * @param readerRange Indices into `orderedDrops` of the first and last drop
 * in view.
 */
export function planChatTrim({
  orderedDrops,
  readerRange,
  pinnedSerials,
  limits = DEFAULT_LIMITS,
}: {
  readonly orderedDrops: readonly Drop[];
  readonly readerRange: { readonly first: number; readonly last: number };
  readonly pinnedSerials: ReadonlySet<number>;
  readonly limits?: ChatTrimLimits | undefined;
}): WaveDropsTrim | null {
  const count = orderedDrops.length;
  const { cap, slack, liveKeep } = limits;
  if (count <= cap + slack) {
    return null;
  }
  const isKept = (drop: Drop) =>
    pinnedSerials.has(drop.serial_no) || isPendingSend(drop);
  const liveStart = Math.max(0, count - liveKeep);
  const center = Math.floor((readerRange.first + readerRange.last) / 2);

  let windowStart: number;
  let windowEnd: number;
  if (center >= count - cap) {
    windowStart = count - cap;
    windowEnd = count;
  } else {
    const windowSize = Math.max(0, cap - liveKeep);
    windowEnd = Math.min(
      liveStart,
      Math.max(center + Math.ceil(windowSize / 2), windowSize)
    );
    windowStart = Math.max(0, windowEnd - windowSize);
  }

  // Grow the window over pinned drops so no hole opens around them.
  for (let index = 0; index < windowStart; index++) {
    if (isKept(orderedDrops[index]!)) {
      windowStart = index;
      break;
    }
  }
  for (let index = liveStart - 1; index >= windowEnd; index--) {
    if (isKept(orderedDrops[index]!)) {
      windowEnd = index + 1;
      break;
    }
  }

  const older = orderedDrops.slice(0, windowStart);
  const between =
    windowEnd < liveStart ? orderedDrops.slice(windowEnd, liveStart) : [];
  const released = [...older, ...between];
  if (released.length === 0) {
    return null;
  }
  const lastKeptBefore = orderedDrops[windowEnd - 1];
  const firstKeptAfter = orderedDrops[liveStart];
  return {
    dropIds: released.map((drop) => drop.id),
    releasesOlderHistory: older.length > 0,
    historyGap:
      between.length > 0 && lastKeptBefore && firstKeptAfter
        ? {
            newerThan: lastKeptBefore.serial_no,
            olderThan: firstKeptAfter.serial_no,
          }
        : null,
  };
}
