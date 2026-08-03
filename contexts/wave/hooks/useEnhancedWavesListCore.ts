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
  unreadSubwaveDrops: number;
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
  enabled?: boolean | undefined;
  stateIdentityKey?: string | null | undefined;
  otherListWaveIds?: ReadonlySet<string> | undefined;
  unknownWaveRefetchCooldownMs?: number | undefined;
  trustServerSnapshotUnreadState?: boolean | undefined;
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
  const isEnabled = options.enabled !== false;
  const {
    addPinnedWave: addPinnedWaveFromData,
    fetchNextPage: fetchNextPageFromData,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    loadSubwavesForParent: loadSubwavesForParentFromData,
    loadingSubwaveParentIds,
    prefetchSubwavesForParent: prefetchSubwavesForParentFromData,
    refetchAllWaves: refetchAllWavesFromData,
    removePinnedWave: removePinnedWaveFromData,
    waves,
  } = wavesData;
  const { newDropsCounts, resetAllWavesNewDropsCount, resetWaveNewDropsCount } =
    useNewDropCounter(activeWaveId, waves, refetchAllWavesFromData, {
      enabled: isEnabled,
      stateIdentityKey: options.stateIdentityKey,
      otherListWaveIds: options.otherListWaveIds,
      unknownWaveRefetchCooldownMs: options.unknownWaveRefetchCooldownMs,
      trustServerSnapshotUnreadState: options.trustServerSnapshotUnreadState,
    });

  const [unreadState, setUnreadState] = useState<{
    readonly identityKey: string | null | undefined;
    readonly clearedWaveIds: Set<string>;
    readonly clearedAtByWave: Record<string, number>;
    readonly forcedCounts: Record<string, number>;
  }>(() => ({
    identityKey: options.stateIdentityKey,
    clearedWaveIds: new Set(),
    clearedAtByWave: {},
    forcedCounts: {},
  }));
  const currentUnreadState = useMemo(
    () =>
      unreadState.identityKey === options.stateIdentityKey
        ? unreadState
        : {
            // useMemo keeps this empty identity snapshot stable until either
            // the identity or committed unread state changes.
            identityKey: options.stateIdentityKey,
            clearedWaveIds: new Set<string>(),
            clearedAtByWave: {},
            forcedCounts: {},
          },
    [options.stateIdentityKey, unreadState]
  );

  const resetWaveUnreadCount = useCallback(
    (waveId: string) => {
      if (!isEnabled) {
        return;
      }

      setUnreadState((previous) => {
        const current =
          previous.identityKey === options.stateIdentityKey
            ? previous
            : {
                identityKey: options.stateIdentityKey,
                clearedWaveIds: new Set<string>(),
                clearedAtByWave: {},
                forcedCounts: {},
              };
        const clearedWaveIds = new Set(current.clearedWaveIds);
        clearedWaveIds.add(waveId);
        const { [waveId]: _, ...forcedCounts } = current.forcedCounts;
        return {
          identityKey: options.stateIdentityKey,
          clearedWaveIds,
          clearedAtByWave: {
            ...current.clearedAtByWave,
            [waveId]: Date.now(),
          },
          forcedCounts,
        };
      });
    },
    [isEnabled, options.stateIdentityKey]
  );

  const restoreWaveUnreadCount = useCallback(
    (waveId: string, count?: number) => {
      if (!isEnabled) {
        return;
      }

      setUnreadState((previous) => {
        const current =
          previous.identityKey === options.stateIdentityKey
            ? previous
            : {
                identityKey: options.stateIdentityKey,
                clearedWaveIds: new Set<string>(),
                clearedAtByWave: {},
                forcedCounts: {},
              };
        const clearedWaveIds = new Set(current.clearedWaveIds);
        clearedWaveIds.delete(waveId);
        const { [waveId]: _, ...clearedAtByWave } = current.clearedAtByWave;
        return {
          identityKey: options.stateIdentityKey,
          clearedWaveIds,
          clearedAtByWave,
          forcedCounts:
            count === undefined
              ? current.forcedCounts
              : {
                  ...current.forcedCounts,
                  [waveId]: count,
                },
        };
      });
    },
    [isEnabled, options.stateIdentityKey]
  );

  const markWaveRead = useCallback(
    (waveId: string) => {
      resetWaveNewDropsCount(waveId);
      resetWaveUnreadCount(waveId);
    },
    [resetWaveNewDropsCount, resetWaveUnreadCount]
  );

  useEffect(() => {
    if (!isEnabled || !activeWaveId) return;
    const timeout = setTimeout(() => {
      resetWaveUnreadCount(activeWaveId);
    }, UNREAD_CLEAR_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [activeWaveId, isEnabled, options.stateIdentityKey, resetWaveUnreadCount]);

  const mapWave = useCallback(
    (wave: EnhancedSidebarWave): MinimalWave => {
      const wsData = newDropsCounts[wave.id];
      const wsDropCount = wsData?.count ?? 0;
      const hasNewWsDrops = wsDropCount > 0;
      const directLatestDropTimestamp = getNewestTimestamp(
        wsData?.latestDropTimestamp,
        wave.latestDropTimestamp ?? null
      );
      const sidebarActivityTimestamp = getNewestTimestamp(
        directLatestDropTimestamp,
        wave.latestFollowedSubwaveDropTimestamp ?? null
      );
      const newDrops = {
        count: wsDropCount,
        latestDropTimestamp: directLatestDropTimestamp,
        firstUnreadSerialNo: wsData?.firstUnreadSerialNo ?? null,
      };
      const isWsDataCoveredByApi =
        hasNewWsDrops &&
        wsData?.latestDropTimestamp !== null &&
        wsData?.latestDropTimestamp !== undefined &&
        wave.latestDropTimestamp !== null &&
        wave.latestDropTimestamp >= wsData.latestDropTimestamp;
      const clearedAt = currentUnreadState.clearedAtByWave[wave.id];
      const hasFreshServerUnreadAfterClear = Boolean(
        clearedAt !== undefined &&
        wave.unreadDropsCount > 0 &&
        wave.serverSnapshotRequestStartedAt !== undefined &&
        wave.serverSnapshotRequestStartedAt > clearedAt
      );
      const wasCleared =
        currentUnreadState.clearedWaveIds.has(wave.id) &&
        !hasFreshServerUnreadAfterClear;
      const isCleared = wasCleared && !hasNewWsDrops;
      const forcedCount =
        wave.id === activeWaveId
          ? undefined
          : currentUnreadState.forcedCounts[wave.id];
      const apiFirstUnread = wave.firstUnreadDropSerialNo ?? null;
      const wsFirstUnread = wsData?.firstUnreadSerialNo ?? null;
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
        unreadDropsCount = forcedCount + wsDropCount;
      } else if (wasCleared && hasNewWsDrops) {
        unreadDropsCount = wsDropCount;
      } else if (hasNewWsDrops && isWsDataCoveredByApi) {
        // The API can already include the same websocket drop after a refetch.
        // Use the larger count instead of adding both sources and double-counting.
        unreadDropsCount = Math.max(wave.unreadDropsCount, wsDropCount);
      } else if (hasNewWsDrops) {
        unreadDropsCount = wave.unreadDropsCount + wsDropCount;
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
          ? wave.isPinned === true || wave.pinned === true
          : false,
        isFollowing: wave.subscribed,
        isOfficial: wave.isOfficial === true,
        isMuted: wave.muted,
        parentWaveId: wave.parentWaveId,
        hasSubwaves: wave.hasSubwaves,
        followedSubwavesCount: wave.followedSubwavesCount,
        latestFollowedSubwaveDropTimestamp:
          wave.latestFollowedSubwaveDropTimestamp,
        unreadSubwaveDrops: wave.unreadSubwaveDrops,
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
          !wave.subscribed &&
          wave.followedSubwavesCount > 0,
      };
    },
    [newDropsCounts, activeWaveId, currentUnreadState, options.supportsPinning]
  );

  const minimal = useMemo(() => {
    if (!isEnabled) {
      return [];
    }

    return waves.map((wave) => mapWave(wave));
  }, [isEnabled, waves, mapWave]);

  const fetchNextPage = useCallback(() => {
    if (!isEnabled) {
      return;
    }

    fetchNextPageFromData();
  }, [fetchNextPageFromData, isEnabled]);

  const refetchAllWaves = useCallback(() => {
    if (!isEnabled) {
      return;
    }

    refetchAllWavesFromData();
  }, [isEnabled, refetchAllWavesFromData]);

  const loadSubwavesForParent = useCallback(
    (parentWaveId: string) => {
      if (!isEnabled) {
        return;
      }

      loadSubwavesForParentFromData(parentWaveId);
    },
    [isEnabled, loadSubwavesForParentFromData]
  );

  const prefetchSubwavesForParent = useCallback(
    (parentWaveId: string) => {
      if (!isEnabled) {
        return;
      }

      prefetchSubwavesForParentFromData(parentWaveId);
    },
    [isEnabled, prefetchSubwavesForParentFromData]
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
      isFetching: isEnabled ? isFetching : false,
      isFetchingNextPage: isEnabled ? isFetchingNextPage : false,
      hasNextPage: isEnabled ? hasNextPage : false,
      fetchNextPage,
      addPinnedWave:
        isEnabled && options.supportsPinning ? addPinnedWaveFromData : () => {},
      removePinnedWave:
        isEnabled && options.supportsPinning
          ? removePinnedWaveFromData
          : () => {},
      refetchAllWaves,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: isEnabled ? (loadingSubwaveParentIds ?? []) : [],
      resetAllWavesNewDropsCount,
      markWaveRead,
      restoreWaveUnreadCount,
    }),
    [
      sorted,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      addPinnedWaveFromData,
      removePinnedWaveFromData,
      refetchAllWaves,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds,
      resetAllWavesNewDropsCount,
      markWaveRead,
      restoreWaveUnreadCount,
      isEnabled,
      options.supportsPinning,
    ]
  );
}

export default useEnhancedWavesListCore;
