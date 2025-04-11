import { useCallback } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useWaveLoadingState } from "./useWaveLoadingState";
import { useWaveAbortController } from "./useWaveAbortController";
import { WaveDataStoreUpdater } from "./types";
import {
  fetchWaveMessages,
  formatWaveMessages,
  createEmptyWaveMessages,
  fetchNewestWaveMessages,
} from "../utils/wave-messages-utils";

// Define the limit constant used by the fetch utility
const FETCH_NEWEST_LIMIT = 50;

export function useWaveDataFetching({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Compose with the smaller hooks
  const { getLoadingState, setLoadingState, setPromise, clearLoadingState } =
    useWaveLoadingState();

  const { cancelFetch, createController, cleanupController } =
    useWaveAbortController();

  /**
   * Checks if a wave already has data, returns true if loading should continue
   */
  const hasWaveData = useCallback(
    (waveId: string): boolean => {
      const existingData = getData(waveId);
      return !!existingData?.drops.length;
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
        updateData(
          waveId,
          formatWaveMessages(waveId, drops, { isLoading: false })
        );
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
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log(
          `[WaveDataManager] Request for wave ${waveId} was cancelled`
        );
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
    async (waveId: string, syncNewest = false) => {
      // Check if we need to fetch data
      if (hasWaveData(waveId)) {
        if (syncNewest) {
          const wave = getData(waveId);
          if (wave) {
            const highestSerialNo = Math.max(
              ...wave.drops.map((drop) => drop.serial_no)
            );
            if (highestSerialNo) {
              syncNewestMessages(
                waveId,
                highestSerialNo,
                new AbortController().signal
              );
            }
          }
        }
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
      hasWaveData,
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
   * Fetches ALL messages newer than a given serial number by potentially
   * looping internal API calls until caught up.
   * This is intended for background reconciliation after WebSocket updates.
   */
  const syncNewestMessages = useCallback(
    async (
      waveId: string,
      initialSinceSerialNo: number,
      signal: AbortSignal
    ): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> => {
      let allFetchedDrops: ApiDrop[] = [];
      let currentSinceSerialNo = initialSinceSerialNo;
      let keepFetching = true;
      let overallHighestSerialNo: number | null = initialSinceSerialNo; // Track highest overall

      console.log(
        `[WaveDataFetching] Starting fetchNewest loop for ${waveId}, since: ${initialSinceSerialNo}`
      );

      while (keepFetching && !signal.aborted) {
        try {
          console.log(
            `[WaveDataFetching] Loop iteration for ${waveId}, since: ${currentSinceSerialNo}`
          );
          const { drops: fetchedChunk, highestSerialNo: chunkHighestSerial } =
            await fetchNewestWaveMessages(
              // Call the utility function
              waveId,
              currentSinceSerialNo,
              FETCH_NEWEST_LIMIT,
              signal
            );

          // Check if aborted during the fetch utility call
          if (signal.aborted) {
            console.log(
              `[WaveDataFetching] Loop for ${waveId} aborted during fetch.`
            );
            throw new DOMException("Aborted", "AbortError");
          }

          if (fetchedChunk && fetchedChunk.length > 0) {
            console.log(
              `[WaveDataFetching] Loop fetched chunk of ${fetchedChunk.length} for ${waveId}.`
            );
            allFetchedDrops = allFetchedDrops.concat(fetchedChunk);
            // Update highest serial number seen so far
            if (chunkHighestSerial !== null) {
              overallHighestSerialNo = Math.max(
                overallHighestSerialNo ?? -1,
                chunkHighestSerial
              );
            }

            if (chunkHighestSerial !== null) {
              currentSinceSerialNo = chunkHighestSerial; // Use the highest from this chunk for the next iteration
            } else {
              console.log(
                `[WaveDataFetching] Loop finished for ${waveId}: No highest serial number found.`
              );
              keepFetching = false;
            }

            // Stop loop if fetch returned fewer drops than the limit, or if highestSerial is null
            if (
              fetchedChunk.length < FETCH_NEWEST_LIMIT ||
              currentSinceSerialNo === null
            ) {
              console.log(
                `[WaveDataFetching] Loop finished for ${waveId}: Fetched ${fetchedChunk.length} < ${FETCH_NEWEST_LIMIT} or null serial.`
              );
              keepFetching = false;
            } else {
              console.log(
                `[WaveDataFetching] Loop limit hit for ${waveId}, continuing fetch.`
              );
            }
          } else if (fetchedChunk) {
            // Success, but 0 drops returned
            console.log(
              `[WaveDataFetching] Loop finished for ${waveId}: 0 drops returned.`
            );
            keepFetching = false; // No more drops found
          } else {
            // fetchNewestWaveMessages utility returned null drops (error occurred)
            console.error(
              `[WaveDataFetching] Loop for ${waveId} encountered an error from utility.`
            );
            // Error logged in utility, return failure for the whole operation
            return { drops: null, highestSerialNo: null };
          }
        } catch (error) {
          // Handle errors specifically from the fetchNewestWaveMessages call or aborts
          if (error instanceof DOMException && error.name === "AbortError") {
            console.log(
              `[WaveDataFetching] Loop for ${waveId} caught abort error.`
            );
            throw error; // Re-throw abort to be handled by caller
          }
          // Log other errors from within the loop/utility call
          console.error(
            `[WaveDataFetching] Error during fetchNewest loop for ${waveId}:`,
            error
          );
          return { drops: null, highestSerialNo: null }; // Indicate failure
        }
      } // end while loop

      if (signal.aborted) {
        console.log(
          `[WaveDataFetching] Fetch newest loop for ${waveId} detected abort after loop.`
        );
        throw new DOMException("Aborted", "AbortError");
      }

      console.log(
        `[WaveDataFetching] Fetch newest loop completed for ${waveId}. Total drops: ${allFetchedDrops.length}. Final highest serial: ${overallHighestSerialNo}`
      );

      // Return all accumulated drops and the overall highest serial number found
      return {
        drops: allFetchedDrops,
        highestSerialNo: overallHighestSerialNo,
      };
    },
    [] // No dependencies needed, it uses the imported utility
  );

  /**
   * Simplified interface to activate a wave
   */
  const registerWave = useCallback(
    (waveId: string, syncNewest = false) => {
      activateWave(waveId, syncNewest);
    },
    [activateWave]
  );

  const cancelWaveDataFetch = cancelFetch;

  return {
    registerWave,
    cancelWaveDataFetch,
    syncNewestMessages,
  };
}
