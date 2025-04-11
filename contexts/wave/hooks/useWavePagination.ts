import { useCallback, useRef } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useWaveAbortController } from "./useWaveAbortController";
import { WaveDataStoreUpdater } from "./types";
import { fetchWaveMessages, mergeDrops } from "../utils/wave-messages-utils";

// Tracks which waves are currently loading next page
interface PaginationState {
  isLoading: boolean;
  promise: Promise<ApiDrop[] | null> | null;
}

export function useWavePagination({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Use the common hooks
  const {
    cancelFetch: cancelAbort,
    createController,
    cleanupController,
  } = useWaveAbortController();

  // Track pagination loading state
  const paginationStates = useRef<Record<string, PaginationState>>({});

  /**
   * Gets the oldest message's serial number for pagination
   */
  const getOldestMessageSerialNo = useCallback(
    (waveId: string): number | null => {
      const data = getData(waveId);
      if (!data?.drops.length) {
        return null;
      }

      // Sort by serial_no and get the smallest (oldest) one
      const serialNos = data.drops.map((drop) => drop.serial_no);
      return Math.min(...serialNos);
    },
    [getData]
  );

  /**
   * Updates store with new paginated data
   */
  const updateWithPaginatedData = useCallback(
    (waveId: string, newDrops: ApiDrop[] | null) => {
      // Clear the loading state
      if (paginationStates.current[waveId]) {
        paginationStates.current[waveId].isLoading = false;
        paginationStates.current[waveId].promise = null;
      }

      if (!newDrops?.length) {
        // No more drops to load, update hasNextPage
        const currentData = getData(waveId);
        if (currentData) {
          updateData(waveId, {
            ...currentData,
            isLoadingNextPage: false,
            hasNextPage: false,
          });
        }
        return null;
      }

      // Merge new drops with existing drops
      const currentData = getData(waveId);
      if (!currentData) {
        return null;
      }

      const mergedDrops = mergeDrops(
        currentData.drops,
        newDrops.map((drop) => ({
          ...drop,
          stableKey: drop.id,
          stableHash: drop.id,
        }))
      );

      // Update the store with merged data
      updateData(waveId, {
        ...currentData,
        isLoadingNextPage: false,
        hasNextPage: newDrops.length > 0, // If we got drops, assume there might be more
        drops: mergedDrops,
      });

      return newDrops;
    },
    [getData, updateData]
  );

  /**
   * Handles errors during pagination
   */
  const handlePaginationError = useCallback(
    (waveId: string, error: unknown) => {
      // Clear loading state
      if (paginationStates.current[waveId]) {
        paginationStates.current[waveId].isLoading = false;
        paginationStates.current[waveId].promise = null;
      }

      // Reset loading indicator in store
      const currentData = getData(waveId);
      if (currentData) {
        updateData(waveId, {
          ...currentData,
          isLoadingNextPage: false,
        });
      }

      // Handle abort errors differently
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log(
          `[WaveDataManager] Pagination request for wave ${waveId} was cancelled`
        );
        return null;
      }

      console.error(
        `[WaveDataManager] Error fetching more messages for ${waveId}:`,
        error
      );
      return null;
    },
    [getData, updateData]
  );

  /**
   * Fetches the next page of data for a wave
   */
  const fetchNextPage = useCallback(
    async (waveId: string): Promise<ApiDrop[] | null> => {
      console.log(`[WaveDataManager] Fetching next page for wave ${waveId}`);
      
      // Get current state
      const currentData = getData(waveId);
      if (!currentData) {
        return null;
      }

      // Don't proceed if already loading or if no next page
      if (currentData.isLoadingNextPage || !currentData.hasNextPage) {
        return null;
      }

      // Check if already has a pagination loading state
      const paginationState = paginationStates.current[waveId] || {
        isLoading: false,
        promise: null,
      };
      paginationStates.current[waveId] = paginationState;

      // If already loading, return the existing promise
      if (paginationState.isLoading && paginationState.promise) {
        return paginationState.promise;
      }

      // Get the oldest message serial number for pagination
      const oldestSerialNo = getOldestMessageSerialNo(waveId);
      if (!oldestSerialNo) {
        return null;
      }

      // Mark as loading
      paginationState.isLoading = true;

      // Update store to show loading state
      updateData(waveId, {
        ...currentData,
        isLoadingNextPage: true,
      });

      // Setup abort controller
      const controller = createController(waveId);

      // Create promise for the request
      const fetchPromise = fetchWaveMessages(
        waveId,
        oldestSerialNo,
        controller.signal
      )
        .then((drops) => updateWithPaginatedData(waveId, drops))
        .catch((error) => handlePaginationError(waveId, error))
        .finally(() => cleanupController(waveId, controller));

      // Store the promise
      paginationState.promise = fetchPromise;

      return fetchPromise;
    },
    [
      getData,
      updateData,
      getOldestMessageSerialNo,
      createController,
      updateWithPaginatedData,
      handlePaginationError,
      cleanupController,
    ]
  );

  /**
   * Cancels a pagination fetch if one is in progress
   */
  const cancelPaginationFetch = useCallback(
    (waveId: string) => {
      // Cancel the abort controller
      cancelAbort(waveId);

      // Clear pagination state
      if (paginationStates.current[waveId]) {
        paginationStates.current[waveId].isLoading = false;
        paginationStates.current[waveId].promise = null;
      }

      // Reset loading indicator in store
      const currentData = getData(waveId);
      if (currentData?.isLoadingNextPage) {
        updateData(waveId, {
          ...currentData,
          isLoadingNextPage: false,
        });
      }
    },
    [cancelAbort, getData, updateData]
  );

  return {
    fetchNextPage,
    cancelPaginationFetch,
  };
}
