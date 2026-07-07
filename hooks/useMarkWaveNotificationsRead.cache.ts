import {
  getWaveReadProxyRoleRequestKey,
  getWaveReadRequestKey,
  isWaveReadJwtExpired,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type {
  WaveReadTemporaryProxyRoleIdentity,
  WaveReadVerifiedIdentity,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import {
  clearAllWaveReadState,
  clearPendingWaveReadsForAddress,
  deleteLatestVerifiedWaveReadIdentityByAddress,
  deleteLatestVerifiedWaveReadIdentityIfCurrent,
  enqueuePendingWaveReadRequest,
  flushPendingClearedWaveReadRequests,
  flushPendingWaveReadRequests,
  getLatestVerifiedWaveReadIdentityByAddress,
  getStaleAddressEpochWaveReadResult,
  getVerifiedProxyRoleIdentityKey,
  markWaveReadIdentityCleared,
  markWaveReadWithAuthHeaders,
  setLatestVerifiedWaveReadIdentityByAddress,
} from "@/hooks/useMarkWaveNotificationsRead.requests";
import type {
  MarkWaveNotificationsReadOptions,
  MarkWaveNotificationsReadResult,
  WaveReadAddressEpoch,
  WaveReadCacheRefs,
  WaveReadSendIntent,
  WaveReadSendRetryContext,
} from "@/hooks/useMarkWaveNotificationsRead.types";
import { useLayoutEffect, useMemo, useRef } from "react";

let mountedWaveNotificationsReadMarkerHookCount = 0;
let clearWaveNotificationsReadStateTimeout: {
  readonly timeout: ReturnType<typeof globalThis.setTimeout>;
  readonly addressKey: string | null;
} | null = null;

export const useWaveReadCacheRefs = ({
  addressEpoch,
  identityKey,
  temporaryProxyRoleIdentity,
  verifiedIdentity,
  invalidateNotifications,
}: {
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly identityKey: string;
  readonly temporaryProxyRoleIdentity:
    | WaveReadTemporaryProxyRoleIdentity
    | undefined;
  readonly verifiedIdentity: WaveReadVerifiedIdentity | undefined;
  readonly invalidateNotifications: () => void;
}): WaveReadCacheRefs => {
  const invalidateNotificationsRef = useRef(invalidateNotifications);
  const latestAddressEpochRef = useRef<WaveReadAddressEpoch>(addressEpoch);
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
    latestAddressEpochRef.current = addressEpoch;
  }, [addressEpoch]);

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
      latestAddressEpochRef,
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
      latestAddressEpochRef,
      latestVerifiedIdentityByAddressRef,
      latestVerifiedIdentityByProxyRoleRef,
      temporaryProxyRoleIdentityByIdentityRef,
    ]
  );
};

export const useSyncWaveReadVerifiedIdentityCaches = ({
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
        deleteLatestVerifiedWaveReadIdentityByAddress(identity.addressKey);
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
      setLatestVerifiedWaveReadIdentityByAddress(verifiedIdentity);
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

const evictExpiredWaveReadIdentity = ({
  identity,
  cacheRefs,
}: {
  readonly identity: WaveReadVerifiedIdentity;
  readonly cacheRefs: WaveReadCacheRefs;
}): void => {
  if (
    cacheRefs.authByIdentityRef.current.get(identity.identityKey) === identity
  ) {
    cacheRefs.authByIdentityRef.current.delete(identity.identityKey);
  }

  if (
    cacheRefs.latestVerifiedIdentityByAddressRef.current.get(
      identity.addressKey
    ) === identity
  ) {
    cacheRefs.latestVerifiedIdentityByAddressRef.current.delete(
      identity.addressKey
    );
  }

  const proxyRoleIdentityKey = getVerifiedProxyRoleIdentityKey(identity);
  if (
    proxyRoleIdentityKey !== null &&
    cacheRefs.latestVerifiedIdentityByProxyRoleRef.current.get(
      proxyRoleIdentityKey
    ) === identity
  ) {
    cacheRefs.latestVerifiedIdentityByProxyRoleRef.current.delete(
      proxyRoleIdentityKey
    );
  }

  deleteLatestVerifiedWaveReadIdentityIfCurrent(identity);
};

const getUsableCachedWaveReadIdentity = ({
  identity,
  cacheRefs,
}: {
  readonly identity: WaveReadVerifiedIdentity | undefined;
  readonly cacheRefs: WaveReadCacheRefs;
}): WaveReadVerifiedIdentity | undefined => {
  if (!identity) {
    return undefined;
  }

  if (!isWaveReadJwtExpired(identity.jwtExpiresAt)) {
    return identity;
  }

  evictExpiredWaveReadIdentity({ identity, cacheRefs });
  return undefined;
};

const getUsableLatestClearedWaveReadIdentity = ({
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

  const localLatestIdentity = getUsableCachedWaveReadIdentity({
    identity:
      cacheRefs.latestVerifiedIdentityByAddressRef.current.get(addressKey),
    cacheRefs,
  });
  if (localLatestIdentity) {
    return localLatestIdentity;
  }

  return getUsableCachedWaveReadIdentity({
    identity: getLatestVerifiedWaveReadIdentityByAddress(addressKey),
    cacheRefs,
  });
};

export const useClearWaveReadStateOnAddressChange = (
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

export const useClearWaveReadStateOnLastUnmount = (
  addressKey: string | null
): void => {
  const latestAddressKeyRef = useRef(addressKey);

  useLayoutEffect(() => {
    latestAddressKeyRef.current = addressKey;
  }, [addressKey]);

  useLayoutEffect(() => {
    if (clearWaveNotificationsReadStateTimeout !== null) {
      const deferredCleanupTimeout =
        clearWaveNotificationsReadStateTimeout.timeout;
      const deferredCleanupAddressKey =
        clearWaveNotificationsReadStateTimeout.addressKey;

      globalThis.clearTimeout(deferredCleanupTimeout);
      clearWaveNotificationsReadStateTimeout = null;

      if (
        deferredCleanupAddressKey !== null &&
        deferredCleanupAddressKey !== latestAddressKeyRef.current
      ) {
        clearPendingWaveReadsForAddress(deferredCleanupAddressKey);
      }
    }

    mountedWaveNotificationsReadMarkerHookCount += 1;

    return () => {
      mountedWaveNotificationsReadMarkerHookCount -= 1;

      if (mountedWaveNotificationsReadMarkerHookCount > 0) {
        return;
      }

      mountedWaveNotificationsReadMarkerHookCount = 0;
      const cleanupAddressKey = latestAddressKeyRef.current;
      const timeout = globalThis.setTimeout(() => {
        if (clearWaveNotificationsReadStateTimeout?.timeout === timeout) {
          clearWaveNotificationsReadStateTimeout = null;
        }

        if (mountedWaveNotificationsReadMarkerHookCount === 0) {
          clearAllWaveReadState();
        }
      }, 0);
      clearWaveNotificationsReadStateTimeout = {
        timeout,
        addressKey: cleanupAddressKey,
      };
    };
  }, []);
};

const createWaveReadSendIntent = ({
  shouldSend,
  retryContext,
}: {
  readonly shouldSend: MarkWaveNotificationsReadOptions["shouldSend"];
  readonly retryContext: WaveReadSendRetryContext | undefined;
}): WaveReadSendIntent => ({
  shouldSend,
  retryContext,
});

const getWaveReadSendRetryContext = ({
  addressKey,
  activeProfileProxyId,
  proxyCreatorId,
  identityKey,
  requestKey,
  waveId,
  addressEpoch,
  cacheRefs,
  queueIfBlocked,
}: {
  readonly addressKey: string;
  readonly activeProfileProxyId: string | null;
  readonly proxyCreatorId: string | null;
  readonly identityKey: string;
  readonly requestKey: string;
  readonly waveId: string;
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly cacheRefs: WaveReadCacheRefs;
  readonly queueIfBlocked: boolean;
}): WaveReadSendRetryContext | undefined => {
  if (!queueIfBlocked) {
    return undefined;
  }

  return {
    addressKey,
    activeProfileProxyId,
    proxyCreatorId,
    identityKey,
    requestKey,
    waveId,
    addressEpoch,
    latestAddressEpochRef: cacheRefs.latestAddressEpochRef,
  };
};

const markTemporaryProxyRoleWaveRead = ({
  waveId,
  addressKey,
  addressEpoch,
  temporaryProxyRoleIdentity,
  cacheRefs,
  options,
}: {
  readonly waveId: string;
  readonly addressKey: string;
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly temporaryProxyRoleIdentity: WaveReadTemporaryProxyRoleIdentity;
  readonly cacheRefs: WaveReadCacheRefs;
  readonly options: MarkWaveNotificationsReadOptions | undefined;
}): Promise<MarkWaveNotificationsReadResult> => {
  const latestVerifiedProxyRoleIdentity = getUsableCachedWaveReadIdentity({
    identity: cacheRefs.latestVerifiedIdentityByProxyRoleRef.current.get(
      temporaryProxyRoleIdentity.identityKey
    ),
    cacheRefs,
  });
  if (latestVerifiedProxyRoleIdentity) {
    const loadedProxyRequestKey = getWaveReadRequestKey({
      addressKey: latestVerifiedProxyRoleIdentity.addressKey,
      activeProfileProxyId:
        latestVerifiedProxyRoleIdentity.activeProfileProxyId,
      waveId,
    });

    return markWaveReadWithAuthHeaders({
      waveId,
      addressKey: latestVerifiedProxyRoleIdentity.addressKey,
      requestKey: loadedProxyRequestKey,
      authHeaders: latestVerifiedProxyRoleIdentity.authHeaders,
      jwtExpiresAt: latestVerifiedProxyRoleIdentity.jwtExpiresAt,
      invalidateNotificationsRef: cacheRefs.invalidateNotificationsRef,
      sendIntents: [
        createWaveReadSendIntent({
          shouldSend: options?.shouldSend,
          retryContext: getWaveReadSendRetryContext({
            addressKey: latestVerifiedProxyRoleIdentity.addressKey,
            activeProfileProxyId:
              latestVerifiedProxyRoleIdentity.activeProfileProxyId,
            proxyCreatorId: null,
            identityKey: latestVerifiedProxyRoleIdentity.identityKey,
            requestKey: loadedProxyRequestKey,
            waveId,
            addressEpoch,
            cacheRefs,
            queueIfBlocked: options?.queueIfBlocked ?? true,
          }),
        }),
      ],
    });
  }

  const proxyRoleRequestKey = getWaveReadProxyRoleRequestKey({
    addressKey,
    proxyCreatorId: temporaryProxyRoleIdentity.proxyCreatorId,
    waveId,
  });

  return enqueuePendingWaveReadRequest({
    addressKey,
    activeProfileProxyId: null,
    proxyCreatorId: temporaryProxyRoleIdentity.proxyCreatorId,
    identityKey: temporaryProxyRoleIdentity.identityKey,
    requestKey: proxyRoleRequestKey,
    waveId,
    addressEpoch,
    latestAddressEpochRef: cacheRefs.latestAddressEpochRef,
    shouldSend: options?.shouldSend,
    queueIfBlocked: options?.queueIfBlocked ?? true,
  });
};

export const markWaveReadFromCache = ({
  waveId,
  addressKey,
  activeProfileProxyId,
  identityKey,
  addressEpoch,
  cacheRefs,
  options,
}: {
  readonly waveId: string;
  readonly addressKey: string | null;
  readonly activeProfileProxyId: string | null;
  readonly identityKey: string;
  readonly addressEpoch: WaveReadAddressEpoch;
  readonly cacheRefs: WaveReadCacheRefs;
  readonly options: MarkWaveNotificationsReadOptions | undefined;
}): Promise<MarkWaveNotificationsReadResult> => {
  if (addressKey === null) {
    return Promise.resolve("skipped");
  }

  const queueIfBlocked = options?.queueIfBlocked ?? true;
  const staleAddressEpochResult = getStaleAddressEpochWaveReadResult({
    addressEpoch,
    latestAddressEpochRef: cacheRefs.latestAddressEpochRef,
    queueIfBlocked,
  });
  if (staleAddressEpochResult) {
    return staleAddressEpochResult;
  }

  const requestKey = getWaveReadRequestKey({
    addressKey,
    activeProfileProxyId,
    waveId,
  });
  const verifiedCachedIdentity = getUsableCachedWaveReadIdentity({
    identity: cacheRefs.authByIdentityRef.current.get(identityKey),
    cacheRefs,
  });
  if (verifiedCachedIdentity) {
    return markWaveReadWithAuthHeaders({
      waveId,
      addressKey: verifiedCachedIdentity.addressKey,
      requestKey,
      authHeaders: verifiedCachedIdentity.authHeaders,
      jwtExpiresAt: verifiedCachedIdentity.jwtExpiresAt,
      invalidateNotificationsRef: cacheRefs.invalidateNotificationsRef,
      sendIntents: [
        createWaveReadSendIntent({
          shouldSend: options?.shouldSend,
          retryContext: getWaveReadSendRetryContext({
            addressKey: verifiedCachedIdentity.addressKey,
            activeProfileProxyId,
            proxyCreatorId: null,
            identityKey: verifiedCachedIdentity.identityKey,
            requestKey,
            waveId,
            addressEpoch,
            cacheRefs,
            queueIfBlocked,
          }),
        }),
      ],
    });
  }

  const latestVerifiedIdentity = getUsableLatestClearedWaveReadIdentity({
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
      jwtExpiresAt: latestVerifiedIdentity.jwtExpiresAt,
      invalidateNotificationsRef: cacheRefs.invalidateNotificationsRef,
      sendIntents: [
        createWaveReadSendIntent({
          shouldSend: options?.shouldSend,
          retryContext: getWaveReadSendRetryContext({
            addressKey: latestVerifiedIdentity.addressKey,
            activeProfileProxyId,
            proxyCreatorId: null,
            identityKey: latestVerifiedIdentity.identityKey,
            requestKey,
            waveId,
            addressEpoch,
            cacheRefs,
            queueIfBlocked,
          }),
        }),
      ],
    });
  }

  const temporaryProxyRoleIdentity =
    cacheRefs.temporaryProxyRoleIdentityByIdentityRef.current.get(identityKey);
  if (temporaryProxyRoleIdentity) {
    return markTemporaryProxyRoleWaveRead({
      waveId,
      addressKey,
      addressEpoch,
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
    addressEpoch,
    latestAddressEpochRef: cacheRefs.latestAddressEpochRef,
    shouldSend: options?.shouldSend,
    queueIfBlocked,
  });
};
