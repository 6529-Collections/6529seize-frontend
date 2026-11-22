import { createStore, get, set } from "@/lib/storage/idb-keyval";

/**
 * This device's sender keys, one per (device key, sealed class), with a
 * generation that rises on rotation. Raw bytes, so the device can wrap them
 * to its readers again; they live only in this browser's IndexedDB.
 */
export interface SenderKey {
  readonly deviceKey: string;
  readonly cls: number;
  readonly gen: number;
  readonly key: Uint8Array;
}

const DATABASE_NAME = "6529-signed-records";
const STORE_NAME = "sender-keys";

let store: ReturnType<typeof createStore> | null = null;

const getStore = () => {
  store ??= createStore(DATABASE_NAME, STORE_NAME);
  return store;
};

const storageKey = (deviceKey: string, cls: number) =>
  `${deviceKey.toLowerCase()}:${cls}`;

async function withSenderKeyLock<T>(
  deviceKey: string,
  task: () => Promise<T>
): Promise<T> {
  // Web Locks keep two tabs from creating two keys for one generation.
  const locks = (globalThis.navigator as Partial<Navigator> | undefined)?.locks;
  if (!locks) {
    return await task();
  }
  return await locks.request(
    `6529-signed-records:${deviceKey.toLowerCase()}`,
    task
  );
}

function newKey(deviceKey: string, cls: number, gen: number): SenderKey {
  return {
    deviceKey: deviceKey.toLowerCase(),
    cls,
    gen,
    key: globalThis.crypto.getRandomValues(new Uint8Array(32)),
  };
}

/** This device's current sender key for the class, created on first use. */
export async function getOrCreateSenderKey(
  deviceKey: string,
  cls: number
): Promise<SenderKey> {
  return await withSenderKeyLock(deviceKey, async () => {
    const id = storageKey(deviceKey, cls);
    const existing = await get<SenderKey>(id, getStore());
    if (existing) {
      return existing;
    }
    const created = newKey(deviceKey, cls, 1);
    await set(id, created, getStore());
    return created;
  });
}

/** Starts the next generation: after a revoked grant or a provider key change. */
export async function rotateSenderKey(
  deviceKey: string,
  cls: number
): Promise<SenderKey> {
  return await withSenderKeyLock(deviceKey, async () => {
    const id = storageKey(deviceKey, cls);
    const existing = await get<SenderKey>(id, getStore());
    const rotated = newKey(deviceKey, cls, (existing?.gen ?? 0) + 1);
    await set(id, rotated, getStore());
    return rotated;
  });
}
