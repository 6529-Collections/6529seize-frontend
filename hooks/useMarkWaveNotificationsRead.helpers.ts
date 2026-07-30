import {
  markWaveReadFromCache,
  useClearWaveReadStateOnAddressChange,
  useClearWaveReadStateOnLastUnmount,
  useSyncWaveReadVerifiedIdentityCaches,
  useWaveReadCacheRefs,
} from "@/hooks/useMarkWaveNotificationsRead.cache";
import { useWaveReadIdentityState } from "@/hooks/useMarkWaveNotificationsRead.identity";
import type {
  MarkWaveNotificationsReadOptions,
  MarkWaveNotificationsReadResult,
  WaveNotificationsReadMarkerConfig,
  WaveNotificationsReadMarkerState,
  WaveReadAddressEpoch,
} from "@/hooks/useMarkWaveNotificationsRead.types";
import { useCallback, useMemo } from "react";

export type {
  MarkWaveNotificationsReadOptions,
  MarkWaveNotificationsReadResult,
  WaveNotificationsReadMarkerState,
} from "@/hooks/useMarkWaveNotificationsRead.types";

export const useWaveNotificationsReadMarkerState = ({
  address,
  connectedProfileId,
  activeProfileProxyId,
  activeProfileProxyCreatorId,
  walletAuth,
  invalidateWaveReadState,
}: WaveNotificationsReadMarkerConfig): WaveNotificationsReadMarkerState => {
  const identityState = useWaveReadIdentityState({
    address,
    connectedProfileId,
    activeProfileProxyId,
    activeProfileProxyCreatorId,
    walletAuth,
  });
  const {
    addressKey,
    activeProfileProxyId: currentProfileProxyId,
    identityKey,
    proxyRoleIdentityKey,
    temporaryProxyRoleIdentity,
    verifiedIdentity,
  } = identityState;
  const addressEpoch = useMemo<WaveReadAddressEpoch>(
    () => ({ addressKey }),
    [addressKey]
  );
  const cacheRefs = useWaveReadCacheRefs({
    addressEpoch,
    identityKey,
    temporaryProxyRoleIdentity,
    verifiedIdentity,
    invalidateWaveReadState,
  });
  useSyncWaveReadVerifiedIdentityCaches({
    walletAuth,
    verifiedIdentity,
    cacheRefs,
  });
  useClearWaveReadStateOnAddressChange(addressKey);
  useClearWaveReadStateOnLastUnmount(addressKey);

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
        addressEpoch,
        cacheRefs,
        options,
      }),
    [addressEpoch, addressKey, cacheRefs, currentProfileProxyId, identityKey]
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
