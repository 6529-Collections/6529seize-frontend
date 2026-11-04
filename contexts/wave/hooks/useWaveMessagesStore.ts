"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  formatWaveMessages,
  maxOrNull,
  mergeDrops,
} from "../utils/wave-messages-utils";
import type { ServerWaveFeedSeedResult } from "../server-wave-feed-seed";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { Drop } from "@/helpers/waves/drop.helpers";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import type { WaveMessages, WaveMessagesUpdate } from "./types";
import {
  rememberEvictedWave,
  selectWavesToEvict,
} from "./waveMessagesEviction";

type DropChange = {
  key: string;
  originalValue: unknown;
  optimisticValue: unknown;
  originalHasKey: boolean;
  optimisticHasKey: boolean;
};

const serializeValue = (value: unknown): string => {
  if (value === undefined) {
    return "__undefined__";
  }
  return JSON.stringify(value);
};

const valuesEqual = (left: unknown, right: unknown): boolean => {
  return serializeValue(left) === serializeValue(right);
};

const cloneValue = <T>(value: T): T => {
  if (value === undefined) {
    return value;
  }

  return structuredClone(value);
};

type DropRecord = Drop & Record<string, unknown>;

const toDropRecord = (drop: Drop): DropRecord => drop as DropRecord;

const collectDropChanges = (original: Drop, updated: Drop): DropChange[] => {
  const keys = Array.from(
    new Set([...Object.keys(original), ...Object.keys(updated)])
  );
  const changes: DropChange[] = [];
  const originalRecord = toDropRecord(original);
  const updatedRecord = toDropRecord(updated);

  for (const key of keys) {
    const originalHasKey = Object.hasOwn(original, key);
    const optimisticHasKey = Object.hasOwn(updated, key);
    const originalValue = originalHasKey ? originalRecord[key] : undefined;
    const optimisticValue = optimisticHasKey ? updatedRecord[key] : undefined;

    if (!valuesEqual(originalValue, optimisticValue)) {
      changes.push({
        key,
        originalValue: cloneValue(originalValue),
        optimisticValue: cloneValue(optimisticValue),
        originalHasKey,
        optimisticHasKey,
      });
    }
  }

  return changes;
};

const cloneDrop = (drop: Drop): Drop => cloneValue(drop);

function mergeWaveDrops(
  current: Drop[],
  incoming: Drop[],
  mergePolicy: "standard" | "preserve-existing",
  deleted: Set<string> | undefined
): Drop[] {
  const available = incoming.filter((drop) => !deleted?.has(drop.id));
  return mergePolicy === "preserve-existing"
    ? mergeDrops(available, current)
    : mergeDrops(current, available);
}

export type Listener = (data: WaveMessages | undefined) => void;
type EvictionListener = (waveId: string) => void;

type Listeners = Set<Listener>; // Keep internal types non-exported
type KeyListeners = Record<string, Listeners>; // Keep internal types non-exported
type WaveMessagesCommit = {
  readonly update: WaveMessagesUpdate;
  readonly mergePolicy: "standard" | "preserve-existing";
  readonly onApplied?: (() => void) | undefined;
  readonly generation: number;
};
type PendingServerFeedSeed = {
  readonly gatePromise: Promise<ServerWaveFeedSeedResult>;
  readonly generation: number;
  readonly promise: Promise<ServerWaveFeedSeedResult>;
};

function useWaveMessagesStore() {
  const [, forceRender] = useReducer((version: number) => version + 1, 0);
  const waveMessagesRef = useRef<Record<string, WaveMessages>>({});
  // Resident wave ids, least recently used first.
  const residentWaveIdsRef = useRef<Set<string>>(new Set());
  // Evicted waves reject late writes until they load again.
  const evictedWaveIdsRef = useRef<Set<string>>(new Set());
  const evictionListenersRef = useRef<Set<EvictionListener>>(new Set());
  const activeWaveIdRef = useRef<string | null>(null);
  // Use useRef to keep listeners stable across renders
  const listenersRef = useRef<KeyListeners>({});
  const dirtyWaveIdsRef = useRef(new Set<string>());
  const notificationFrameRef = useRef<number | null>(null);
  const deletedDropIdsRef = useRef(new Map<string, Set<string>>());
  const pendingServerFeedSeedsRef = useRef<Map<string, PendingServerFeedSeed>>(
    new Map()
  );
  const activeServerFeedSeedsRef = useRef<Set<string>>(new Set());
  const activeServerFeedSeedGatePromisesRef = useRef<
    Map<string, Promise<ServerWaveFeedSeedResult>>
  >(new Map());
  const appliedServerFeedSeedWaveIdsRef = useRef<Set<string>>(new Set());
  const completedInitialRegistrationsRef = useRef<Set<string>>(new Set());
  const committedServerFeedSeedsRef = useRef<Set<string>>(new Set());
  const serverFeedSeedReadyCallbacksRef = useRef<Map<string, () => void>>(
    new Map()
  );
  const authoritativePaginationWaveIdsRef = useRef<Set<string>>(new Set());
  const storeGenerationRef = useRef(0);
  const [storeGeneration, setStoreGeneration] = useState(0);

  const flushNotifications = useCallback(() => {
    if (document.visibilityState === "hidden") return;
    const dirtyWaveIds = [...dirtyWaveIdsRef.current];
    dirtyWaveIdsRef.current.clear();
    if (dirtyWaveIds.length === 0) return;
    forceRender();
    for (const waveId of dirtyWaveIds) {
      const value = waveMessagesRef.current[waveId];
      listenersRef.current[waveId]?.forEach((listener) => listener(value));
    }
  }, []);

  const scheduleNotification = useCallback(
    (waveId: string) => {
      dirtyWaveIdsRef.current.add(waveId);
      if (
        document.visibilityState === "hidden" ||
        notificationFrameRef.current !== null
      )
        return;
      notificationFrameRef.current = requestAnimationFrame(() => {
        notificationFrameRef.current = null;
        flushNotifications();
      });
    },
    [flushNotifications]
  );

  useEffect(() => {
    document.addEventListener("visibilitychange", flushNotifications);
    return () => {
      document.removeEventListener("visibilitychange", flushNotifications);
      if (notificationFrameRef.current !== null) {
        cancelAnimationFrame(notificationFrameRef.current);
        notificationFrameRef.current = null;
      }
    };
  }, [flushNotifications]);

  const releaseServerFeedSeedIfReady = useCallback((waveId: string): void => {
    if (
      !completedInitialRegistrationsRef.current.has(waveId) ||
      !committedServerFeedSeedsRef.current.has(waveId)
    ) {
      return;
    }

    activeServerFeedSeedsRef.current.delete(waveId);
    activeServerFeedSeedGatePromisesRef.current.delete(waveId);
    completedInitialRegistrationsRef.current.delete(waveId);
    committedServerFeedSeedsRef.current.delete(waveId);
    const onReady = serverFeedSeedReadyCallbacksRef.current.get(waveId);
    serverFeedSeedReadyCallbacksRef.current.delete(waveId);
    onReady?.();
  }, []);

  useEffect(() => {
    const resetProfileScopedState = () => {
      const clearedWaveIds = Object.keys(waveMessagesRef.current);
      storeGenerationRef.current += 1;
      setStoreGeneration(storeGenerationRef.current);
      pendingServerFeedSeedsRef.current.clear();
      activeServerFeedSeedsRef.current.clear();
      activeServerFeedSeedGatePromisesRef.current.clear();
      appliedServerFeedSeedWaveIdsRef.current.clear();
      completedInitialRegistrationsRef.current.clear();
      committedServerFeedSeedsRef.current.clear();
      serverFeedSeedReadyCallbacksRef.current.clear();
      dirtyWaveIdsRef.current.clear();
      deletedDropIdsRef.current.clear();
      authoritativePaginationWaveIdsRef.current.clear();
      residentWaveIdsRef.current.clear();
      evictedWaveIdsRef.current.clear();
      if (clearedWaveIds.length === 0) {
        return;
      }

      waveMessagesRef.current = {};
      forceRender();
      for (const waveId of clearedWaveIds) {
        const listeners = listenersRef.current[waveId];
        if (!listeners) {
          continue;
        }
        for (const listener of listeners) {
          listener(undefined);
        }
      }
    };

    globalThis.addEventListener(
      PROFILE_SWITCHED_EVENT,
      resetProfileScopedState
    );
    return () => {
      globalThis.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        resetProfileScopedState
      );
    };
  }, []);

  // Moves a resident wave to the most recently used end.
  const touchWave = useCallback((waveId: string): void => {
    if (residentWaveIdsRef.current.delete(waveId)) {
      residentWaveIdsRef.current.add(waveId);
    }
  }, []);

  // The active wave is never evicted and counts as just used.
  const trackActiveWave = useCallback(
    (waveId: string | null): void => {
      activeWaveIdRef.current = waveId;
      if (waveId) {
        touchWave(waveId);
      }
    },
    [touchWave]
  );

  // A wave is in use while it is active or a mounted component subscribes.
  const isWaveInUse = useCallback(
    (waveId: string): boolean =>
      activeWaveIdRef.current === waveId ||
      (listenersRef.current[waveId]?.size ?? 0) > 0,
    []
  );

  // Data hooks release their per-wave requests, timers and state on eviction.
  const subscribeToEvictions = useCallback(
    (listener: EvictionListener): (() => void) => {
      evictionListenersRef.current.add(listener);
      return () => {
        evictionListenersRef.current.delete(listener);
      };
    },
    []
  );

  const releaseWaveState = useCallback((waveId: string): void => {
    pendingServerFeedSeedsRef.current.delete(waveId);
    activeServerFeedSeedsRef.current.delete(waveId);
    activeServerFeedSeedGatePromisesRef.current.delete(waveId);
    appliedServerFeedSeedWaveIdsRef.current.delete(waveId);
    completedInitialRegistrationsRef.current.delete(waveId);
    committedServerFeedSeedsRef.current.delete(waveId);
    serverFeedSeedReadyCallbacksRef.current.delete(waveId);
    authoritativePaginationWaveIdsRef.current.delete(waveId);
    residentWaveIdsRef.current.delete(waveId);
    dirtyWaveIdsRef.current.delete(waveId);
    deletedDropIdsRef.current.delete(waveId);
  }, []);

  const evictLeastRecentlyUsedWaves = useCallback(
    (insertedWaveId: string): void => {
      const evictedWaveIds = selectWavesToEvict(
        residentWaveIdsRef.current,
        (waveId) =>
          waveId === insertedWaveId ||
          isWaveInUse(waveId) ||
          pendingServerFeedSeedsRef.current.has(waveId) ||
          activeServerFeedSeedsRef.current.has(waveId)
      );
      if (evictedWaveIds.length === 0) {
        return;
      }

      const next = { ...waveMessagesRef.current };
      for (const waveId of evictedWaveIds) {
        delete next[waveId];
        releaseWaveState(waveId);
        rememberEvictedWave(evictedWaveIdsRef.current, waveId);
      }
      waveMessagesRef.current = next;
      // Evicted waves have no subscribers, so only the data hooks hear of it.
      for (const waveId of evictedWaveIds) {
        for (const listener of evictionListenersRef.current) {
          listener(waveId);
        }
      }
    },
    [isWaveInUse, releaseWaveState]
  );

  // Runs after each update applies: a wave cached for the first time
  // becomes the most recently used one and may push older waves out.
  const admitWave = useCallback(
    (waveId: string): void => {
      if (
        residentWaveIdsRef.current.has(waveId) ||
        !waveMessagesRef.current[waveId]
      ) {
        return;
      }
      residentWaveIdsRef.current.add(waveId);
      evictLeastRecentlyUsedWaves(waveId);
    },
    [evictLeastRecentlyUsedWaves]
  );

  // Stable function to get data for a key
  const getData = useCallback((key: string): WaveMessages | undefined => {
    return waveMessagesRef.current[key];
  }, []);

  // Stable function to subscribe a listener for a specific key
  const subscribe = useCallback(
    (key: string, listener: Listener) => {
      const keyListeners = listenersRef.current[key] ?? new Set();
      keyListeners.add(listener);
      listenersRef.current[key] = keyListeners;
      touchWave(key);
      // Provide initial value immediately upon subscription
      listener(waveMessagesRef.current[key]);
    },
    [touchWave]
  );

  // Stable function to unsubscribe a listener
  const unsubscribe = useCallback((key: string, callback: Listener) => {
    const keyListeners = listenersRef.current[key];
    if (keyListeners) {
      keyListeners.delete(callback);
      if (keyListeners.size === 0) {
        delete listenersRef.current[key];
      }
    }
  }, []); // No dependencies needed

  const applyUpdate = useCallback(
    ({
      generation,
      mergePolicy,
      onApplied,
      update,
    }: WaveMessagesCommit): void => {
      if (generation !== storeGenerationRef.current) return;

      const newWaveMessages = { ...waveMessagesRef.current };
      const existingWaveMessages = newWaveMessages[update.key];
      if (!existingWaveMessages) {
        newWaveMessages[update.key] = {
          id: update.key,
          isLoading: false,
          isLoadingNextPage: false,
          hasNextPage: false,
          drops: [],
          latestFetchedSerialNo: null,
        };
      }

      const updatedWaveMessages = {
        ...newWaveMessages[update.key]!,
      };
      const hasAuthoritativePagination =
        authoritativePaginationWaveIdsRef.current.has(update.key);

      if (
        update.isLoading !== undefined &&
        (mergePolicy === "standard" || existingWaveMessages === undefined)
      ) {
        updatedWaveMessages.isLoading = update.isLoading;
      }
      if (
        update.isLoadingNextPage !== undefined &&
        (mergePolicy === "standard" || existingWaveMessages === undefined)
      ) {
        updatedWaveMessages.isLoadingNextPage = update.isLoadingNextPage;
      }
      if (
        update.hasNextPage !== undefined &&
        (mergePolicy === "standard" ||
          existingWaveMessages === undefined ||
          !hasAuthoritativePagination)
      ) {
        updatedWaveMessages.hasNextPage = update.hasNextPage;
      }
      if (update.drops !== undefined) {
        updatedWaveMessages.drops = mergeWaveDrops(
          updatedWaveMessages.drops,
          update.drops,
          mergePolicy,
          deletedDropIdsRef.current.get(update.key)
        );
      }

      if (update.historyGaps !== undefined) {
        updatedWaveMessages.historyGaps = update.historyGaps;
      }

      if (typeof update.latestFetchedSerialNo === "number") {
        updatedWaveMessages.latestFetchedSerialNo = maxOrNull(
          updatedWaveMessages.latestFetchedSerialNo,
          update.latestFetchedSerialNo
        );
      }

      const nextState = {
        ...newWaveMessages,
        [update.key]: updatedWaveMessages,
      };
      // Drops-only realtime/target updates create a default false cursor but do
      // not own pagination until a feed or page result supplies messages.
      const hasMessagesForPagination =
        (existingWaveMessages?.drops.length ?? 0) > 0 ||
        (update.drops?.length ?? 0) > 0;
      if (
        update.hasNextPage !== undefined &&
        (mergePolicy === "preserve-existing" || hasMessagesForPagination)
      ) {
        authoritativePaginationWaveIdsRef.current.add(update.key);
      }
      waveMessagesRef.current = nextState as Record<string, WaveMessages>;
      scheduleNotification(update.key);
      onApplied?.();
    },
    [scheduleNotification]
  );

  // Commit immediately; rendering never blocks subsequent writes.
  const updateData = useCallback(
    (update: WaveMessagesUpdate) => {
      if (update.isLoading === true) {
        // A loading placeholder starts a fresh load, so the wave caches again.
        evictedWaveIdsRef.current.delete(update.key);
      } else if (evictedWaveIdsRef.current.has(update.key)) {
        // A late result for an evicted wave would leave a partial cache.
        return;
      }
      applyUpdate({
        update,
        mergePolicy: "standard",
        onApplied: () => admitWave(update.key),
        generation: storeGenerationRef.current,
      });
    },
    [admitWave, applyUpdate]
  );

  const registerPendingServerFeedSeed = useCallback(
    (waveId: string, promise: Promise<ServerWaveFeedSeedResult>) => {
      // A server seed loads the wave again, so it may cache again.
      evictedWaveIdsRef.current.delete(waveId);
      activeServerFeedSeedsRef.current.delete(waveId);
      activeServerFeedSeedGatePromisesRef.current.delete(waveId);
      completedInitialRegistrationsRef.current.delete(waveId);
      committedServerFeedSeedsRef.current.delete(waveId);
      serverFeedSeedReadyCallbacksRef.current.delete(waveId);
      pendingServerFeedSeedsRef.current.set(waveId, {
        gatePromise: promise,
        generation: storeGenerationRef.current,
        promise,
      });
    },
    []
  );

  const clearPendingServerFeedSeed = useCallback(
    (waveId: string, promise: Promise<ServerWaveFeedSeedResult>) => {
      if (pendingServerFeedSeedsRef.current.get(waveId)?.promise === promise) {
        pendingServerFeedSeedsRef.current.delete(waveId);
      }
    },
    []
  );

  const replacePendingServerFeedSeed = useCallback(
    (
      waveId: string,
      expectedPromise: Promise<ServerWaveFeedSeedResult>,
      promise: Promise<ServerWaveFeedSeedResult>
    ): boolean => {
      const pendingSeed = pendingServerFeedSeedsRef.current.get(waveId);
      if (
        pendingSeed?.gatePromise !== expectedPromise ||
        pendingSeed.promise !== expectedPromise ||
        pendingSeed.generation !== storeGenerationRef.current
      ) {
        return false;
      }

      pendingServerFeedSeedsRef.current.set(waveId, {
        ...pendingSeed,
        promise,
      });
      return true;
    },
    []
  );

  const expireServerFeedSeed = useCallback(
    (
      waveId: string,
      expectedPromise: Promise<ServerWaveFeedSeedResult>
    ): void => {
      const pendingSeed = pendingServerFeedSeedsRef.current.get(waveId);
      const ownsPendingSeed = pendingSeed?.gatePromise === expectedPromise;
      const ownsActiveSeed =
        activeServerFeedSeedGatePromisesRef.current.get(waveId) ===
        expectedPromise;
      if (!ownsPendingSeed && !ownsActiveSeed) {
        return;
      }

      if (ownsPendingSeed) {
        pendingServerFeedSeedsRef.current.delete(waveId);
      }
      if (ownsActiveSeed) {
        activeServerFeedSeedsRef.current.delete(waveId);
        activeServerFeedSeedGatePromisesRef.current.delete(waveId);
      }
      completedInitialRegistrationsRef.current.delete(waveId);
      committedServerFeedSeedsRef.current.delete(waveId);
      serverFeedSeedReadyCallbacksRef.current.delete(waveId);
    },
    []
  );

  const hasServerFeedSeed = useCallback(
    (waveId: string): boolean =>
      pendingServerFeedSeedsRef.current.has(waveId) ||
      activeServerFeedSeedsRef.current.has(waveId),
    []
  );

  const applyServerFeedSeed = useCallback(
    ({
      drops,
      hasNextPage,
      onReady,
      promise,
      waveId,
    }: {
      readonly drops: ApiDrop[];
      readonly hasNextPage: boolean;
      readonly onReady?: (() => void) | undefined;
      readonly promise: Promise<ServerWaveFeedSeedResult>;
      readonly waveId: string;
    }): boolean => {
      const pendingSeed = pendingServerFeedSeedsRef.current.get(waveId);
      if (
        pendingSeed?.promise !== promise ||
        pendingSeed.generation !== storeGenerationRef.current
      ) {
        return false;
      }
      pendingServerFeedSeedsRef.current.delete(waveId);

      const seedUpdate = formatWaveMessages(waveId, drops, {
        hasNextPage,
        isLoading: false,
      });
      const seedGeneration = pendingSeed.generation;
      activeServerFeedSeedsRef.current.add(waveId);
      activeServerFeedSeedGatePromisesRef.current.set(
        waveId,
        pendingSeed.gatePromise
      );
      appliedServerFeedSeedWaveIdsRef.current.add(waveId);
      if (onReady) {
        serverFeedSeedReadyCallbacksRef.current.set(waveId, onReady);
      }
      applyUpdate({
        update: seedUpdate,
        mergePolicy: "preserve-existing",
        generation: seedGeneration,
        onApplied: () => {
          admitWave(waveId);
          if (seedGeneration !== storeGenerationRef.current) {
            return;
          }
          committedServerFeedSeedsRef.current.add(waveId);
          releaseServerFeedSeedIfReady(waveId);
        },
      });
      return true;
    },
    [admitWave, applyUpdate, releaseServerFeedSeedIfReady]
  );

  const completeInitialServerFeedRegistration = useCallback(
    (waveId: string): void => {
      completedInitialRegistrationsRef.current.add(waveId);
      releaseServerFeedSeedIfReady(waveId);
    },
    [releaseServerFeedSeedIfReady]
  );

  const optimisticUpdateDrop = useCallback(
    ({
      waveId,
      dropId,
      update,
    }: {
      waveId: string;
      dropId: string;
      update: (draft: Drop) => Drop | void;
    }): { rollback: () => void } | null => {
      const wave = waveMessagesRef.current[waveId];
      if (!wave) {
        return null;
      }

      const existingDrop = wave.drops.find((drop) => drop.id === dropId);
      if (!existingDrop) {
        return null;
      }

      const original = cloneDrop(existingDrop);
      const draft = cloneDrop(existingDrop);
      const updated = update(draft) ?? draft;
      const changes = collectDropChanges(original, updated);

      if (changes.length === 0) {
        return null;
      }

      updateData({
        key: waveId,
        drops: [updated],
      });

      const rollback = () => {
        const latestWave = waveMessagesRef.current[waveId];
        if (!latestWave) {
          return;
        }

        const latestDrop = latestWave.drops.find((drop) => drop.id === dropId);
        if (!latestDrop) {
          return;
        }

        let nextDrop = cloneDrop(latestDrop);
        const nextDropRecord = toDropRecord(nextDrop);
        let shouldRollback = false;

        for (const {
          key,
          originalHasKey,
          optimisticHasKey,
          originalValue,
          optimisticValue,
        } of changes) {
          const currentHasKey = Object.hasOwn(nextDrop, key);
          const currentValue = currentHasKey ? nextDropRecord[key] : undefined;

          if (optimisticHasKey) {
            if (!valuesEqual(currentValue, optimisticValue)) {
              continue;
            }
          } else if (currentHasKey) {
            continue;
          }

          if (originalHasKey) {
            nextDropRecord[key] = cloneValue(originalValue);
          } else {
            delete nextDropRecord[key];
          }

          shouldRollback = true;
        }

        if (!shouldRollback) {
          return;
        }

        updateData({
          key: waveId,
          drops: [nextDrop],
        });
      };

      return { rollback };
    },
    [updateData]
  );

  // Bind destructive cache callbacks to the rendered profile generation so a
  // caller holding an old callback cannot mutate a newly populated profile.
  const removeDrops = useCallback(
    (waveId: string, dropIds: readonly string[]) => {
      if (storeGeneration !== storeGenerationRef.current) return;
      const currentWave = waveMessagesRef.current[waveId];
      // Deletes can precede the first cached message or an in-flight feed.
      const deleted =
        deletedDropIdsRef.current.get(waveId) ?? new Set<string>();
      dropIds.forEach((id) => deleted.add(id));
      deletedDropIdsRef.current.set(waveId, deleted);
      if (!currentWave || dropIds.length === 0) return;
      const removed = new Set(dropIds);
      const drops = currentWave.drops.filter((drop) => !removed.has(drop.id));
      if (drops.length === currentWave.drops.length) return;
      const updatedWave = { ...currentWave, drops };
      waveMessagesRef.current = {
        ...waveMessagesRef.current,
        [waveId]: updatedWave,
      };
      dirtyWaveIdsRef.current.add(waveId);
      flushNotifications();
    },
    [flushNotifications, storeGeneration]
  );

  const removeDrop = useCallback(
    (waveId: string, dropId: string) => {
      removeDrops(waveId, [dropId]);
    },
    [removeDrops]
  );

  const clearWave = useCallback(
    (waveId: string) => {
      if (storeGeneration !== storeGenerationRef.current) return false;
      releaseWaveState(waveId);
      const next = { ...waveMessagesRef.current };
      delete next[waveId];
      waveMessagesRef.current = next;
      forceRender();
      listenersRef.current[waveId]?.forEach((listener) => listener(undefined));
      return true;
    },
    [releaseWaveState, storeGeneration]
  );

  return {
    getData,
    subscribe,
    unsubscribe,
    trackActiveWave,
    isWaveInUse,
    subscribeToEvictions,
    updateData,
    registerPendingServerFeedSeed,
    clearPendingServerFeedSeed,
    replacePendingServerFeedSeed,
    expireServerFeedSeed,
    hasServerFeedSeed,
    applyServerFeedSeed,
    completeInitialServerFeedRegistration,
    removeDrop,
    removeDrops,
    clearWave,
    optimisticUpdateDrop,
  };
}

export default useWaveMessagesStore;
