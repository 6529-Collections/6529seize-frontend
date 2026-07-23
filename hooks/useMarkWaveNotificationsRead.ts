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
import { useContext } from "react";

export function useWaveNotificationsReadMarkerState(): WaveNotificationsReadMarkerState {
  const { invalidateWaveReadState } = useContext(ReactQueryWrapperContext);
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
    invalidateWaveReadState,
  });
}

export function useMarkWaveNotificationsRead(): (
  waveId: string,
  options?: MarkWaveNotificationsReadOptions
) => Promise<MarkWaveNotificationsReadResult> {
  return useWaveNotificationsReadMarkerState().markWaveNotificationsRead;
}
