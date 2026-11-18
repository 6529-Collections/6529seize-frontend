/**
 * Removes every key of `storage` that `matches` selects. Keys are collected
 * first so removals do not shift the indexes still being read.
 */
export const removeMatchingStorageKeys = (
  storage: Storage,
  matches: (key: string) => boolean
): void => {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null && matches(key)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    storage.removeItem(key);
  }
};
