"use client";

import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
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
  isMuted: boolean;
  unreadDropsCount: number;
  latestReadTimestamp: number;
  firstUnreadDropSerialNo: number | null;
}

export interface WavesDataSource {
  waves: ApiWave[];
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  mainWavesRefetch: () => void;
  refetchAllWaves: () => void;
  addPinnedWave: (waveId: string) => void;
  removePinnedWave: (waveId: string) => void;
}

interface UseEnhancedWavesListCoreOptions {
  supportsPinning: boolean;
}

const DEFAULT_OPTIONS: UseEnhancedWavesListCoreOptions = {
  supportsPinning: true,
};

function useEnhancedWavesListCore(
  activeWaveId: string | null,
  wavesData: WavesDataSource,
  options: UseEnhancedWavesListCoreOptions = DEFAULT_OPTIONS
) {
  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.mainWavesRefetch
  );

  const [clearedUnreadWaveIds, setClearedUnreadWaveIds] = useState<Set<string>>(
    new Set()
  );

  const [forcedUnreadCounts, setForcedUnreadCounts] = useState<
    Record<string, number>
  >({});

  const resetWaveUnreadCount = useCallback((waveId: string) => {
    setClearedUnreadWaveIds((prev) => {
      const next = new Set(prev);
      next.add(waveId);
      return next;
    });
    setForcedUnreadCounts((prev) => {
      if (!(waveId in prev)) return prev;
      const { [waveId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const restoreWaveUnreadCount = useCallback(
    (waveId: string, count?: number) => {
      setClearedUnreadWaveIds((prev) => {
        if (!prev.has(waveId)) return prev;
        const next = new Set(prev);
        next.delete(waveId);
        return next;
      });
      if (count !== undefined) {
        setForcedUnreadCounts((prev) => ({
          ...prev,
          [waveId]: count,
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (!activeWaveId) return;
    setForcedUnreadCounts((prev) => {
      if (!(activeWaveId in prev)) return prev;
      const { [activeWaveId]: _, ...rest } = prev;
      return rest;
    });
    const timeout = setTimeout(() => {
      resetWaveUnreadCount(activeWaveId);
    }, UNREAD_CLEAR_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [activeWaveId, resetWaveUnreadCount]);

  const mapWave = useCallback(
    (wave: ApiWave & { pinned?: boolean }): MinimalWave => {
      const wsData = newDropsCounts[wave.id];
      const hasNewWsDrops = (wsData?.count ?? 0) > 0;
      const newDrops = {
        count: wsData?.count ?? 0,
        latestDropTimestamp: getNewestTimestamp(
          wsData?.latestDropTimestamp,
          wave.metrics.latest_drop_timestamp ?? null
        ),
        firstUnreadSerialNo: wsData?.firstUnreadSerialNo ?? null,
      };
      const isCleared = clearedUnreadWaveIds.has(wave.id) && !hasNewWsDrops;
      const forcedCount = forcedUnreadCounts[wave.id];
      const apiFirstUnread = wave.metrics.first_unread_drop_serial_no ?? null;
      const wsFirstUnread = wsData?.firstUnreadSerialNo ?? null;
      const wasCleared = clearedUnreadWaveIds.has(wave.id);
      let firstUnreadDropSerialNo: number | null = null;
      if (!isCleared) {
        if (wasCleared && hasNewWsDrops) {
          firstUnreadDropSerialNo = wsFirstUnread;
        } else if (apiFirstUnread !== null && wsFirstUnread !== null) {
          firstUnreadDropSerialNo = Math.min(apiFirstUnread, wsFirstUnread);
        } else {
          firstUnreadDropSerialNo = apiFirstUnread ?? wsFirstUnread;
        }
      }

      let unreadDropsCount: number;
      if (isCleared) {
        unreadDropsCount = 0;
      } else if (forcedCount !== undefined) {
        unreadDropsCount = forcedCount + (wsData?.count ?? 0);
      } else if (wasCleared && hasNewWsDrops) {
        unreadDropsCount = wsData?.count ?? 0;
      } else if (hasNewWsDrops) {
        unreadDropsCount =
          wave.metrics.your_unread_drops_count + (wsData?.count ?? 0);
      } else {
        unreadDropsCount = wave.metrics.your_unread_drops_count;
      }

      return {
        id: wave.id,
        name: wave.name,
        type: wave.wave.type,
        picture: wave.picture,
        contributors: wave.contributors_overview.map((c) => ({
          pfp: c.contributor_pfp,
        })),
        newDropsCount: newDrops,
        isPinned: options.supportsPinning ? wave.pinned ?? false : false,
        isMuted: wave.metrics.muted,
        unreadDropsCount,
        latestReadTimestamp: wave.metrics.your_latest_read_timestamp,
        firstUnreadDropSerialNo,
      };
    },
    [
      newDropsCounts,
      clearedUnreadWaveIds,
      forcedUnreadCounts,
      options.supportsPinning,
    ]
  );

  const minimal = useMemo(
    () => wavesData.waves.map(mapWave),
    [wavesData.waves, mapWave]
  );

  const sorted = useMemo(
    () =>
      [...minimal].sort((a, b) => {
        if (a.isMuted !== b.isMuted) {
          return a.isMuted ? 1 : -1;
        }
        return (
          (b.newDropsCount.latestDropTimestamp ?? 0) -
          (a.newDropsCount.latestDropTimestamp ?? 0)
        );
      }),
    [minimal]
  );

  return useMemo(
    () => ({
      waves: sorted,
      isFetching: wavesData.isFetching,
      isFetchingNextPage: wavesData.isFetchingNextPage,
      hasNextPage: wavesData.hasNextPage,
      fetchNextPage: wavesData.fetchNextPage,
      addPinnedWave: options.supportsPinning
        ? wavesData.addPinnedWave
        : () => {},
      removePinnedWave: options.supportsPinning
        ? wavesData.removePinnedWave
        : () => {},
      refetchAllWaves: wavesData.refetchAllWaves,
      resetAllWavesNewDropsCount,
      restoreWaveUnreadCount,
    }),
    [
      sorted,
      wavesData.isFetching,
      wavesData.isFetchingNextPage,
      wavesData.hasNextPage,
      wavesData.fetchNextPage,
      wavesData.addPinnedWave,
      wavesData.removePinnedWave,
      wavesData.refetchAllWaves,
      resetAllWavesNewDropsCount,
      restoreWaveUnreadCount,
      options.supportsPinning,
    ]
  );
}

export default useEnhancedWavesListCore;
