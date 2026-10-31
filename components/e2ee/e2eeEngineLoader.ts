import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { E2eeBackupManager } from "@/lib/e2ee/backup";
import type {
  E2eeEngine,
  E2eeEngineDeps,
  E2eeEngineOptions,
} from "@/lib/e2ee/types";

/** What the provider hands the engine: its deps plus the conflict hook. */
export type E2eeEngineHostDeps = E2eeEngineDeps &
  Pick<E2eeEngineOptions, "onStateConflict">;

export interface E2eeEngineModules {
  readonly createE2eeEngine: (deps: E2eeEngineHostDeps) => Promise<E2eeEngine>;
  readonly createE2eeApiClient: () => E2eeApiClient;
  /** Starts encrypted history backups for a loaded engine (optional). */
  readonly startE2eeBackup?: (
    engine: E2eeEngine,
    profileId: string
  ) => E2eeBackupManager | null;
}

export type LoadE2eeEngineModules = () => Promise<E2eeEngineModules>;

/**
 * Loads the engine and its REST client on demand. Both are dynamic imports so
 * the engine (and, through it, the MLS WebAssembly module) never enters the
 * main bundle; this runs only when the flag is on and the user opens an
 * encrypted route or this browser already enrolled a device.
 */
export const loadE2eeEngineModules: LoadE2eeEngineModules = async () => {
  const [engineModule, apiModule, backupModule] = await Promise.all([
    import("@/lib/e2ee/engine"),
    import("@/lib/e2ee/api"),
    import("@/lib/e2ee/backup"),
  ]);
  return {
    createE2eeEngine: engineModule.createE2eeEngine,
    createE2eeApiClient: apiModule.createE2eeApiClient,
    startE2eeBackup: backupModule.startE2eeBackup,
  };
};
