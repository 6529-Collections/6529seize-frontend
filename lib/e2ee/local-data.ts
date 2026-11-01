import {
  E2EE_BACKUP_DB_NAME,
  getDefaultBackupStateStore,
} from "./backup/state";
import type { BackupStateStore } from "./backup/state";
import { acquireE2eeEngineLock } from "./engine-lock";
import {
  E2EE_DB_NAME,
  type E2eeStorage,
  getDefaultE2eeStorage,
  isIndexedDbAvailable,
} from "./storage";

/**
 * "Remove encrypted messages from this browser". Decrypted message text,
 * attachment keys, the outbox and the MLS state live in IndexedDB; these
 * delete them (and the encrypted-backup state) so nothing readable stays
 * behind after sign-out.
 */

interface RemoveProfileDeps {
  readonly storage?: E2eeStorage | undefined;
  readonly backupState?: BackupStateStore | undefined;
  readonly locks?: LockManager | null | undefined;
}

const noop = () => undefined;

/**
 * Deletes one profile's encrypted-messages data. Takes the profile's engine
 * lock first, so the tab that runs its engine stops before the delete and
 * cannot write the state back afterwards.
 */
export async function removeE2eeProfileLocalData(
  profileId: string,
  deps: RemoveProfileDeps = {}
): Promise<void> {
  const lease = await acquireE2eeEngineLock({
    profileId,
    takeOver: true,
    signal: new AbortController().signal,
    onBusy: noop,
    onLost: noop,
    locks: deps.locks,
  });
  try {
    const storage =
      deps.storage ?? (isIndexedDbAvailable() ? getDefaultE2eeStorage() : null);
    await storage?.clearProfile(profileId);
    await (deps.backupState ?? getDefaultBackupStateStore()).delete(profileId);
  } finally {
    lease.release();
  }
}

/** How long a delete may stay blocked by another tab before it counts as failed. */
const BLOCKED_DELETE_TIMEOUT_MS = 4000;

function deleteDatabase(factory: IDBFactory, name: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let blockedTimer: ReturnType<typeof setTimeout> | null = null;
    const settle = (finish: () => void) => {
      if (blockedTimer !== null) {
        clearTimeout(blockedTimer);
        blockedTimer = null;
      }
      finish();
    };
    const req = factory.deleteDatabase(name);
    req.onsuccess = () => {
      settle(resolve);
    };
    req.onerror = () => {
      settle(() => reject(req.error ?? new Error("IndexedDB delete failed")));
    };
    // A tab running an older build may still hold a connection. The delete
    // stays queued until that tab closes it, so only report success once it
    // actually completes; if it stays blocked, fail so sign-out never claims
    // the data is gone.
    req.onblocked = () => {
      blockedTimer ??= setTimeout(() => {
        blockedTimer = null;
        reject(new Error("IndexedDB delete blocked by another tab"));
      }, BLOCKED_DELETE_TIMEOUT_MS);
    };
  });
}

/** Deletes every profile's encrypted-messages databases in this browser. */
export async function removeAllE2eeLocalData(
  factory: IDBFactory | undefined = globalThis.indexedDB as
    | IDBFactory
    | undefined
): Promise<void> {
  if (!factory) {
    return;
  }
  await Promise.all([
    deleteDatabase(factory, E2EE_DB_NAME),
    deleteDatabase(factory, E2EE_BACKUP_DB_NAME),
  ]);
}
