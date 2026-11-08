let request: Promise<void> | null = null;

/**
 * Asks the browser to keep this site's storage when it runs low on space.
 * The device signing key and the encrypted-messages device (with its message
 * history) live only in IndexedDB, which browsers may otherwise evict as
 * "best effort" storage; the browser then needs new grants and loses that
 * history. Best effort and at most once per page: the result is ignored,
 * nothing is asked when storage is already persistent, and an unsupported or
 * refused request changes nothing. Call it right after the user stored a
 * grant or a device, since some browsers ask the user.
 */
export function requestPersistentStorage(): Promise<void> {
  request ??= (async () => {
    try {
      const storage = (globalThis.navigator as Partial<Navigator> | undefined)
        ?.storage;
      if (typeof storage?.persist !== "function") {
        return;
      }
      if (typeof storage.persisted === "function" && (await storage.persisted())) {
        return;
      }
      await storage.persist();
    } catch {
      // Unsupported or refused: storage stays best effort.
    }
  })();
  return request;
}
