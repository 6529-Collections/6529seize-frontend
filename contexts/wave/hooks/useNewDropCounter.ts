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
  readonly otherListWaveIds?: ReadonlySet<string> | undefined;
  readonly unknownWaveRefetchCooldownMs?: number | undefined;
}

const DEFAULT_UNKNOWN_WAVE_REFETCH_COOLDOWN_MS = 3000;
const DEFAULT_OTHER_LIST_WAVE_IDS: ReadonlySet<string> = new Set<string>();

export function getNewestTimestamp(
  cached: number | null | undefined = null,
  server: number | null | undefined = null
): number | null {
  if (cached == null && server == null) {
    return null;
  }

  if (cached == null) {
    return server;
  }

  if (server == null) {
    return cached;
  }

  return Math.max(cached, server);
}

const isPollResponseDropUpdate = (
  message: WsDropUpdateMessage["data"]
): boolean =>
  getWebSocketMessageReason(message) === WS_DROP_UPDATE_REASON_POLL_RESPONSE;

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
    otherListWaveIds = DEFAULT_OTHER_LIST_WAVE_IDS,
    unknownWaveRefetchCooldownMs = DEFAULT_UNKNOWN_WAVE_REFETCH_COOLDOWN_MS,
  } = options;

  // Keep track of new drop counts
  const [newDropsCounts, setNewDropsCounts] = useState<
    Record<string, MinimalWaveNewDropsCount>
  >({});
  const wavesRef = useRef(waves);
  const lastUnknownWaveRefetchAtRef = useRef<number | null>(null);

  useEffect(() => {
    wavesRef.current = waves;
  }, [waves]);

  // Reset counts for a specific wave
  const resetWaveNewDropsCount = useCallback((waveId: string) => {
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
  }, []);

  // Reset counts for all waves
  const resetAllWavesNewDropsCount = useCallback(() => {
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
  }, []);

  // Handle visibility changes for active wave
  useEffect(() => {
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
  }, [activeWaveId, resetWaveNewDropsCount]);

  // Reset active wave counts whenever activeWaveId changes
  useEffect(() => {
    if (activeWaveId) {
      resetWaveNewDropsCount(activeWaveId);
    }
  }, [activeWaveId, resetWaveNewDropsCount]);

  // WebSocket subscription for new drops using callback pattern
  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        if (!message?.wave.id) return;
        if (isPollResponseDropUpdate(message)) return;

        const waveId = message.wave.id;
        const wave = waves.find((w) => w.id === waveId);

        if (!wave) {
          // If the opposite list already knows this wave, skip refetch for this list.
          if (otherListWaveIds.has(waveId)) {
            return;
          }

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

        if (wave.muted) return;

        if (
          connectedProfile?.handle?.toLowerCase() ===
          message.author.handle?.toLowerCase()
        )
          return setNewDropsCounts((prev) => {
            const currentCount = prev[waveId]?.count ?? 0;
            const currentLatestDropTimestamp =
              prev[waveId]?.latestDropTimestamp ?? null;
            return {
              ...prev,
              [waveId]: {
                count: currentCount,
                latestDropTimestamp: Math.max(
                  message.created_at,
                  currentLatestDropTimestamp ?? 0
                ),
                firstUnreadSerialNo: prev[waveId]?.firstUnreadSerialNo ?? null,
              },
            };
          });

        // Skip incrementing if this is the active wave AND the document is visible
        if (waveId === activeWaveId && document.visibilityState === "visible") {
          return setNewDropsCounts((prev) => {
            const currentCount = prev[waveId]?.count ?? 0;
            const currentLatestDropTimestamp =
              prev[waveId]?.latestDropTimestamp ?? null;
            return {
              ...prev,
              [waveId]: {
                count: currentCount,
                latestDropTimestamp: Math.max(
                  message.created_at,
                  currentLatestDropTimestamp ?? 0
                ),
                firstUnreadSerialNo: prev[waveId]?.firstUnreadSerialNo ?? null,
              },
            };
          });
        }

        setNewDropsCounts((prev) => {
          const currentCount = prev[waveId]?.count ?? 0;
          const currentLatestDropTimestamp =
            prev[waveId]?.latestDropTimestamp ?? null;
          const currentFirstUnread = prev[waveId]?.firstUnreadSerialNo ?? null;
          return {
            ...prev,
            [waveId]: {
              count: currentCount + 1,
              latestDropTimestamp: Math.max(
                message.created_at,
                currentLatestDropTimestamp ?? 0
              ),
              firstUnreadSerialNo:
                currentFirstUnread === null
                  ? message.serial_no
                  : Math.min(currentFirstUnread, message.serial_no),
            },
          };
        });
      },
      [
        activeWaveId,
        connectedProfile,
        waves,
        refetchWaves,
        otherListWaveIds,
        unknownWaveRefetchCooldownMs,
      ]
    ) // Make sure to include activeWaveId as a dependency
  );

  return {
    newDropsCounts,
    resetWaveNewDropsCount,
    // Reset counts for all tracked waves
    resetAllWavesNewDropsCount,
  };
}

export default useNewDropCounter;
