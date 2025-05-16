import { useCallback, useMemo } from "react";
import { useDirectMessagesList } from "../../../hooks/useDirectMessagesList";
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

function useDirectMessagesEnhancedList(activeWaveId: string | null) {
  const wavesData = useDirectMessagesList();

  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.refetchWaves
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
        isPinned: wavesData.pinnedIds?.some((id: string) => id === wave.id) ?? false,
      };
    },
    [newDropsCounts, wavesData.pinnedIds]
  );

  const mappedWaves = useMemo(() => {
    return wavesData.waves.map(mapWaveToMinimalWave);
  }, [wavesData.waves, mapWaveToMinimalWave]);

  const sortedWaves = useMemo(() => {
    return [...mappedWaves].sort(
      (a, b) =>
        (b.newDropsCount.latestDropTimestamp ?? 0) -
        (a.newDropsCount.latestDropTimestamp ?? 0)
    );
  }, [mappedWaves]);

  return {
    waves: sortedWaves,
    isFetching: wavesData.isFetching,
    isFetchingNextPage: wavesData.isFetchingNextPage,
    hasNextPage: wavesData.hasNextPage,
    fetchNextPage: wavesData.fetchNextPage,
    addPinnedWave: wavesData.addPinnedId,
    removePinnedWave: wavesData.removePinnedId,
    refetchAllWaves: wavesData.refetchWaves,
    resetAllWavesNewDropsCount,
  };
}

export default useDirectMessagesEnhancedList; 