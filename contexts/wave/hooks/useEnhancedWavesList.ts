import { useCallback, useMemo } from "react";
import useWavesList from "../../../hooks/useWavesList";
import useNewDropCounter, {
  MinimalWaveNewDropsCount,
} from "./useNewDropCounter";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";

/**
 * Represents a minimal version of a wave with essential data
 */
export interface MinimalWave {
  id: string;
  name: string;
  type: ApiWaveType;
  newDropsCount: MinimalWaveNewDropsCount;
  picture: string | null;
  contributors: {
    pfp: string;
  }[];
  isPinned: boolean;
}

/**
 * Hook to provide an enhanced list of waves with new drop counts
 *
 * @param activeWaveId The currently active wave ID
 * @returns Object containing waves data, loading states, pagination, and pinning functions
 */
function useEnhancedWavesList(activeWaveId: string | null) {
  // Get waves data from the optimized hook
  const wavesData = useWavesList();

  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.mainWavesRefetch
  );

  // Helper function to map API wave data to MinimalWave format
  const mapWaveToMinimalWave = useCallback(
    (wave: ApiWave): MinimalWave => {
      const newDropsData = {
        count: newDropsCounts[wave.id]?.count ?? 0,
        latestDropTimestamp:
          newDropsCounts[wave.id]?.latestDropTimestamp ??
          wave.metrics.latest_drop_timestamp ??
          null,
      };
      return {
        id: wave.id, // Add the missing id property
        name: wave.name,
        type: wave.wave.type,
        picture: wave.picture,
        contributors: wave.contributors_overview.map((c) => ({
          pfp: c.contributor_pfp,
        })),
        newDropsCount: newDropsData,
        isPinned: wavesData.pinnedWaves.some((w) => w.id === wave.id),
      };
    },
    [newDropsCounts, wavesData.pinnedWaves]
  );

  // Combine wave data with counts for consumers
  const mappedWaves = useMemo(() => {
    return wavesData.waves.map(mapWaveToMinimalWave);
  }, [wavesData.waves, mapWaveToMinimalWave]);

  // Sort waves by latest drop timestamp (most recent first)
  const sortedWaves = useMemo(() => {
    return [...mappedWaves].sort(
      (a, b) =>
        (b.newDropsCount.latestDropTimestamp ?? 0) -
        (a.newDropsCount.latestDropTimestamp ?? 0)
    );
  }, [mappedWaves]);

  // Return all relevant data and functions
  return {
    // Data
    waves: sortedWaves,

    // Loading states
    isFetching: wavesData.isFetching,
    isFetchingNextPage: wavesData.isFetchingNextPage,

    // Pagination
    hasNextPage: wavesData.hasNextPage,
    fetchNextPage: wavesData.fetchNextPage,

    // Pinning functions
    addPinnedWave: wavesData.addPinnedWave,
    removePinnedWave: wavesData.removePinnedWave,

    // Utilities
    refetchAllWaves: wavesData.refetchAllWaves,
    resetAllWavesNewDropsCount,
  };
}

export default useEnhancedWavesList;
