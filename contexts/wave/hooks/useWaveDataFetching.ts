import { useCallback } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useWaveLoadingState } from "./useWaveLoadingState";
import { useWaveAbortController } from "./useWaveAbortController";
import { WaveDataStoreUpdater } from "./types";
import {
  fetchWaveMessages,
  formatWaveMessages,
  createEmptyWaveMessages,
  getHighestSerialNo,
} from "../utils/wave-messages-utils";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiWaveDropsFeed } from "../../../generated/models/ApiWaveDropsFeed";

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
        updateData(waveId, formatWaveMessages(waveId, drops, { isLoading: false }));
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
      updateData(waveId, createEmptyWaveMessages(waveId, { isLoading: false }));

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
      updateData(waveId, createEmptyWaveMessages(waveId, { isLoading: true }));

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
   * Fetches messages newer than a given serial number.
   * This is intended for background reconciliation after WebSocket updates.
   */
  const fetchNewestMessages = useCallback(
    async (
      waveId: string,
      sinceSerialNo: number | null,
      signal: AbortSignal
    ): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> => {
      // We need a slightly different API call here, fetching *newer* messages
      // Assuming a commonApiFetch structure or similar needs adjustment
      // For now, let's simulate the expected API call structure
      const params: Record<string, string> = {
        limit: "50", // Or another appropriate limit for fetching newest
      };
      if (sinceSerialNo !== null) {
        // IMPORTANT: Parameter name might differ, e.g., 'serial_no_greater_than'
        params.serial_no_limit = `${sinceSerialNo}`;
        params.search_strategy = "FIND_NEWER";
      }

      try {
        const data = await commonApiFetch<ApiWaveDropsFeed>({
          endpoint: `waves/${waveId}/drops`,
          params,
          signal,
        });

        
        const fetchedDrops = data.drops.map((drop) => ({ // Replace mockDrops with data.drops
          ...drop,
          wave: data.wave, // Replace mockWaveData with data.wave
        }));
        
        // Cast to ApiDrop[] for the helper function during mock phase
        const highestSerialNo = getHighestSerialNo(fetchedDrops as ApiDrop[]);
        console.log(`[Mock Fetch] Fetched ${fetchedDrops.length} new drops for ${waveId}. Highest serial: ${highestSerialNo}`);
        
        // Cast drops in the return object as well for the mock
        return { drops: fetchedDrops as ApiDrop[], highestSerialNo };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          console.log(`[WaveDataFetching] Fetch newest for ${waveId} aborted.`);
          // Re-throw abort errors to be handled by the caller (useWaveRealtimeUpdater)
          throw error;
        }
        console.error(
          `[WaveDataFetching] Error fetching newest messages for ${waveId}:`,
          error
        );
        return { drops: null, highestSerialNo: null }; // Return null on other errors
      }
    },
    [] // No dependencies needed for this fetch logic itself
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
    fetchNewestMessages,
  };
}
