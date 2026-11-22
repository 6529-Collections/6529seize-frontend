import { createStore, get, set } from "@/lib/storage/idb-keyval";

/**
 * This device's sender keys, one per (device key, sealed class), with a
 * generation that rises on rotation. Raw bytes, so the device can wrap them
 * to its readers again; they live only in this browser's IndexedDB.
 * @api
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

/**
 * A new key's generation is the current Unix second, or one more than the
 * last one this store knew. If this store is lost while the device key
 * stays, a new key never reuses a generation 6529.io already holds a key
 * for (it would refuse the second key).
 */
function nextGeneration(previous: number | undefined): number {
  return Math.max((previous ?? 0) + 1, Math.floor(Date.now() / 1000));
}

function newKey(
  deviceKey: string,
  cls: number,
  previous: number | undefined
): SenderKey {
  return {
    deviceKey: deviceKey.toLowerCase(),
    cls,
    gen: nextGeneration(previous),
    key: globalThis.crypto.getRandomValues(new Uint8Array(32)),
  };
}

/**
 * This device's current sender key for the class, created on first use.
 * @api
 */
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
    const created = newKey(deviceKey, cls, undefined);
    await set(id, created, getStore());
    return created;
  });
}

/**
 * Starts the next generation: after a revoked grant or a provider key change.
 * @api
 */
export async function rotateSenderKey(
  deviceKey: string,
  cls: number
): Promise<SenderKey> {
  return await withSenderKeyLock(deviceKey, async () => {
    const id = storageKey(deviceKey, cls);
    const existing = await get<SenderKey>(id, getStore());
    const rotated = newKey(deviceKey, cls, existing?.gen);
    await set(id, rotated, getStore());
    return rotated;
  });
}
