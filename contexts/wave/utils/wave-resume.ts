import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { Drop } from "@/helpers/waves/drop.helpers";
import type { WaveHistoryGap } from "@/contexts/wave/hooks/types";

/** A response must not overwrite a live edit received while it was in flight. */
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
