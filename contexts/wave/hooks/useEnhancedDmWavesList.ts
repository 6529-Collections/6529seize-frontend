"use client";

import { ApiWave } from "@/generated/models/ApiWave";
import useDmWavesList from "@/hooks/useDmWavesList";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MinimalWave } from "./useEnhancedWavesList";
import useNewDropCounter, { getNewestTimestamp } from "./useNewDropCounter";

const UNREAD_CLEAR_DELAY_MS = 1000;

function useEnhancedDmWavesList(activeWaveId: string | null) {
  const wavesData = useDmWavesList();

  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.mainWavesRefetch
  );

  const [clearedUnreadWaveIds, setClearedUnreadWaveIds] = useState<Set<string>>(
    new Set()
  );

  const resetWaveUnreadCount = useCallback((waveId: string) => {
    setClearedUnreadWaveIds((prev) => {
      const next = new Set(prev);
      next.add(waveId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!activeWaveId) return;
    const timeout = setTimeout(() => {
      resetWaveUnreadCount(activeWaveId);
    }, UNREAD_CLEAR_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [activeWaveId, resetWaveUnreadCount]);

  const mapWaveToMinimalWave = useCallback(
    (wave: ApiWave): MinimalWave => {
      const newDropsData = {
        count: newDropsCounts[wave.id]?.count ?? 0,
        latestDropTimestamp: getNewestTimestamp(
          newDropsCounts[wave.id]?.latestDropTimestamp,
          wave.metrics.latest_drop_timestamp ?? null
        ),
      };
      const isCleared = clearedUnreadWaveIds.has(wave.id);
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
        unreadDropsCount: isCleared ? 0 : wave.metrics.your_unread_drops_count,
        latestReadTimestamp: wave.metrics.your_latest_read_timestamp,
      };
    },
    [newDropsCounts, clearedUnreadWaveIds]
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
