/**
 * Minimal in-memory IndexedDB (just the surface lib/e2ee/storage.ts uses):
 * open + upgrade, object stores with key paths and indexes, readwrite
 * transactions that commit after their last request (or abort before any
 * write), get/put/delete, index getAll and key cursors,
 * IDBKeyRange.only/bound, deleteDatabase with versionchange.
 */

type Key = string | number | Key[];

const compareKeys = (a: Key, b: Key): number => {
  const rank = (k: Key) =>
    Array.isArray(k) ? 2 : typeof k === "string" ? 1 : 0;
  if (rank(a) !== rank(b)) {
    return rank(a) - rank(b);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
      const diff = compareKeys(a[i]!, b[i]!);
      if (diff !== 0) {
        return diff;
      }
    }
    return a.length - b.length;
  }
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};

export class FakeKeyRange {
  constructor(
    readonly lower: Key,
    readonly upper: Key
  ) {}

  static only(value: Key): FakeKeyRange {
    return new FakeKeyRange(value, value);
  }

  static bound(lower: Key, upper: Key): FakeKeyRange {
    return new FakeKeyRange(lower, upper);
  }

  includes(key: Key): boolean {
    return (
      compareKeys(this.lower, key) <= 0 && compareKeys(key, this.upper) <= 0
    );
  }
}

const extract = (
  value: Record<string, unknown>,
  path: string | string[]
): Key =>
  Array.isArray(path) ? path.map((p) => value[p] as Key) : (value[path] as Key);

const serialize = (key: Key): string => JSON.stringify(key);

interface StoreData {
  keyPath: string | string[];
  indexes: Map<string, string | string[]>;
  rows: Map<string, { key: Key; value: unknown }>;
}

class FakeRequest<T> {
  result!: T;
  error: Error | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class FakeTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  error: Error | null = null;
  private pending = 0;
  private scheduled = false;
  private aborted = false;

  constructor(
    private readonly db: FakeDatabase,
    private readonly names: string[]
  ) {
    this.scheduleCommit();
  }

  objectStore(name: string): FakeObjectStore {
    if (!this.names.includes(name)) {
      throw new Error(`store ${name} not in transaction`);
    }
    return new FakeObjectStore(this, this.db.store(name));
  }

  /** Callers abort before their first write, so nothing to roll back. */
  abort(): void {
    this.aborted = true;
    setTimeout(() => {
      this.onabort?.();
    }, 0);
  }

  run<T>(work: () => T): FakeRequest<T> {
    const request = new FakeRequest<T>();
    this.pending += 1;
    setTimeout(() => {
      if (this.aborted) {
        this.pending -= 1;
        return;
      }
      try {
        request.result = work();
        request.onsuccess?.();
      } catch (error) {
        request.error = error as Error;
        request.onerror?.();
      }
      this.pending -= 1;
      this.scheduleCommit();
    }, 0);
    return request;
  }

  private scheduleCommit(): void {
    if (this.scheduled) {
      return;
    }
    this.scheduled = true;
    setTimeout(() => {
      this.scheduled = false;
      if (this.aborted) {
        return;
      }
      if (this.pending === 0) {
        this.oncomplete?.();
      } else {
        this.scheduleCommit();
      }
    }, 1);
  }
}

class FakeIndex {
  constructor(
    private readonly tx: FakeTransaction,
    private readonly data: StoreData,
    private readonly path: string | string[]
  ) {}

  private matching(range: FakeKeyRange): { key: Key; value: unknown }[] {
    return [...this.data.rows.values()]
      .filter((row) =>
        range.includes(extract(row.value as Record<string, unknown>, this.path))
      )
      .sort((x, y) => compareKeys(x.key, y.key));
  }

  getAll(range: FakeKeyRange): FakeRequest<unknown[]> {
    return this.tx.run(() =>
      this.matching(range).map((row) => structuredClone(row.value))
    );
  }

  openKeyCursor(range: FakeKeyRange): FakeRequest<FakeCursor | null> {
    const rows = this.matching(range);
    const request = new FakeRequest<FakeCursor | null>();
    let position = 0;
    const advance = () => {
      const inner = this.tx.run<FakeCursor | null>(() => {
        const row = rows[position];
        if (!row) {
          return null;
        }
        return {
          primaryKey: row.key,
          continue: () => {
            position += 1;
            advance();
          },
        };
      });
      inner.onsuccess = () => {
        request.result = inner.result;
        request.onsuccess?.();
      };
    };
    advance();
    return request;
  }
}

interface FakeCursor {
  primaryKey: Key;
  continue(): void;
}

class FakeObjectStore {
  constructor(
    private readonly tx: FakeTransaction,
    private readonly data: StoreData
  ) {}

  createIndex(name: string, path: string | string[]): void {
    this.data.indexes.set(name, path);
  }

  index(name: string): FakeIndex {
    const path = this.data.indexes.get(name);
    if (!path) {
      throw new Error(`no index ${name}`);
    }
    return new FakeIndex(this.tx, this.data, path);
  }

  put(value: Record<string, unknown>): FakeRequest<Key> {
    const key = extract(value, this.data.keyPath);
    const copy = cloneValue(value);
    return this.tx.run(() => {
      this.data.rows.set(serialize(key), { key, value: copy });
      return key;
    });
  }

  get(key: Key): FakeRequest<unknown> {
    return this.tx.run(() => {
      const row = this.data.rows.get(serialize(key));
      return row ? cloneValue(row.value as Record<string, unknown>) : undefined;
    });
  }

  delete(key: Key | FakeKeyRange): FakeRequest<undefined> {
    return this.tx.run(() => {
      if (key instanceof FakeKeyRange) {
        for (const [id, row] of [...this.data.rows]) {
          if (key.includes(row.key)) {
            this.data.rows.delete(id);
          }
        }
      } else {
        this.data.rows.delete(serialize(key));
      }
      return undefined;
    });
  }
}

/** CryptoKey is not structured-cloneable everywhere: keep it by reference. */
function cloneValue(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(value)) {
    out[key] = field instanceof CryptoKey ? field : structuredClone(field);
  }
  return out;
}

class FakeDatabase {
  readonly stores = new Map<string, StoreData>();
  onversionchange: (() => void) | null = null;
  closed = false;

  close(): void {
    this.closed = true;
  }
  readonly objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };

  store(name: string): StoreData {
    const data = this.stores.get(name);
    if (!data) {
      throw new Error(`no store ${name}`);
    }
    return data;
  }

  createObjectStore(
    name: string,
    options: { keyPath: string | string[] }
  ): FakeObjectStore {
    const data: StoreData = {
      keyPath: options.keyPath,
      indexes: new Map(),
      rows: new Map(),
    };
    this.stores.set(name, data);
    return new FakeObjectStore(new FakeTransaction(this, [name]), data);
  }

  transaction(names: string | string[]): FakeTransaction {
    return new FakeTransaction(this, Array.isArray(names) ? names : [names]);
  }
}

export function createFakeIndexedDb(): {
  factory: IDBFactory;
  install(): () => void;
  has(name: string): boolean;
} {
  const databases = new Map<string, FakeDatabase>();
  const factory = {
    open(name: string) {
      const request =
        new FakeRequest<FakeDatabase>() as FakeRequest<FakeDatabase> & {
          onupgradeneeded: (() => void) | null;
          onblocked: (() => void) | null;
        };
      request.onupgradeneeded = null;
      request.onblocked = null;
      setTimeout(() => {
        let db = databases.get(name);
        const fresh = !db;
        db ??= new FakeDatabase();
        databases.set(name, db);
        request.result = db;
        if (fresh) {
          request.onupgradeneeded?.();
        }
        request.onsuccess?.();
      }, 0);
      return request;
    },
    deleteDatabase(name: string) {
      const request = new FakeRequest<undefined>();
      setTimeout(() => {
        databases.get(name)?.onversionchange?.();
        databases.delete(name);
        request.onsuccess?.();
      }, 0);
      return request;
    },
  } as unknown as IDBFactory;
  return {
    factory,
    has: (name: string) => databases.has(name),
    install() {
      const previous = (globalThis as { IDBKeyRange?: unknown }).IDBKeyRange;
      (globalThis as { IDBKeyRange?: unknown }).IDBKeyRange = FakeKeyRange;
      return () => {
        (globalThis as { IDBKeyRange?: unknown }).IDBKeyRange = previous;
      };
    },
  };
}
