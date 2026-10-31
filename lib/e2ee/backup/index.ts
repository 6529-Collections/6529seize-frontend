import { createE2eeBackupApiClient } from "./api";
import { type BackupEngine, E2eeBackupManager } from "./manager";
import { getDefaultBackupStateStore } from "./state";

export type {
  E2eeBackupSnapshot,
  PreparedBackup,
  RestoreResult,
} from "./manager";
export { E2eeBackupManager } from "./manager";

const isBackupEngine = (engine: object): engine is BackupEngine =>
  "backupHistory" in engine && "importBackupHistory" in engine;

/**
 * Starts encrypted history backups for a loaded engine (the provider calls
 * this through the dynamic engine loader). Null when the engine has no
 * backup support.
 */
export function startE2eeBackup(
  engine: object,
  profileId: string
): E2eeBackupManager | null {
  if (!isBackupEngine(engine)) {
    return null;
  }
  const manager = new E2eeBackupManager({
    profileId,
    engine,
    api: createE2eeBackupApiClient(),
    state: getDefaultBackupStateStore(),
  });
  void manager.start().catch(() => undefined);
  return manager;
}
