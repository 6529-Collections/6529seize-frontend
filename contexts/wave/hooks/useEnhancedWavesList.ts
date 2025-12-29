"use client";

import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import useWavesList from "@/hooks/useWavesList";
import { useCallback, useEffect, useMemo, useState } from "react";
import useNewDropCounter, {
  MinimalWaveNewDropsCount,
  getNewestTimestamp,
} from "./useNewDropCounter";

const UNREAD_CLEAR_DELAY_MS = 1000;

export interface MinimalWave {
  id: string;
  name: string;
  type: ApiWaveType;
  newDropsCount: MinimalWaveNewDropsCount;
  picture: string | null;
  contributors: { pfp: string }[];
  isPinned: boolean;
  unreadDropsCount: number;
  latestReadTimestamp: number;
}

function useEnhancedWavesList(activeWaveId: string | null) {
  const wavesData = useWavesList();

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

  const mapWave = useCallback(
    (wave: ApiWave & { isPinned?: boolean }): MinimalWave => {
      const newDrops = {
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
        newDropsCount: newDrops,
        isPinned: wave.isPinned ?? false,
        unreadDropsCount: isCleared ? 0 : wave.metrics.your_unread_drops_count,
        latestReadTimestamp: wave.metrics.your_latest_read_timestamp,
      };
    },
    [newDropsCounts, clearedUnreadWaveIds]
  );

  const minimal = useMemo(
    () => wavesData.waves.map(mapWave),
    [wavesData.waves, mapWave]
  );

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
