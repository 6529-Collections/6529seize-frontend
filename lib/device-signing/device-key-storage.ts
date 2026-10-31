import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { createStore, get, set, values } from "@/lib/storage/idb-keyval";

/** One browser-held device key per lowercase wallet address. */
export interface StoredDeviceKey {
  readonly address: string;
  /** Non-extractable Ed25519 key pair (structured-cloned by IndexedDB). */
  readonly keyPair: CryptoKeyPair;
  readonly publicKeyHex: string;
  readonly grant: ApiDeviceGrant | null;
  readonly lastSeq: number;
  /**
   * The wallet's own profile id, from the session role returned by the
   * grant-carrying sign-in (which never acts through a proxy). Absent on
   * records created before it was stored.
   */
  readonly ownProfileId?: string | null | undefined;
}

const DATABASE_NAME = "6529-device-keys";
const STORE_NAME = "keys";

let store: ReturnType<typeof createStore> | null = null;

const getStore = () => {
  store ??= createStore(DATABASE_NAME, STORE_NAME);
  return store;
};

export const deviceKeyStorage = {
  read: (address: string): Promise<StoredDeviceKey | undefined> =>
    get<StoredDeviceKey>(address, getStore()),
  write: (record: StoredDeviceKey): Promise<void> =>
    set(record.address, record, getStore()),
  readAll: (): Promise<StoredDeviceKey[]> =>
    values<StoredDeviceKey>(getStore()),
};
