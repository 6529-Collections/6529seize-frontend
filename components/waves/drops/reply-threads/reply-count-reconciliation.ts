import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";

interface ReplyCountReconciliationOptions {
  readonly waveId: string;
  readonly fetchDrop: (dropId: string) => Promise<ApiDropV2View>;
  readonly applyCount: (dropId: string, count: number) => void;
  readonly onError: (error: unknown) => void;
}

/** Refresh every ancestor: the server counts nested replies in each thread. */
async function fetchAncestorCounts(
  dropId: string,
  { waveId, fetchDrop }: ReplyCountReconciliationOptions
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  let nextDropId: string | undefined = dropId;
  while (nextDropId !== undefined) {
    if (counts.has(nextDropId)) {
      throw new Error("Reply ancestry contains a cycle");
    }
    const drop = await fetchDrop(nextDropId);
    if (drop.id !== nextDropId || drop.wave.id !== waveId) {
      throw new Error("Reply ancestor does not belong to the expected wave");
    }
    counts.set(drop.id, drop.replies_count ?? 0);
    nextDropId = drop.reply_to?.drop_id;
  }
  return counts;
}

async function fetchPendingCounts(
  dropIds: readonly string[],
  options: ReplyCountReconciliationOptions,
  isActive: () => boolean
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const dropId of dropIds) {
    if (!isActive()) break;
    try {
      const ancestorCounts = await fetchAncestorCounts(dropId, options);
      ancestorCounts.forEach((count, id) => counts.set(id, count));
    } catch (error) {
      if (isActive()) options.onError(error);
    }
  }
  return counts;
}

/**
 * Serialize refreshes and coalesce pending events. Counts come from the API,
 * so duplicate events, edits and delayed messages cannot add phantom replies.
 */
export function createReplyCountReconciliation(
  options: ReplyCountReconciliationOptions
) {
  const pendingDropIds = new Set<string>();
  let active = true;
  let running = false;
  const isActive = (): boolean => active;

  const drain = async (): Promise<void> => {
    running = true;
    try {
      while (isActive() && pendingDropIds.size > 0) {
        const dropIds = [...pendingDropIds];
        pendingDropIds.clear();
        const counts = await fetchPendingCounts(dropIds, options, isActive);
        if (!isActive()) return;
        counts.forEach((count, id) => options.applyCount(id, count));
      }
    } finally {
      running = false;
    }
  };

  return {
    request: (dropId: string): void => {
      if (!isActive()) return;
      pendingDropIds.add(dropId);
      if (!running) void drain();
    },
    dispose: (): void => {
      active = false;
      pendingDropIds.clear();
    },
  };
}
