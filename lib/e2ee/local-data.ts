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

function deleteDatabase(factory: IDBFactory, name: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = factory.deleteDatabase(name);
    req.onsuccess = () => {
      resolve();
    };
    req.onerror = () => {
      reject(req.error ?? new Error("IndexedDB delete failed"));
    };
    // A tab running an older build may still hold a connection; the delete
    // stays queued and completes as soon as that tab closes it.
    req.onblocked = () => {
      resolve();
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
