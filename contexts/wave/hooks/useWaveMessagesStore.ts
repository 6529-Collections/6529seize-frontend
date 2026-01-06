"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { maxOrNull, mergeDrops } from "../utils/wave-messages-utils";
import type { Drop } from "@/helpers/waves/drop.helpers";
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

export type Listener = (data: WaveMessages | undefined) => void;

type Listeners = Set<Listener>; // Keep internal types non-exported
type KeyListeners = Record<string, Listeners>; // Keep internal types non-exported

function useWaveMessagesStore() {
  const [waveMessages, setWaveMessages] = useState<
    Record<string, WaveMessages>
  >({});
  const waveMessagesRef = useRef<Record<string, WaveMessages>>({});
  // Use useRef to keep listeners stable across renders
  const listenersRef = useRef<KeyListeners>({});
  const updateQueueRef = useRef<WaveMessagesUpdate[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  useEffect(() => {
    waveMessagesRef.current = waveMessages;
  }, [waveMessages]);

  // Stable function to get data for a key
  const getData = useCallback((key: string): WaveMessages | undefined => {
    return waveMessagesRef.current[key];
  }, []);

  // Stable function to subscribe a listener for a specific key
  const subscribe = useCallback(
    (key: string, callback: Listener) => {
      const keyListeners = listenersRef.current[key] ?? new Set();
      keyListeners.add(callback);
      listenersRef.current[key] = keyListeners;
      // Provide initial value immediately upon subscription
      callback(waveMessages[key]);
    },
    [waveMessages]
  ); // Include store dependency to give the latest value on subscribe

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

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const update = updateQueueRef.current.shift();

    if (!update) {
      isProcessingRef.current = false;
      return; // Should not happen based on length check, but safety first
    }

    let notifyValue: WaveMessages | undefined;

    setWaveMessages((prevWaveMessages) => {
      const newWaveMessages = { ...prevWaveMessages };
      if (!newWaveMessages[update.key]) {
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

      if (update.isLoading !== undefined) {
        updatedWaveMessages.isLoading = update.isLoading;
      }
      if (update.isLoadingNextPage !== undefined) {
        updatedWaveMessages.isLoadingNextPage = update.isLoadingNextPage;
      }
      if (update.hasNextPage !== undefined) {
        updatedWaveMessages.hasNextPage = update.hasNextPage;
      }
      if (update.drops !== undefined) {
        updatedWaveMessages.drops = mergeDrops(
          updatedWaveMessages.drops!,
          update.drops
        );
      }

      if (typeof update.latestFetchedSerialNo === "number") {
        updatedWaveMessages.latestFetchedSerialNo = maxOrNull(
          updatedWaveMessages.latestFetchedSerialNo,
          update.latestFetchedSerialNo
        );
      }

      notifyValue = updatedWaveMessages as WaveMessages; // Capture the value to notify
      const nextState = {
        ...newWaveMessages,
        [update.key]: updatedWaveMessages,
      };
      waveMessagesRef.current = nextState as Record<string, WaveMessages>;
      return nextState;
    });

    // Notify listeners after the state update for this item
    // Use setTimeout to ensure notification happens after the current execution context,
    // allowing React's batching to potentially complete.
    setTimeout(() => {
      const keyListeners = listenersRef.current[update.key];
      if (keyListeners && notifyValue) {
        keyListeners.forEach((listener) => listener(notifyValue));
      }

      // Finished processing this item, allow the next one
      isProcessingRef.current = false;
      // Trigger processing for the next item if queue is not empty
      processQueue();
    }, 0);
  }, []); // Dependencies: setWaveMessages (implicitly stable), listenersRef (stable)

  // Function to add an update to the queue and trigger processing
  const updateData = useCallback(
    (update: WaveMessagesUpdate) => {
      updateQueueRef.current.push(update);
      // Start processing if not already running
      processQueue();
    },
    [processQueue] // Dependency: processQueue
  );

  const cloneDrop = (drop: Drop): Drop => cloneValue(drop);

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
      const wave = waveMessages[waveId];
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
    [waveMessages, updateData]
  );

  const removeDrop = useCallback(
    (waveId: string, dropId: string) => {
      let notify: WaveMessages | undefined;
      setWaveMessages((prevWaveMessages) => {
        const newWaveMessages = { ...prevWaveMessages };
        if (!newWaveMessages[waveId]) {
          newWaveMessages[waveId] = {
            id: waveId,
            isLoading: false,
            isLoadingNextPage: false,
            hasNextPage: false,
            drops: [],
            latestFetchedSerialNo: null,
          };
        }

        const updatedWaveMessages = {
          ...newWaveMessages[waveId],
          drops: newWaveMessages[waveId].drops.filter(
            (drop) => drop.id !== dropId
          ),
        };

        notify = updatedWaveMessages;
        const nextState = {
          ...newWaveMessages,
          [waveId]: updatedWaveMessages,
        };
        waveMessagesRef.current = nextState;
        return nextState;
      });

      // Notify listeners *after* state update is triggered
      // Note: state updates might be async, listeners get the *new* state idea
      const keyListeners = listenersRef.current[waveId];

      if (keyListeners && notify) {
        // Pass the new value directly
        keyListeners.forEach((listener) => listener(notify));
      }
    },
    [waveMessages]
  );

  return {
    getData,
    subscribe,
    unsubscribe,
    updateData,
    removeDrop,
    optimisticUpdateDrop,
  };
}

export default useWaveMessagesStore;
