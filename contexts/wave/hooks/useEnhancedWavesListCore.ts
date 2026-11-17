"use client";

import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import type { SidebarDiscoverySection } from "@/hooks/useWavesList";
import type { SidebarWave, SidebarWaveContributor } from "@/types/waves.types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MinimalWaveNewDropsCount } from "./useNewDropCounter";
import useNewDropCounter, { getNewestTimestamp } from "./useNewDropCounter";
import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import type { WaveUnreadSource } from "../WaveUnreadContext";
import { createWaveUnreadStore, type WaveUnreadEntry } from "./waveUnreadStore";
import { getDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";

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
  readonly reserveDescriptionRow?: boolean;
  followedSubwavesCount: number;
  latestFollowedSubwaveDropTimestamp: number | null;
  unreadSubwaveDrops: number;
  unreadDropsCount: number;
  latestReadTimestamp: number;
  firstUnreadDropSerialNo: number | null;
  firstUnreadFollowedSubwaveDropSerialNo: number | null;
  waveRep: ApiWaveRepSummary | null;
  waveScore: ApiWaveScore | null;
  isInAllWaves?: boolean;
  sidebarSection: SidebarDiscoverySection | null;
  sidebarActivityTimestamp: number | null;
  isFollowedSubwaveContainer: boolean;
}

type EnhancedSidebarWave = SidebarWave & {
  readonly isPinned?: boolean;
  readonly isOfficial?: boolean;
  readonly isInAllWaves?: boolean;
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
  /** Refreshes only the list a newly active wave can join. */
  refreshActivityList?: (() => void) | undefined;
  loadSubwavesForParent: (parentWaveId: string) => void;
  prefetchSubwavesForParent: (parentWaveId: string) => void;
  loadingSubwaveParentIds?: readonly string[];
  addPinnedWave: (waveId: string) => void;
  removePinnedWave: (waveId: string) => void;
}

interface UseEnhancedWavesListCoreOptions {
  supportsPinning: boolean;
  enabled?: boolean | undefined;
  otherListWaveIds?: ReadonlySet<string> | undefined;
  preserveBackendWaveOrder?: boolean | undefined;
  sortMutedLast?: boolean | undefined;
  canonicalUnreadByWaveId?:
    | Readonly<Record<string, ApiDmUnreadConversationState>>
    | undefined;
}

interface UnreadInputs {
  readonly wave: EnhancedSidebarWave;
  readonly unread: WaveUnreadEntry | undefined;
  readonly canonicalUnread: ApiDmUnreadConversationState | undefined;
  readonly usesCanonicalUnread: boolean;
}

function resolveFirstUnreadDropSerialNo({
  wave,
  unread,
  canonicalUnread,
  usesCanonicalUnread,
}: UnreadInputs): number | null {
  const canonicalFirstUnread =
    canonicalUnread?.first_unread_drop_serial_no ?? null;
  const hasNewWsDrops = (unread?.newDrops?.count ?? 0) > 0;
  const wasCleared = unread?.cleared === true;
  if (usesCanonicalUnread || (wasCleared && !hasNewWsDrops)) {
    return canonicalFirstUnread;
  }
  const wsFirstUnread = unread?.newDrops?.firstUnreadSerialNo ?? null;
  if (wasCleared) {
    return wsFirstUnread;
  }
  const apiFirstUnread = wave.firstUnreadDropSerialNo ?? null;
  if (apiFirstUnread !== null && wsFirstUnread !== null) {
    return Math.min(apiFirstUnread, wsFirstUnread);
  }
  return apiFirstUnread ?? wsFirstUnread;
}

function isWsDataCoveredByApi(
  wave: EnhancedSidebarWave,
  latestWsDropTimestamp: number | null | undefined
): boolean {
  return (
    latestWsDropTimestamp !== null &&
    latestWsDropTimestamp !== undefined &&
    wave.latestDropTimestamp !== null &&
    wave.latestDropTimestamp >= latestWsDropTimestamp
  );
}

function resolveUnreadDropsCount({
  wave,
  unread,
  canonicalUnread,
  usesCanonicalUnread,
}: UnreadInputs): number {
  if (usesCanonicalUnread) {
    return canonicalUnread?.unread_count ?? 0;
  }
  const wsData = unread?.newDrops;
  const wsDropCount = wsData?.count ?? 0;
  const hasNewWsDrops = wsDropCount > 0;
  const wasCleared = unread?.cleared === true;
  if (wasCleared && !hasNewWsDrops) {
    return 0;
  }
  if (unread?.forcedCount !== undefined) {
    return unread.forcedCount + wsDropCount;
  }
  if (wasCleared || !hasNewWsDrops) {
    // Cleared with new drops: only the drops since the read count.
    return wasCleared ? wsDropCount : wave.unreadDropsCount;
  }
  if (isWsDataCoveredByApi(wave, wsData?.latestDropTimestamp)) {
    // The API can already include the same websocket drop after a refetch.
    // Use the larger count instead of adding both sources and double-counting.
    return Math.max(wave.unreadDropsCount, wsDropCount);
  }
  return wave.unreadDropsCount + wsDropCount;
}

/**
 * Maps a sidebar wave to its list row. `unread` adds the client's live
 * deltas (socket counts, local read and mark-unread) to the server's values;
 * without it the row shows the server's values only.
 */
function toMinimalWave({
  wave,
  unread,
  canonicalUnread,
  usesCanonicalUnread,
  supportsPinning,
}: UnreadInputs & { readonly supportsPinning: boolean }): MinimalWave {
  const unreadInputs = { wave, unread, canonicalUnread, usesCanonicalUnread };
  const wsData = unread?.newDrops;
  const directLatestDropTimestamp =
    wave.latestTopLevelDropTimestamp !== undefined
      ? wave.latestTopLevelDropTimestamp
      : getNewestTimestamp(
          wsData?.latestDropTimestamp,
          wave.latestDropTimestamp ?? null
        );
  const sidebarActivityTimestamp = getNewestTimestamp(
    directLatestDropTimestamp,
    wave.latestFollowedSubwaveDropTimestamp ?? null
  );
  const newDrops = {
    count: usesCanonicalUnread ? 0 : (wsData?.count ?? 0),
    latestDropTimestamp: directLatestDropTimestamp,
    firstUnreadSerialNo: usesCanonicalUnread
      ? (canonicalUnread?.first_unread_drop_serial_no ?? null)
      : (wsData?.firstUnreadSerialNo ?? null),
  };
  const firstUnreadDropSerialNo = resolveFirstUnreadDropSerialNo(unreadInputs);
  const unreadDropsCount = resolveUnreadDropsCount(unreadInputs);

  return {
    id: wave.id,
    name: wave.name,
    type: wave.type,
    createdAt: wave.createdAt,
    picture: wave.picture,
    contributors: wave.contributors,
    newDropsCount: newDrops,
    isPinned: supportsPinning
      ? wave.isPinned === true || wave.pinned === true
      : false,
    isFollowing: wave.subscribed,
    isOfficial: wave.isOfficial === true,
    isMuted: wave.muted,
    parentWaveId: wave.parentWaveId,
    hasSubwaves: wave.hasSubwaves,
    reserveDescriptionRow:
      wave.descriptionDrop.contents === null ||
      Boolean(getDescriptionPreviewText(wave.descriptionDrop.contents)),
    followedSubwavesCount: wave.followedSubwavesCount,
    latestFollowedSubwaveDropTimestamp: wave.latestFollowedSubwaveDropTimestamp,
    unreadSubwaveDrops: wave.unreadSubwaveDrops,
    unreadDropsCount,
    latestReadTimestamp: wave.latestReadTimestamp,
    firstUnreadDropSerialNo,
    firstUnreadFollowedSubwaveDropSerialNo:
      wave.firstUnreadFollowedSubwaveDropSerialNo,
    waveRep: wave.waveRep,
    waveScore: wave.waveScore,
    isInAllWaves: wave.isInAllWaves ?? wave.sidebarSection !== "highly-rated",
    sidebarSection: wave.sidebarSection ?? null,
    sidebarActivityTimestamp,
    // Directly-followed waves remain normal following rows; this flag is
    // reserved for parent rows surfaced only because a child subwave is followed.
    isFollowedSubwaveContainer:
      wave.parentWaveId === null &&
      !wave.subscribed &&
      wave.followedSubwavesCount > 0,
  };
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
  const usesCanonicalUnread = options.canonicalUnreadByWaveId !== undefined;
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
    refreshActivityList,
    removePinnedWave: removePinnedWaveFromData,
    waves,
  } = wavesData;
  // Live unread deltas live in a store, not in this hook's state: a received
  // message must not remap every wave or change the stream context.
  const [unreadStore] = useState(createWaveUnreadStore);
  const { resetAllWavesNewDropsCount, resetWaveNewDropsCount } =
    useNewDropCounter(
      activeWaveId,
      waves,
      refreshActivityList ?? refetchAllWavesFromData,
      {
        enabled: isEnabled && !usesCanonicalUnread,
        otherListWaveIds: options.otherListWaveIds,
        store: unreadStore,
      }
    );

  const resetWaveUnreadCount = useCallback(
    (waveId: string) => {
      if (!isEnabled || usesCanonicalUnread) {
        return;
      }

      unreadStore.setCleared(waveId, true);
      unreadStore.setForcedCount(waveId, undefined);
    },
    [isEnabled, unreadStore, usesCanonicalUnread]
  );

  const restoreWaveUnreadCount = useCallback(
    (waveId: string, count?: number) => {
      if (!isEnabled || usesCanonicalUnread) {
        return;
      }

      unreadStore.setCleared(waveId, false);
      if (count !== undefined) {
        unreadStore.setForcedCount(waveId, count);
      }
    },
    [isEnabled, unreadStore, usesCanonicalUnread]
  );

  const markWaveRead = useCallback(
    (waveId: string) => {
      if (!isEnabled || usesCanonicalUnread) {
        return;
      }
      resetWaveNewDropsCount(waveId);
      resetWaveUnreadCount(waveId);
    },
    [
      isEnabled,
      resetWaveNewDropsCount,
      resetWaveUnreadCount,
      usesCanonicalUnread,
    ]
  );

  useEffect(() => {
    if (
      !isEnabled ||
      usesCanonicalUnread ||
      !activeWaveId ||
      document.visibilityState !== "visible"
    )
      return;
    unreadStore.setForcedCount(activeWaveId, undefined);
    const timeout = setTimeout(() => {
      if (document.visibilityState === "visible") {
        resetWaveUnreadCount(activeWaveId);
      }
    }, UNREAD_CLEAR_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [
    activeWaveId,
    isEnabled,
    resetWaveUnreadCount,
    unreadStore,
    usesCanonicalUnread,
  ]);

  const canonicalUnreadByWaveId = options.canonicalUnreadByWaveId;
  const supportsPinning = options.supportsPinning;
  const mapWave = useCallback(
    (wave: EnhancedSidebarWave, unread: WaveUnreadEntry | undefined) =>
      toMinimalWave({
        wave,
        unread,
        canonicalUnread: canonicalUnreadByWaveId?.[wave.id],
        usesCanonicalUnread,
        supportsPinning,
      }),
    [canonicalUnreadByWaveId, supportsPinning, usesCanonicalUnread]
  );

  // Wave objects carry the server's unread values only, so they keep their
  // identity while messages arrive. useWavesWithUnread and useWaveUnread add
  // the live values for the components that show them.
  const { minimal, sourceById } = useMemo(() => {
    const sources = new Map<string, EnhancedSidebarWave>();
    if (!isEnabled) {
      return { minimal: [], sourceById: sources };
    }

    return {
      minimal: waves.map((wave) => {
        sources.set(wave.id, wave);
        return mapWave(wave, undefined);
      }),
      sourceById: sources,
    };
  }, [isEnabled, waves, mapWave]);

  const unreadSource = useMemo<WaveUnreadSource>(() => {
    const resolved = new WeakMap<
      MinimalWave,
      { readonly unread: WaveUnreadEntry; readonly wave: MinimalWave }
    >();
    return {
      store: unreadStore,
      resolve: (base, unread) => {
        if (!unread) return base;
        const source = sourceById.get(base.id);
        if (!source) return base;
        const cached = resolved.get(base);
        if (cached?.unread === unread) return cached.wave;
        const wave = mapWave(source, unread);
        resolved.set(base, { unread, wave });
        return wave;
      },
    };
  }, [mapWave, sourceById, unreadStore]);

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
      unreadSource,
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
      unreadSource,
      isEnabled,
      options.supportsPinning,
    ]
  );
}

export default useEnhancedWavesListCore;
