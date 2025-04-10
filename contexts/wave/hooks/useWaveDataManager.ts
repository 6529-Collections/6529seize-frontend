import { useCallback, useRef, useEffect } from "react";
import { WaveMessages } from "./useWaveMessagesStore";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { fetchWaveMessages } from "../utils/wave-messages-utils";

// Define the shape of the functions passed from the store
interface WaveDataStoreUpdater {
  readonly updateData: (key: string, value: WaveMessages | undefined) => void;
  readonly getData: (key: string) => WaveMessages | undefined;
}

// Tracks loading state for each wave
interface LoadingState {
  isLoading: boolean;
  promise: Promise<ApiDrop[] | null> | null;
}

export function useWaveDataManager({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Keep track of loading states
  const loadingStates = useRef<Record<string, LoadingState>>({});
  // Track abort controllers for cancellation
  const abortControllers = useRef<Record<string, AbortController>>({});

  // Function to cancel a specific wave data fetch
  const cancelWaveDataFetch = useCallback((waveId: string) => {
    if (abortControllers.current[waveId]) {
      abortControllers.current[waveId].abort();
      delete abortControllers.current[waveId];
    }
    
    if (loadingStates.current[waveId]) {
      loadingStates.current[waveId].isLoading = false;
      loadingStates.current[waveId].promise = null;
    }
  }, []);

  const activateWave = useCallback(
    async (waveId: string) => {
      // Check if data already exists
      const existingData = getData(waveId);
      if (!!existingData?.drops.length) {
        return;
      }

      // Get or initialize loading state
      const loadingState = loadingStates.current[waveId] || {
        isLoading: false,
        promise: null,
      };
      loadingStates.current[waveId] = loadingState;

      // If already loading, return existing promise
      if (loadingState.isLoading && loadingState.promise) {
        return loadingState.promise;
      }

      loadingState.isLoading = true;

      updateData(waveId, {
        id: waveId,
        isLoading: true,
        drops: [],
      });

      // Cancel any existing request for this wave
      if (abortControllers.current[waveId]) {
        abortControllers.current[waveId].abort();
      }

      // Create a new abort controller
      const controller = new AbortController();
      abortControllers.current[waveId] = controller;

      // Create a new promise with the abort signal
      const fetchPromise = fetchWaveMessages(waveId, null, controller.signal)
        .then((drops) => {
          // Clear loading state when done
          if (loadingStates.current[waveId]) {
            loadingStates.current[waveId].isLoading = false;
            loadingStates.current[waveId].promise = null;
          }

          // Update data in store if we got results
          if (drops) {
            updateData(waveId, {
              id: waveId,
              isLoading: false,
              drops: drops.map((drop) => ({
                ...drop,
                stableKey: drop.id,
                stableHash: drop.id,
              })),
            });
          }

          return drops;
        })
        .catch((error) => {
          // Handle abort errors differently than other errors
          if (error.name === 'AbortError') {
            console.log(`[WaveDataManager] Request for wave ${waveId} was cancelled`);
            return null;
          }

          // Clear loading state on error
          if (loadingStates.current[waveId]) {
            loadingStates.current[waveId].isLoading = false;
            loadingStates.current[waveId].promise = null;
          }

          updateData(waveId, {
            id: waveId,
            isLoading: false,
            drops: [],
          });

          console.error(
            `[WaveDataManager] Error fetching messages for ${waveId}:`,
            error
          );
          return null;
        })
        .finally(() => {
          // Clean up abort controller reference
          if (abortControllers.current[waveId] === controller) {
            delete abortControllers.current[waveId];
          }
        });

      // Store the promise
      loadingState.promise = fetchPromise;

      return fetchPromise;
    },
    [updateData, getData]
  );

  const registerWave = useCallback(
    (waveId: string) => {
      activateWave(waveId);
    },
    [activateWave]
  );

  // Clean up all pending requests when the hook unmounts
  useEffect(() => {
    return () => {
      Object.keys(abortControllers.current).forEach((waveId) => {
        cancelWaveDataFetch(waveId);
      });
    };
  }, [cancelWaveDataFetch]);

  return { registerWave, cancelWaveDataFetch };
}
