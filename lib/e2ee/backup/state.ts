/**
 * Local backup state per profile. Lives in its own IndexedDB database so it
 * never touches the engine's schema. The chunk key is a non-extractable
 * CryptoKey; the raw backup key and the recovery code are never stored.
 */
export interface BackupLocalState {
  profileId: string;
  /** The enrolled device this state belongs to (a re-enrolled device drops it). */
  deviceKey: string;
  backupId: string;
  chunkKey: CryptoKey;
  /** False until the server made this generation the active one. */
  activated: boolean;
  createdAt: number;
  lastBackupAt: number | null;
  /** Compaction in progress: delete chunks <= this seq once re-uploaded. */
  compactThroughSeq: number | null;
  /** Fingerprints of what this device already uploaded. */
  groupPrints: Record<string, string>;
  messagePrints: Record<string, string>;
}

export interface BackupStateStore {
  get(profileId: string): Promise<BackupLocalState | null>;
  put(state: BackupLocalState): Promise<void>;
  delete(profileId: string): Promise<void>;
}

class MemoryBackupStateStore implements BackupStateStore {
  private readonly states = new Map<string, BackupLocalState>();

  get(profileId: string): Promise<BackupLocalState | null> {
    const state = this.states.get(profileId);
    return Promise.resolve(
      state
        ? {
            ...state,
            groupPrints: { ...state.groupPrints },
            messagePrints: { ...state.messagePrints },
          }
        : null
    );
  }

  put(state: BackupLocalState): Promise<void> {
    this.states.set(state.profileId, {
      ...state,
      groupPrints: { ...state.groupPrints },
      messagePrints: { ...state.messagePrints },
    });
    return Promise.resolve();
  }

  delete(profileId: string): Promise<void> {
    this.states.delete(profileId);
    return Promise.resolve();
  }
}

export const createMemoryBackupStateStore = (): BackupStateStore =>
  new MemoryBackupStateStore();

const DB_NAME = "6529-e2ee-backup";
const DB_VERSION = 1;
const STORE = "state";

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error("IndexedDB request failed"));
    };
  });
}

function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "profileId" });
      }
    };
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error("IndexedDB open failed"));
    };
    req.onblocked = () => {
      reject(new Error("IndexedDB open blocked"));
    };
  });
}

class IndexedDbBackupStateStore implements BackupStateStore {
  private readonly db: Promise<IDBDatabase>;

  constructor(factory: IDBFactory) {
    this.db = openDb(factory);
  }

  private async run<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.db;
    return promisify(fn(db.transaction(STORE, mode).objectStore(STORE)));
  }

  async get(profileId: string): Promise<BackupLocalState | null> {
    const state = await this.run<BackupLocalState | undefined>(
      "readonly",
      (store) =>
        store.get(profileId) as IDBRequest<BackupLocalState | undefined>
    );
    return state ?? null;
  }

  async put(state: BackupLocalState): Promise<void> {
    await this.run("readwrite", (store) => store.put(state));
  }

  async delete(profileId: string): Promise<void> {
    await this.run("readwrite", (store) => store.delete(profileId));
  }
}

let shared: BackupStateStore | null = null;

/** IndexedDB when available, otherwise memory (state then lasts a session). */
export function getDefaultBackupStateStore(): BackupStateStore {
  shared ??=
    typeof globalThis.indexedDB === "undefined"
      ? createMemoryBackupStateStore()
      : new IndexedDbBackupStateStore(globalThis.indexedDB);
  return shared;
}
