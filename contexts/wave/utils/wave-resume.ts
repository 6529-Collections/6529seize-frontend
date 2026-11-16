import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { Drop } from "@/helpers/waves/drop.helpers";
import type { WaveHistoryGap } from "@/contexts/wave/hooks/types";

/** Protect edits received in flight. All writes still pass through the store's
 * tombstone filter, which also rejects deletions of IDs absent from this snapshot. */
export function reconcileWaveSnapshot(
  fetched: readonly ApiDrop[],
  before: readonly Drop[],
  current: readonly Drop[]
): ApiDrop[] {
  const beforeById = new Map(before.map((drop) => [drop.id, drop]));
  const currentById = new Map(current.map((drop) => [drop.id, drop]));
  return fetched.filter((drop) => {
    const previous = beforeById.get(drop.id);
    const live = currentById.get(drop.id);
    return previous === live;
  });
}

export function addWaveHistoryGap(
  gaps: readonly WaveHistoryGap[],
  nextGap: WaveHistoryGap
): WaveHistoryGap[] {
  const sorted = [...gaps, nextGap].sort((a, b) => a.newerThan - b.newerThan);
  const merged: WaveHistoryGap[] = [];
  for (const gap of sorted) {
    const previous = merged.at(-1);
    if (previous && gap.newerThan <= previous.olderThan) {
      merged[merged.length - 1] = {
        newerThan: previous.newerThan,
        olderThan: Math.max(previous.olderThan, gap.olderThan),
      };
    } else {
      merged.push(gap);
    }
  }
  return merged;
}

/**
 * Returns the history gaps after placing a window of drops fetched around a
 * target serial (a shared link, a quoted drop, a reply parent).
 *
 * The window is usually far from the drops already loaded. Rather than loading
 * every drop in between, the unloaded range on each side becomes a history
 * gap, which the chat fills page by page when the reader scrolls toward it.
 * A window that overlaps loaded drops is already connected and adds no gap.
 */
export function getTargetWindowHistoryGaps({
  currentDrops,
  currentGaps,
  windowDrops,
}: {
  readonly currentDrops: readonly Pick<Drop, "serial_no">[];
  readonly currentGaps: readonly WaveHistoryGap[];
  readonly windowDrops: readonly Pick<ApiDrop, "serial_no">[];
}): readonly WaveHistoryGap[] {
  if (windowDrops.length === 0) {
    return currentGaps;
  }
  const windowSerials = windowDrops.map((drop) => drop.serial_no);
  const oldest = Math.min(...windowSerials);
  const newest = Math.max(...windowSerials);

  // The window is loaded now, so no gap may cover it. Split any that did.
  const gaps: WaveHistoryGap[] = currentGaps.flatMap((gap) => {
    if (gap.olderThan <= oldest || gap.newerThan >= newest) {
      return [gap];
    }
    const pieces: WaveHistoryGap[] = [];
    if (gap.newerThan < oldest) {
      pieces.push({ newerThan: gap.newerThan, olderThan: oldest });
    }
    if (gap.olderThan > newest) {
      pieces.push({ newerThan: newest, olderThan: gap.olderThan });
    }
    return pieces;
  });

  let nearestNewer: number | null = null;
  let nearestOlder: number | null = null;
  for (const { serial_no: serialNo } of currentDrops) {
    if (serialNo >= oldest && serialNo <= newest) {
      // Connected to drops already loaded.
      return gaps;
    }
    if (
      serialNo > newest &&
      (nearestNewer === null || serialNo < nearestNewer)
    ) {
      nearestNewer = serialNo;
    }
    if (
      serialNo < oldest &&
      (nearestOlder === null || serialNo > nearestOlder)
    ) {
      nearestOlder = serialNo;
    }
  }

  // A split gap already covers its side of the window.
  if (nearestNewer !== null && !gaps.some((gap) => gap.newerThan === newest)) {
    gaps.push({ newerThan: newest, olderThan: nearestNewer });
  }
  if (nearestOlder !== null && !gaps.some((gap) => gap.olderThan === oldest)) {
    gaps.push({ newerThan: nearestOlder, olderThan: oldest });
  }
  return gaps.sort((a, b) => a.newerThan - b.newerThan);
}
