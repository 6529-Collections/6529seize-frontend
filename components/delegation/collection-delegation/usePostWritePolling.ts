"use client";

import { useSyncExternalStore } from "react";

/** Re-read cadence while a write reaches the chain and the read RPC. */
const POST_WRITE_POLL_INTERVAL_MS = 5_000;
/** Longest a submitted write keeps reads polling before its receipt settles. */
const SUBMITTED_WRITE_POLL_WINDOW_MS = 180_000;
/** How long to keep re-reading after a write is confirmed. */
const CONFIRMED_WRITE_POLL_WINDOW_MS = 30_000;

// One store shared by every delegation screen: a write submitted or
// confirmed in any section (registration, collection forms, revocations,
// locks) keeps all delegation chain reads polling, even after the form that
// sent it has closed. Pending writes are keyed by transaction hash so a
// receipt ends that write's long window and leaves only the confirmed one.
let confirmedUntil = 0;
const pendingWrites = new Map<string, number>();
let stopTimer: ReturnType<typeof setTimeout> | undefined;
let lastPolling = false;
const listeners = new Set<() => void>();

function pollingDeadline(): number {
  let deadline = confirmedUntil;
  for (const until of pendingWrites.values()) {
    deadline = Math.max(deadline, until);
  }
  return deadline;
}

const isPolling = (): boolean => Date.now() < pollingDeadline();

function update(): void {
  const now = Date.now();
  for (const [hash, until] of pendingWrites) {
    if (until <= now) {
      pendingWrites.delete(hash);
    }
  }
  clearTimeout(stopTimer);
  stopTimer = undefined;
  const deadline = pollingDeadline();
  if (deadline > now) {
    stopTimer = setTimeout(update, deadline - now);
  }
  const polling = deadline > now;
  if (polling !== lastPolling) {
    lastPolling = polling;
    [...listeners].forEach((listener) => listener());
  }
}

/**
 * Keeps delegation reads polling for `windowMs` from now (the confirmed-write
 * window by default). A window that already ends later is not shortened.
 */
function notePostWriteActivity(
  windowMs: number = CONFIRMED_WRITE_POLL_WINDOW_MS
): void {
  confirmedUntil = Math.max(confirmedUntil, Date.now() + windowMs);
  update();
}

/** A write was submitted: poll until its receipt settles, at most 3 minutes. */
export function notePostWriteSubmitted(transactionHash: string): void {
  if (!pendingWrites.has(transactionHash)) {
    pendingWrites.set(
      transactionHash,
      Date.now() + SUBMITTED_WRITE_POLL_WINDOW_MS
    );
  }
  update();
}

/**
 * A submitted write's receipt settled. A confirmed write keeps the short
 * confirmed window so the screens catch up; a failed one stops right away.
 */
export function notePostWriteSettled(
  transactionHash: string,
  confirmed: boolean
): void {
  pendingWrites.delete(transactionHash);
  if (confirmed) {
    notePostWriteActivity(CONFIRMED_WRITE_POLL_WINDOW_MS);
  } else {
    update();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

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

/** @api Resets the shared store between tests. */
export function resetPostWritePollingForTests(): void {
  clearTimeout(stopTimer);
  stopTimer = undefined;
  confirmedUntil = 0;
  pendingWrites.clear();
  lastPolling = false;
}
