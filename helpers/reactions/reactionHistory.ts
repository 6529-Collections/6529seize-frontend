import { safeLocalStorage } from "../safeLocalStorage";

const STORAGE_KEY = "seize-reaction-counts";
const DEFAULT_REACTION = ":+1:";

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
  const counts = getReactionCounts();
  counts[emoji] = (counts[emoji] ?? 0) + 1;
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
}

export function getMostUsedReaction(): string {
  const counts = getReactionCounts();
  const entries = Object.entries(counts);
  if (entries.length === 0) return DEFAULT_REACTION;

  let maxEmoji = DEFAULT_REACTION;
  let maxCount = 0;
  for (const [emoji, count] of entries) {
    if (count > maxCount) {
      maxCount = count;
      maxEmoji = emoji;
    }
  }
  return maxEmoji;
}

// For useSyncExternalStore - returns default on server
export function getMostUsedReactionServer(): string {
  return DEFAULT_REACTION;
}

// Subscribe to storage changes (for useSyncExternalStore)
export function subscribeToReactionStore(
  onStoreChange: () => void
): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
