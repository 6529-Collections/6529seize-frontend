"use client";

import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_EVENT = "memesQuickVoteStorageChange";

type StoredScalar = number | string;
type ArraySanitizer<T extends StoredScalar> = (value: unknown) => T[];
type StorageChangeDetail = {
  readonly key: string;
};

type CacheEntry = {
  raw: string | null;
  value: StoredScalar[];
};

const EMPTY_ARRAY: StoredScalar[] = [];
const cachedByKey = new Map<string, CacheEntry>();

const areStoredArraysEqual = (
  left: readonly StoredScalar[],
  right: readonly StoredScalar[]
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

const cacheSnapshot = <T extends StoredScalar>(
  key: string,
  raw: string | null,
  next: T[]
): T[] => {
  const entry = getCachedEntry(key);
  const normalizedNext: T[] = next.length === 0 ? (EMPTY_ARRAY as T[]) : next;

  if (entry.raw === raw) {
    return entry.value as T[];
  }

  entry.raw = raw;

  if (areStoredArraysEqual(entry.value, normalizedNext)) {
    return entry.value as T[];
  }

  entry.value = normalizedNext;
  return normalizedNext;
};

const readStoredArray = <T extends StoredScalar>(
  key: string | null,
  sanitize: ArraySanitizer<T>
): T[] => {
  if (!key) {
    return EMPTY_ARRAY as T[];
  }

  const stored = safeLocalStorage.getItem(key);
  const entry = getCachedEntry(key);

  if (entry.raw === stored) {
    return entry.value as T[];
  }

  if (!stored) {
    return cacheSnapshot(key, null, []);
  }

  try {
    return cacheSnapshot(key, stored, sanitize(JSON.parse(stored)));
  } catch {
    return cacheSnapshot(key, stored, []);
  }
};

const writeStoredArray = (
  key: string | null,
  values: readonly StoredScalar[]
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

const subscribeToStoredArray = (
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

const useStoredArray = <T extends StoredScalar>(
  key: string | null,
  sanitize: ArraySanitizer<T>
): T[] => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToStoredArray(key, onStoreChange),
    [key]
  );
  const getSnapshot = useCallback(
    () => readStoredArray(key, sanitize),
    [key, sanitize]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_ARRAY as T[]);
};

export const readStoredNumberArray = (
  key: string | null,
  sanitize: ArraySanitizer<number>
): number[] => readStoredArray(key, sanitize);

export const writeStoredNumberArray = (
  key: string | null,
  values: readonly number[]
): void => {
  writeStoredArray(key, values);
};

export const useStoredNumberArray = (
  key: string | null,
  sanitize: ArraySanitizer<number>
): number[] => useStoredArray(key, sanitize);

export const readStoredStringArray = (
  key: string | null,
  sanitize: ArraySanitizer<string>
): string[] => readStoredArray(key, sanitize);

export const writeStoredStringArray = (
  key: string | null,
  values: readonly string[]
): void => {
  writeStoredArray(key, values);
};

export const useStoredStringArray = (
  key: string | null,
  sanitize: ArraySanitizer<string>
): string[] => useStoredArray(key, sanitize);
