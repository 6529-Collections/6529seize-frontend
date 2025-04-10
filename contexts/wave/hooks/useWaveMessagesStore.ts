import { useCallback, useEffect, useRef, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

// Export the types so they can be imported elsewhere
export type WaveMessages = {
  readonly id: string;
  readonly isLoading: boolean;
  readonly drops: ExtendedDrop[];
};
export type Listener = (data: WaveMessages | undefined) => void;

type Listeners = Set<Listener>; // Keep internal types non-exported
type KeyListeners = Record<string, Listeners>; // Keep internal types non-exported

function useWaveMessagesStore() {
  const [waveMessages, setWaveMessages] = useState<
    Record<string, WaveMessages>
  >({});
  // Use useRef to keep listeners stable across renders
  const listenersRef = useRef<KeyListeners>({});

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

  // Function to update data and notify listeners for a specific key
  const updateData = useCallback(
    (key: string, value: WaveMessages | undefined) => {
      setWaveMessages((prevWaveMessages) => {
        const newWaveMessages = { ...prevWaveMessages };
        if (value === undefined) {
          delete newWaveMessages[key];
        } else {
          newWaveMessages[key] = value;
        }
        return newWaveMessages;
      });

      // Notify listeners *after* state update is triggered
      // Note: state updates might be async, listeners get the *new* state idea
      // For more robust notification, you might useEffect on `store` change
      const keyListeners = listenersRef.current[key];
      if (keyListeners) {
        // Pass the new value directly
        keyListeners.forEach((listener) => listener(value));
      }
    },
    []
  ); // No dependencies needed

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

  return { getData, subscribe, unsubscribe, updateData };
}

export default useWaveMessagesStore;
