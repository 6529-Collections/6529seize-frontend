"use client";

import { useCallback, useSyncExternalStore } from "react";

export type WaveViewMode = "chat" | "gallery";

const STORAGE_KEY = "waveViewModes";
const STORAGE_EVENT = "waveViewModesChange";

type WaveViewModes = Record<string, WaveViewMode>;

const EMPTY_MODES: WaveViewModes = {};

let memoryModes: WaveViewModes = {};
let useMemoryStore = false;

// Cache for useSyncExternalStore - must return same reference when data unchanged
let cachedModes: WaveViewModes = EMPTY_MODES;
let cachedRaw: string | null = null;

const readStoredModes = (): WaveViewModes => {
  if (typeof window === "undefined") {
    return EMPTY_MODES;
  }

  if (useMemoryStore) {
    return memoryModes;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    // Return cached if raw string unchanged
    if (stored === cachedRaw) {
      return cachedModes;
    }

    if (!stored) {
      cachedRaw = null;
      cachedModes = EMPTY_MODES;
      return EMPTY_MODES;
    }

    try {
      cachedRaw = stored;
      cachedModes = JSON.parse(stored) as WaveViewModes;
      return cachedModes;
    } catch {
      cachedRaw = null;
      cachedModes = EMPTY_MODES;
      return EMPTY_MODES;
    }
  } catch {
    useMemoryStore = true;
    return memoryModes;
  }
};

const writeStoredModes = (next: WaveViewModes) => {
  memoryModes = next;

  if (typeof window === "undefined") {
    return;
  }

  if (!useMemoryStore) {
    try {
      const serialized = JSON.stringify(next);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      // Sync cache
      cachedRaw = serialized;
      cachedModes = next;
    } catch (e) {
      useMemoryStore = true;
      console.warn("Error saving wave view modes to localStorage:", e);
    }
  }

  window.dispatchEvent(new Event(STORAGE_EVENT));
};

const subscribeToModes = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    if (
      event instanceof StorageEvent &&
      event.key !== null &&
      event.key !== STORAGE_KEY
    ) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handler);
  window.addEventListener(STORAGE_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
};

export function useWaveViewMode(waveId: string) {
  const allModes = useSyncExternalStore<WaveViewModes>(
    subscribeToModes,
    readStoredModes,
    () => EMPTY_MODES
  );

  const viewMode: WaveViewMode = allModes[waveId] ?? "chat";

  const setViewMode = useCallback(
    (mode: WaveViewMode | ((prev: WaveViewMode) => WaveViewMode)) => {
      const prev = readStoredModes();
      const current = prev[waveId] ?? "chat";
      const next = typeof mode === "function" ? mode(current) : mode;

      writeStoredModes({ ...prev, [waveId]: next });
    },
    [waveId]
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "chat" ? "gallery" : "chat"));
  }, [setViewMode]);

  return { viewMode, setViewMode, toggleViewMode };
}
