const STORAGE_KEY = "emoji-mart.frequently";
const DEFAULT_REACTION = ":+1:";

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function readReactionStore(): Record<string, number> | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  let rawStore: string | null;
  try {
    rawStore = globalThis.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!rawStore) {
    return null;
  }

  try {
    const parsedStore: unknown = JSON.parse(rawStore);
    if (!isRecord(parsedStore)) {
      return null;
    }

    const entries = Object.entries(parsedStore).filter(
      (entry): entry is [string, number] =>
        typeof entry[0] === "string" &&
        typeof entry[1] === "number" &&
        Number.isFinite(entry[1])
    );

    return Object.fromEntries(entries);
  } catch {
    return null;
  }
}

function writeReactionStore(store: Record<string, number>): void {
  if (typeof globalThis.localStorage === "undefined") {
    return;
  }

  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function recordReaction(emoji: string): void {
  const id = emoji.replaceAll(":", "");
  const store = readReactionStore() ?? {};
  store[id] = (store[id] ?? 0) + 1;
  writeReactionStore(store);
  emitChange();
}

export function getTopReactions(limit: number): string[] {
  const freq = readReactionStore();
  if (!freq) return [DEFAULT_REACTION];

  const sorted = Object.entries(freq)
    .toSorted(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => `:${id}:`);

  return sorted.length > 0 ? sorted : [DEFAULT_REACTION];
}

// Subscribe to storage changes (for useSyncExternalStore)
export function subscribeToReactionStore(
  onStoreChange: () => void
): () => void {
  listeners.add(onStoreChange);
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onStoreChange();
  };
  globalThis.addEventListener("storage", handler);
  return () => {
    listeners.delete(onStoreChange);
    globalThis.removeEventListener("storage", handler);
  };
}

export function getReactionSnapshot(): string {
  if (typeof globalThis.localStorage === "undefined") {
    return "";
  }

  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getReactionSnapshotServer(): string {
  return "";
}
