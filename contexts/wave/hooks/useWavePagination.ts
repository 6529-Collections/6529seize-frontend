import { useCallback, useRef } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useWaveAbortController } from "./useWaveAbortController";
import { WaveDataStoreUpdater } from "./types";
import { fetchWaveMessages } from "../utils/wave-messages-utils";

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

      if (newDrops === null) {
        return null;
      }

      if (!newDrops?.length) {
        // No more drops to load, update hasNextPage
        const currentData = getData(waveId);
        if (currentData) {
          updateData({
            key: waveId,
            isLoadingNextPage: false,
            hasNextPage: false,
          });
        }
        return null;
      }

      const currentData = getData(waveId);
      if (!currentData) {
        return null;
      }

      updateData({
        key: waveId,
        isLoadingNextPage: false,
        hasNextPage: newDrops.length > 0, // If we got drops, assume there might be more
        drops: newDrops.map((drop) => ({
          ...drop,
          stableKey: drop.id,
          stableHash: drop.id,
        })),
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
        updateData({
          key: waveId,
          isLoadingNextPage: false,
        });
      }

      // Handle abort errors differently
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error(
        `[WaveDataManager] Error fetching more messages for ${waveId}:`,
        error
      );
    },
    [getData, updateData]
  );

  /**
   * Fetches the next page of data for a wave
   */
  const fetchNextPage = useCallback(
    async (waveId: string): Promise<ApiDrop[] | null> => {
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
      const paginationState = paginationStates.current[waveId] ?? {
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
      updateData({
        key: waveId,
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
        .catch((error) => {
          handlePaginationError(waveId, error);
          return null;
        })
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
        updateData({
          key: waveId,
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
