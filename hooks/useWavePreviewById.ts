"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveById } from "@/hooks/useWaveById";

const MAX_CONCURRENT_WAVE_PREVIEW_FETCHES = 3;
const MAX_EMPTY_WAVE_PREVIEW_RETRIES = 1;

const activeWavePreviewFetches = new Set<string>();
const queuedWavePreviewFetches: string[] = [];
const wavePreviewSubscriptionCounts = new Map<string, number>();
const wavePreviewStoreListeners = new Set<() => void>();

const subscribeToWavePreviewStore = (listener: () => void): (() => void) => {
  wavePreviewStoreListeners.add(listener);
  return () => wavePreviewStoreListeners.delete(listener);
};

const notifyWavePreviewStoreListeners = (): void => {
  for (const listener of wavePreviewStoreListeners) {
    listener();
  }
};

const removeQueuedWave = (waveId: string): void => {
  const index = queuedWavePreviewFetches.indexOf(waveId);
  if (index >= 0) {
    queuedWavePreviewFetches.splice(index, 1);
  }
};

const pumpWavePreviewQueue = (): boolean => {
  let changed = false;

  while (
    activeWavePreviewFetches.size < MAX_CONCURRENT_WAVE_PREVIEW_FETCHES &&
    queuedWavePreviewFetches.length > 0
  ) {
    const waveId = queuedWavePreviewFetches.shift();
    if (!waveId || activeWavePreviewFetches.has(waveId)) {
      continue;
    }

    const subscriberCount = wavePreviewSubscriptionCounts.get(waveId) ?? 0;
    if (subscriberCount === 0) {
      continue;
    }

    activeWavePreviewFetches.add(waveId);
    changed = true;
  }

  return changed;
};

const registerWavePreviewFetch = (waveId: string): (() => void) => {
  const subscriptionCount = wavePreviewSubscriptionCounts.get(waveId) ?? 0;
  wavePreviewSubscriptionCounts.set(waveId, subscriptionCount + 1);

  if (
    !activeWavePreviewFetches.has(waveId) &&
    !queuedWavePreviewFetches.includes(waveId)
  ) {
    queuedWavePreviewFetches.push(waveId);
    if (pumpWavePreviewQueue()) {
      notifyWavePreviewStoreListeners();
    }
  }

  return () => {
    const currentSubscriptionCount =
      wavePreviewSubscriptionCounts.get(waveId) ?? 0;
    if (currentSubscriptionCount === 0) {
      return;
    }

    if (currentSubscriptionCount > 1) {
      wavePreviewSubscriptionCounts.set(waveId, currentSubscriptionCount - 1);
      return;
    }

    wavePreviewSubscriptionCounts.delete(waveId);
    removeQueuedWave(waveId);
    const removedActiveFetch = activeWavePreviewFetches.delete(waveId);
    const queueChanged = pumpWavePreviewQueue();
    const changed = removedActiveFetch || queueChanged;
    if (changed) {
      notifyWavePreviewStoreListeners();
    }
  };
};

const releaseWavePreviewFetch = (waveId: string): void => {
  const removedActiveFetch = activeWavePreviewFetches.delete(waveId);
  const queueChanged = pumpWavePreviewQueue();
  const changed = removedActiveFetch || queueChanged;
  if (changed) {
    notifyWavePreviewStoreListeners();
  }
};

export function useWavePreviewById(waveId: string): {
  readonly wave: ApiWave | undefined;
} {
  const emptyPreviewRetryCountRef = useRef(0);
  const fetchCycleStartedRef = useRef(false);
  const fetchEnabled = useSyncExternalStore(
    subscribeToWavePreviewStore,
    () => activeWavePreviewFetches.has(waveId),
    () => false
  );
  const { wave, isFetching, isLoading, refetch } = useWaveById(waveId, {
    enabled: fetchEnabled,
  });
  const hasWave = Boolean(wave);

  useEffect(() => {
    fetchCycleStartedRef.current = false;
    emptyPreviewRetryCountRef.current = 0;
  }, [waveId]);

  useEffect(() => {
    if (hasWave) {
      emptyPreviewRetryCountRef.current = 0;
    }
  }, [hasWave]);

  useEffect(() => {
    if (!waveId || hasWave) {
      return;
    }

    return registerWavePreviewFetch(waveId);
  }, [hasWave, waveId]);

  useEffect(() => {
    if (!waveId || !fetchEnabled) {
      fetchCycleStartedRef.current = false;
      return;
    }

    if (isFetching || isLoading) {
      fetchCycleStartedRef.current = true;
      return;
    }

    if (!fetchCycleStartedRef.current) {
      return;
    }

    fetchCycleStartedRef.current = false;

    if (!hasWave) {
      if (emptyPreviewRetryCountRef.current < MAX_EMPTY_WAVE_PREVIEW_RETRIES) {
        emptyPreviewRetryCountRef.current += 1;
        void refetch();
        return;
      }
    }

    releaseWavePreviewFetch(waveId);
  }, [fetchEnabled, hasWave, isFetching, isLoading, refetch, waveId]);

  return useMemo(() => ({ wave }), [wave]);
}

export function resetWavePreviewFetchGateForTests(): void {
  activeWavePreviewFetches.clear();
  queuedWavePreviewFetches.splice(0);
  wavePreviewSubscriptionCounts.clear();
  wavePreviewStoreListeners.clear();
}
