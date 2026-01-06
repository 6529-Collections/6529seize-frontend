import { useWaveDataFetching } from "./useWaveDataFetching";
import { useWavePagination } from "./useWavePagination";
import type { WaveDataStoreUpdater } from "./types";

/**
 * Main hook that manages wave data loading and caching
 * This is the primary hook that components will use
 */
export function useWaveDataManager({
  updateData,
  getData,
  removeDrop,
}: WaveDataStoreUpdater) {
  // Use composition to build the complete functionality
  const { registerWave, cancelWaveDataFetch, syncNewestMessages } =
    useWaveDataFetching({
      updateData,
      getData,
      removeDrop,
    });

  // Add pagination functionality
  const { fetchNextPage, cancelPaginationFetch, fetchAroundSerialNo } =
    useWavePagination({
      updateData,
      getData,
      removeDrop,
    });

  // Expose a clean, focused API
  return {
    // Initial data loading & updates
    registerWave,
    cancelWaveDataFetch,
    syncNewestMessages,

    // Pagination
    fetchNextPage,
    cancelPaginationFetch,
    fetchAroundSerialNo,
  };
}
