"use client";

import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_EVENT = "memesQuickVoteStorageChange";

type NumberArraySanitizer = (value: unknown) => number[];

type CacheEntry = {
  raw: string | null;
  value: number[];
};

type StorageChangeDetail = {
  readonly key: string;
};

const EMPTY_ARRAY: number[] = [];
const cachedByKey = new Map<string, CacheEntry>();

const areNumberArraysEqual = (
  left: readonly number[],
  right: readonly number[]
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const getCachedEntry = (key: string): CacheEntry => {
  const existing = cachedByKey.get(key);

  if (existing) {
    return existing;
  }

  const created: CacheEntry = {
    raw: null,
    value: EMPTY_ARRAY,
  };
  cachedByKey.set(key, created);
  return created;
};

const cacheSnapshot = (
  key: string,
  raw: string | null,
  next: number[]
): number[] => {
  const entry = getCachedEntry(key);
  const normalizedNext = next.length === 0 ? EMPTY_ARRAY : next;

  if (entry.raw === raw) {
    return entry.value;
  }

  entry.raw = raw;

  if (areNumberArraysEqual(entry.value, normalizedNext)) {
    return entry.value;
  }

  entry.value = normalizedNext;
  return normalizedNext;
};

export const readStoredNumberArray = (
  key: string | null,
  sanitize: NumberArraySanitizer
): number[] => {
  if (!key) {
    return EMPTY_ARRAY;
  }

  const stored = safeLocalStorage.getItem(key);
  const entry = getCachedEntry(key);

  if (entry.raw === stored) {
    return entry.value;
  }

  if (!stored) {
    return cacheSnapshot(key, null, EMPTY_ARRAY);
  }

  try {
    return cacheSnapshot(key, stored, sanitize(JSON.parse(stored)));
  } catch {
    return cacheSnapshot(key, stored, EMPTY_ARRAY);
  }
};

export const writeStoredNumberArray = (
  key: string | null,
  values: readonly number[]
): void => {
  if (!key) {
    return;
  }

  const next = [...values];
  const serialized = next.length === 0 ? null : JSON.stringify(next);

  if (serialized === null) {
    safeLocalStorage.removeItem(key);
  } else {
    safeLocalStorage.setItem(key, serialized);
  }

  cacheSnapshot(key, serialized, next);

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StorageChangeDetail>(STORAGE_EVENT, {
      detail: { key },
    })
  );
};

const subscribeToStoredNumberArray = (
  key: string | null,
  onStoreChange: () => void
): (() => void) => {
  if (!key || typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) {
      return;
    }

    onStoreChange();
  };

  const handleCustomChange = (event: Event) => {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const detail = event.detail as StorageChangeDetail | null;

    if (detail?.key !== key) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, handleCustomChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, handleCustomChange);
  };
};

export const useStoredNumberArray = (
  key: string | null,
  sanitize: NumberArraySanitizer
): number[] => {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      subscribeToStoredNumberArray(key, onStoreChange),
    [key]
  );
  const getSnapshot = useCallback(
    () => readStoredNumberArray(key, sanitize),
    [key, sanitize]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_ARRAY);
};
