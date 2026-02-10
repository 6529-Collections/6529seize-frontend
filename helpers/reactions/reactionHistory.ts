import { FrequentlyUsed, Store } from "emoji-mart";

const STORAGE_KEY = "emoji-mart.frequently";
const DEFAULT_REACTION = ":+1:";

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function recordReaction(emoji: string): void {
  const id = emoji.replaceAll(":", "");
  FrequentlyUsed.add({ id });
  emitChange();
}

export function getTopReactions(limit: number): string[] {
  const freq = Store.get("frequently") as Record<string, number> | null;
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
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function getReactionSnapshotServer(): string {
  return "";
}
