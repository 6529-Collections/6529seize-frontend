"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
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

export type Listener = (data: WaveMessages | undefined) => void;

type Listeners = Set<Listener>; // Keep internal types non-exported
type KeyListeners = Record<string, Listeners>; // Keep internal types non-exported
type WaveMessagesMergePolicy = "standard" | "preserve-existing";
type QueuedWaveMessagesUpdate = {
  readonly update: WaveMessagesUpdate;
  readonly mergePolicy: WaveMessagesMergePolicy;
  readonly onApplied?: (() => void) | undefined;
  readonly seedGeneration?: number | undefined;
};
type PendingServerFeedSeed = {
  readonly gatePromise: Promise<ServerWaveFeedSeedResult>;
  readonly generation: number;
  readonly promise: Promise<ServerWaveFeedSeedResult>;
};

type KnownWaveScopes = {
  readonly profileScopedWaveIds: ReadonlySet<string>;
  readonly publicWaveIds: ReadonlySet<string>;
};

const createEmptyWaveMessages = (waveId: string): WaveMessages => ({
  id: waveId,
  isLoading: false,
  isLoadingNextPage: false,
  hasNextPage: false,
  drops: [],
  latestFetchedSerialNo: null,
});

const applyWaveMessagesUpdate = ({
  existingWaveMessages,
  hasAuthoritativePagination,
  mergePolicy,
  update,
}: {
  readonly existingWaveMessages: WaveMessages | undefined;
  readonly hasAuthoritativePagination: boolean;
  readonly mergePolicy: WaveMessagesMergePolicy;
  readonly update: WaveMessagesUpdate;
}): WaveMessages => {
  const updatedWaveMessages = {
    ...(existingWaveMessages ?? createEmptyWaveMessages(update.key)),
  };
  const canReplaceExistingFields =
    mergePolicy === "standard" || existingWaveMessages === undefined;

  if (update.isLoading !== undefined && canReplaceExistingFields) {
    updatedWaveMessages.isLoading = update.isLoading;
  }
  if (update.isLoadingNextPage !== undefined && canReplaceExistingFields) {
    updatedWaveMessages.isLoadingNextPage = update.isLoadingNextPage;
  }
  if (
    update.hasNextPage !== undefined &&
    (canReplaceExistingFields || !hasAuthoritativePagination)
  ) {
    updatedWaveMessages.hasNextPage = update.hasNextPage;
  }
  if (update.drops !== undefined) {
    updatedWaveMessages.drops =
      mergePolicy === "preserve-existing"
        ? mergeDrops(update.drops, updatedWaveMessages.drops)
        : mergeDrops(updatedWaveMessages.drops, update.drops);
  }
  if (typeof update.latestFetchedSerialNo === "number") {
    updatedWaveMessages.latestFetchedSerialNo = maxOrNull(
      updatedWaveMessages.latestFetchedSerialNo,
      update.latestFetchedSerialNo
    );
  }

  return updatedWaveMessages;
};

const shouldMarkAuthoritativePagination = ({
  existingWaveMessages,
  mergePolicy,
  update,
}: {
  readonly existingWaveMessages: WaveMessages | undefined;
  readonly mergePolicy: WaveMessagesMergePolicy;
  readonly update: WaveMessagesUpdate;
}): boolean => {
  const hasMessages =
    (existingWaveMessages?.drops.length ?? 0) > 0 ||
    (update.drops?.length ?? 0) > 0;

  return (
    update.hasNextPage !== undefined &&
    (mergePolicy === "preserve-existing" || hasMessages)
  );
};

function useWaveMessagesStore() {
  const [, forceRender] = useReducer((version: number) => version + 1, 0);
  const waveMessagesRef = useRef<Record<string, WaveMessages>>({});
  // Use useRef to keep listeners stable across renders
  const listenersRef = useRef<KeyListeners>({});
  const updateQueueRef = useRef<QueuedWaveMessagesUpdate[]>([]);
  const isProcessingRef = useRef<boolean>(false);
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
  const knownProfileScopedWaveIdsRef = useRef<Set<string>>(new Set());
  const inferredProfileScopedWaveIdsRef = useRef<Set<string>>(new Set());
  const publicWaveIdsRef = useRef<Set<string>>(new Set());
  const serverFeedSeedGenerationRef = useRef(0);

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
    const resetMessagesForProfileSwitch = () => {
      const resetWaveIds = new Set([
        ...pendingServerFeedSeedsRef.current.keys(),
        ...activeServerFeedSeedsRef.current,
        ...appliedServerFeedSeedWaveIdsRef.current,
        ...knownProfileScopedWaveIdsRef.current,
        ...inferredProfileScopedWaveIdsRef.current,
      ]);
      serverFeedSeedGenerationRef.current += 1;
      pendingServerFeedSeedsRef.current.clear();
      activeServerFeedSeedsRef.current.clear();
      activeServerFeedSeedGatePromisesRef.current.clear();
      appliedServerFeedSeedWaveIdsRef.current.clear();
      completedInitialRegistrationsRef.current.clear();
      committedServerFeedSeedsRef.current.clear();
      serverFeedSeedReadyCallbacksRef.current.clear();
      knownProfileScopedWaveIdsRef.current.clear();
      inferredProfileScopedWaveIdsRef.current.clear();
      updateQueueRef.current = updateQueueRef.current.filter(
        ({ update }) => !resetWaveIds.has(update.key)
      );
      resetWaveIds.forEach((waveId) =>
        authoritativePaginationWaveIdsRef.current.delete(waveId)
      );

      if (resetWaveIds.size === 0) {
        return;
      }

      const nextState = { ...waveMessagesRef.current };
      let didClearCachedData = false;
      for (const waveId of resetWaveIds) {
        if (nextState[waveId] !== undefined) {
          delete nextState[waveId];
          didClearCachedData = true;
        }
      }

      if (didClearCachedData) {
        waveMessagesRef.current = nextState;
        forceRender();
      }

      for (const waveId of resetWaveIds) {
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
      resetMessagesForProfileSwitch
    );
    return () => {
      globalThis.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        resetMessagesForProfileSwitch
      );
    };
  }, []);

  const setKnownWaveScopes = useCallback(
    ({ profileScopedWaveIds, publicWaveIds }: KnownWaveScopes): void => {
      const nextProfileScopedWaveIds = new Set(profileScopedWaveIds);
      const nextPublicWaveIds = new Set(publicWaveIds);
      for (const waveId of nextProfileScopedWaveIds) {
        nextPublicWaveIds.delete(waveId);
      }
      knownProfileScopedWaveIdsRef.current = nextProfileScopedWaveIds;
      publicWaveIdsRef.current = nextPublicWaveIds;

      for (const waveId of nextPublicWaveIds) {
        inferredProfileScopedWaveIdsRef.current.delete(waveId);
      }
    },
    []
  );

  // Stable function to get data for a key
  const getData = useCallback((key: string): WaveMessages | undefined => {
    return waveMessagesRef.current[key];
  }, []);

  // Stable function to subscribe a listener for a specific key
  const subscribe = useCallback((key: string, callback: Listener) => {
    const keyListeners = listenersRef.current[key] ?? new Set();
    keyListeners.add(callback);
    listenersRef.current[key] = keyListeners;
    // Provide initial value immediately upon subscription
    callback(waveMessagesRef.current[key]);
  }, []);

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

  const processQueue = useCallback(function processQueueItem(): void {
    if (isProcessingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const queuedUpdate = updateQueueRef.current.shift();

    if (!queuedUpdate) {
      isProcessingRef.current = false;
      return; // Should not happen based on length check, but safety first
    }
    const { mergePolicy, onApplied, seedGeneration, update } = queuedUpdate;
    if (
      seedGeneration !== undefined &&
      seedGeneration !== serverFeedSeedGenerationRef.current
    ) {
      isProcessingRef.current = false;
      globalThis.queueMicrotask(processQueueItem);
      return;
    }

    const existingWaveMessages = waveMessagesRef.current[update.key];
    const hasAuthoritativePagination =
      authoritativePaginationWaveIdsRef.current.has(update.key);
    const updatedWaveMessages = applyWaveMessagesUpdate({
      existingWaveMessages,
      hasAuthoritativePagination,
      mergePolicy,
      update,
    });
    const notifyValue = updatedWaveMessages;
    const nextState = {
      ...waveMessagesRef.current,
      [update.key]: updatedWaveMessages,
    };
    // Drops-only realtime/target updates create a default false cursor but do
    // not own pagination until a feed or page result supplies messages.
    if (
      shouldMarkAuthoritativePagination({
        existingWaveMessages,
        mergePolicy,
        update,
      })
    ) {
      authoritativePaginationWaveIdsRef.current.add(update.key);
    }
    waveMessagesRef.current = nextState;
    forceRender();
    onApplied?.();

    // Notify listeners after the state update for this item
    // Use setTimeout to ensure notification happens after the current execution context,
    // allowing React's batching to potentially complete.
    setTimeout(() => {
      const keyListeners = listenersRef.current[update.key];
      if (
        keyListeners &&
        (seedGeneration === undefined ||
          seedGeneration === serverFeedSeedGenerationRef.current)
      ) {
        keyListeners.forEach((listener) => listener(notifyValue));
      }

      // Finished processing this item, allow the next one
      isProcessingRef.current = false;
      // Trigger processing for the next item if queue is not empty
      globalThis.queueMicrotask(processQueueItem);
    }, 0);
  }, []); // Dependencies: forceRender (stable), listenersRef (stable)

  // Function to add an update to the queue and trigger processing
  const updateData = useCallback(
    (update: WaveMessagesUpdate) => {
      const isPublicWave = publicWaveIdsRef.current.has(update.key);
      if (!isPublicWave) {
        inferredProfileScopedWaveIdsRef.current.add(update.key);
      }
      updateQueueRef.current.push({
        update,
        mergePolicy: "standard",
        seedGeneration: isPublicWave
          ? undefined
          : serverFeedSeedGenerationRef.current,
      });
      // Start processing if not already running
      processQueue();
    },
    [processQueue] // Dependency: processQueue
  );

  const registerPendingServerFeedSeed = useCallback(
    (waveId: string, promise: Promise<ServerWaveFeedSeedResult>) => {
      activeServerFeedSeedsRef.current.delete(waveId);
      activeServerFeedSeedGatePromisesRef.current.delete(waveId);
      completedInitialRegistrationsRef.current.delete(waveId);
      committedServerFeedSeedsRef.current.delete(waveId);
      serverFeedSeedReadyCallbacksRef.current.delete(waveId);
      pendingServerFeedSeedsRef.current.set(waveId, {
        gatePromise: promise,
        generation: serverFeedSeedGenerationRef.current,
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
        pendingSeed.generation !== serverFeedSeedGenerationRef.current
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
        pendingSeed.generation !== serverFeedSeedGenerationRef.current
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
      updateQueueRef.current.push({
        update: seedUpdate,
        mergePolicy: "preserve-existing",
        seedGeneration,
        onApplied: () => {
          if (seedGeneration !== serverFeedSeedGenerationRef.current) {
            return;
          }
          committedServerFeedSeedsRef.current.add(waveId);
          releaseServerFeedSeedIfReady(waveId);
        },
      });
      processQueue();
      return true;
    },
    [processQueue, releaseServerFeedSeedIfReady]
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

  const removeDrop = useCallback((waveId: string, dropId: string) => {
    const currentWaveMessages = waveMessagesRef.current;
    const currentWave = currentWaveMessages[waveId] ?? {
      id: waveId,
      isLoading: false,
      isLoadingNextPage: false,
      hasNextPage: false,
      drops: [],
      latestFetchedSerialNo: null,
    };

    const updatedWaveMessages: WaveMessages = {
      ...currentWave,
      drops: currentWave.drops.filter((drop) => drop.id !== dropId),
    };
    const nextState = {
      ...currentWaveMessages,
      [waveId]: updatedWaveMessages,
    };

    waveMessagesRef.current = nextState;
    forceRender();

    const keyListeners = listenersRef.current[waveId];
    if (keyListeners) {
      keyListeners.forEach((listener) => listener(updatedWaveMessages));
    }
  }, []);

  return {
    getData,
    subscribe,
    unsubscribe,
    setKnownWaveScopes,
    updateData,
    registerPendingServerFeedSeed,
    clearPendingServerFeedSeed,
    replacePendingServerFeedSeed,
    expireServerFeedSeed,
    hasServerFeedSeed,
    applyServerFeedSeed,
    completeInitialServerFeedRegistration,
    removeDrop,
    optimisticUpdateDrop,
  };
}

export default useWaveMessagesStore;
