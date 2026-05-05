import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import {
  getWaveReadIdentityKey,
  getWaveReadProxyRoleIdentityKey,
  getWaveReadProxyRoleRequestKey,
  getWaveReadRequestKey,
  useWaveReadIdentityState,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type {
  AuthHeaders,
  WaveReadIdentityConfig,
  WaveReadTemporaryProxyRoleIdentity,
  WaveReadVerifiedIdentity,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type { RefObject } from "react";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

interface WaveReadRequestState {
  promise: Promise<MarkWaveNotificationsReadResult>;
  readonly addressKey: string;
  readonly requestKey: string;
  authHeaders: AuthHeaders;
  shouldSends: WaveReadShouldSend[];
  pendingShouldSends: WaveReadShouldSend[];
}

interface PendingWaveReadRequestState {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly promise: Promise<MarkWaveNotificationsReadResult>;
  readonly resolve: (result: MarkWaveNotificationsReadResult) => void;
  readonly reject: (error: unknown) => void;
  readonly shouldSends: WaveReadShouldSend[];
}

interface WaveReadCacheRefs {
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
  readonly authByIdentityRef: RefObject<Map<string, WaveReadVerifiedIdentity>>;
  readonly temporaryProxyRoleIdentityByIdentityRef: RefObject<
    Map<string, WaveReadTemporaryProxyRoleIdentity>
  >;
  readonly latestVerifiedIdentityByAddressRef: RefObject<
    Map<string, WaveReadVerifiedIdentity>
  >;
  readonly latestVerifiedIdentityByProxyRoleRef: RefObject<
    Map<string, WaveReadVerifiedIdentity>
  >;
  readonly clearedIdentityKeysRef: RefObject<Set<string>>;
}

interface WaveNotificationsReadMarkerConfig extends WaveReadIdentityConfig {
  readonly invalidateNotifications: () => void;
}

export interface WaveNotificationsReadMarkerState {
  readonly markWaveNotificationsRead: (
    waveId: string,
    options?: MarkWaveNotificationsReadOptions
  ) => Promise<MarkWaveNotificationsReadResult>;
  readonly identityKey: string;
  readonly proxyRoleIdentityKey: string | null;
}

export type MarkWaveNotificationsReadResult = "sent" | "skipped";

export interface MarkWaveNotificationsReadOptions {
  readonly shouldSend?: () => boolean;
  readonly queueIfBlocked?: boolean;
}

type WaveReadShouldSend = (() => boolean) | undefined;

const inFlightWaveReadRequests = new Map<string, WaveReadRequestState>();
const pendingWaveReadRequests = new Map<string, PendingWaveReadRequestState>();
const clearedWaveReadIdentityKeysByAddress = new Map<string, Set<string>>();
const latestVerifiedWaveReadIdentityByAddress = new Map<
  string,
  WaveReadVerifiedIdentity
>();
let mountedWaveNotificationsReadMarkerHookCount = 0;

const createClearedWaveReadStateError = (reason: string): Error =>
  new Error(`Pending wave notification read cleared: ${reason}.`);

const clearInFlightWaveReadState = (state: WaveReadRequestState): void => {
  state.pendingShouldSends = [];
};

const isCurrentInFlightWaveReadRequest = (
  state: WaveReadRequestState
): boolean => inFlightWaveReadRequests.get(state.requestKey) === state;

const clearPendingWaveReadsForAddress = (addressKey: string): void => {
  for (const [requestKey, state] of pendingWaveReadRequests) {
    if (state.addressKey !== addressKey) {
      continue;
    }

    pendingWaveReadRequests.delete(requestKey);
    state.reject(
      createClearedWaveReadStateError("wallet address changed or disconnected")
    );
  }

  for (const [requestKey, state] of inFlightWaveReadRequests) {
    if (state.addressKey !== addressKey) {
      continue;
    }

    clearInFlightWaveReadState(state);
    inFlightWaveReadRequests.delete(requestKey);
  }

  clearedWaveReadIdentityKeysByAddress.delete(addressKey);
  latestVerifiedWaveReadIdentityByAddress.delete(addressKey);
};

const clearAllWaveReadState = (): void => {
  for (const state of pendingWaveReadRequests.values()) {
    state.reject(
      createClearedWaveReadStateError("no marker hooks are mounted")
    );
  }

  pendingWaveReadRequests.clear();

  for (const state of inFlightWaveReadRequests.values()) {
    clearInFlightWaveReadState(state);
  }

  inFlightWaveReadRequests.clear();
  clearedWaveReadIdentityKeysByAddress.clear();
  latestVerifiedWaveReadIdentityByAddress.clear();
};

const hasConsistentPendingWaveReadIdentity = (
  state: PendingWaveReadRequestState
): boolean => {
  if (state.proxyCreatorId !== null) {
    return (
      state.identityKey ===
      getWaveReadProxyRoleIdentityKey({
        addressKey: state.addressKey,
        proxyCreatorId: state.proxyCreatorId,
      })
    );
  }

  return (
    state.identityKey ===
    getWaveReadIdentityKey({
      addressKey: state.addressKey,
      activeProfileProxyId: state.activeProfileProxyId,
    })
  );
};

const shouldSendWaveRead = (shouldSend: WaveReadShouldSend): boolean =>
  shouldSend?.() ?? true;

const hasSendableWaveRead = (
  shouldSends: readonly WaveReadShouldSend[]
): boolean => shouldSends.some(shouldSendWaveRead);

const mergeWaveReadResults = (
  first: MarkWaveNotificationsReadResult,
  second: MarkWaveNotificationsReadResult
): MarkWaveNotificationsReadResult =>
  first === "sent" || second === "sent" ? "sent" : "skipped";

const sendWaveReadRequest = async (
  waveId: string,
  authHeaders: AuthHeaders,
  invalidateNotificationsRef: Readonly<{ current: () => void }>,
  shouldSends: readonly WaveReadShouldSend[]
): Promise<MarkWaveNotificationsReadResult> => {
  if (!hasSendableWaveRead(shouldSends)) {
    return "skipped";
  }

  await commonApiPostWithoutBodyAndResponse({
    endpoint: `notifications/wave/${waveId}/read`,
    headers: authHeaders,
  });
  invalidateNotificationsRef.current();
  return "sent";
};

const startWaveReadRequest = async (
  waveId: string,
  state: WaveReadRequestState,
  invalidateNotificationsRef: Readonly<{ current: () => void }>
): Promise<MarkWaveNotificationsReadResult> => {
  let requestError: unknown;
  let hasRequestError = false;
  let requestResult: MarkWaveNotificationsReadResult = "skipped";

  try {
    requestResult = await sendWaveReadRequest(
      waveId,
      state.authHeaders,
      invalidateNotificationsRef,
      state.shouldSends
    );
  } catch (error) {
    requestError = error;
    hasRequestError = true;
  }

  try {
    if (
      state.pendingShouldSends.length > 0 &&
      isCurrentInFlightWaveReadRequest(state)
    ) {
      state.shouldSends = state.pendingShouldSends;
      state.pendingShouldSends = [];
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotificationsRef
      );
      const trailingResult = await state.promise;
      return mergeWaveReadResults(requestResult, trailingResult);
    }

    if (hasRequestError) {
      throw requestError;
    }

    return requestResult;
  } finally {
    if (isCurrentInFlightWaveReadRequest(state)) {
      inFlightWaveReadRequests.delete(state.requestKey);
    }
  }
};

const markWaveReadWithAuthHeaders = ({
  waveId,
  addressKey,
  requestKey,
  authHeaders,
  invalidateNotificationsRef,
  shouldSend,
}: {
  readonly waveId: string;
  readonly addressKey: string;
  readonly requestKey: string;
  readonly authHeaders: AuthHeaders;
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
  readonly shouldSend: WaveReadShouldSend;
}): Promise<MarkWaveNotificationsReadResult> => {
  const existingState = inFlightWaveReadRequests.get(requestKey);
  if (existingState) {
    existingState.authHeaders = authHeaders;
    existingState.pendingShouldSends.push(shouldSend);
    return existingState.promise;
  }

  const state: WaveReadRequestState = {
    promise: Promise.resolve("skipped"),
    addressKey,
    requestKey,
    authHeaders,
    shouldSends: [shouldSend],
    pendingShouldSends: [],
  };
  inFlightWaveReadRequests.set(requestKey, state);
  state.promise = startWaveReadRequest(
    waveId,
    state,
    invalidateNotificationsRef
  );
  return state.promise;
};

const markWaveReadIdentityCleared = (
  identity: WaveReadVerifiedIdentity
): void => {
  const clearedIdentityKeys =
    clearedWaveReadIdentityKeysByAddress.get(identity.addressKey) ??
    new Set<string>();
  clearedIdentityKeys.add(identity.identityKey);
  clearedWaveReadIdentityKeysByAddress.set(
    identity.addressKey,
    clearedIdentityKeys
  );
};

const getVerifiedProxyRoleIdentityKey = (
  identity: WaveReadVerifiedIdentity
): string | null =>
  identity.activeProfileProxyCreatorId !== null
    ? getWaveReadProxyRoleIdentityKey({
        addressKey: identity.addressKey,
        proxyCreatorId: identity.activeProfileProxyCreatorId,
      })
    : null;

const enqueuePendingWaveReadRequest = ({
  addressKey,
  activeProfileProxyId,
  proxyCreatorId,
  identityKey,
  requestKey,
  waveId,
  shouldSend,
  queueIfBlocked,
}: {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly shouldSend: WaveReadShouldSend;
  readonly queueIfBlocked: boolean;
}): Promise<MarkWaveNotificationsReadResult> => {
  if (!queueIfBlocked) {
    return Promise.resolve("skipped");
  }

  const existingState = pendingWaveReadRequests.get(requestKey);
  if (existingState) {
    existingState.shouldSends.push(shouldSend);
    return existingState.promise;
  }

  let resolveQueuedRequest: (
    result: MarkWaveNotificationsReadResult
  ) => void = () => {};
  let rejectQueuedRequest: (error: unknown) => void = () => {};
  const promise = new Promise<MarkWaveNotificationsReadResult>(
    (resolve, reject) => {
      resolveQueuedRequest = resolve;
      rejectQueuedRequest = reject;
    }
  );

  const state: PendingWaveReadRequestState = {
    addressKey,
    activeProfileProxyId,
    proxyCreatorId,
    identityKey,
    requestKey,
    waveId,
    promise,
    resolve: resolveQueuedRequest,
    reject: rejectQueuedRequest,
    shouldSends: [shouldSend],
  };
  pendingWaveReadRequests.set(requestKey, state);

  return promise;
};

const hasSendableQueuedWaveRead = (
  queuedRequest: PendingWaveReadRequestState
): boolean => hasSendableWaveRead(queuedRequest.shouldSends);

const flushQueuedWaveReadRequests = ({
  queuedRequests,
  getRequestKey,
  authHeaders,
  invalidateNotificationsRef,
}: {
  readonly queuedRequests: readonly PendingWaveReadRequestState[];
  readonly getRequestKey: (
    queuedRequest: PendingWaveReadRequestState
  ) => string;
  readonly authHeaders: AuthHeaders;
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
}): void => {
  const queuedRequestsByRequestKey = new Map<
    string,
    PendingWaveReadRequestState[]
  >();

  for (const queuedRequest of queuedRequests) {
    if (
      pendingWaveReadRequests.get(queuedRequest.requestKey) !== queuedRequest
    ) {
      continue;
    }

    const requestKey = getRequestKey(queuedRequest);
    pendingWaveReadRequests.delete(queuedRequest.requestKey);
    const groupedRequests = queuedRequestsByRequestKey.get(requestKey) ?? [];
    groupedRequests.push(queuedRequest);
    queuedRequestsByRequestKey.set(requestKey, groupedRequests);
  }

  for (const [requestKey, groupedRequests] of queuedRequestsByRequestKey) {
    const [firstQueuedRequest] = groupedRequests;
    if (!firstQueuedRequest) {
      continue;
    }

    void (async () => {
      try {
        const result = await markWaveReadWithAuthHeaders({
          waveId: firstQueuedRequest.waveId,
          addressKey: firstQueuedRequest.addressKey,
          requestKey,
          authHeaders,
          invalidateNotificationsRef,
          shouldSend: () => groupedRequests.some(hasSendableQueuedWaveRead),
        });
        for (const queuedRequest of groupedRequests) {
          queuedRequest.resolve(result);
        }
      } catch (error) {
        for (const queuedRequest of groupedRequests) {
          queuedRequest.reject(error);
        }
      }
    })();
  }
};

const flushPendingWaveReadRequests = ({
  verifiedIdentity,
  invalidateNotificationsRef,
}: {
  readonly verifiedIdentity: WaveReadVerifiedIdentity;
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
}): void => {
  const proxyRoleIdentityKey =
    getVerifiedProxyRoleIdentityKey(verifiedIdentity);
  const queuedRequests = Array.from(pendingWaveReadRequests.values()).filter(
    (state) =>
      (state.identityKey === verifiedIdentity.identityKey ||
        state.identityKey === proxyRoleIdentityKey) &&
      state.addressKey === verifiedIdentity.addressKey &&
      hasConsistentPendingWaveReadIdentity(state)
  );

  flushQueuedWaveReadRequests({
    queuedRequests,
    getRequestKey: (queuedRequest) => {
      if (queuedRequest.identityKey !== proxyRoleIdentityKey) {
        return queuedRequest.requestKey;
      }

      return getWaveReadRequestKey({
        addressKey: verifiedIdentity.addressKey,
        activeProfileProxyId: verifiedIdentity.activeProfileProxyId,
        waveId: queuedRequest.waveId,
      });
    },
    authHeaders: verifiedIdentity.authHeaders,
    invalidateNotificationsRef,
  });
};

const flushPendingClearedWaveReadRequests = ({
  verifiedIdentity,
  invalidateNotificationsRef,
}: {
  readonly verifiedIdentity: WaveReadVerifiedIdentity;
  readonly invalidateNotificationsRef: Readonly<{ current: () => void }>;
}): void => {
  const clearedIdentityKeys = clearedWaveReadIdentityKeysByAddress.get(
    verifiedIdentity.addressKey
  );
  if (!clearedIdentityKeys?.has(verifiedIdentity.identityKey)) {
    return;
  }

  const queuedRequests = Array.from(pendingWaveReadRequests.values()).filter(
    (state) =>
      state.identityKey === verifiedIdentity.identityKey &&
      hasConsistentPendingWaveReadIdentity(state) &&
      state.addressKey === verifiedIdentity.addressKey
  );

  flushQueuedWaveReadRequests({
    queuedRequests,
    getRequestKey: (queuedRequest) => queuedRequest.requestKey,
    authHeaders: verifiedIdentity.authHeaders,
    invalidateNotificationsRef,
  });

  clearedIdentityKeys.delete(verifiedIdentity.identityKey);
  if (clearedIdentityKeys.size === 0) {
    clearedWaveReadIdentityKeysByAddress.delete(verifiedIdentity.addressKey);
  }
};

const useWaveReadCacheRefs = ({
  identityKey,
  temporaryProxyRoleIdentity,
  verifiedIdentity,
  invalidateNotifications,
}: {
  readonly identityKey: string;
  readonly temporaryProxyRoleIdentity:
    | WaveReadTemporaryProxyRoleIdentity
    | undefined;
  readonly verifiedIdentity: WaveReadVerifiedIdentity | undefined;
  readonly invalidateNotifications: () => void;
}): WaveReadCacheRefs => {
  const invalidateNotificationsRef = useRef(invalidateNotifications);
  const authByIdentityRef = useRef<Map<string, WaveReadVerifiedIdentity>>(
    new Map<string, WaveReadVerifiedIdentity>(
      verifiedIdentity ? [[identityKey, verifiedIdentity]] : []
    )
  );
  const temporaryProxyRoleIdentityByIdentityRef = useRef<
    Map<string, WaveReadTemporaryProxyRoleIdentity>
  >(
    new Map<string, WaveReadTemporaryProxyRoleIdentity>(
      temporaryProxyRoleIdentity
        ? [[identityKey, temporaryProxyRoleIdentity]]
        : []
    )
  );
  const latestVerifiedIdentityByAddressRef = useRef<
    Map<string, WaveReadVerifiedIdentity>
  >(
    new Map<string, WaveReadVerifiedIdentity>(
      verifiedIdentity ? [[verifiedIdentity.addressKey, verifiedIdentity]] : []
    )
  );
  const latestVerifiedIdentityByProxyRoleRef = useRef<
    Map<string, WaveReadVerifiedIdentity>
  >(new Map<string, WaveReadVerifiedIdentity>());
  const clearedIdentityKeysRef = useRef<Set<string>>(new Set<string>());

  useLayoutEffect(() => {
    invalidateNotificationsRef.current = invalidateNotifications;
  }, [invalidateNotifications]);

  useLayoutEffect(() => {
    if (temporaryProxyRoleIdentity) {
      temporaryProxyRoleIdentityByIdentityRef.current.set(
        identityKey,
        temporaryProxyRoleIdentity
      );
      return;
    }

    temporaryProxyRoleIdentityByIdentityRef.current.delete(identityKey);
  }, [identityKey, temporaryProxyRoleIdentity]);

  return useMemo(
    () => ({
      invalidateNotificationsRef,
      authByIdentityRef,
      temporaryProxyRoleIdentityByIdentityRef,
      latestVerifiedIdentityByAddressRef,
      latestVerifiedIdentityByProxyRoleRef,
      clearedIdentityKeysRef,
    }),
    [
      authByIdentityRef,
      clearedIdentityKeysRef,
      invalidateNotificationsRef,
      latestVerifiedIdentityByAddressRef,
      latestVerifiedIdentityByProxyRoleRef,
      temporaryProxyRoleIdentityByIdentityRef,
    ]
  );
};

const useSyncWaveReadVerifiedIdentityCaches = ({
  walletAuth,
  verifiedIdentity,
  cacheRefs,
}: {
  readonly walletAuth: string | null;
  readonly verifiedIdentity: WaveReadVerifiedIdentity | undefined;
  readonly cacheRefs: WaveReadCacheRefs;
}): void => {
  const {
    authByIdentityRef,
    clearedIdentityKeysRef,
    invalidateNotificationsRef,
    latestVerifiedIdentityByAddressRef,
    latestVerifiedIdentityByProxyRoleRef,
  } = cacheRefs;

  useLayoutEffect(() => {
    if (walletAuth === null) {
      for (const identity of authByIdentityRef.current.values()) {
        const proxyRoleIdentityKey = getVerifiedProxyRoleIdentityKey(identity);
        markWaveReadIdentityCleared(identity);
        clearedIdentityKeysRef.current.add(identity.identityKey);
        latestVerifiedIdentityByAddressRef.current.delete(identity.addressKey);
        latestVerifiedWaveReadIdentityByAddress.delete(identity.addressKey);
        if (proxyRoleIdentityKey !== null) {
          latestVerifiedIdentityByProxyRoleRef.current.delete(
            proxyRoleIdentityKey
          );
        }
      }
      authByIdentityRef.current.clear();
      return;
    }

    if (verifiedIdentity) {
      authByIdentityRef.current.set(
        verifiedIdentity.identityKey,
        verifiedIdentity
      );
      latestVerifiedIdentityByAddressRef.current.set(
        verifiedIdentity.addressKey,
        verifiedIdentity
      );
      latestVerifiedWaveReadIdentityByAddress.set(
        verifiedIdentity.addressKey,
        verifiedIdentity
      );
      const proxyRoleIdentityKey =
        getVerifiedProxyRoleIdentityKey(verifiedIdentity);
      if (proxyRoleIdentityKey !== null) {
        latestVerifiedIdentityByProxyRoleRef.current.set(
          proxyRoleIdentityKey,
          verifiedIdentity
        );
      }
      flushPendingWaveReadRequests({
        verifiedIdentity,
        invalidateNotificationsRef,
      });
      flushPendingClearedWaveReadRequests({
        verifiedIdentity,
        invalidateNotificationsRef,
      });
    }
  }, [
    authByIdentityRef,
    clearedIdentityKeysRef,
    invalidateNotificationsRef,
    latestVerifiedIdentityByAddressRef,
    latestVerifiedIdentityByProxyRoleRef,
    verifiedIdentity,
    walletAuth,
  ]);
};

const getLatestClearedWaveReadIdentity = ({
  addressKey,
  identityKey,
  cacheRefs,
}: {
  readonly addressKey: string;
  readonly identityKey: string;
  readonly cacheRefs: WaveReadCacheRefs;
}): WaveReadVerifiedIdentity | undefined => {
  if (!cacheRefs.clearedIdentityKeysRef.current.has(identityKey)) {
    return undefined;
  }

  return (
    cacheRefs.latestVerifiedIdentityByAddressRef.current.get(addressKey) ??
    latestVerifiedWaveReadIdentityByAddress.get(addressKey)
  );
};

const useClearWaveReadStateOnAddressChange = (
  addressKey: string | null
): void => {
  const previousAddressKeyRef = useRef(addressKey);

  useLayoutEffect(() => {
    const previousAddressKey = previousAddressKeyRef.current;
    if (previousAddressKey !== null && previousAddressKey !== addressKey) {
      clearPendingWaveReadsForAddress(previousAddressKey);
    }

    previousAddressKeyRef.current = addressKey;
  }, [addressKey]);
};

const useClearWaveReadStateOnLastUnmount = (): void => {
  useLayoutEffect(() => {
    mountedWaveNotificationsReadMarkerHookCount += 1;

    return () => {
      mountedWaveNotificationsReadMarkerHookCount -= 1;

      if (mountedWaveNotificationsReadMarkerHookCount <= 0) {
        mountedWaveNotificationsReadMarkerHookCount = 0;
        clearAllWaveReadState();
      }
    };
  }, []);
};

const markTemporaryProxyRoleWaveRead = ({
  waveId,
  addressKey,
  temporaryProxyRoleIdentity,
  cacheRefs,
  options,
}: {
  readonly waveId: string;
  readonly addressKey: string;
  readonly temporaryProxyRoleIdentity: WaveReadTemporaryProxyRoleIdentity;
  readonly cacheRefs: WaveReadCacheRefs;
  readonly options: MarkWaveNotificationsReadOptions | undefined;
}): Promise<MarkWaveNotificationsReadResult> => {
  const latestVerifiedProxyRoleIdentity =
    cacheRefs.latestVerifiedIdentityByProxyRoleRef.current.get(
      temporaryProxyRoleIdentity.identityKey
    );
  if (latestVerifiedProxyRoleIdentity) {
    return markWaveReadWithAuthHeaders({
      waveId,
      addressKey: latestVerifiedProxyRoleIdentity.addressKey,
      requestKey: getWaveReadRequestKey({
        addressKey: latestVerifiedProxyRoleIdentity.addressKey,
        activeProfileProxyId:
          latestVerifiedProxyRoleIdentity.activeProfileProxyId,
        waveId,
      }),
      authHeaders: latestVerifiedProxyRoleIdentity.authHeaders,
      invalidateNotificationsRef: cacheRefs.invalidateNotificationsRef,
      shouldSend: options?.shouldSend,
    });
  }

  return enqueuePendingWaveReadRequest({
    addressKey,
    activeProfileProxyId: null,
    proxyCreatorId: temporaryProxyRoleIdentity.proxyCreatorId,
    identityKey: temporaryProxyRoleIdentity.identityKey,
    requestKey: getWaveReadProxyRoleRequestKey({
      addressKey,
      proxyCreatorId: temporaryProxyRoleIdentity.proxyCreatorId,
      waveId,
    }),
    waveId,
    shouldSend: options?.shouldSend,
    queueIfBlocked: options?.queueIfBlocked ?? true,
  });
};

const markWaveReadFromCache = ({
  waveId,
  addressKey,
  activeProfileProxyId,
  identityKey,
  cacheRefs,
  options,
}: {
  readonly waveId: string;
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly identityKey: string;
  readonly cacheRefs: WaveReadCacheRefs;
  readonly options: MarkWaveNotificationsReadOptions | undefined;
}): Promise<MarkWaveNotificationsReadResult> => {
  if (addressKey === null) {
    return Promise.resolve("skipped");
  }

  const requestKey = getWaveReadRequestKey({
    addressKey,
    activeProfileProxyId,
    waveId,
  });
  const verifiedCachedIdentity =
    cacheRefs.authByIdentityRef.current.get(identityKey);
  if (verifiedCachedIdentity) {
    return markWaveReadWithAuthHeaders({
      waveId,
      addressKey: verifiedCachedIdentity.addressKey,
      requestKey,
      authHeaders: verifiedCachedIdentity.authHeaders,
      invalidateNotificationsRef: cacheRefs.invalidateNotificationsRef,
      shouldSend: options?.shouldSend,
    });
  }

  const latestVerifiedIdentity = getLatestClearedWaveReadIdentity({
    addressKey,
    identityKey,
    cacheRefs,
  });
  if (latestVerifiedIdentity?.identityKey === identityKey) {
    return markWaveReadWithAuthHeaders({
      waveId,
      addressKey: latestVerifiedIdentity.addressKey,
      requestKey,
      authHeaders: latestVerifiedIdentity.authHeaders,
      invalidateNotificationsRef: cacheRefs.invalidateNotificationsRef,
      shouldSend: options?.shouldSend,
    });
  }

  const temporaryProxyRoleIdentity =
    cacheRefs.temporaryProxyRoleIdentityByIdentityRef.current.get(identityKey);
  if (temporaryProxyRoleIdentity) {
    return markTemporaryProxyRoleWaveRead({
      waveId,
      addressKey,
      temporaryProxyRoleIdentity,
      cacheRefs,
      options,
    });
  }

  return enqueuePendingWaveReadRequest({
    addressKey,
    activeProfileProxyId,
    proxyCreatorId: null,
    identityKey,
    requestKey,
    waveId,
    shouldSend: options?.shouldSend,
    queueIfBlocked: options?.queueIfBlocked ?? true,
  });
};

export const useWaveNotificationsReadMarkerState = ({
  address,
  activeProfileProxyId,
  activeProfileProxyCreatorId,
  walletAuth,
  invalidateNotifications,
}: WaveNotificationsReadMarkerConfig): WaveNotificationsReadMarkerState => {
  const identityState = useWaveReadIdentityState({
    address,
    activeProfileProxyId,
    activeProfileProxyCreatorId,
    walletAuth,
  });
  const cacheRefs = useWaveReadCacheRefs({
    identityKey: identityState.identityKey,
    temporaryProxyRoleIdentity: identityState.temporaryProxyRoleIdentity,
    verifiedIdentity: identityState.verifiedIdentity,
    invalidateNotifications,
  });
  useSyncWaveReadVerifiedIdentityCaches({
    walletAuth,
    verifiedIdentity: identityState.verifiedIdentity,
    cacheRefs,
  });
  useClearWaveReadStateOnAddressChange(identityState.addressKey);
  useClearWaveReadStateOnLastUnmount();
  const {
    addressKey,
    activeProfileProxyId: currentProfileProxyId,
    identityKey,
    proxyRoleIdentityKey,
  } = identityState;

  const markWaveNotificationsRead = useCallback(
    (
      waveId: string,
      options?: MarkWaveNotificationsReadOptions
    ): Promise<MarkWaveNotificationsReadResult> =>
      markWaveReadFromCache({
        waveId,
        addressKey,
        activeProfileProxyId: currentProfileProxyId,
        identityKey,
        cacheRefs,
        options,
      }),
    [addressKey, cacheRefs, currentProfileProxyId, identityKey]
  );

  return useMemo(
    () => ({
      markWaveNotificationsRead,
      identityKey,
      proxyRoleIdentityKey,
    }),
    [identityKey, markWaveNotificationsRead, proxyRoleIdentityKey]
  );
};
