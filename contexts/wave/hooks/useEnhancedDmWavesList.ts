"use client"

import { useCallback, useMemo } from "react";
import useDmWavesList from "../../../hooks/useDmWavesList";
import useNewDropCounter, {
  MinimalWaveNewDropsCount,
} from "./useNewDropCounter";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";

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

function useEnhancedDmWavesList(activeWaveId: string | null) {
  const wavesData = useDmWavesList();

  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.mainWavesRefetch
  );

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
        id: wave.id,
        name: wave.name,
        type: wave.wave.type,
        picture: wave.picture,
        contributors: wave.contributors_overview.map((c) => ({
          pfp: c.contributor_pfp,
        })),
        newDropsCount: newDropsData,
        isPinned: false,
      };
    },
    [newDropsCounts]
  );

  const mappedWaves = useMemo(
    () => wavesData.waves.map(mapWaveToMinimalWave),
    [wavesData.waves, mapWaveToMinimalWave]
  );

  const sortedWaves = useMemo(
    () =>
      [...mappedWaves].sort(
        (a, b) =>
          (b.newDropsCount.latestDropTimestamp ?? 0) -
          (a.newDropsCount.latestDropTimestamp ?? 0)
      ),
    [mappedWaves]
  );

  return {
    waves: sortedWaves,
    isFetching: wavesData.isFetching,
    isFetchingNextPage: wavesData.isFetchingNextPage,
    hasNextPage: wavesData.hasNextPage,
    fetchNextPage: wavesData.fetchNextPage,
    addPinnedWave: () => {},
    removePinnedWave: () => {},
    refetchAllWaves: wavesData.refetchAllWaves,
    resetAllWavesNewDropsCount,
  };
}

export default useEnhancedDmWavesList; 