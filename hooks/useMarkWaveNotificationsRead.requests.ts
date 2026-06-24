import {
  getWaveReadIdentityKey,
  getWaveReadProxyRoleIdentityKey,
  getWaveReadRequestKey,
  isWaveReadJwtExpired,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type {
  AuthHeaders,
  WaveReadVerifiedIdentity,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type {
  InvalidateNotificationsRef,
  MarkWaveNotificationsReadResult,
  PendingWaveReadRequestState,
  WaveReadAddressEpoch,
  WaveReadRequestState,
  WaveReadSendIntent,
  WaveReadSendRetryContext,
  WaveReadShouldSend,
} from "@/hooks/useMarkWaveNotificationsRead.types";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import type { RefObject } from "react";

const inFlightWaveReadRequests = new Map<string, WaveReadRequestState>();
const pendingWaveReadRequests = new Map<string, PendingWaveReadRequestState>();
const clearedWaveReadIdentityKeysByAddress = new Map<string, Set<string>>();
const latestVerifiedWaveReadIdentityByAddress = new Map<
  string,
  WaveReadVerifiedIdentity
>();

export const getStaleAddressEpochWaveReadResult = ({
  addressEpoch,
  latestAddressEpochRef,
  queueIfBlocked,
}: {
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly latestAddressEpochRef: RefObject<WaveReadAddressEpoch>;
  readonly queueIfBlocked: boolean;
}): Promise<MarkWaveNotificationsReadResult> | undefined => {
  if (addressEpoch === latestAddressEpochRef.current) {
    return undefined;
  }

  if (!queueIfBlocked) {
    return Promise.resolve("skipped");
  }

  return Promise.resolve("skipped");
};

const clearInFlightWaveReadState = (state: WaveReadRequestState): void => {
  state.pendingSendIntents = [];
};

const isCurrentInFlightWaveReadRequest = (
  state: WaveReadRequestState
): boolean => inFlightWaveReadRequests.get(state.requestKey) === state;

export const clearPendingWaveReadsForAddress = (addressKey: string): void => {
  for (const [requestKey, state] of pendingWaveReadRequests) {
    if (state.addressKey !== addressKey) {
      continue;
    }

    pendingWaveReadRequests.delete(requestKey);
    state.resolve("skipped");
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

export const clearAllWaveReadState = (): void => {
  for (const state of pendingWaveReadRequests.values()) {
    state.resolve("skipped");
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

const shouldSendWaveRead = (sendIntent: WaveReadSendIntent): boolean =>
  sendIntent.shouldSend?.() ?? true;

const hasSendableWaveRead = (
  sendIntents: readonly WaveReadSendIntent[]
): boolean => sendIntents.some(shouldSendWaveRead);

const mergeWaveReadResults = (
  first: MarkWaveNotificationsReadResult,
  second: MarkWaveNotificationsReadResult
): MarkWaveNotificationsReadResult =>
  first === "sent" || second === "sent" ? "sent" : "skipped";

type WaveReadSendRequestResult =
  | MarkWaveNotificationsReadResult
  | "auth-expired";

const createWaveReadSendIntent = ({
  shouldSend,
  retryContext,
}: {
  readonly shouldSend: WaveReadShouldSend;
  readonly retryContext: WaveReadSendRetryContext | undefined;
}): WaveReadSendIntent => ({
  shouldSend,
  retryContext,
});

const requeueExpiredWaveReadIntents = (
  sendIntents: readonly WaveReadSendIntent[],
  invalidateNotificationsRef: InvalidateNotificationsRef
): Promise<MarkWaveNotificationsReadResult> => {
  const requeuedAddressKeys = new Set<string>();
  const retryPromises = sendIntents
    .filter(shouldSendWaveRead)
    .map((sendIntent) => {
      const retryContext = sendIntent.retryContext;
      if (!retryContext) {
        return Promise.resolve<MarkWaveNotificationsReadResult>("skipped");
      }

      if (
        retryContext.addressEpoch === retryContext.latestAddressEpochRef.current
      ) {
        requeuedAddressKeys.add(retryContext.addressKey);
      }

      return enqueuePendingWaveReadRequest({
        ...retryContext,
        shouldSend: sendIntent.shouldSend,
        queueIfBlocked: true,
      });
    });

  if (retryPromises.length === 0) {
    return Promise.resolve("skipped");
  }

  for (const addressKey of requeuedAddressKeys) {
    const verifiedIdentity =
      latestVerifiedWaveReadIdentityByAddress.get(addressKey);
    if (
      !verifiedIdentity ||
      isWaveReadJwtExpired(verifiedIdentity.jwtExpiresAt)
    ) {
      continue;
    }

    flushPendingWaveReadRequests({
      verifiedIdentity,
      invalidateNotificationsRef,
    });
  }

  return Promise.all(retryPromises).then((results) =>
    results.reduce<MarkWaveNotificationsReadResult>(
      mergeWaveReadResults,
      "skipped"
    )
  );
};

const sendWaveReadRequest = async (
  waveId: string,
  authHeaders: AuthHeaders,
  jwtExpiresAt: number,
  invalidateNotificationsRef: InvalidateNotificationsRef,
  sendIntents: readonly WaveReadSendIntent[]
): Promise<WaveReadSendRequestResult> => {
  if (!hasSendableWaveRead(sendIntents)) {
    return "skipped";
  }

  if (isWaveReadJwtExpired(jwtExpiresAt)) {
    return "auth-expired";
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
  invalidateNotificationsRef: InvalidateNotificationsRef
): Promise<MarkWaveNotificationsReadResult> => {
  let requestError: unknown;
  let hasRequestError = false;
  let requestResult: MarkWaveNotificationsReadResult = "skipped";

  try {
    const sendResult = await sendWaveReadRequest(
      waveId,
      state.authHeaders,
      state.jwtExpiresAt,
      invalidateNotificationsRef,
      state.sendIntents
    );

    if (sendResult === "auth-expired") {
      if (!isCurrentInFlightWaveReadRequest(state)) {
        requestResult = "skipped";
      } else {
        const expiredSendIntents = [
          ...state.sendIntents,
          ...state.pendingSendIntents,
        ];
        state.pendingSendIntents = [];
        inFlightWaveReadRequests.delete(state.requestKey);
        requestResult = await requeueExpiredWaveReadIntents(
          expiredSendIntents,
          invalidateNotificationsRef
        );
      }
    } else {
      requestResult = sendResult;
    }
  } catch (error) {
    requestError = error;
    hasRequestError = true;
  }

  try {
    if (
      state.pendingSendIntents.length > 0 &&
      isCurrentInFlightWaveReadRequest(state)
    ) {
      state.sendIntents = state.pendingSendIntents;
      state.pendingSendIntents = [];
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotificationsRef
      );

      let trailingResult: MarkWaveNotificationsReadResult;
      try {
        trailingResult = await state.promise;
      } catch (trailingError) {
        if (hasRequestError) {
          throw requestError;
        }

        throw trailingError;
      }

      if (hasRequestError && trailingResult !== "sent") {
        throw requestError;
      }

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

export const markWaveReadWithAuthHeaders = ({
  waveId,
  addressKey,
  requestKey,
  authHeaders,
  jwtExpiresAt,
  invalidateNotificationsRef,
  sendIntents,
}: {
  readonly waveId: string;
  readonly addressKey: string;
  readonly requestKey: string;
  readonly authHeaders: AuthHeaders;
  readonly jwtExpiresAt: number;
  readonly invalidateNotificationsRef: InvalidateNotificationsRef;
  readonly sendIntents: readonly WaveReadSendIntent[];
}): Promise<MarkWaveNotificationsReadResult> => {
  const existingState = inFlightWaveReadRequests.get(requestKey);
  if (existingState) {
    existingState.authHeaders = authHeaders;
    existingState.jwtExpiresAt = jwtExpiresAt;
    existingState.pendingSendIntents.push(...sendIntents);
    return existingState.promise;
  }

  const state: WaveReadRequestState = {
    promise: Promise.resolve("skipped"),
    addressKey,
    requestKey,
    authHeaders,
    jwtExpiresAt,
    sendIntents: [...sendIntents],
    pendingSendIntents: [],
  };
  inFlightWaveReadRequests.set(requestKey, state);
  state.promise = startWaveReadRequest(
    waveId,
    state,
    invalidateNotificationsRef
  );
  return state.promise;
};

export const markWaveReadIdentityCleared = (
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

export const getVerifiedProxyRoleIdentityKey = (
  identity: WaveReadVerifiedIdentity
): string | null =>
  identity.activeProfileProxyCreatorId !== null
    ? getWaveReadProxyRoleIdentityKey({
        addressKey: identity.addressKey,
        proxyCreatorId: identity.activeProfileProxyCreatorId,
      })
    : null;

export function enqueuePendingWaveReadRequest({
  addressKey,
  activeProfileProxyId,
  proxyCreatorId,
  identityKey,
  requestKey,
  waveId,
  addressEpoch,
  latestAddressEpochRef,
  shouldSend,
  queueIfBlocked,
}: {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly latestAddressEpochRef: RefObject<WaveReadAddressEpoch>;
  readonly shouldSend: WaveReadShouldSend;
  readonly queueIfBlocked: boolean;
}): Promise<MarkWaveNotificationsReadResult> {
  const staleAddressEpochResult = getStaleAddressEpochWaveReadResult({
    addressEpoch,
    latestAddressEpochRef,
    queueIfBlocked,
  });
  if (staleAddressEpochResult) {
    return staleAddressEpochResult;
  }

  if (!queueIfBlocked) {
    return Promise.resolve("skipped");
  }

  const retryContext: WaveReadSendRetryContext = {
    addressKey,
    activeProfileProxyId,
    proxyCreatorId,
    identityKey,
    requestKey,
    waveId,
    addressEpoch,
    latestAddressEpochRef,
  };
  const sendIntent = createWaveReadSendIntent({
    shouldSend,
    retryContext,
  });

  const existingState = pendingWaveReadRequests.get(requestKey);
  if (existingState) {
    existingState.sendIntents.push(sendIntent);
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
    addressEpoch,
    latestAddressEpochRef,
    promise,
    resolve: resolveQueuedRequest,
    reject: rejectQueuedRequest,
    sendIntents: [sendIntent],
  };
  pendingWaveReadRequests.set(requestKey, state);

  return promise;
}

const flushQueuedWaveReadRequests = ({
  queuedRequests,
  getRequestKey,
  getRetryContext,
  authHeaders,
  jwtExpiresAt,
  invalidateNotificationsRef,
}: {
  readonly queuedRequests: readonly PendingWaveReadRequestState[];
  readonly getRequestKey: (
    queuedRequest: PendingWaveReadRequestState
  ) => string;
  readonly getRetryContext: (
    queuedRequest: PendingWaveReadRequestState,
    requestKey: string
  ) => WaveReadSendRetryContext;
  readonly authHeaders: AuthHeaders;
  readonly jwtExpiresAt: number;
  readonly invalidateNotificationsRef: InvalidateNotificationsRef;
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

    if (
      queuedRequest.addressEpoch !== queuedRequest.latestAddressEpochRef.current
    ) {
      pendingWaveReadRequests.delete(queuedRequest.requestKey);
      queuedRequest.resolve("skipped");
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

    const sendIntents = groupedRequests.flatMap((queuedRequest) =>
      queuedRequest.sendIntents.map((sendIntent) =>
        createWaveReadSendIntent({
          shouldSend: sendIntent.shouldSend,
          retryContext: getRetryContext(queuedRequest, requestKey),
        })
      )
    );

    void (async () => {
      try {
        const result = await markWaveReadWithAuthHeaders({
          waveId: firstQueuedRequest.waveId,
          addressKey: firstQueuedRequest.addressKey,
          requestKey,
          authHeaders,
          jwtExpiresAt,
          invalidateNotificationsRef,
          sendIntents,
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

export function flushPendingWaveReadRequests({
  verifiedIdentity,
  invalidateNotificationsRef,
}: {
  readonly verifiedIdentity: WaveReadVerifiedIdentity;
  readonly invalidateNotificationsRef: InvalidateNotificationsRef;
}): void {
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
    getRetryContext: (queuedRequest, requestKey) => ({
      addressKey: verifiedIdentity.addressKey,
      activeProfileProxyId: verifiedIdentity.activeProfileProxyId,
      proxyCreatorId: null,
      identityKey: verifiedIdentity.identityKey,
      requestKey,
      waveId: queuedRequest.waveId,
      addressEpoch: queuedRequest.addressEpoch,
      latestAddressEpochRef: queuedRequest.latestAddressEpochRef,
    }),
    authHeaders: verifiedIdentity.authHeaders,
    jwtExpiresAt: verifiedIdentity.jwtExpiresAt,
    invalidateNotificationsRef,
  });
}

export const flushPendingClearedWaveReadRequests = ({
  verifiedIdentity,
  invalidateNotificationsRef,
}: {
  readonly verifiedIdentity: WaveReadVerifiedIdentity;
  readonly invalidateNotificationsRef: InvalidateNotificationsRef;
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
    getRetryContext: (queuedRequest, requestKey) => ({
      addressKey: verifiedIdentity.addressKey,
      activeProfileProxyId: verifiedIdentity.activeProfileProxyId,
      proxyCreatorId: null,
      identityKey: verifiedIdentity.identityKey,
      requestKey,
      waveId: queuedRequest.waveId,
      addressEpoch: queuedRequest.addressEpoch,
      latestAddressEpochRef: queuedRequest.latestAddressEpochRef,
    }),
    authHeaders: verifiedIdentity.authHeaders,
    jwtExpiresAt: verifiedIdentity.jwtExpiresAt,
    invalidateNotificationsRef,
  });

  clearedIdentityKeys.delete(verifiedIdentity.identityKey);
  if (clearedIdentityKeys.size === 0) {
    clearedWaveReadIdentityKeysByAddress.delete(verifiedIdentity.addressKey);
  }
};

export const getLatestVerifiedWaveReadIdentityByAddress = (
  addressKey: string
): WaveReadVerifiedIdentity | undefined =>
  latestVerifiedWaveReadIdentityByAddress.get(addressKey);

export const setLatestVerifiedWaveReadIdentityByAddress = (
  identity: WaveReadVerifiedIdentity
): void => {
  latestVerifiedWaveReadIdentityByAddress.set(identity.addressKey, identity);
};

export const deleteLatestVerifiedWaveReadIdentityByAddress = (
  addressKey: string
): void => {
  latestVerifiedWaveReadIdentityByAddress.delete(addressKey);
};

export const deleteLatestVerifiedWaveReadIdentityIfCurrent = (
  identity: WaveReadVerifiedIdentity
): void => {
  if (
    latestVerifiedWaveReadIdentityByAddress.get(identity.addressKey) ===
    identity
  ) {
    latestVerifiedWaveReadIdentityByAddress.delete(identity.addressKey);
  }
};
