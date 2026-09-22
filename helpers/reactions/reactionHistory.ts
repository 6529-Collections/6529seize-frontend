const STORAGE_KEY = "emoji-mart.frequently";
const DEFAULT_REACTION = ":+1:";

const listeners = new Set<() => void>();

export function notifyReactionHistoryChange() {
  for (const listener of listeners) {
    listener();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function readReactionStore(rawStore: string): Record<string, number> | null {
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
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export async function recordReaction(emoji: string): Promise<void> {
  const id = emoji.replaceAll(":", "");
  if (!id) return;

  try {
    // Keep the runtime lazy, but use the same writer as the picker. Writing
    // localStorage directly leaves Emoji Mart's in-memory index stale.
    const { FrequentlyUsed } = await import("emoji-mart");
    FrequentlyUsed.add({ id });
  } catch {
    // A failed runtime import must not discard a quick reaction's history.
    const store = readReactionStore(getReactionSnapshot()) ?? {};
    store[id] = (store[id] ?? 0) + 1;
    writeReactionStore(store);
  }
  notifyReactionHistoryChange();
}

export function getTopReactions(
  limit: number,
  snapshot = getReactionSnapshot()
): string[] {
  const freq = readReactionStore(snapshot);
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
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange();
  };
  globalThis.addEventListener("storage", handler);
  return () => {
    listeners.delete(onStoreChange);
    globalThis.removeEventListener("storage", handler);
  };
}

export function getReactionSnapshot(): string {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getReactionSnapshotServer(): string {
  return "";
}
