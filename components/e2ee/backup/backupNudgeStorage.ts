"use client";

import { useSyncExternalStore } from "react";

const KEY_PREFIX = "6529:e2ee:backup-nudge:";
const CHANGE_EVENT = "6529:e2ee:backup-nudge-change";
const DAY_MS = 24 * 60 * 60 * 1000;
/** The first "remind me" waits a week, every later one a month. */
const FIRST_SNOOZE_MS = 7 * DAY_MS;
const LATER_SNOOZE_MS = 30 * DAY_MS;

export interface BackupNudgeState {
  /** Hidden until this time (ms); 0 when never snoozed. */
  readonly snoozedUntil: number;
  readonly snoozes: number;
}

const NONE: BackupNudgeState = { snoozedUntil: 0, snoozes: 0 };

// Read instead of storage only while it can't be used (private modes,
// quota), so a cleared storage still brings the reminder back.
const memory = new Map<string, string>();
let lastWriteFailed = false;

const keyFor = (profileId: string) => `${KEY_PREFIX}${profileId}`;

function readRaw(profileId: string): string {
  if (lastWriteFailed) {
    return memory.get(profileId) ?? "";
  }
  try {
    return globalThis.localStorage.getItem(keyFor(profileId)) ?? "";
  } catch {
    return memory.get(profileId) ?? "";
  }
}

function parse(raw: string): BackupNudgeState {
  if (!raw) {
    return NONE;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return NONE;
    }
    const { snoozedUntil, snoozes } = value as Partial<BackupNudgeState>;
    return {
      snoozedUntil: typeof snoozedUntil === "number" ? snoozedUntil : 0,
      snoozes: typeof snoozes === "number" ? snoozes : 0,
    };
  } catch {
    return NONE;
  }
}

/** How long the next "remind me" hides the reminder. */
export const nextSnoozeMs = (state: BackupNudgeState): number =>
  state.snoozes === 0 ? FIRST_SNOOZE_MS : LATER_SNOOZE_MS;

/**
 * Hides the backup reminder for this profile: 7 days the first time, then
 * 30. Clearing the site's data brings it back, which is when it matters.
 */
export function snoozeBackupNudge(profileId: string, now: number): void {
  const current = parse(readRaw(profileId));
  const next = JSON.stringify({
    snoozedUntil: now + nextSnoozeMs(current),
    snoozes: current.snoozes + 1,
  });
  memory.set(profileId, next);
  try {
    globalThis.localStorage.setItem(keyFor(profileId), next);
    lastWriteFailed = false;
  } catch {
    // The in-memory copy keeps it hidden for this tab.
    lastWriteFailed = true;
  }
  globalThis.dispatchEvent(new Event(CHANGE_EVENT));
}

const subscribe = (listener: () => void) => {
  globalThis.addEventListener(CHANGE_EVENT, listener);
  globalThis.addEventListener("storage", listener);
  return () => {
    globalThis.removeEventListener(CHANGE_EVENT, listener);
    globalThis.removeEventListener("storage", listener);
  };
};

/** The profile's reminder state, as stored text (stable for React). */
export function useBackupNudgeState(
  profileId: string | null
): BackupNudgeState {
  const raw = useSyncExternalStore(
    subscribe,
    () => (profileId ? readRaw(profileId) : ""),
    () => ""
  );
  return parse(raw);
}
