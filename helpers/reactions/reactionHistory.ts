import { safeLocalStorage } from "../safeLocalStorage";

const STORAGE_KEY = "seize-reaction-counts";
const DEFAULT_REACTION = ":+1:";

let listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

type ReactionCounts = Record<string, number>;

function getReactionCounts(): ReactionCounts {
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as ReactionCounts;
  } catch {
    return {};
  }
}

export function recordReaction(emoji: string): void {
  const DECAY_FACTOR = 0.95;
  const counts = getReactionCounts();
  // Decay all existing scores
  for (const key of Object.keys(counts)) {
    counts[key] = counts[key]! * DECAY_FACTOR;
  }
  // Boost the used emoji
  counts[emoji] = (counts[emoji] ?? 0) + 1;
  // Prune near-zero entries to keep storage clean
  for (const key of Object.keys(counts)) {
    if (counts[key]! < 0.01) delete counts[key];
  }
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  emitChange();
}

export function getMostUsedReaction(): string {
  return getTopReactions(1)[0]!;
}

export function getTopReactions(limit: number): string[] {
  const counts = getReactionCounts();
  const entries = Object.entries(counts);
  if (entries.length === 0) return [DEFAULT_REACTION];

  const sorted = entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([emoji]) => emoji);

  return sorted.length > 0 ? sorted : [DEFAULT_REACTION];
}

// For useSyncExternalStore - returns default on server
export function getMostUsedReactionServer(): string {
  return DEFAULT_REACTION;
}

// Subscribe to storage changes (for useSyncExternalStore)
export function subscribeToReactionStore(
  onStoreChange: () => void
): () => void {
  listeners.add(onStoreChange);
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handler);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handler);
  };
}

export function getReactionSnapshot(): string {
  return safeLocalStorage.getItem(STORAGE_KEY) ?? "";
}

export function getReactionSnapshotServer(): string {
  return "";
}
