"use client";

import { useSyncExternalStore } from "react";

/** Re-read cadence while a write reaches the chain and the read RPC. */
const POST_WRITE_POLL_INTERVAL_MS = 5_000;
/** How long to keep re-reading after a write is submitted (until it is mined). */
export const SUBMITTED_WRITE_POLL_WINDOW_MS = 180_000;
/** How long to keep re-reading after a write is confirmed. */
export const CONFIRMED_WRITE_POLL_WINDOW_MS = 30_000;

// One window shared by every delegation screen: a write submitted or
// confirmed in any section (registration, collection forms, revocations,
// locks) keeps all delegation chain reads polling, even after the form that
// sent it has closed.
let pollUntil = 0;
let stopTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Keeps delegation reads polling for `windowMs` from now. A window that
 * already ends later is not shortened.
 */
export function notePostWriteActivity(
  windowMs: number = CONFIRMED_WRITE_POLL_WINDOW_MS
): void {
  const until = Date.now() + windowMs;
  if (until <= pollUntil) {
    return;
  }
  const wasPolling = Date.now() < pollUntil;
  pollUntil = until;
  clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    pollUntil = 0;
    notify();
  }, windowMs);
  if (!wasPolling) {
    notify();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const isPolling = (): boolean => Date.now() < pollUntil;

/**
 * Chain reads are fetched once (and again when the tab is shown); they only
 * poll while a delegation write is pending or was just confirmed, so the
 * screen catches up with the new state and then stops.
 *
 * Pass `refetchInterval` to the read queries. `startPostWritePolling` starts
 * the confirmed-write window.
 */
export function usePostWritePolling() {
  const polling = useSyncExternalStore(subscribe, isPolling, () => false);
  return {
    refetchInterval: polling ? POST_WRITE_POLL_INTERVAL_MS : false,
    startPostWritePolling: notePostWriteActivity,
  } as const;
}

/** @api Resets the shared window between tests. */
export function resetPostWritePollingForTests(): void {
  clearTimeout(stopTimer);
  stopTimer = undefined;
  pollUntil = 0;
}
