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

/** Session preferences survive navigation, with an SSR-safe initial snapshot. */
export function useWaveSidebarPreference(key: string) {
  const read = useCallback(() => {
    if (fallback.has(key)) return fallback.get(key) ?? null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return fallback.get(key) ?? null;
    }
  }, [key]);
  const value = useSyncExternalStore(subscribe, read, () => null);
  const setValue = useCallback(
    (next: string) => {
      try {
        sessionStorage.setItem(key, next);
        fallback.delete(key);
      } catch {
        fallback.set(key, next);
        // Keep navigation usable when browser storage is unavailable.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key]
  );
  return [value, setValue] as const;
}
