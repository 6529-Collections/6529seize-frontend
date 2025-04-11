import { useWaveDataFetching } from "./useWaveDataFetching";
import { useWavePagination } from "./useWavePagination";
import { WaveDataStoreUpdater } from "./types";
import { ApiDrop } from "../../../generated/models/ApiDrop";

/**
 * Main hook that manages wave data loading and caching
 * This is the primary hook that components will use
 */
export function useWaveDataManager({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Use composition to build the complete functionality
  const { registerWave, cancelWaveDataFetch, fetchNewestMessages } = useWaveDataFetching({
    updateData,
    getData,
  });
  
  // Add pagination functionality
  const { fetchNextPage, cancelPaginationFetch } = useWavePagination({
    updateData,
    getData,
  });

  // Expose a clean, focused API
  return {
    // Initial data loading & updates
    registerWave,
    cancelWaveDataFetch,
    fetchNewestMessages,

    // Pagination
    fetchNextPage,
    cancelPaginationFetch
  };
}
