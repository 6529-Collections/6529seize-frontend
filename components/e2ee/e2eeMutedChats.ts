"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Encrypted chats muted on this device. Muting is local: the chat stops
 * counting toward the Messages badge here and shows a muted mark; nothing is
 * sent to the server, which cannot tell which chat a wake belongs to anyway.
 */
const MUTED_KEY_PREFIX = "6529:e2ee:muted:";
const MAX_MUTED = 500;
const EMPTY: ReadonlySet<string> = new Set();

const listeners = new Set<() => void>();
const cache = new Map<
  string,
  { readonly raw: string | null; readonly set: ReadonlySet<string> }
>();

const keyFor = (profileId: string) => `${MUTED_KEY_PREFIX}${profileId}`;

const readRaw = (profileId: string): string | null => {
  try {
    return globalThis.localStorage.getItem(keyFor(profileId));
  } catch {
    return null;
  }
};

const parse = (raw: string | null): ReadonlySet<string> => {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(
          parsed.filter((value): value is string => typeof value === "string")
        )
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

/** The muted chat handles for a profile on this device (stable per value). */
function readMutedE2eeChats(profileId: string | null): ReadonlySet<string> {
  if (!profileId) {
    return EMPTY;
  }
  const raw = readRaw(profileId);
  const cached = cache.get(profileId);
  if (cached?.raw === raw) {
    return cached.set;
  }
  const set = parse(raw);
  cache.set(profileId, { raw, set });
  return set;
}

export function setE2eeChatMuted(
  profileId: string,
  g: string,
  muted: boolean
): void {
  const next = new Set(readMutedE2eeChats(profileId));
  if (muted) {
    next.add(g);
  } else {
    next.delete(g);
  }
  try {
    globalThis.localStorage.setItem(
      keyFor(profileId),
      JSON.stringify([...next].slice(-MAX_MUTED))
    );
  } catch {
    // Storage can be unavailable (private mode, quota); muting is optional.
  }
  for (const listener of [...listeners]) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(MUTED_KEY_PREFIX)) {
      listener();
    }
  };
  globalThis.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener("storage", onStorage);
  };
}

/** Muted chat handles for the profile, updating when any tab changes them. */
export function useMutedE2eeChats(
  profileId: string | null
): ReadonlySet<string> {
  const getSnapshot = useCallback(
    () => readMutedE2eeChats(profileId),
    [profileId]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
