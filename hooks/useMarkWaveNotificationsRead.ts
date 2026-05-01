"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

type AuthHeaders = Record<string, string> | undefined;

interface WaveReadRequestState {
  promise: Promise<void>;
  pending: boolean;
  readonly requestKey: string;
  authHeaders: AuthHeaders;
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

const getAuthHeaders = (walletAuth: string | null): AuthHeaders =>
  walletAuth ? { Authorization: `Bearer ${walletAuth}` } : undefined;

const sendWaveReadRequest = async (
  waveId: string,
  authHeaders: AuthHeaders,
  invalidateNotificationsRef: Readonly<{ current: () => void }>
): Promise<void> => {
  await commonApiPostWithoutBodyAndResponse({
    endpoint: `notifications/wave/${waveId}/read`,
    ...(authHeaders ? { headers: authHeaders } : {}),
  });
  invalidateNotificationsRef.current();
};

const startWaveReadRequest = async (
  waveId: string,
  state: WaveReadRequestState,
  invalidateNotificationsRef: Readonly<{ current: () => void }>
): Promise<void> => {
  let requestError: unknown;
  let hasRequestError = false;

  try {
    await sendWaveReadRequest(
      waveId,
      state.authHeaders,
      invalidateNotificationsRef
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
        invalidateNotificationsRef
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
  const authHeadersRef = useRef<AuthHeaders>(authHeaders);
  const invalidateNotificationsRef = useRef(invalidateNotifications);
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const addressKey = getAddressKey(address);

  useLayoutEffect(() => {
    authHeadersRef.current = authHeaders;
  }, [authHeaders]);

  useLayoutEffect(() => {
    invalidateNotificationsRef.current = invalidateNotifications;
  }, [invalidateNotifications]);

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
        existingState.authHeaders = authHeadersRef.current;
        return existingState.promise;
      }

      const state: WaveReadRequestState = {
        promise: Promise.resolve(),
        pending: false,
        requestKey,
        authHeaders: authHeadersRef.current,
      };
      inFlightWaveReadRequests.set(requestKey, state);
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotificationsRef
      );
      return state.promise;
    },
    [activeProfileProxyId, addressKey]
  );
}
