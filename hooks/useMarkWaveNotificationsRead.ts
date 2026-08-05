"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  useWaveNotificationsReadMarkerState as useWaveNotificationsReadMarkerStateFromConfig,
  type MarkWaveNotificationsReadResult,
  type MarkWaveNotificationsReadOptions,
  type WaveNotificationsReadMarkerState,
} from "@/hooks/useMarkWaveNotificationsRead.helpers";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { useCallback, useContext } from "react";
import { useDmUnreadActions } from "@/services/dm-unread/DmUnreadStateProvider";

export function useWaveNotificationsReadMarkerState(): WaveNotificationsReadMarkerState {
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy, connectedProfile } = useAuth();
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const activeProfileProxyCreatorId = activeProfileProxy
    ? activeProfileProxy.created_by.id
    : null;
  const connectedProfileId = connectedProfile?.id ?? null;

  return useWaveNotificationsReadMarkerStateFromConfig({
    address,
    connectedProfileId,
    activeProfileProxyId,
    activeProfileProxyCreatorId,
    walletAuth: getAuthJwt(),
    invalidateNotifications,
  });
}

export function useMarkWaveNotificationsRead(): (
  waveId: string,
  options?: MarkWaveNotificationsReadOptions
) => Promise<MarkWaveNotificationsReadResult> {
  const { markWaveNotificationsRead } = useWaveNotificationsReadMarkerState();
  const { applyServerState, beginRead, reconcileFailedRead } =
    useDmUnreadActions();

  return useCallback(
    async (
      waveId: string,
      options?: MarkWaveNotificationsReadOptions
    ): Promise<MarkWaveNotificationsReadResult> => {
      const readOperation = beginRead(waveId, options?.readThroughSerialNo);
      try {
        const result = await markWaveNotificationsRead(
          waveId,
          readOperation
            ? {
                ...options,
                readThroughSerialNo: readOperation.readThroughSerialNo,
                onReadResponse: (response) => {
                  options?.onReadResponse?.(response);
                  if (response.dm_unread_state) {
                    applyServerState(response.dm_unread_state);
                  }
                },
              }
            : options
        );
        if (readOperation && result === "skipped") {
          await reconcileFailedRead(readOperation);
        }
        return result;
      } catch (error) {
        if (readOperation) {
          await reconcileFailedRead(readOperation);
        }
        throw error;
      }
    },
    [
      applyServerState,
      beginRead,
      markWaveNotificationsRead,
      reconcileFailedRead,
    ]
  );
}
