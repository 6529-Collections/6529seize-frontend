import { MemoryE2eeStorage } from "./storage-memory";
import { nextVersion } from "./storage-version";
import { backfillHistory } from "./storage-upgrade";
import {
  historyKey,
  isUnread,
  type HistoryPageOptions,
  type HistorySummary,
} from "./history-order";
import type { ImportedPayload } from "./imported-payload";
import { randomBytes, toArrayBuffer, utf8Encode } from "./bytes";
import type {
  StoredDevice,
  StoredGroup,
  StoredMessage,
  StoredOutboxItem,
} from "./records";

export { isE2eeStateConflict } from "./storage-version";

/**
 * Contract 8.7 local storage. One IndexedDB database per origin; every record
 * is keyed by profile id. The WASM state blob is encrypted with a
 * non-extractable AES-GCM CryptoKey that itself lives in IndexedDB.
 */

/**
 * Another engine (another tab) wrote this profile's state after this engine
 * loaded it, or the state was cleared. Writing would put older state over
 * newer state, so the write is refused and the engine must stop.
 */
/** Writes applied atomically (one IndexedDB transaction). */
export interface E2eeStorageBatch {
  /**
   * Compare-and-swap on the persisted state version. When set, the batch is
   * applied only if the stored version equals it, and the version becomes
   * `expectedVersion + 1`; otherwise it throws E2eeStateConflictError and
   * nothing is written. Unset (sign-in key adoption) skips the check and
   * keeps the version.
   */
  expectedVersion?: number;
  device?: StoredDevice;
  wasmState?: Uint8Array;
  /** Drop the stored WASM (MLS) state; ignored with `wasmState`. */
  dropWasmState?: boolean;
  groups?: StoredGroup[];
  deleteGroups?: string[];
  messages?: StoredMessage[];
  deleteMessages?: { g: string; id: string }[];
  outbox?: StoredOutboxItem[];
  deleteOutbox?: string[];
}

export interface E2eeStorage {
  readonly kind: "indexeddb" | "memory";
  /**
   * Atomic checkpoint: the WASM state and the cursors/messages derived from
   * it land together, so a crash never splits them (8.7).
   */
  writeBatch(profileId: string, batch: E2eeStorageBatch): Promise<void>;
  getDevice(profileId: string): Promise<StoredDevice | null>;
  getWasmState(profileId: string): Promise<Uint8Array | null>;
  /**
   * Monotonic version of the persisted engine state (0 when never written).
   * An engine reads it before its state and writes with it as
   * `expectedVersion`, so a stale tab can never overwrite newer state.
   */
  getStateVersion(profileId: string): Promise<number>;
  listGroups(profileId: string): Promise<StoredGroup[]>;
  listMessages(profileId: string, g: string): Promise<StoredMessage[]>;
  getMessage(
    profileId: string,
    g: string,
    id: string
  ): Promise<StoredMessage | null>;
  pageMessages(
    profileId: string,
    g: string,
    options?: HistoryPageOptions
  ): Promise<StoredMessage[]>;
  findImported(
    profileId: string,
    g: string,
    imp: ImportedPayload
  ): Promise<StoredMessage[]>;
  historySummary(
    profileId: string,
    g: string,
    readSeq: number
  ): Promise<HistorySummary>;

  listOutbox(profileId: string): Promise<StoredOutboxItem[]>;
  /**
   * Deletes the profile's records. The state version survives and goes up by
   * one, so an engine that loaded the old state cannot write it back. With
   * `expectedVersion`, the clear is a compare-and-swap like writeBatch.
   */
  clearProfile(profileId: string, expectedVersion?: number): Promise<void>;
}

/** In-memory storage for tests and browsers without IndexedDB. */
export const createMemoryE2eeStorage = (): E2eeStorage =>
  new MemoryE2eeStorage();

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

export const E2EE_DB_NAME = "6529-e2ee";
const DB_VERSION = 3;
const S_DEVICES = "devices";
const S_WASM = "wasm";
const S_KEYS = "keys";
const S_GROUPS = "groups";
const S_MESSAGES = "messages";
const S_OUTBOX = "outbox";
const IDX_PROFILE = "profile";
const IDX_ORDER = "history-order";
const IDX_IMPORT = "import-source";
const IDX_LAST = "last-message";
const IDX_UNREAD = "unread-seq";
const IDX_MENTION = "mention-seq";

function indexedMessage(profileId: string, message: StoredMessage) {
  const unread = isUnread(message, profileId, -1);
  return {
    ...message,
    profileId,
    historyOrder: historyKey(message),
    ...(message.kind === "message" ? { lastOrder: historyKey(message) } : {}),
    ...(message.imported
      ? {
          importSource: [
            message.imported.w,
            message.imported.d,
            message.imported.p,
          ],
        }
      : {}),
    ...(unread ? { unreadSeq: message.seq } : {}),
    ...(unread && message.mentions.includes(profileId)
      ? { mentionSeq: message.seq }
      : {}),
  };
}
const ALL_STORES = [S_DEVICES, S_WASM, S_KEYS, S_GROUPS, S_MESSAGES, S_OUTBOX];

/**
 * The sealed WASM state plus its version. A cleared profile keeps a record
 * with only the version (no key material), so the counter never goes back.
 * Records written before versioning read as version 0.
 */
interface WasmRecord {
  profileId: string;
  version?: number;
  iv?: Uint8Array;
  ciphertext?: ArrayBuffer;
}

interface SealedState {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

interface KeyRecord {
  profileId: string;
  key: CryptoKey;
}

type WithProfile<T> = T & { profileId: string };

const request = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error("IndexedDB request failed"));
    };
  });

const done = (tx: IDBTransaction): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    };
  });

function createStore(
  db: IDBDatabase,
  name: string,
  keyPath: string | string[],
  indexes: [string, string | string[]][]
): void {
  if (db.objectStoreNames.contains(name)) {
    return;
  }
  const store = db.createObjectStore(name, { keyPath });
  for (const [indexName, indexPath] of indexes) {
    store.createIndex(indexName, indexPath);
  }
}

function upgrade(
  db: IDBDatabase,
  tx: IDBTransaction,
  oldVersion: number
): void {
  createStore(db, S_DEVICES, "profileId", []);
  createStore(db, S_WASM, "profileId", []);
  createStore(db, S_KEYS, "profileId", []);
  createStore(db, S_GROUPS, ["profileId", "g"], [[IDX_PROFILE, "profileId"]]);
  createStore(db, S_MESSAGES, ["profileId", "g", "id"], []);
  createStore(db, S_OUTBOX, ["profileId", "id"], [[IDX_PROFILE, "profileId"]]);
  const messages = tx.objectStore(S_MESSAGES);
  // The primary key already supports profile/group prefix ranges. Duplicate
  // index keys make large Chromium writes and upgrades disproportionately slow.
  for (const name of ["group", IDX_PROFILE]) {
    if (messages.indexNames.contains(name)) messages.deleteIndex(name);
  }
  if (oldVersion >= 2) return;
  // Populate indexes after the rewrite to avoid index updates per put.
  // Both steps remain in the same atomic versionchange transaction.
  backfillHistory(
    messages,
    tx.objectStore(S_GROUPS),
    indexedMessage,
    (row) => strip(row),
    () => {
      const indexes: [string, string | string[]][] = [
        [IDX_ORDER, ["profileId", "g", "historyOrder"]],
        [IDX_LAST, ["profileId", "g", "lastOrder"]],
        [IDX_IMPORT, ["profileId", "g", "importSource"]],
        [IDX_UNREAD, ["profileId", "g", "unreadSeq"]],
        [IDX_MENTION, ["profileId", "g", "mentionSeq"]],
      ];
      for (const [name, path] of indexes) {
        if (!messages.indexNames.contains(name))
          messages.createIndex(name, path);
      }
    }
  );
}

export const isIndexedDbAvailable = (): boolean =>
  typeof globalThis.indexedDB !== "undefined";

function openDatabase(
  factory: IDBFactory,
  onClosed: () => void
): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = factory.open(E2EE_DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      upgrade(req.result, req.transaction!, event.oldVersion);
    };
    req.onsuccess = () => {
      const db = req.result;
      // "Remove encrypted messages from this browser" deletes the database:
      // close when asked, and reopen on next use.
      db.onversionchange = () => {
        db.close();
        onClosed();
      };
      resolve(db);
    };
    req.onerror = () => {
      reject(req.error ?? new Error("IndexedDB open failed"));
    };
    req.onblocked = () => {
      reject(new Error("IndexedDB open blocked"));
    };
  });
}

const strip = <T extends object>(record: WithProfile<T>): T => {
  const {
    profileId: _profileId,
    historyOrder: _order,
    lastOrder: _last,
    importSource: _source,
    unreadSeq: _unread,
    mentionSeq: _mention,
    ...rest
  } = record as WithProfile<T> & {
    historyOrder?: unknown;
    lastOrder?: unknown;
    importSource?: unknown;
    unreadSeq?: unknown;
    mentionSeq?: unknown;
  };
  return rest as unknown as T;
};

const profileRange = (profileId: string): IDBKeyRange =>
  IDBKeyRange.only(profileId);

const messageRange = (profileId: string, g?: string): IDBKeyRange => {
  const prefix = g === undefined ? [profileId] : [profileId, g];
  return IDBKeyRange.bound(prefix, [...prefix, []]);
};

function deleteByIndex(
  tx: IDBTransaction,
  storeName: string,
  indexName: string | null,
  range: IDBKeyRange
): void {
  const store = tx.objectStore(storeName);
  const source = indexName === null ? store : store.index(indexName);
  const cursorRequest = source.openKeyCursor(range);
  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (cursor) {
      store.delete(cursor.primaryKey);
      cursor.continue();
    }
  };
}

function applyBatch(
  tx: IDBTransaction,
  profileId: string,
  batch: E2eeStorageBatch,
  wasmRecord: WasmRecord
): void {
  if (batch.device) {
    tx.objectStore(S_DEVICES).put(batch.device);
  }
  tx.objectStore(S_WASM).put(wasmRecord);
  for (const g of batch.deleteGroups ?? []) {
    tx.objectStore(S_GROUPS).delete([profileId, g]);
    deleteByIndex(tx, S_MESSAGES, null, messageRange(profileId, g));
  }
  for (const group of batch.groups ?? []) {
    tx.objectStore(S_GROUPS).put({ ...group, profileId });
  }
  for (const item of batch.deleteMessages ?? []) {
    tx.objectStore(S_MESSAGES).delete([profileId, item.g, item.id]);
  }
  for (const message of batch.messages ?? []) {
    tx.objectStore(S_MESSAGES).put(indexedMessage(profileId, message));
  }
  for (const id of batch.deleteOutbox ?? []) {
    tx.objectStore(S_OUTBOX).delete([profileId, id]);
  }
  for (const item of batch.outbox ?? []) {
    tx.objectStore(S_OUTBOX).put({ ...item, profileId });
  }
}

const versionOf = (record: WasmRecord | undefined): number =>
  record?.version ?? 0;

/**
 * One readwrite transaction that first reads the profile's state record,
 * then writes. `next` computes the new record and throws on a version
 * conflict, which aborts the transaction before anything is written.
 */
async function versionedWrite(
  db: IDBDatabase,
  profileId: string,
  next: (stored: WasmRecord | undefined) => WasmRecord,
  apply: (tx: IDBTransaction, record: WasmRecord) => void
): Promise<void> {
  const tx = db.transaction(ALL_STORES, "readwrite");
  const finished = done(tx);
  // Set by the read callback when `next` refuses the write.
  let conflict = null as Error | null;
  const read = tx.objectStore(S_WASM).get(profileId) as IDBRequest<
    WasmRecord | undefined
  >;
  read.onsuccess = () => {
    let record: WasmRecord;
    try {
      record = next(read.result);
    } catch (error) {
      conflict = error as Error;
      tx.abort();
      return;
    }
    apply(tx, record);
  };
  try {
    await finished;
  } catch (error) {
    throw conflict ?? error;
  }
}

class IndexedDbE2eeStorage implements E2eeStorage {
  readonly kind = "indexeddb" as const;
  private readonly factory: IDBFactory;
  private connection: Promise<IDBDatabase> | null = null;
  private readonly keys = new Map<string, Promise<CryptoKey>>();

  constructor(factory: IDBFactory) {
    this.factory = factory;
  }

  /** Opens on first use, and again after a failed open or a delete. */
  private open(): Promise<IDBDatabase> {
    if (!this.connection) {
      const opening = openDatabase(this.factory, () => {
        if (this.connection === opening) {
          this.connection = null;
        }
        // The keys went with the database; never seal with a stale one.
        this.keys.clear();
      });
      opening.catch(() => {
        if (this.connection === opening) {
          this.connection = null;
        }
      });
      this.connection = opening;
    }
    return this.connection;
  }

  private async read<T>(
    store: string,
    run: (os: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const db = await this.open();
    const tx = db.transaction(store, "readonly");
    return (await request(run(tx.objectStore(store)))) as T;
  }

  private stateKey(profileId: string): Promise<CryptoKey> {
    let key = this.keys.get(profileId);
    if (!key) {
      key = this.loadOrCreateKey(profileId);
      this.keys.set(profileId, key);
      key.catch(() => {
        this.keys.delete(profileId);
      });
    }
    return key;
  }

  private async loadOrCreateKey(profileId: string): Promise<CryptoKey> {
    const existing = await this.read<KeyRecord | undefined>(S_KEYS, (os) =>
      os.get(profileId)
    );
    if (existing) {
      return existing.key;
    }
    const key = await globalThis.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    const db = await this.open();
    const tx = db.transaction(S_KEYS, "readwrite");
    const finished = done(tx);
    tx.objectStore(S_KEYS).put({ profileId, key } satisfies KeyRecord);
    await finished;
    return key;
  }

  private async sealState(
    profileId: string,
    state: Uint8Array
  ): Promise<SealedState> {
    const key = await this.stateKey(profileId);
    const iv = randomBytes(12);
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(utf8Encode(profileId)),
      },
      key,
      toArrayBuffer(state)
    );
    return { iv, ciphertext };
  }

  async writeBatch(profileId: string, batch: E2eeStorageBatch): Promise<void> {
    // Encrypt first: a transaction must not span non-IndexedDB awaits.
    const sealed = batch.wasmState
      ? await this.sealState(profileId, batch.wasmState)
      : null;
    const db = await this.open();
    await versionedWrite(
      db,
      profileId,
      (stored) => ({
        // Without new state, dropWasmState keeps only the version.
        ...(batch.dropWasmState && !sealed ? {} : stored),
        ...sealed,
        profileId,
        version: nextVersion(versionOf(stored), batch.expectedVersion, false),
      }),
      (tx, record) => {
        applyBatch(tx, profileId, batch, record);
      }
    );
  }

  async getDevice(profileId: string): Promise<StoredDevice | null> {
    const record = await this.read<WithProfile<StoredDevice> | undefined>(
      S_DEVICES,
      (os) => os.get(profileId)
    );
    return record ?? null;
  }

  async getWasmState(profileId: string): Promise<Uint8Array | null> {
    const record = await this.read<WasmRecord | undefined>(S_WASM, (os) =>
      os.get(profileId)
    );
    if (!record?.iv || !record.ciphertext) {
      return null;
    }
    const key = await this.stateKey(profileId);
    const plaintext = await globalThis.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(record.iv),
        additionalData: toArrayBuffer(utf8Encode(profileId)),
      },
      key,
      record.ciphertext
    );
    return new Uint8Array(plaintext);
  }

  async getStateVersion(profileId: string): Promise<number> {
    const record = await this.read<WasmRecord | undefined>(S_WASM, (os) =>
      os.get(profileId)
    );
    return versionOf(record);
  }

  async listGroups(profileId: string): Promise<StoredGroup[]> {
    const rows = await this.read<WithProfile<StoredGroup>[]>(S_GROUPS, (os) =>
      os.index(IDX_PROFILE).getAll(profileRange(profileId))
    );
    return rows.map((row) => strip(row));
  }

  async listMessages(profileId: string, g: string): Promise<StoredMessage[]> {
    const rows = await this.read<WithProfile<StoredMessage>[]>(
      S_MESSAGES,
      (os) => os.getAll(messageRange(profileId, g))
    );
    return rows.map((row) => strip(row));
  }

  async getMessage(
    profileId: string,
    g: string,
    id: string
  ): Promise<StoredMessage | null> {
    const row = await this.read<WithProfile<StoredMessage> | undefined>(
      S_MESSAGES,
      (os) => os.get([profileId, g, id])
    );
    return row ? strip(row) : null;
  }

  private async cursorMessages(
    index: string,
    range: IDBKeyRange,
    direction: IDBCursorDirection,
    limit: number
  ): Promise<StoredMessage[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const result: StoredMessage[] = [];
      const req = db
        .transaction(S_MESSAGES, "readonly")
        .objectStore(S_MESSAGES)
        .index(index)
        .openCursor(range, direction);
      req.onerror = () => reject(req.error ?? new Error("History read failed"));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve(result);
          return;
        }
        result.push(strip(cursor.value as WithProfile<StoredMessage>));
        if (result.length >= limit) resolve(result);
        else cursor.continue();
      };
    });
  }

  async pageMessages(
    profileId: string,
    g: string,
    options: HistoryPageOptions = {}
  ): Promise<StoredMessage[]> {
    const lower = options.after
      ? [profileId, g, options.after]
      : [profileId, g];
    const upper = options.before
      ? [profileId, g, options.before]
      : [profileId, g, [2]];
    const range = IDBKeyRange.bound(
      lower,
      upper,
      Boolean(options.after),
      Boolean(options.before)
    );
    const rows = await this.cursorMessages(
      IDX_ORDER,
      range,
      options.after ? "next" : "prev",
      Math.min(200, Math.max(1, options.limit ?? 100))
    );
    return options.after ? rows : rows.reverse();
  }

  async findImported(
    profileId: string,
    g: string,
    imp: ImportedPayload
  ): Promise<StoredMessage[]> {
    const rows = await this.cursorMessages(
      IDX_IMPORT,
      IDBKeyRange.only([profileId, g, [imp.w, imp.d, imp.p]]),
      "next",
      Number.MAX_SAFE_INTEGER
    );
    return rows.filter((message) => !message.deleted);
  }

  async historySummary(
    profileId: string,
    g: string,
    readSeq: number
  ): Promise<HistorySummary> {
    const unreadRange = IDBKeyRange.bound(
      [profileId, g, readSeq],
      [profileId, g, []],
      true
    );
    const [last, newest, count, unread, mentions] = await Promise.all([
      this.cursorMessages(
        IDX_LAST,
        IDBKeyRange.bound([profileId, g], [profileId, g, [1]]),
        "prev",
        1
      ),
      this.cursorMessages(
        IDX_ORDER,
        IDBKeyRange.bound([profileId, g], [profileId, g, [1]]),
        "prev",
        1
      ),
      this.read<number>(S_MESSAGES, (os) =>
        os.count(messageRange(profileId, g))
      ),
      this.read<number>(S_MESSAGES, (os) =>
        os.index(IDX_UNREAD).count(unreadRange)
      ),
      this.read<number>(S_MESSAGES, (os) =>
        os.index(IDX_MENTION).count(unreadRange)
      ),
    ]);
    // Pending messages sort last; sequenced max is stored separately by the engine cursor.
    return {
      last: last[0] ?? null,
      tail: newest[0] ?? null,
      count,
      unread,
      mentions,
      maxSeq: newest[0]?.pending ? 0 : (newest[0]?.seq ?? 0),
    };
  }

  async listOutbox(profileId: string): Promise<StoredOutboxItem[]> {
    const rows = await this.read<WithProfile<StoredOutboxItem>[]>(
      S_OUTBOX,
      (os) => os.index(IDX_PROFILE).getAll(profileRange(profileId))
    );
    return rows.map((row) => strip(row));
  }

  async clearProfile(
    profileId: string,
    expectedVersion?: number
  ): Promise<void> {
    const db = await this.open();
    await versionedWrite(
      db,
      profileId,
      (stored) => ({
        profileId,
        version: nextVersion(versionOf(stored), expectedVersion, true),
      }),
      (tx, record) => {
        tx.objectStore(S_DEVICES).delete(profileId);
        // Version only: no key material survives the clear.
        tx.objectStore(S_WASM).put(record);
        tx.objectStore(S_KEYS).delete(profileId);
        deleteByIndex(tx, S_MESSAGES, null, messageRange(profileId));
        for (const name of [S_GROUPS, S_OUTBOX]) {
          deleteByIndex(tx, name, IDX_PROFILE, profileRange(profileId));
        }
      }
    );
    this.keys.delete(profileId);
  }
}

export function createIndexedDbE2eeStorage(
  factory: IDBFactory = globalThis.indexedDB
): E2eeStorage {
  return new IndexedDbE2eeStorage(factory);
}

let sharedStorage: E2eeStorage | null = null;

/** The per-origin IndexedDB storage, opened once. */
export function getDefaultE2eeStorage(): E2eeStorage {
  sharedStorage ??= createIndexedDbE2eeStorage();
  return sharedStorage;
}

/**
 * Lightweight check the UI can run before loading the engine: does this
 * browser hold an enrolled device for the profile? (Contract 12 loading rule.)
 */
export async function hasStoredE2eeDevice(profileId: string): Promise<boolean> {
  if (!isIndexedDbAvailable()) {
    return false;
  }
  try {
    const device = await getDefaultE2eeStorage().getDevice(profileId);
    return device?.registered === true;
  } catch {
    return false;
  }
}
