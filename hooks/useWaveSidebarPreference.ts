"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "wave-sidebar-preference-change";
const fallback = new Map<string, string>();

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Browser-local preferences with session scope by default and an SSR-safe snapshot. */
export function useWaveSidebarPreference(
  key: string,
  storage: "session" | "local" = "session"
) {
  const fallbackKey = `${storage}:${key}`;
  const read = useCallback(() => {
    if (fallback.has(fallbackKey)) return fallback.get(fallbackKey) ?? null;
    try {
      const store = storage === "local" ? localStorage : sessionStorage;
      return store.getItem(key);
    } catch {
      return fallback.get(fallbackKey) ?? null;
    }
  }, [key, storage, fallbackKey]);
  const value = useSyncExternalStore(subscribe, read, () => null);
  const setValue = useCallback(
    (next: string) => {
      try {
        const store = storage === "local" ? localStorage : sessionStorage;
        store.setItem(key, next);
        fallback.delete(fallbackKey);
      } catch {
        fallback.set(fallbackKey, next);
        // Keep navigation usable when browser storage is unavailable.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key, storage, fallbackKey]
  );
  return [value, setValue] as const;
}
