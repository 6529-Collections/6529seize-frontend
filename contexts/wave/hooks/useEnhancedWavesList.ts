"use client"

import { useCallback, useMemo } from "react";
import useWavesList from "@/hooks/useWavesList";
import useNewDropCounter, {
  MinimalWaveNewDropsCount,
  getNewestTimestamp,
} from "./useNewDropCounter";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

export interface MinimalWave {
  id: string;
  name: string;
  type: ApiWaveType;
  newDropsCount: MinimalWaveNewDropsCount;
  picture: string | null;
  contributors: { pfp: string }[];
  isPinned: boolean;
}

function useEnhancedWavesList(activeWaveId: string | null) {
  const wavesData = useWavesList();

  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.mainWavesRefetch
  );

  const mapWave = useCallback(
    (wave: ApiWave & { isPinned?: boolean }): MinimalWave => {
      const newDrops = {
        count: newDropsCounts[wave.id]?.count ?? 0,
        latestDropTimestamp: getNewestTimestamp(
          newDropsCounts[wave.id]?.latestDropTimestamp,
          wave.metrics.latest_drop_timestamp ?? null
        ),
      };
      return {
        id: wave.id,
        name: wave.name,
        type: wave.wave.type,
        picture: wave.picture,
        contributors: wave.contributors_overview.map((c) => ({ pfp: c.contributor_pfp })),
        newDropsCount: newDrops,
        // Use server-provided isPinned status instead of local comparison
        isPinned: wave.isPinned ?? false,
      };
    },
    [newDropsCounts]
  );

  const minimal = useMemo(() => wavesData.waves.map(mapWave), [wavesData.waves, mapWave]);

  const sorted = useMemo(
    () =>
      [...minimal].sort(
        (a, b) =>
          (b.newDropsCount.latestDropTimestamp ?? 0) -
          (a.newDropsCount.latestDropTimestamp ?? 0)
      ),
    [minimal]
  );

  return {
    waves: sorted,
    isFetching: wavesData.isFetching,
    isFetchingNextPage: wavesData.isFetchingNextPage,
    hasNextPage: wavesData.hasNextPage,
    fetchNextPage: wavesData.fetchNextPage,
    addPinnedWave: wavesData.addPinnedWave,
    removePinnedWave: wavesData.removePinnedWave,
    refetchAllWaves: wavesData.refetchAllWaves,
    resetAllWavesNewDropsCount,
  };
}

export default useEnhancedWavesList; 
