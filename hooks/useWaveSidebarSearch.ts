"use client";

import { useCallback, useSyncExternalStore } from "react";

// Shared by the list and its pagination controls, but never persisted to storage.
// A full refresh starts empty while in-page navigation retains the current query.
const queries = new Map<string, string>();
const listeners = new Set<() => void>();
const getServerSnapshot = () => "";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWaveSidebarSearch(viewerKey: string) {
  const read = useCallback(() => queries.get(viewerKey) ?? "", [viewerKey]);
  const query = useSyncExternalStore(subscribe, read, getServerSnapshot);
  const setQuery = useCallback(
    (value: string) => {
      if (value) queries.set(viewerKey, value);
      else queries.delete(viewerKey);
      for (const listener of listeners) listener();
    },
    [viewerKey]
  );
  return [query, setQuery] as const;
}
