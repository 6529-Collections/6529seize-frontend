import { publicEnv } from "@/config/env";

/**
 * Gap-only chat sync (WAVES-PLAN 0.7 and 0.8), staged behind a build flag:
 * the realtime updater trusts a connected socket, fetches the newest drops
 * only on a gap signal or a trailing check after a burst, and batches the
 * read marker it sends for the open wave.
 */
export const isChatGapSyncEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_CHAT_GAP_SYNC === "true";
