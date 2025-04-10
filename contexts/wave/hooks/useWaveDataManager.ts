import { useWaveDataFetching } from "./useWaveDataFetching";
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

  // Expose a clean, focused API
  return { registerWave, cancelWaveDataFetch };
}
