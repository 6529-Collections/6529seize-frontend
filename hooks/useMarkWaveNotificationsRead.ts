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

type AuthHeaders = Record<string, string>;

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

interface PendingWaveReadRequestState {
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

const inFlightWaveReadRequests = new Map<string, WaveReadRequestState>();
const pendingWaveReadRequests = new Map<string, PendingWaveReadRequestState>();

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

const getAuthHeaders = (walletAuth: string): AuthHeaders => ({
  Authorization: `Bearer ${walletAuth}`,
});

const getVerifiedAuthHeaders = ({
  walletAuth,
  addressKey,
  activeProfileProxyCreatorId,
}: {
  readonly walletAuth: string | null;
  readonly addressKey: string | null;
  readonly activeProfileProxyCreatorId: string | null;
}): AuthHeaders | undefined => {
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
    headers: authHeaders,
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

const markWaveReadWithAuthHeaders = ({
  waveId,
  requestKey,
  authHeaders,
  invalidateNotificationsRef,
}: {
  readonly waveId: string;
  readonly requestKey: string;
  readonly authHeaders: AuthHeaders;
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
}): Promise<void> => {
  const existingState = inFlightWaveReadRequests.get(requestKey);
  if (existingState) {
    existingState.pending = true;
    existingState.authHeaders = authHeaders;
    return existingState.promise;
  }

  const state: WaveReadRequestState = {
    promise: Promise.resolve(),
    pending: false,
    requestKey,
    authHeaders,
  };
  inFlightWaveReadRequests.set(requestKey, state);
  state.promise = startWaveReadRequest(
    waveId,
    state,
    invalidateNotificationsRef
  );
  return state.promise;
};

const enqueuePendingWaveReadRequest = ({
  identityKey,
  requestKey,
  waveId,
}: {
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
}): Promise<void> => {
  const existingState = pendingWaveReadRequests.get(requestKey);
  if (existingState) {
    return existingState.promise;
  }

  let resolveQueuedRequest: () => void = () => {};
  let rejectQueuedRequest: (error: unknown) => void = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    resolveQueuedRequest = resolve;
    rejectQueuedRequest = reject;
  });

  const state: PendingWaveReadRequestState = {
    identityKey,
    requestKey,
    waveId,
    promise,
    resolve: resolveQueuedRequest,
    reject: rejectQueuedRequest,
  };
  pendingWaveReadRequests.set(requestKey, state);

  return promise;
};

const flushPendingWaveReadRequests = ({
  identityKey,
  authHeaders,
  invalidateNotificationsRef,
}: {
  readonly identityKey: string;
  readonly authHeaders: AuthHeaders;
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
}): void => {
  const queuedRequests = Array.from(pendingWaveReadRequests.values()).filter(
    (state) => state.identityKey === identityKey
  );

  for (const queuedRequest of queuedRequests) {
    if (
      pendingWaveReadRequests.get(queuedRequest.requestKey) !== queuedRequest
    ) {
      continue;
    }

    pendingWaveReadRequests.delete(queuedRequest.requestKey);
    void (async () => {
      try {
        await markWaveReadWithAuthHeaders({
          waveId: queuedRequest.waveId,
          requestKey: queuedRequest.requestKey,
          authHeaders,
          invalidateNotificationsRef,
        });
        queuedRequest.resolve();
      } catch (error) {
        queuedRequest.reject(error);
      }
    })();
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
  const activeProfileProxyCreatorId = activeProfileProxy
    ? activeProfileProxy.created_by.id
    : null;
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
    invalidateNotificationsRef.current = invalidateNotifications;
  }, [invalidateNotifications]);

  useLayoutEffect(() => {
    if (verifiedAuthHeaders) {
      authHeadersByIdentityRef.current.set(identityKey, verifiedAuthHeaders);
      flushPendingWaveReadRequests({
        identityKey,
        authHeaders: verifiedAuthHeaders,
        invalidateNotificationsRef,
      });
    }
  }, [identityKey, verifiedAuthHeaders]);

  return useCallback(
    (waveId: string): Promise<void> => {
      const requestKey = getWaveReadRequestKey({
        addressKey,
        activeProfileProxyId,
        waveId,
      });
      const identityAuthHeaders =
        authHeadersByIdentityRef.current.get(identityKey);
      if (!identityAuthHeaders) {
        return enqueuePendingWaveReadRequest({
          identityKey,
          requestKey,
          waveId,
        });
      }

      return markWaveReadWithAuthHeaders({
        waveId,
        requestKey,
        authHeaders: identityAuthHeaders,
        invalidateNotificationsRef,
      });
    },
    [activeProfileProxyId, addressKey, identityKey]
  );
}
