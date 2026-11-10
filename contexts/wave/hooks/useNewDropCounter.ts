"use client";

import { useAuth } from "@/components/auth/Auth";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import {
  WS_DROP_UPDATE_REASON_POLL_RESPONSE,
  WS_DROP_UPDATE_REASON_REPLY_COLLAPSE,
  isWsDropUpdateRefData,
  WsMessageType,
} from "@/helpers/Types";
import { getWebSocketMessageReason } from "@/services/websocket/WebSocketTypes";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import type { SidebarWave } from "@/types/waves.types";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useDropUpdateRefMessages } from "./useDropUpdateRefMessages";
import { useUnknownWaveRefresh } from "./useUnknownWaveRefresh";
import type { WaveUnreadStore } from "./waveUnreadStore";

/**
 * Interface for tracking new drops count for a wave
 */
export interface MinimalWaveNewDropsCount {
  readonly count: number;
  readonly latestDropTimestamp: number | null;
  readonly firstUnreadSerialNo: number | null;
}

interface UseNewDropCounterOptions {
  readonly enabled?: boolean | undefined;
  readonly otherListWaveIds?: ReadonlySet<string> | undefined;
  /** Where the live counts go; owned by the caller. */
  readonly store: WaveUnreadStore;
}

const DEFAULT_OTHER_LIST_WAVE_IDS: ReadonlySet<string> = new Set<string>();

export function getNewestTimestamp(
  cached: number | null | undefined = null,
  server: number | null | undefined = null
): number | null {
  const hasCached = cached !== null;
  const hasServer = server !== null;

  if (!hasCached && !hasServer) {
    return null;
  }

  if (!hasCached) {
    return server ?? null;
  }

  if (!hasServer) {
    return cached;
  }

  return Math.max(cached, server);
}

const updateLatestDropTimestamp = ({
  createdAt,
  firstUnreadSerialNo,
  newDropsCounts,
  unreadCount,
  waveId,
}: {
  readonly createdAt: number;
  readonly firstUnreadSerialNo?: number | null | undefined;
  readonly newDropsCounts: Record<string, MinimalWaveNewDropsCount>;
  readonly unreadCount?: number | undefined;
  readonly waveId: string;
}): Record<string, MinimalWaveNewDropsCount> => {
  const current = newDropsCounts[waveId];
  const next: MinimalWaveNewDropsCount = {
    count: unreadCount ?? current?.count ?? 0,
    latestDropTimestamp: Math.max(createdAt, current?.latestDropTimestamp ?? 0),
    firstUnreadSerialNo:
      firstUnreadSerialNo !== undefined
        ? firstUnreadSerialNo
        : (current?.firstUnreadSerialNo ?? null),
  };

  if (
    current?.count === next.count &&
    current.latestDropTimestamp === next.latestDropTimestamp &&
    current.firstUnreadSerialNo === next.firstUnreadSerialNo
  ) {
    return newDropsCounts;
  }

  return {
    ...newDropsCounts,
    [waveId]: next,
  };
};

const addUnreadDropCount = ({
  createdAt,
  newDropsCounts,
  serialNo,
  waveId,
}: {
  readonly createdAt: number;
  readonly newDropsCounts: Record<string, MinimalWaveNewDropsCount>;
  readonly serialNo: number;
  readonly waveId: string;
}): Record<string, MinimalWaveNewDropsCount> => {
  const currentCount = newDropsCounts[waveId]?.count ?? 0;
  const currentLatestDropTimestamp =
    newDropsCounts[waveId]?.latestDropTimestamp ?? null;
  const currentFirstUnread =
    newDropsCounts[waveId]?.firstUnreadSerialNo ?? null;

  return {
    ...newDropsCounts,
    [waveId]: {
      count: currentCount + 1,
      latestDropTimestamp: Math.max(createdAt, currentLatestDropTimestamp ?? 0),
      firstUnreadSerialNo:
        currentFirstUnread === null
          ? serialNo
          : Math.min(currentFirstUnread, serialNo),
    },
  };
};

/**
 * Hook to manage new drop counts via WebSockets
 *
 * @param activeWaveId - The displayed Chat panel's wave, or null outside Chat
 * @param waves - List of waves for which to track new drops
 * @param refetchWaves - Refreshes the list a newly active wave can join;
 *   called coalesced and jittered for drops in waves the list doesn't have
 * @returns Reset functions; the live counts go to `options.store`
 *
 * Counts go to a store, not React state: a received message updates only the
 * store's subscribers instead of re-rendering the provider that owns it.
 */
function useNewDropCounter(
  activeWaveId: string | null,
  waves: SidebarWave[],
  refetchWaves: () => void,
  options: UseNewDropCounterOptions
) {
  const { connectedProfile } = useAuth();
  const {
    enabled = true,
    otherListWaveIds = DEFAULT_OTHER_LIST_WAVE_IDS,
    store,
  } = options;
  const requestWaveListRefresh = useUnknownWaveRefresh(refetchWaves, enabled);

  // Keep track of new drop counts
  const setNewDropsCounts = store.updateNewDropsCounts;
  const clearNewDropsCounts = store.clearNewDropsCounts;
  const wavesRef = useRef(waves);
  const wasEnabledRef = useRef(enabled);

  useEffect(() => {
    if (!enabled) {
      wavesRef.current = [];
      return;
    }

    wavesRef.current = waves;
  }, [enabled, waves]);

  useEffect(() => {
    if (enabled && !wasEnabledRef.current) {
      clearNewDropsCounts();
    }

    wasEnabledRef.current = enabled;
  }, [enabled, clearNewDropsCounts]);

  // Reset counts for a specific wave
  const resetWaveNewDropsCount = useCallback(
    (waveId: string) => {
      if (!enabled) {
        return;
      }

      setNewDropsCounts((prev) => {
        const previous = prev[waveId];
        const next: MinimalWaveNewDropsCount = {
          count: 0,
          latestDropTimestamp: getNewestTimestamp(
            previous?.latestDropTimestamp,
            wavesRef.current.find((wave) => wave.id === waveId)
              ?.latestDropTimestamp ?? null
          ),
          firstUnreadSerialNo: null,
        };

        if (
          previous?.count === next.count &&
          previous.latestDropTimestamp === next.latestDropTimestamp &&
          previous.firstUnreadSerialNo === next.firstUnreadSerialNo
        ) {
          return prev;
        }

        return {
          ...prev,
          [waveId]: next,
        };
      });
    },
    [enabled, setNewDropsCounts]
  );

  // Reset counts for all waves
  const resetAllWavesNewDropsCount = useCallback(() => {
    if (!enabled) {
      return;
    }

    setNewDropsCounts((prev) => {
      const newCounts: Record<string, MinimalWaveNewDropsCount> = {};
      const nextWaveIds = new Set<string>();
      let changed = false;

      wavesRef.current.forEach((wave) => {
        nextWaveIds.add(wave.id);
        const previous = prev[wave.id];
        const next: MinimalWaveNewDropsCount = {
          count: 0,
          latestDropTimestamp: getNewestTimestamp(
            previous?.latestDropTimestamp,
            wave.latestDropTimestamp ?? null
          ),
          firstUnreadSerialNo: null,
        };

        if (
          previous?.count !== next.count ||
          previous.latestDropTimestamp !== next.latestDropTimestamp ||
          previous.firstUnreadSerialNo !== next.firstUnreadSerialNo
        ) {
          changed = true;
        }

        newCounts[wave.id] = next;
      });

      if (Object.keys(prev).some((waveId) => !nextWaveIds.has(waveId))) {
        changed = true;
      }

      return changed ? newCounts : prev;
    });
  }, [enabled, setNewDropsCounts]);

  // Handle visibility changes for active wave
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      // If user returns to the tab and there's an active wave, reset its count
      if (document.visibilityState === "visible" && activeWaveId) {
        resetWaveNewDropsCount(activeWaveId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeWaveId, enabled, resetWaveNewDropsCount]);

  // Reset active wave counts whenever activeWaveId changes
  useEffect(() => {
    if (enabled && activeWaveId && document.visibilityState === "visible") {
      resetWaveNewDropsCount(activeWaveId);
    }
  }, [activeWaveId, enabled, resetWaveNewDropsCount]);

  const recordDropActivity = useCallback(
    (
      activity: {
        readonly waveId: string;
        readonly createdAt: number;
        readonly serialNo: number;
        readonly isOwnDrop: boolean;
      },
      muted = false
    ): boolean => {
      const { waveId, createdAt, serialNo, isOwnDrop } = activity;
      const isVisibleActiveWave =
        waveId === activeWaveId && document.visibilityState === "visible";
      if (muted || isOwnDrop || isVisibleActiveWave) {
        setNewDropsCounts((prev) =>
          updateLatestDropTimestamp({
            createdAt,
            newDropsCounts: prev,
            waveId,
            ...(muted ? { firstUnreadSerialNo: null, unreadCount: 0 } : {}),
          })
        );
        return false;
      }
      setNewDropsCounts((prev) =>
        addUnreadDropCount({
          createdAt,
          newDropsCounts: prev,
          serialNo,
          waveId,
        })
      );
      return true;
    },
    [activeWaveId, setNewDropsCounts]
  );

  const recordFullDrop = useCallback(
    (message: ApiDrop, muted = false) =>
      recordDropActivity(
        {
          waveId: message.wave.id,
          createdAt: message.created_at,
          serialNo: message.serial_no,
          isOwnDrop:
            connectedProfile?.handle?.toLowerCase() ===
            message.author.handle?.toLowerCase(),
        },
        muted
      ),
    [connectedProfile?.handle, recordDropActivity]
  );

  const handleUnknownDrop = useCallback(
    (message: ApiDrop) => {
      if (otherListWaveIds.has(message.wave.id)) return;
      if (!message.reply_to) {
        const addedUnread = recordFullDrop(message);
        if (!addedUnread) return;
      }
      // Every online tab gets this drop at once; refresh the list later,
      // jittered and coalesced, so the wave can join it.
      requestWaveListRefresh();
    },
    [otherListWaveIds, recordFullDrop, requestWaveListRefresh]
  );

  const handleDropUpdate = useCallback(
    (message: ApiDrop) => {
      if (!enabled || !message.wave.id) return;
      const reason = getWebSocketMessageReason(message);
      if (
        reason === WS_DROP_UPDATE_REASON_POLL_RESPONSE ||
        reason === WS_DROP_UPDATE_REASON_REPLY_COLLAPSE
      )
        return;
      const wave = waves.find((candidate) => candidate.id === message.wave.id);
      if (!wave) {
        handleUnknownDrop(message);
        return;
      }
      if (wave.repliesCollapsed && message.reply_to) return;
      recordFullDrop(message, wave.muted);
    },
    [enabled, waves, handleUnknownDrop, recordFullDrop]
  );

  const currentProfileId = useRef(connectedProfile?.id);
  const currentDropHandler = useRef(handleDropUpdate);
  // Commit the viewer and handler together before async resolutions can run.
  useLayoutEffect(() => {
    currentProfileId.current = connectedProfile?.id;
    currentDropHandler.current = handleDropUpdate;
  }, [connectedProfile?.id, handleDropUpdate]);
  const resolveDropUpdateRef = useDropUpdateRefMessages({
    processIncomingDrop: useCallback(
      (drop: ApiDrop) => {
        if (currentProfileId.current === connectedProfile?.id) {
          currentDropHandler.current(drop);
        }
        return Promise.resolve();
      },
      [connectedProfile?.id]
    ),
  });

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    handleDropUpdate
  );

  useWebSocketMessage<unknown>(
    WsMessageType.DROP_UPDATE_REF,
    useCallback(
      (message) => {
        if (
          !enabled ||
          !isWsDropUpdateRefData(message) ||
          message.update_type !== WsMessageType.DROP_UPDATE ||
          message.reason === WS_DROP_UPDATE_REASON_POLL_RESPONSE ||
          message.reason === WS_DROP_UPDATE_REASON_REPLY_COLLAPSE
        ) {
          return;
        }

        const { serial_no: serialNo, wave_id: waveId } = message;
        const now = Date.now();
        const wave = waves.find((candidate) => candidate.id === waveId);
        if (!wave || wave.repliesCollapsed) {
          if (!otherListWaveIds.has(waveId)) resolveDropUpdateRef(message);
          return;
        }
        recordDropActivity(
          {
            waveId,
            createdAt: now,
            serialNo,
            isOwnDrop: connectedProfile?.id === message.author_id,
          },
          wave.muted
        );
      },
      [
        connectedProfile?.id,
        enabled,
        otherListWaveIds,
        waves,
        resolveDropUpdateRef,
        recordDropActivity,
      ]
    )
  );

  return {
    resetWaveNewDropsCount,
    // Reset counts for all tracked waves
    resetAllWavesNewDropsCount,
  };
}

export default useNewDropCounter;
