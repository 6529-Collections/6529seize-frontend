"use client";

import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import type { SidebarDiscoverySection } from "@/hooks/useWavesList";
import type { SidebarWave, SidebarWaveContributor } from "@/types/waves.types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MinimalWaveNewDropsCount } from "./useNewDropCounter";
import useNewDropCounter, { getNewestTimestamp } from "./useNewDropCounter";

const UNREAD_CLEAR_DELAY_MS = 1000;

export interface MinimalWave {
  id: string;
  name: string;
  type: ApiWaveType;
  createdAt: number;
  newDropsCount: MinimalWaveNewDropsCount;
  picture: string | null;
  contributors: readonly SidebarWaveContributor[];
  isPinned: boolean;
  isFollowing: boolean;
  isOfficial: boolean;
  isMuted: boolean;
  parentWaveId: string | null;
  hasSubwaves: boolean;
  followedSubwavesCount: number;
  latestFollowedSubwaveDropTimestamp: number | null;
  unreadFollowedSubwaveDrops: number;
  unreadDropsCount: number;
  latestReadTimestamp: number;
  firstUnreadDropSerialNo: number | null;
  firstUnreadFollowedSubwaveDropSerialNo: number | null;
  waveRep: ApiWaveRepSummary | null;
  waveScore: ApiWaveScore | null;
  sidebarSection: SidebarDiscoverySection | null;
  sidebarActivityTimestamp: number | null;
  isFollowedSubwaveContainer: boolean;
}

type EnhancedSidebarWave = SidebarWave & {
  readonly isPinned?: boolean;
  readonly isOfficial?: boolean;
  readonly sidebarSection?: SidebarDiscoverySection;
};

interface WavesDataSource {
  waves: EnhancedSidebarWave[];
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  mainWavesRefetch: () => void;
  refetchAllWaves: () => void;
  loadSubwavesForParent: (parentWaveId: string) => void;
  prefetchSubwavesForParent: (parentWaveId: string) => void;
  loadingSubwaveParentIds?: readonly string[];
  addPinnedWave: (waveId: string) => void;
  removePinnedWave: (waveId: string) => void;
}

interface UseEnhancedWavesListCoreOptions {
  supportsPinning: boolean;
  otherListWaveIds?: ReadonlySet<string> | undefined;
  unknownWaveRefetchCooldownMs?: number | undefined;
  preserveBackendWaveOrder?: boolean | undefined;
  sortMutedLast?: boolean | undefined;
}

const DEFAULT_OPTIONS: UseEnhancedWavesListCoreOptions = {
  supportsPinning: true,
  sortMutedLast: true,
};

function useEnhancedWavesListCore(
  activeWaveId: string | null,
  wavesData: WavesDataSource,
  options: UseEnhancedWavesListCoreOptions = DEFAULT_OPTIONS
) {
  const { newDropsCounts, resetAllWavesNewDropsCount } = useNewDropCounter(
    activeWaveId,
    wavesData.waves,
    wavesData.refetchAllWaves,
    {
      otherListWaveIds: options.otherListWaveIds,
      unknownWaveRefetchCooldownMs: options.unknownWaveRefetchCooldownMs,
    }
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
    (wave: EnhancedSidebarWave): MinimalWave => {
      const wsData = newDropsCounts[wave.id];
      const hasNewWsDrops = (wsData?.count ?? 0) > 0;
      const directLatestDropTimestamp = getNewestTimestamp(
        wsData?.latestDropTimestamp,
        wave.latestDropTimestamp ?? null
      );
      const sidebarActivityTimestamp = getNewestTimestamp(
        directLatestDropTimestamp,
        wave.latestFollowedSubwaveDropTimestamp ?? null
      );
      const newDrops = {
        count: wsData?.count ?? 0,
        latestDropTimestamp: sidebarActivityTimestamp,
        firstUnreadSerialNo: wsData?.firstUnreadSerialNo ?? null,
      };
      const isCleared = clearedUnreadWaveIds.has(wave.id) && !hasNewWsDrops;
      const forcedCount = forcedUnreadCounts[wave.id];
      const apiFirstUnread = wave.firstUnreadDropSerialNo ?? null;
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
        unreadDropsCount = wave.unreadDropsCount + (wsData?.count ?? 0);
      } else {
        unreadDropsCount = wave.unreadDropsCount;
      }

      return {
        id: wave.id,
        name: wave.name,
        type: wave.type,
        createdAt: wave.createdAt,
        picture: wave.picture,
        contributors: wave.contributors,
        newDropsCount: newDrops,
        isPinned: options.supportsPinning
          ? (wave.isPinned ?? wave.pinned ?? false)
          : false,
        isFollowing: wave.subscribed ?? false,
        isOfficial: wave.isOfficial ?? false,
        isMuted: wave.muted,
        parentWaveId: wave.parentWaveId,
        hasSubwaves: wave.hasSubwaves,
        followedSubwavesCount: wave.followedSubwavesCount,
        latestFollowedSubwaveDropTimestamp:
          wave.latestFollowedSubwaveDropTimestamp,
        unreadFollowedSubwaveDrops: wave.unreadFollowedSubwaveDrops,
        unreadDropsCount,
        latestReadTimestamp: wave.latestReadTimestamp,
        firstUnreadDropSerialNo,
        firstUnreadFollowedSubwaveDropSerialNo:
          wave.firstUnreadFollowedSubwaveDropSerialNo,
        waveRep: wave.waveRep,
        waveScore: wave.waveScore,
        sidebarSection: wave.sidebarSection ?? null,
        sidebarActivityTimestamp,
        // Directly-followed waves remain normal following rows; this flag is
        // reserved for parent rows surfaced only because a child subwave is followed.
        isFollowedSubwaveContainer:
          wave.parentWaveId === null &&
          !(wave.subscribed ?? false) &&
          wave.followedSubwavesCount > 0,
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
        if (options.sortMutedLast !== false && a.isMuted !== b.isMuted) {
          return a.isMuted ? 1 : -1;
        }
        if (options.preserveBackendWaveOrder) {
          return 0;
        }
        return (
          (b.sidebarActivityTimestamp ?? 0) - (a.sidebarActivityTimestamp ?? 0)
        );
      }),
    [minimal, options.preserveBackendWaveOrder, options.sortMutedLast]
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
      loadSubwavesForParent: wavesData.loadSubwavesForParent,
      prefetchSubwavesForParent: wavesData.prefetchSubwavesForParent,
      loadingSubwaveParentIds: wavesData.loadingSubwaveParentIds ?? [],
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
      wavesData.loadSubwavesForParent,
      wavesData.prefetchSubwavesForParent,
      wavesData.loadingSubwaveParentIds,
      resetAllWavesNewDropsCount,
      restoreWaveUnreadCount,
      options.supportsPinning,
    ]
  );
}

export default useEnhancedWavesListCore;
