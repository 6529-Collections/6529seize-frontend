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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useUnknownWaveRefetchRetry from "./useUnknownWaveRefetchRetry";

/**
 * Interface for tracking new drops count for a wave
 */
export interface MinimalWaveNewDropsCount {
  readonly count: number;
  readonly latestDropTimestamp: number | null;
  readonly firstUnreadSerialNo: number | null;
}

type NewDropsCounts = Record<string, MinimalWaveNewDropsCount>;

interface UseNewDropCounterOptions {
  readonly enabled?: boolean | undefined;
  readonly stateIdentityKey?: string | null | undefined;
  readonly otherListWaveIds?: ReadonlySet<string> | undefined;
  readonly unknownWaveRefetchCooldownMs?: number | undefined;
  readonly trustServerSnapshotUnreadState?: boolean | undefined;
}

const DEFAULT_UNKNOWN_WAVE_REFETCH_COOLDOWN_MS = 3000;
const DEFAULT_OTHER_LIST_WAVE_IDS: ReadonlySet<string> = new Set<string>();
const EMPTY_NEW_DROPS_COUNTS: Record<string, MinimalWaveNewDropsCount> = {};

const removeWaveCounts = (
  newDropsCounts: NewDropsCounts,
  waveIds: ReadonlySet<string>
): NewDropsCounts => {
  let next = newDropsCounts;

  waveIds.forEach((waveId) => {
    if (!(waveId in next)) {
      return;
    }

    if (next === newDropsCounts) {
      next = { ...newDropsCounts };
    }
    delete next[waveId];
  });

  return next;
};

const retainWaveCounts = (
  newDropsCounts: NewDropsCounts,
  waveIds: ReadonlySet<string>
): NewDropsCounts => {
  let next = newDropsCounts;

  Object.keys(newDropsCounts).forEach((waveId) => {
    if (waveIds.has(waveId)) {
      return;
    }

    if (next === newDropsCounts) {
      next = { ...newDropsCounts };
    }
    delete next[waveId];
  });

  return next;
};

const haveSameWaveIds = (
  left: ReadonlySet<string>,
  right: ReadonlySet<string>
): boolean =>
  left.size === right.size && [...left].every((waveId) => right.has(waveId));

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

const isDropCoveredByServer = (
  wave: SidebarWave,
  dropTimestamp: number,
  trustServerSnapshotUnreadState: boolean,
  websocketReceivedAt: number | undefined
): boolean => {
  const latestReadTimestamp =
    typeof wave.latestReadTimestamp === "number"
      ? wave.latestReadTimestamp
      : null;
  if (latestReadTimestamp !== null && latestReadTimestamp >= dropTimestamp) {
    return true;
  }

  if (!trustServerSnapshotUnreadState) {
    return false;
  }

  const snapshotRequestStartedAt = wave.serverSnapshotRequestStartedAt;
  if (
    wave.unreadDropsCount === 0 &&
    websocketReceivedAt !== undefined &&
    snapshotRequestStartedAt !== undefined &&
    snapshotRequestStartedAt > websocketReceivedAt
  ) {
    // A zero-unread snapshot requested after the websocket event is
    // authoritative even when the latest-drop timestamp is unchanged by a
    // cross-device read. Requiring request ordering prevents an older response
    // from erasing a distinct event that shares the snapshot timestamp.
    return true;
  }

  const snapshotLatestDropTimestamp =
    wave.serverSnapshotLatestDropTimestamp ?? null;
  // Timestamps are not unique. A websocket event at the exact snapshot
  // timestamp can be a distinct higher-serial drop, so only a strictly newer
  // snapshot proves that the event is already covered. Read timestamps are
  // different: equality means the drop itself has been read.
  return (
    snapshotLatestDropTimestamp !== null &&
    snapshotLatestDropTimestamp > dropTimestamp
  );
};

const reconcileNewDropsCounts = ({
  newDropsCounts,
  trustServerSnapshotUnreadState,
  websocketReceivedAtByWave,
  waves,
}: {
  readonly newDropsCounts: NewDropsCounts;
  readonly trustServerSnapshotUnreadState: boolean;
  readonly websocketReceivedAtByWave: Readonly<Record<string, number>>;
  readonly waves: readonly SidebarWave[];
}): NewDropsCounts => {
  let next = newDropsCounts;

  waves.forEach((wave) => {
    const localCount = newDropsCounts[wave.id];
    const isCoveredByServer = isDropCoveredByServer(
      wave,
      localCount?.latestDropTimestamp ?? 0,
      trustServerSnapshotUnreadState,
      websocketReceivedAtByWave[wave.id]
    );
    if (
      !localCount ||
      localCount.count <= 0 ||
      localCount.latestDropTimestamp === null ||
      !isCoveredByServer
    ) {
      return;
    }

    if (next === newDropsCounts) {
      next = { ...newDropsCounts };
    }
    next[wave.id] = {
      count: 0,
      latestDropTimestamp: getNewestTimestamp(
        localCount.latestDropTimestamp,
        wave.latestDropTimestamp ?? null
      ),
      firstUnreadSerialNo: null,
    };
  });

  return next;
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
    stateIdentityKey,
    otherListWaveIds = DEFAULT_OTHER_LIST_WAVE_IDS,
    unknownWaveRefetchCooldownMs = DEFAULT_UNKNOWN_WAVE_REFETCH_COOLDOWN_MS,
    trustServerSnapshotUnreadState = false,
  } = options;

  // Keep track of new drop counts
  const [rawNewDropsState, setRawNewDropsState] = useState<{
    readonly identityKey: string | null | undefined;
    readonly counts: Record<string, MinimalWaveNewDropsCount>;
    readonly websocketReceivedAtByWave: Record<string, number>;
  }>(() => ({
    identityKey: stateIdentityKey,
    counts: {},
    websocketReceivedAtByWave: {},
  }));
  if (rawNewDropsState.identityKey !== stateIdentityKey) {
    setRawNewDropsState({
      identityKey: stateIdentityKey,
      counts: {},
      websocketReceivedAtByWave: {},
    });
  }
  const currentRawNewDropsState = useMemo(
    () =>
      rawNewDropsState.identityKey === stateIdentityKey
        ? rawNewDropsState
        : {
            identityKey: stateIdentityKey,
            counts: {},
            websocketReceivedAtByWave: {},
          },
    [rawNewDropsState, stateIdentityKey]
  );
  const rawNewDropsCounts = currentRawNewDropsState.counts;
  const websocketReceivedAtByWave =
    currentRawNewDropsState.websocketReceivedAtByWave;
  const setRawNewDropsCounts = useCallback(
    (
      update:
        | Record<string, MinimalWaveNewDropsCount>
        | ((
            current: Record<string, MinimalWaveNewDropsCount>,
            websocketReceivedAtByWave: Readonly<Record<string, number>>
          ) => Record<string, MinimalWaveNewDropsCount>)
    ): void => {
      setRawNewDropsState((previous) => {
        const current =
          previous.identityKey === stateIdentityKey
            ? previous
            : {
                identityKey: stateIdentityKey,
                counts: {},
                websocketReceivedAtByWave: {},
              };
        const counts =
          typeof update === "function"
            ? update(current.counts, current.websocketReceivedAtByWave)
            : update;
        return {
          identityKey: stateIdentityKey,
          counts,
          websocketReceivedAtByWave: current.websocketReceivedAtByWave,
        };
      });
    },
    [stateIdentityKey]
  );
  const [previousEnabled, setPreviousEnabled] = useState(enabled);
  const [previousOtherListWaveIds, setPreviousOtherListWaveIds] =
    useState(otherListWaveIds);
  const wavesRef = useRef(waves);

  if (previousEnabled !== enabled) {
    setPreviousEnabled(enabled);
    if (enabled) {
      setRawNewDropsState({
        identityKey: stateIdentityKey,
        counts: {},
        websocketReceivedAtByWave: {},
      });
    }
  }

  if (!haveSameWaveIds(previousOtherListWaveIds, otherListWaveIds)) {
    setPreviousOtherListWaveIds(otherListWaveIds);
    setRawNewDropsState((previous) => {
      if (previous.identityKey !== stateIdentityKey) {
        return previous;
      }

      const counts = removeWaveCounts(previous.counts, otherListWaveIds);
      return counts === previous.counts ? previous : { ...previous, counts };
    });
  }

  useEffect(() => {
    if (!enabled) {
      wavesRef.current = [];
      return;
    }

    wavesRef.current = waves;
  }, [enabled, waves]);

  const ownWaveIds = useMemo(
    () => new Set(waves.map((wave) => wave.id)),
    [waves]
  );
  const reconciledRawNewDropsCounts = useMemo(() => {
    const reconciled = reconcileNewDropsCounts({
      newDropsCounts: rawNewDropsCounts,
      trustServerSnapshotUnreadState,
      websocketReceivedAtByWave,
      waves,
    });
    return removeWaveCounts(reconciled, otherListWaveIds);
  }, [
    otherListWaveIds,
    rawNewDropsCounts,
    trustServerSnapshotUnreadState,
    websocketReceivedAtByWave,
    waves,
  ]);
  if (enabled && reconciledRawNewDropsCounts !== rawNewDropsCounts) {
    setRawNewDropsState((previous) =>
      previous.identityKey === stateIdentityKey &&
      previous.counts === rawNewDropsCounts
        ? { ...previous, counts: reconciledRawNewDropsCounts }
        : previous
    );
  }
  // Unknown events remain pending internally until one list classifies them,
  // but they are never exposed on the wrong navigation surface meanwhile.
  const reconciledNewDropsCounts = useMemo(
    () => retainWaveCounts(reconciledRawNewDropsCounts, ownWaveIds),
    [ownWaveIds, reconciledRawNewDropsCounts]
  );
  const requestUnknownWaveRefetch = useUnknownWaveRefetchRetry({
    cooldownMs: unknownWaveRefetchCooldownMs,
    enabled,
    identityKey: stateIdentityKey,
    ownWaveIds,
    otherListWaveIds,
    rawCounts: rawNewDropsCounts,
    refetchWaves,
  });

  const updateNewDropsCountsForMessage = useCallback(
    (
      waveId: string,
      createdAt: number,
      update: (current: NewDropsCounts) => NewDropsCounts,
      websocketReceivedAt?: number
    ) => {
      setRawNewDropsState((previous) => {
        const currentState =
          previous.identityKey === stateIdentityKey
            ? previous
            : {
                identityKey: stateIdentityKey,
                counts: {},
                websocketReceivedAtByWave: {},
              };
        const current = reconcileNewDropsCounts({
          newDropsCounts: currentState.counts,
          trustServerSnapshotUnreadState,
          websocketReceivedAtByWave: currentState.websocketReceivedAtByWave,
          waves: wavesRef.current,
        });
        const currentWave = current[waveId];
        if (
          currentWave?.count === 0 &&
          currentWave.latestDropTimestamp !== null &&
          createdAt < currentWave.latestDropTimestamp
        ) {
          return {
            ...currentState,
            counts: current,
          };
        }

        return {
          identityKey: stateIdentityKey,
          counts: update(current),
          websocketReceivedAtByWave:
            websocketReceivedAt === undefined
              ? currentState.websocketReceivedAtByWave
              : {
                  ...currentState.websocketReceivedAtByWave,
                  [waveId]: websocketReceivedAt,
                },
        };
      });
    },
    [stateIdentityKey, trustServerSnapshotUnreadState]
  );

  // Reset counts for a specific wave
  const resetWaveNewDropsCount = useCallback(
    (waveId: string) => {
      if (!enabled) {
        return;
      }

      setRawNewDropsCounts((prev, currentWebsocketReceivedAtByWave) => {
        // Every counter write first commits server-authoritative reconciliation
        // for all tracked waves so covered sibling counts cannot reappear.
        const current = reconcileNewDropsCounts({
          newDropsCounts: prev,
          trustServerSnapshotUnreadState,
          websocketReceivedAtByWave: currentWebsocketReceivedAtByWave,
          waves: wavesRef.current,
        });
        const previous = current[waveId];
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
          return current;
        }

        return {
          ...current,
          [waveId]: next,
        };
      });
    },
    [enabled, setRawNewDropsCounts, trustServerSnapshotUnreadState]
  );

  // Reset counts for all waves
  const resetAllWavesNewDropsCount = useCallback(() => {
    if (!enabled) {
      return;
    }

    setRawNewDropsCounts((prev, currentWebsocketReceivedAtByWave) => {
      const current = reconcileNewDropsCounts({
        newDropsCounts: prev,
        trustServerSnapshotUnreadState,
        websocketReceivedAtByWave: currentWebsocketReceivedAtByWave,
        waves: wavesRef.current,
      });
      const newCounts: Record<string, MinimalWaveNewDropsCount> = {};
      const nextWaveIds = new Set<string>();
      let changed = false;

      wavesRef.current.forEach((wave) => {
        nextWaveIds.add(wave.id);
        const previous = current[wave.id];
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

      if (Object.keys(current).some((waveId) => !nextWaveIds.has(waveId))) {
        changed = true;
      }

      return changed ? newCounts : current;
    });
  }, [enabled, setRawNewDropsCounts, trustServerSnapshotUnreadState]);

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
        const websocketReceivedAt = Date.now();
        const wave = waves.find((w) => w.id === waveId);
        const isCoveredByServer = wave
          ? isDropCoveredByServer(
              wave,
              message.created_at,
              trustServerSnapshotUnreadState,
              websocketReceivedAt
            )
          : false;
        if (isCoveredByServer) {
          // Reconcile retained websocket state without adding this covered drop.
          updateNewDropsCountsForMessage(
            waveId,
            message.created_at,
            (current) => current
          );
          return;
        }

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
            updateNewDropsCountsForMessage(
              waveId,
              message.created_at,
              (current) =>
                updateLatestDropTimestamp({
                  createdAt: message.created_at,
                  newDropsCounts: current,
                  waveId,
                })
            );
            return;
          }

          if (isVisibleActiveWave) {
            updateNewDropsCountsForMessage(
              waveId,
              message.created_at,
              (current) =>
                updateLatestDropTimestamp({
                  createdAt: message.created_at,
                  newDropsCounts: current,
                  waveId,
                })
            );
            return;
          }

          updateNewDropsCountsForMessage(
            waveId,
            message.created_at,
            (current) => {
              return addUnreadDropCount({
                createdAt: message.created_at,
                newDropsCounts: current,
                serialNo: message.serial_no,
                waveId,
              });
            },
            websocketReceivedAt
          );

          requestUnknownWaveRefetch(waveId, websocketReceivedAt);
          return;
        }

        if (wave.muted) {
          updateNewDropsCountsForMessage(
            waveId,
            message.created_at,
            (current) =>
              updateLatestDropTimestamp({
                createdAt: message.created_at,
                firstUnreadSerialNo: null,
                newDropsCounts: current,
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
          updateNewDropsCountsForMessage(
            waveId,
            message.created_at,
            (current) => {
              return updateLatestDropTimestamp({
                createdAt: message.created_at,
                newDropsCounts: current,
                waveId,
              });
            }
          );
          return;
        }

        // Skip incrementing if this is the active wave AND the document is visible
        if (waveId === activeWaveId && document.visibilityState === "visible") {
          updateNewDropsCountsForMessage(
            waveId,
            message.created_at,
            (current) => {
              return updateLatestDropTimestamp({
                createdAt: message.created_at,
                newDropsCounts: current,
                waveId,
              });
            }
          );
          return;
        }

        updateNewDropsCountsForMessage(
          waveId,
          message.created_at,
          (current) => {
            return addUnreadDropCount({
              createdAt: message.created_at,
              newDropsCounts: current,
              serialNo: message.serial_no,
              waveId,
            });
          },
          websocketReceivedAt
        );
      },
      [
        activeWaveId,
        connectedProfile,
        enabled,
        waves,
        otherListWaveIds,
        requestUnknownWaveRefetch,
        trustServerSnapshotUnreadState,
        updateNewDropsCountsForMessage,
      ]
    ) // Make sure to include activeWaveId as a dependency
  );

  return {
    newDropsCounts: enabled ? reconciledNewDropsCounts : EMPTY_NEW_DROPS_COUNTS,
    resetWaveNewDropsCount,
    // Reset counts for all tracked waves
    resetAllWavesNewDropsCount,
  };
}

export default useNewDropCounter;
