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
  options: ReplyCountReconciliationOptions,
  counts = new Map<string, number>()
): Promise<Map<string, number>> {
  if (counts.has(dropId)) {
    throw new Error("Reply ancestry contains a cycle");
  }
  const drop = await options.fetchDrop(dropId);
  if (drop.id !== dropId || drop.wave.id !== options.waveId) {
    throw new Error("Reply ancestor does not belong to the expected wave");
  }
  counts.set(drop.id, drop.replies_count ?? 0);
  const parentDropId = drop.reply_to?.drop_id;
  // Each response supplies the next parent, so ancestry remains sequential.
  return parentDropId === undefined
    ? counts
    : fetchAncestorCounts(parentDropId, options, counts);
}

async function fetchPendingCounts(
  dropIds: readonly string[],
  options: ReplyCountReconciliationOptions,
  isActive: () => boolean
): Promise<Map<string, number>> {
  // Independent paths run together, sharing one fresh read per ancestor.
  const requests = new Map<string, Promise<ApiDropV2View>>();
  const batchOptions = {
    ...options,
    fetchDrop: (dropId: string): Promise<ApiDropV2View> => {
      let request = requests.get(dropId);
      if (request === undefined) {
        request = options.fetchDrop(dropId);
        requests.set(dropId, request);
      }
      return request;
    },
  };
  const results = await Promise.all(
    dropIds.map(async (dropId) => {
      if (!isActive()) return new Map<string, number>();
      try {
        return await fetchAncestorCounts(dropId, batchOptions);
      } catch (error) {
        if (isActive()) options.onError(error);
        return new Map<string, number>();
      }
    })
  );
  const counts = new Map<string, number>();
  results.forEach((ancestorCounts) =>
    ancestorCounts.forEach((count, id) => counts.set(id, count))
  );
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
    const dropIds = [...pendingDropIds];
    pendingDropIds.clear();
    try {
      const counts = await fetchPendingCounts(dropIds, options, isActive);
      if (!isActive()) return;
      counts.forEach((count, id) => options.applyCount(id, count));
    } catch (error) {
      if (isActive()) options.onError(error);
    } finally {
      running = false;
      // Consume events received during this read in a fresh, subsequent batch.
      if (isActive() && pendingDropIds.size > 0) void drain();
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
