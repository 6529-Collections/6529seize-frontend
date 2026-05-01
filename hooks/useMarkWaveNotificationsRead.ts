"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { jwtDecode } from "jwt-decode";
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

type AuthHeaders = Record<string, string> | undefined;

interface WaveReadJwtPayload {
  readonly sub?: string | undefined;
  readonly role?: string | null | undefined;
}

interface WaveReadRequestState {
  promise: Promise<void>;
  pending: boolean;
  readonly requestKey: string;
  authHeaders: AuthHeaders;
}

const inFlightWaveReadRequests = new Map<string, WaveReadRequestState>();

const getAddressKey = (address: string | undefined): string | null =>
  address?.toLowerCase() ?? null;

const getWaveReadIdentityKey = ({
  addressKey,
  activeProfileProxyId,
}: {
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
}): string => JSON.stringify([addressKey, activeProfileProxyId]);

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

const getVerifiedAuthHeaders = ({
  walletAuth,
  addressKey,
  activeProfileProxyCreatorId,
}: {
  readonly walletAuth: string | null;
  readonly addressKey: string | null;
  readonly activeProfileProxyCreatorId: string | null;
}): AuthHeaders => {
  if (!walletAuth || !addressKey) {
    return undefined;
  }

  try {
    const decodedJwt = jwtDecode<WaveReadJwtPayload>(walletAuth);
    const jwtAddressKey = decodedJwt.sub?.toLowerCase() ?? null;
    if (jwtAddressKey !== addressKey) {
      return undefined;
    }

    const jwtRole =
      typeof decodedJwt.role === "string" && decodedJwt.role.length > 0
        ? decodedJwt.role
        : null;
    if (jwtRole !== activeProfileProxyCreatorId) {
      return undefined;
    }

    return getAuthHeaders(walletAuth);
  } catch {
    return undefined;
  }
};

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
  const invalidateNotificationsRef = useRef(invalidateNotifications);
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const activeProfileProxyCreatorId =
    activeProfileProxy !== null ? activeProfileProxy.created_by.id : null;
  const addressKey = getAddressKey(address);
  const identityKey = getWaveReadIdentityKey({
    addressKey,
    activeProfileProxyId,
  });
  const verifiedAuthHeaders = useMemo(
    () =>
      getVerifiedAuthHeaders({
        walletAuth,
        addressKey,
        activeProfileProxyCreatorId,
      }),
    [walletAuth, addressKey, activeProfileProxyCreatorId]
  );
  const authHeadersByIdentityRef = useRef<Map<string, AuthHeaders>>(
    new Map<string, AuthHeaders>(
      verifiedAuthHeaders ? [[identityKey, verifiedAuthHeaders]] : []
    )
  );

  useLayoutEffect(() => {
    if (verifiedAuthHeaders) {
      authHeadersByIdentityRef.current.set(identityKey, verifiedAuthHeaders);
    }
  }, [identityKey, verifiedAuthHeaders]);

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
      const identityAuthHeaders =
        authHeadersByIdentityRef.current.get(identityKey);
      const existingState = inFlightWaveReadRequests.get(requestKey);
      if (existingState) {
        existingState.pending = true;
        existingState.authHeaders = identityAuthHeaders;
        return existingState.promise;
      }

      const state: WaveReadRequestState = {
        promise: Promise.resolve(),
        pending: false,
        requestKey,
        authHeaders: identityAuthHeaders,
      };
      inFlightWaveReadRequests.set(requestKey, state);
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotificationsRef
      );
      return state.promise;
    },
    [activeProfileProxyId, addressKey, identityKey]
  );
}
