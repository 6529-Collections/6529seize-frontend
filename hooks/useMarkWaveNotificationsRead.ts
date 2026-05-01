"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { useCallback, useContext, useMemo } from "react";

interface WaveReadRequestState {
  promise: Promise<void>;
  pending: boolean;
  readonly requestKey: string;
  readonly authHeaders?: Record<string, string> | undefined;
}

const inFlightWaveReadRequests = new Map<string, WaveReadRequestState>();

const getAddressKey = (address: string | undefined): string | null =>
  address?.toLowerCase() ?? null;

const getWaveReadRequestKey = ({
  addressKey,
  activeProfileProxyId,
  waveId,
}: {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly waveId: string;
}): string => JSON.stringify([addressKey, activeProfileProxyId, waveId]);

const getAuthHeaders = (
  walletAuth: string | null
): Record<string, string> | undefined =>
  walletAuth ? { Authorization: `Bearer ${walletAuth}` } : undefined;

const sendWaveReadRequest = async (
  waveId: string,
  authHeaders: Record<string, string> | undefined,
  invalidateNotifications: () => void
): Promise<void> => {
  await commonApiPostWithoutBodyAndResponse({
    endpoint: `notifications/wave/${waveId}/read`,
    ...(authHeaders ? { headers: authHeaders } : {}),
  });
  invalidateNotifications();
};

const startWaveReadRequest = async (
  waveId: string,
  state: WaveReadRequestState,
  invalidateNotifications: () => void
): Promise<void> => {
  let requestError: unknown;
  let hasRequestError = false;

  try {
    await sendWaveReadRequest(
      waveId,
      state.authHeaders,
      invalidateNotifications
    );
  } catch (error) {
    requestError = error;
    hasRequestError = true;
  }

  try {
    if (state.pending) {
      state.pending = false;
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotifications
      );
      await state.promise;
      return;
    }

    if (hasRequestError) {
      throw requestError;
    }
  } finally {
    if (inFlightWaveReadRequests.get(state.requestKey) === state) {
      inFlightWaveReadRequests.delete(state.requestKey);
    }
  }
};

export function useMarkWaveNotificationsRead(): (
  waveId: string
) => Promise<void> {
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const walletAuth = getAuthJwt();
  const authHeaders = useMemo(() => getAuthHeaders(walletAuth), [walletAuth]);
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const addressKey = getAddressKey(address);

  return useCallback(
    (waveId: string): Promise<void> => {
      const requestKey = getWaveReadRequestKey({
        addressKey,
        activeProfileProxyId,
        waveId,
      });
      const existingState = inFlightWaveReadRequests.get(requestKey);
      if (existingState) {
        existingState.pending = true;
        return existingState.promise;
      }

      const state: WaveReadRequestState = {
        promise: Promise.resolve(),
        pending: false,
        requestKey,
        ...(authHeaders ? { authHeaders } : {}),
      };
      inFlightWaveReadRequests.set(requestKey, state);
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotifications
      );
      return state.promise;
    },
    [activeProfileProxyId, addressKey, authHeaders, invalidateNotifications]
  );
}
