"use client";

import { useAuth } from "@/components/auth/Auth";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import {
  WS_DROP_UPDATE_REASON_POLL_RESPONSE,
  WsMessageType,
} from "@/helpers/Types";
import { getWebSocketMessageReason } from "@/services/websocket/WebSocketTypes";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import type { SidebarWave } from "@/types/waves.types";
import { useCallback, useEffect, useRef, useState } from "react";

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
  readonly unknownWaveRefetchCooldownMs?: number | undefined;
}

const DEFAULT_UNKNOWN_WAVE_REFETCH_COOLDOWN_MS = 3000;
const DEFAULT_OTHER_LIST_WAVE_IDS: ReadonlySet<string> = new Set<string>();
const EMPTY_NEW_DROPS_COUNTS: Record<string, MinimalWaveNewDropsCount> = {};

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

const isPollResponseDropUpdate = (
  message: WsDropUpdateMessage["data"]
): boolean =>
  getWebSocketMessageReason(message) === WS_DROP_UPDATE_REASON_POLL_RESPONSE;

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
 * @param activeWaveId - The ID of the currently active wave
 * @param waves - List of waves for which to track new drops
 * @param refetchWaves - Function to refetch waves data when needed
 * @returns Object containing newDropsCounts and reset function
 */
function useNewDropCounter(
  activeWaveId: string | null,
  waves: SidebarWave[],
  refetchWaves: () => void,
  options: UseNewDropCounterOptions = {}
) {
  const { connectedProfile } = useAuth();
  const {
    enabled = true,
    otherListWaveIds = DEFAULT_OTHER_LIST_WAVE_IDS,
    unknownWaveRefetchCooldownMs = DEFAULT_UNKNOWN_WAVE_REFETCH_COOLDOWN_MS,
  } = options;

  // Keep track of new drop counts
  const [newDropsCounts, setNewDropsCounts] = useState<
    Record<string, MinimalWaveNewDropsCount>
  >({});
  const wavesRef = useRef(waves);
  const lastUnknownWaveRefetchAtRef = useRef<number | null>(null);
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
      lastUnknownWaveRefetchAtRef.current = null;
      setNewDropsCounts({});
    }

    wasEnabledRef.current = enabled;
  }, [enabled]);

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
    [enabled]
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
  }, [enabled]);

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
    if (enabled && activeWaveId) {
      resetWaveNewDropsCount(activeWaveId);
    }
  }, [activeWaveId, enabled, resetWaveNewDropsCount]);

  // WebSocket subscription for new drops using callback pattern
  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        if (!enabled) return;
        if (!message.wave.id) return;
        if (isPollResponseDropUpdate(message)) return;

        const waveId = message.wave.id;
        const wave = waves.find((w) => w.id === waveId);

        if (!wave) {
          // If the opposite list already knows this wave, skip refetch for this list.
          if (otherListWaveIds.has(waveId)) {
            return;
          }

          const isOwnDrop =
            connectedProfile?.handle?.toLowerCase() ===
            message.author.handle?.toLowerCase();
          const isVisibleActiveWave =
            waveId === activeWaveId && document.visibilityState === "visible";

          if (isOwnDrop) {
            setNewDropsCounts((prev) =>
              updateLatestDropTimestamp({
                createdAt: message.created_at,
                newDropsCounts: prev,
                waveId,
              })
            );
            return;
          }

          if (isVisibleActiveWave) {
            setNewDropsCounts((prev) =>
              updateLatestDropTimestamp({
                createdAt: message.created_at,
                newDropsCounts: prev,
                waveId,
              })
            );
            return;
          }

          setNewDropsCounts((prev) => {
            return addUnreadDropCount({
              createdAt: message.created_at,
              newDropsCounts: prev,
              serialNo: message.serial_no,
              waveId,
            });
          });

          // Prevent refetch storms on bursts of unknown-wave websocket events.
          const now = Date.now();
          if (
            lastUnknownWaveRefetchAtRef.current !== null &&
            now - lastUnknownWaveRefetchAtRef.current <
              unknownWaveRefetchCooldownMs
          ) {
            return;
          }
          lastUnknownWaveRefetchAtRef.current = now;
          refetchWaves();
          return;
        }

        if (wave.muted) {
          setNewDropsCounts((prev) =>
            updateLatestDropTimestamp({
              createdAt: message.created_at,
              firstUnreadSerialNo: null,
              newDropsCounts: prev,
              unreadCount: 0,
              waveId,
            })
          );
          return;
        }

        if (
          connectedProfile?.handle?.toLowerCase() ===
          message.author.handle?.toLowerCase()
        ) {
          setNewDropsCounts((prev) => {
            return updateLatestDropTimestamp({
              createdAt: message.created_at,
              newDropsCounts: prev,
              waveId,
            });
          });
          return;
        }

        // Skip incrementing if this is the active wave AND the document is visible
        if (waveId === activeWaveId && document.visibilityState === "visible") {
          setNewDropsCounts((prev) => {
            return updateLatestDropTimestamp({
              createdAt: message.created_at,
              newDropsCounts: prev,
              waveId,
            });
          });
          return;
        }

        setNewDropsCounts((prev) => {
          return addUnreadDropCount({
            createdAt: message.created_at,
            newDropsCounts: prev,
            serialNo: message.serial_no,
            waveId,
          });
        });
      },
      [
        activeWaveId,
        connectedProfile,
        enabled,
        waves,
        refetchWaves,
        otherListWaveIds,
        unknownWaveRefetchCooldownMs,
      ]
    ) // Make sure to include activeWaveId as a dependency
  );

  return {
    newDropsCounts: enabled ? newDropsCounts : EMPTY_NEW_DROPS_COUNTS,
    resetWaveNewDropsCount,
    // Reset counts for all tracked waves
    resetAllWavesNewDropsCount,
  };
}

export default useNewDropCounter;
