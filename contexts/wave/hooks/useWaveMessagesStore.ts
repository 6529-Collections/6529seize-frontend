"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { maxOrNull, mergeDrops } from "../utils/wave-messages-utils";
import { WaveMessages, WaveMessagesUpdate } from "./types";

export type Listener = (data: WaveMessages | undefined) => void;

type Listeners = Set<Listener>; // Keep internal types non-exported
type KeyListeners = Record<string, Listeners>; // Keep internal types non-exported

function useWaveMessagesStore() {
  const [waveMessages, setWaveMessages] = useState<
    Record<string, WaveMessages>
  >({});
  // Use useRef to keep listeners stable across renders
  const listenersRef = useRef<KeyListeners>({});
  const updateQueueRef = useRef<WaveMessagesUpdate[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Stable function to get data for a key
  const getData = useCallback(
    (key: string): WaveMessages | undefined => {
      return waveMessages[key];
    },
    [waveMessages]
  ); // Dependency on store is fine here

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
        ...newWaveMessages[update.key],
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
          updatedWaveMessages.drops,
          update.drops
        );
      }

      if (typeof update.latestFetchedSerialNo === "number") {
        updatedWaveMessages.latestFetchedSerialNo = maxOrNull(
          updatedWaveMessages.latestFetchedSerialNo,
          update.latestFetchedSerialNo
        );
      }

      notifyValue = updatedWaveMessages; // Capture the value to notify
      return {
        ...newWaveMessages,
        [update.key]: updatedWaveMessages,
      };
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
        return {
          ...newWaveMessages,
          [waveId]: updatedWaveMessages,
        };
      });

      // Notify listeners *after* state update is triggered
      // Note: state updates might be async, listeners get the *new* state idea
      // For more robust notification, you might useEffect on `store` change
      const keyListeners = listenersRef.current[waveId];

      if (keyListeners && notify) {
        // Pass the new value directly
        keyListeners.forEach((listener) => listener(notify));
      }
    },
    [waveMessages]
  );

  // Optional: Effect to notify listeners if state changes outside updateData
  // This is a more robust way to ensure listeners are called *after* the state has definitively updated.
  useEffect(() => {
    // This effect runs after each render where `store` might have changed.
    // We iterate through all tracked keys in listenersRef.
    Object.keys(listenersRef.current).forEach((key) => {
      const keyListeners = listenersRef.current[key];
      const currentValue = waveMessages[key]; // Get the current value from the updated store
      if (keyListeners) {
        keyListeners.forEach((listener) => listener(currentValue));
        // Be cautious: This might notify even if the specific key didn't change,
        // if the store object reference changed. The selector hook below handles this.
      }
    });
  }, [waveMessages]); // Run when the store state changes

  return { getData, subscribe, unsubscribe, updateData, removeDrop };
}

export default useWaveMessagesStore;
