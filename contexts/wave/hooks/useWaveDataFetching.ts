import { useCallback } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useWaveLoadingState } from "./useWaveLoadingState";
import { useWaveAbortController } from "./useWaveAbortController";
import { WaveDataStoreUpdater } from "./types";
import {
  fetchWaveMessages,
  formatWaveMessages,
  createEmptyWaveMessages,
} from "../utils/wave-messages-utils";

export function useWaveDataFetching({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Compose with the smaller hooks
  const {
    getLoadingState,
    setLoadingState,
    setPromise,
    clearLoadingState,
  } = useWaveLoadingState();
  
  const {
    cancelFetch,
    createController,
    cleanupController,
    cancelAllFetches,
  } = useWaveAbortController();

  /**
   * Checks if a wave already has data, returns true if loading should continue
   */
  const shouldFetchWaveData = useCallback(
    (waveId: string): boolean => {
      const existingData = getData(waveId);
      return !existingData?.drops.length;
    },
    [getData]
  );

  /**
   * Handles successful fetch results
   */
  const handleFetchSuccess = useCallback(
    (waveId: string, drops: ApiDrop[] | null) => {
      // Clear loading state when done
      clearLoadingState(waveId);

      // Update data in store if we got results
      if (drops) {
        updateData(waveId, formatWaveMessages(waveId, drops, false));
      }

      return drops;
    },
    [updateData, clearLoadingState]
  );

  /**
   * Handles fetch errors
   */
  const handleFetchError = useCallback(
    (waveId: string, error: unknown) => {
      // Handle abort errors differently than other errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`[WaveDataManager] Request for wave ${waveId} was cancelled`);
        return null;
      }

      // Clear loading state on error
      clearLoadingState(waveId);

      // Update store with empty data
      updateData(waveId, createEmptyWaveMessages(waveId, false));

      console.error(
        `[WaveDataManager] Error fetching messages for ${waveId}:`,
        error
      );
      return null;
    },
    [updateData, clearLoadingState]
  );

  /**
   * Main function to fetch and activate wave data
   */
  const activateWave = useCallback(
    async (waveId: string) => {
      // Check if we need to fetch data
      if (!shouldFetchWaveData(waveId)) {
        return;
      }

      // Get or initialize loading state and check if we should continue
      const { state: loadingState, shouldContinue } = getLoadingState(waveId);
      if (!shouldContinue) {
        return loadingState.promise;
      }

      // Mark as loading
      setLoadingState(waveId, true);
      updateData(waveId, createEmptyWaveMessages(waveId, true));

      // Setup abort controller
      const controller = createController(waveId);

      // Create a new promise with the abort signal
      const fetchPromise = fetchWaveMessages(waveId, null, controller.signal)
        .then((drops) => handleFetchSuccess(waveId, drops))
        .catch((error) => handleFetchError(waveId, error))
        .finally(() => cleanupController(waveId, controller));

      // Store the promise
      setPromise(waveId, fetchPromise);

      return fetchPromise;
    },
    [
      shouldFetchWaveData,
      getLoadingState,
      setLoadingState,
      updateData,
      createController,
      handleFetchSuccess,
      handleFetchError,
      cleanupController,
      setPromise,
    ]
  );

  /**
   * Simplified interface to activate a wave
   */
  const registerWave = useCallback(
    (waveId: string) => {
      activateWave(waveId);
    },
    [activateWave]
  );

  const cancelWaveDataFetch = cancelFetch;

  return {
    registerWave,
    cancelWaveDataFetch,
    activateWave,
  };
}