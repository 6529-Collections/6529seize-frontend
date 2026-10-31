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
