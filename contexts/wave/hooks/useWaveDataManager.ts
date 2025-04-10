import { useWaveDataFetching } from "./useWaveDataFetching";
import { useWavePagination } from "./useWavePagination";
import { WaveDataStoreUpdater } from "./types";

/**
 * Main hook that manages wave data loading and caching
 * This is the primary hook that components will use
 */
export function useWaveDataManager({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Use composition to build the complete functionality
  const { registerWave, cancelWaveDataFetch } = useWaveDataFetching({
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
    // Initial data loading
    registerWave, 
    cancelWaveDataFetch,
    
    // Pagination
    fetchNextPage,
    cancelPaginationFetch
  };
}
