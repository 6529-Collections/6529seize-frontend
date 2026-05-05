import {
  getWaveReadProxyRoleRequestKey,
  getWaveReadRequestKey,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import type {
  WaveReadTemporaryProxyRoleIdentity,
  WaveReadVerifiedIdentity,
} from "@/hooks/useMarkWaveNotificationsRead.identity";
import {
  clearAllWaveReadState,
  clearPendingWaveReadsForAddress,
  deleteLatestVerifiedWaveReadIdentityByAddress,
  enqueuePendingWaveReadRequest,
  flushPendingClearedWaveReadRequests,
  flushPendingWaveReadRequests,
  getLatestVerifiedWaveReadIdentityByAddress,
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
} from "@/hooks/useMarkWaveNotificationsRead.types";
import { useLayoutEffect, useMemo, useRef } from "react";

let mountedWaveNotificationsReadMarkerHookCount = 0;

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
    getLatestVerifiedWaveReadIdentityByAddress(addressKey)
  );
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

export const useClearWaveReadStateOnLastUnmount = (): void => {
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
    queueIfBlocked: options?.queueIfBlocked ?? true,
  });
};
