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
import { useOptionalDmUnreadActions } from "@/services/dm-unread/DmUnreadStateProvider";

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
  const dmUnreadActions = useOptionalDmUnreadActions();
  const applyDmServerState = dmUnreadActions?.applyServerState;
  const beginDmRead = dmUnreadActions?.beginRead;
  const cancelDmRead = dmUnreadActions?.cancelRead;
  const reconcileFailedDmRead = dmUnreadActions?.reconcileFailedRead;
  const hasDmUnreadActions = dmUnreadActions !== null;

  return useCallback(
    (
      waveId: string,
      options?: MarkWaveNotificationsReadOptions
    ): Promise<MarkWaveNotificationsReadResult> => {
      const readOperation =
        beginDmRead?.(waveId, options?.readThroughSerialNo) ?? null;
      const shouldHandleDmResponse =
        hasDmUnreadActions &&
        (readOperation !== null || options?.requestDmUnreadState === true);
      if (
        !shouldHandleDmResponse ||
        !applyDmServerState ||
        !cancelDmRead ||
        !reconcileFailedDmRead
      ) {
        return markWaveNotificationsRead(waveId, options);
      }

      const markDmRead = async (): Promise<MarkWaveNotificationsReadResult> => {
        try {
          const result = await markWaveNotificationsRead(waveId, {
            ...options,
            readThroughSerialNo:
              readOperation?.readThroughSerialNo ??
              options?.readThroughSerialNo,
            onReadResponse: (response) => {
              options?.onReadResponse?.(response);
              if (response.dm_unread_state) {
                applyDmServerState(response.dm_unread_state);
              }
            },
          });
          if (readOperation && result === "skipped") {
            cancelDmRead(readOperation);
          }
          return result;
        } catch (error) {
          if (readOperation) {
            await reconcileFailedDmRead(readOperation);
          }
          throw error;
        }
      };

      return markDmRead();
    },
    [
      applyDmServerState,
      beginDmRead,
      cancelDmRead,
      hasDmUnreadActions,
      markWaveNotificationsRead,
      reconcileFailedDmRead,
    ]
  );
}
