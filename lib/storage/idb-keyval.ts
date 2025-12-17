type StoreFn = <T>(
  txMode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | T
) => Promise<T>;

type RequestLike<T = unknown> = {
  result?: T;
  error?: unknown;
  onsuccess: ((this: any, ev: Event) => any) | null;
  onerror: ((this: any, ev: Event) => any) | null;
  oncomplete?: ((this: any, ev: Event) => any) | null;
  onabort?: ((this: any, ev: Event) => any) | null;
};

function extractErrorMessage(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const maybeMessage = (error as any)?.message ?? (error as any)?.error;
    if (maybeMessage) return String(maybeMessage);
    try {
      return JSON.stringify(error);
    } catch {
      return "[unstringifiable object]";
    }
  }
  if (typeof error === "number") return error.toString();
  if (typeof error === "boolean") return error.toString();
  if (typeof error === "bigint") return error.toString();
  if (typeof error === "symbol") return error.description ?? error.toString();
  if (typeof error === "function") {
    return error.name ? `[function ${error.name}]` : "[function]";
  }
  return "[unknown error]";
}

function extractErrorName(error: unknown): string {
  if (error == null) return "";
  if (error instanceof Error) return error.name;
  return (error as any)?.name ?? (error as any)?.constructor?.name ?? "";
}

function isDatabaseClosingError(error: unknown): boolean {
  const name = extractErrorName(error);
  const message = extractErrorMessage(error);

  return (
    name === "InvalidStateError" ||
    /database\s+connection\s+is\s+closing/i.test(message) ||
    /the\s+database\s+connection\s+is\s+closing/i.test(message) ||
    /connection\s+is\s+closing/i.test(message)
  );
}

export function promisifyRequest<T = unknown>(request: RequestLike<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result as T);
    request.onabort = request.onerror = () => reject(request.error);
  });
}

const dbPromiseCache = new Map<string, Promise<IDBDatabase>>();

function openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }

  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName);
    }
  };
  return promisifyRequest<IDBDatabase>(request as unknown as RequestLike<IDBDatabase>);
}

function getCacheKey(dbName: string, storeName: string): string {
  return `${dbName}::${storeName}`;
}

function getDbPromise(dbName: string, storeName: string): Promise<IDBDatabase> {
  const cacheKey = getCacheKey(dbName, storeName);
  const cached = dbPromiseCache.get(cacheKey);
  if (cached) return cached;

  const dbp = openDatabase(dbName, storeName)
    .then((db) => {
      const reset = () => {
        dbPromiseCache.delete(cacheKey);
      };

      try {
        db.addEventListener("close", reset);
      } catch {}

      try {
        db.addEventListener("versionchange", () => {
          reset();
          try {
            db.close();
          } catch {}
        });
      } catch {}

      return db;
    })
    .catch((error) => {
      dbPromiseCache.delete(cacheKey);
      throw error;
    });

  dbPromiseCache.set(cacheKey, dbp);
  return dbp;
}

function resetDbPromise(dbName: string, storeName: string): void {
  dbPromiseCache.delete(getCacheKey(dbName, storeName));
}

export function createStore(dbName: string, storeName: string): StoreFn {
  return async (txMode, callback) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const db = await getDbPromise(dbName, storeName);

      let store: IDBObjectStore;
      try {
        store = db.transaction(storeName, txMode).objectStore(storeName);
      } catch (error) {
        if (attempt === 0 && isDatabaseClosingError(error)) {
          resetDbPromise(dbName, storeName);
          continue;
        }
        throw error;
      }

      try {
        return await callback(store);
      } catch (error) {
        if (attempt === 0 && isDatabaseClosingError(error)) {
          resetDbPromise(dbName, storeName);
          continue;
        }
        throw error;
      }
    }

    throw new Error("IndexedDB operation failed after retry.");
  };
}

let defaultGetStoreFunc: StoreFn | undefined;

function defaultGetStore(): StoreFn {
  defaultGetStoreFunc ??= createStore("keyval-store", "keyval");
  return defaultGetStoreFunc;
}

export function get<T = unknown>(
  key: IDBValidKey,
  customStore?: StoreFn
): Promise<T | undefined> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readonly", (store) =>
    promisifyRequest<T>(store.get(key) as unknown as RequestLike<T>)
  );
}

export function set<T = unknown>(
  key: IDBValidKey,
  value: T,
  customStore?: StoreFn
): Promise<void> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readwrite", (store) => {
    store.put(value, key);
    return promisifyRequest<void>(
      store.transaction as unknown as RequestLike<void>
    );
  });
}

export function setMany(
  entries: Array<[IDBValidKey, unknown]>,
  customStore?: StoreFn
): Promise<void> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readwrite", (store) => {
    entries.forEach((entry) => store.put(entry[1], entry[0]));
    return promisifyRequest<void>(
      store.transaction as unknown as RequestLike<void>
    );
  });
}

export function getMany<T = unknown>(
  keys: IDBValidKey[],
  customStore?: StoreFn
): Promise<Array<T | undefined>> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readonly", (store) =>
    Promise.all(
      keys.map((key) =>
        promisifyRequest<T>(store.get(key) as unknown as RequestLike<T>)
      )
    )
  );
}

export function update<T = unknown>(
  key: IDBValidKey,
  updater: (oldValue: T | undefined) => T,
  customStore?: StoreFn
): Promise<void> {
  const useStore = customStore ?? defaultGetStore();
  return useStore(
    "readwrite",
    (store) =>
      new Promise((resolve, reject) => {
        let settled = false;
        const transaction = store.transaction;
        const rejectOnce = (error: unknown) => {
          if (settled) return;
          settled = true;
          reject(error);
        };

        try {
          transaction.onabort = () =>
            rejectOnce(
              transaction.error ?? new Error("IndexedDB transaction aborted")
            );
          transaction.onerror = () =>
            rejectOnce(
              transaction.error ?? new Error("IndexedDB transaction error")
            );
        } catch {}

        const request = store.get(key) as unknown as IDBRequest<T | undefined>;

        request.onerror = () =>
          rejectOnce(request.error ?? new Error("IndexedDB request failed"));

        request.onsuccess = () => {
          try {
            store.put(updater(request.result), key);
            settled = true;
            resolve(promisifyRequest<void>(transaction as unknown as RequestLike<void>));
          } catch (err) {
            rejectOnce(err);
          }
        };
      })
  );
}

export function del(
  key: IDBValidKey,
  customStore?: StoreFn
): Promise<void> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readwrite", (store) => {
    store.delete(key);
    return promisifyRequest<void>(
      store.transaction as unknown as RequestLike<void>
    );
  });
}

export function delMany(
  keys: IDBValidKey[],
  customStore?: StoreFn
): Promise<void> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readwrite", (store) => {
    keys.forEach((key) => store.delete(key));
    return promisifyRequest<void>(
      store.transaction as unknown as RequestLike<void>
    );
  });
}

export function clear(customStore?: StoreFn): Promise<void> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readwrite", (store) => {
    store.clear();
    return promisifyRequest<void>(
      store.transaction as unknown as RequestLike<void>
    );
  });
}

function eachCursor(
  store: IDBObjectStore,
  callback: (cursor: IDBCursorWithValue) => void
): Promise<void> {
  store.openCursor().onsuccess = function () {
    if (!this.result) return;
    callback(this.result);
    this.result.continue();
  };
  return promisifyRequest<void>(store.transaction as unknown as RequestLike<void>);
}

export function keys(customStore?: StoreFn): Promise<IDBValidKey[]> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readonly", (store) => {
    if (store.getAllKeys) {
      return promisifyRequest<IDBValidKey[]>(
        store.getAllKeys() as unknown as RequestLike<IDBValidKey[]>
      );
    }
    const items: IDBValidKey[] = [];
    return eachCursor(store, (cursor) => items.push(cursor.key)).then(
      () => items
    );
  });
}

export function values<T = unknown>(customStore?: StoreFn): Promise<T[]> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readonly", (store) => {
    if (store.getAll) {
      return promisifyRequest<T[]>(store.getAll() as unknown as RequestLike<T[]>);
    }
    const items: T[] = [];
    return eachCursor(store, (cursor) => items.push(cursor.value as T)).then(
      () => items
    );
  });
}

export function entries<T = unknown>(
  customStore?: StoreFn
): Promise<Array<[IDBValidKey, T]>> {
  const useStore = customStore ?? defaultGetStore();
  return useStore("readonly", (store) => {
    if (store.getAll && store.getAllKeys) {
      return Promise.all([
        promisifyRequest<IDBValidKey[]>(
          store.getAllKeys() as unknown as RequestLike<IDBValidKey[]>
        ),
        promisifyRequest<T[]>(store.getAll() as unknown as RequestLike<T[]>),
      ]).then(([k, v]) => k.map((key, i) => [key, v[i]]));
    }

    const items: Array<[IDBValidKey, T]> = [];
    return eachCursor(store, (cursor) =>
      items.push([cursor.key, cursor.value as T])
    ).then(() => items);
  });
}
