import { useState, useCallback, useContext, useEffect } from "react";
import { WsMessageType, WsDropUpdateMessage } from "../../../helpers/Types";
import { useWebSocketMessage } from "../../../services/websocket/useWebSocketMessage";
import { AuthContext } from "../../../components/auth/Auth";
import { ApiWave } from "../../../generated/models/ApiWave";

/**
 * Interface for tracking new drops count for a wave
 */
export interface MinimalWaveNewDropsCount {
  readonly count: number;
  readonly latestDropTimestamp: number | null;
}

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
  waves: ApiWave[],
  refetchWaves: () => void
) {
  const { connectedProfile } = useContext(AuthContext);

  // Keep track of new drop counts
  const [newDropsCounts, setNewDropsCounts] = useState<
    Record<string, MinimalWaveNewDropsCount>
  >({});

  // Reset counts for a specific wave
  const resetWaveNewDropsCount = useCallback(
    (waveId: string) => {
      setNewDropsCounts((prev) => ({
        ...prev,
        [waveId]: {
          count: 0,
          latestDropTimestamp:
            prev[waveId]?.latestDropTimestamp ??
            waves.find((wave) => wave.id === waveId)?.metrics
              .latest_drop_timestamp ??
            null,
        },
      }));
    },
    [waves]
  );
  // Reset counts for all waves
  const resetAllWavesNewDropsCount = useCallback(() => {
    setNewDropsCounts(() => {
      const newCounts: Record<string, MinimalWaveNewDropsCount> = {};
      waves.forEach((wave) => {
        newCounts[wave.id] = {
          count: 0,
          latestDropTimestamp: wave.metrics.latest_drop_timestamp ?? null,
        };
      });
      return newCounts;
    });
  }, [waves]);

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
        // Skip if no waveId
        if (!message?.wave.id) return;

        const waveId = message.wave.id;
        const wave = waves.find((w) => w.id === waveId);

        if (!wave) {
          refetchWaves();
        }

        if (
          connectedProfile?.profile?.handle?.toLowerCase() ===
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
              },
            };
          });
        }

        // Update the count for this wave
        setNewDropsCounts((prev) => {
          const currentCount = prev[waveId]?.count ?? 0;
          const currentLatestDropTimestamp =
            prev[waveId]?.latestDropTimestamp ?? null;
          // Optional: Cap the maximum count at 99
          const MAX_COUNT = 99;
          return {
            ...prev,
            [waveId]: {
              count: Math.min(currentCount + 1, MAX_COUNT),
              latestDropTimestamp: Math.max(
                message.created_at,
                currentLatestDropTimestamp ?? 0
              ),
            },
          };
        });
      },
      [activeWaveId, connectedProfile, waves, refetchWaves]
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
