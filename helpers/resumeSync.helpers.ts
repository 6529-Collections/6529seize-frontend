// Coming back to a tab resyncs only when it may have missed something: the
// tab was hidden long enough, or the last resync is a while ago. Window focus
// alone (switching between windows) fires often and rarely misses updates,
// which the socket delivers anyway.
const RESUME_SYNC_MIN_HIDDEN_MS = 30_000;
const RESUME_SYNC_MIN_INTERVAL_MS = 60_000;

/**
 * Whether a focus, visibility or wake event should resync. `hiddenSince` is
 * when the tab was last hidden (null if it stayed visible); `lastSyncAt` is
 * when this data last synced, from any trigger.
 */
export function shouldResyncOnResume({
  now,
  hiddenSince,
  lastSyncAt,
}: {
  readonly now: number;
  readonly hiddenSince: number | null;
  readonly lastSyncAt: number;
}): boolean {
  const hiddenForMs = hiddenSince === null ? 0 : now - hiddenSince;
  return (
    hiddenForMs >= RESUME_SYNC_MIN_HIDDEN_MS ||
    now - lastSyncAt >= RESUME_SYNC_MIN_INTERVAL_MS
  );
}
