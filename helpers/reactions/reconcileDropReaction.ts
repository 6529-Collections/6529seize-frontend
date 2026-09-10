import type { ApiDrop } from "@/generated/models/ApiDrop";
import { fetchDropByIdBatched } from "@/services/api/drop-api";

type ReactionReconciliation = {
  readonly outcome: "confirmed" | "unconfirmed" | "superseded";
  readonly drop: ApiDrop | null;
};

const READ_TIMEOUT_MS = 2_000;
const RETRY_DELAYS_MS = [0, 1_000, 2_000] as const;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => globalThis.setTimeout(resolve, ms));

// The batched fetch is shared with other readers, so bound our wait without
// cancelling their request. Late results have no cache-writing side effects.
export const readReactionDrop = async (
  dropId: string
): Promise<ApiDrop | null> => {
  let timeout: ReturnType<typeof globalThis.setTimeout> | undefined;
  try {
    const drop = await Promise.race([
      fetchDropByIdBatched(dropId),
      new Promise<null>((resolve) => {
        timeout = globalThis.setTimeout(() => resolve(null), READ_TIMEOUT_MS);
      }),
    ]);
    // Do not propagate a partial response into drop caches or chip rendering.
    return drop && Array.isArray(drop.reactions) ? drop : null;
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

export const reconcileDropReaction = async ({
  dropId,
  intendedReaction,
  isCurrent,
  isConfirmed = () => false,
}: {
  readonly dropId: string;
  readonly intendedReaction: string | null;
  readonly isCurrent: () => boolean;
  readonly isConfirmed?: () => boolean;
}): Promise<ReactionReconciliation> => {
  let latestDrop: ApiDrop | null = null;
  // At most three reads / nine seconds, including stalled reads. A mismatch
  // can be replica lag or an in-flight write, so it never proves write failure.
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) {
      await wait(delay);
    }
    if (!isCurrent()) {
      return { outcome: "superseded", drop: null };
    }
    if (isConfirmed()) {
      return { outcome: "confirmed", drop: null };
    }
    const drop = await readReactionDrop(dropId);
    if (!isCurrent()) {
      return { outcome: "superseded", drop: null };
    }
    // A matching websocket refetch is also authoritative. Do not replace it
    // with a slower, older replica read from this recovery attempt.
    if (isConfirmed()) {
      return { outcome: "confirmed", drop: null };
    }
    if (drop?.id !== dropId || !drop.context_profile_context) {
      continue;
    }
    latestDrop = drop;
    if (drop.context_profile_context.reaction === intendedReaction) {
      return { outcome: "confirmed", drop };
    }
  }
  return { outcome: "unconfirmed", drop: latestDrop };
};
