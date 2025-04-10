import { useCallback, useRef } from "react";
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

      // Create a new promise
      const fetchPromise = fetchWaveMessages(waveId, null)
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

  return { registerWave };
}
