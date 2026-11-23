"use client";

import { useSyncExternalStore } from "react";
import { useE2eeContext } from "@/components/e2ee/E2eeContext";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";

const noopSubscribe = () => () => undefined;
const getNullSnapshot = () => null;

interface UseE2eeBackupResult {
  readonly manager: E2eeBackupManager | null;
  readonly snapshot: E2eeBackupSnapshot | null;
}

/** The encrypted history backup of the loaded engine (null until loaded). */
export function useE2eeBackup(): UseE2eeBackupResult {
  const { backup } = useE2eeContext();
  const snapshot = useSyncExternalStore(
    backup ? backup.subscribe : noopSubscribe,
    backup ? backup.getSnapshot : getNullSnapshot,
    getNullSnapshot
  );
  return { manager: backup, snapshot };
}

/**
 * Whether encrypted backup is off, for a hint such as the Devices & security
 * tab's dot. Reads the loaded engine's backup (nothing when encrypted
 * messages aren't running: no request, no storage) and re-renders only when
 * the answer changes, not on every backup progress update.
 */
export function useE2eeBackupOff(): boolean {
  const { backup } = useE2eeContext();
  return useSyncExternalStore(
    backup ? backup.subscribe : noopSubscribe,
    () => backup?.getSnapshot().phase === "off",
    () => false
  );
}
