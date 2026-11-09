import { safeLocalStorage } from "@/helpers/safeLocalStorage";

/** Whether the browser keeps this site's storage under pressure. */
export type PersistentStorageResult = "granted" | "denied" | "unsupported";

const LAST_RESULT_KEY = "6529-storage-persistence";

let request: Promise<PersistentStorageResult> | null = null;

const remember = (result: PersistentStorageResult): PersistentStorageResult => {
  try {
    safeLocalStorage.setItem(LAST_RESULT_KEY, result);
  } catch {
    // Only used to explain a later storage loss.
  }
  return result;
};

/**
 * The last result this browser got, kept in localStorage so that, after the
 * browser drops this site's IndexedDB, it is still known whether that storage
 * had been persistent.
 */
export function readLastPersistentStorageResult(): PersistentStorageResult | null {
  try {
    const value = safeLocalStorage.getItem(LAST_RESULT_KEY);
    return value === "granted" || value === "denied" || value === "unsupported"
      ? value
      : null;
  } catch {
    return null;
  }
}

/**
 * Asks the browser to keep this site's storage when it runs low on space.
 * The device signing key and the encrypted-messages device (with its message
 * history) live only in IndexedDB, which browsers may otherwise evict as
 * "best effort" storage; the browser then needs new grants and loses that
 * history. Best effort and at most once per page: nothing is asked when
 * storage is already persistent, and an unsupported or refused request
 * changes nothing. Called on every page that reads a stored key, and right
 * after the user stored a grant or a device, since some browsers ask the user.
 */
export function requestPersistentStorage(): Promise<PersistentStorageResult> {
  request ??= (async () => {
    try {
      const storage = (globalThis.navigator as Partial<Navigator> | undefined)
        ?.storage;
      if (typeof storage?.persist !== "function") {
        return remember("unsupported");
      }
      if (
        typeof storage.persisted === "function" &&
        (await storage.persisted())
      ) {
        return remember("granted");
      }
      return remember((await storage.persist()) ? "granted" : "denied");
    } catch {
      return "unsupported";
    }
  })();
  return request;
}
