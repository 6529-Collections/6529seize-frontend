"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  getHasAuthenticatedProfile,
  getViewerIdentityKey,
} from "./useWavesList.helpers";

export function useWaveDiscoveryViewer() {
  const {
    connectedProfile,
    activeProfileProxy,
    isAuthenticated,
    fetchingProfile,
  } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile = getHasAuthenticatedProfile({
    hasValidWalletAuthorization,
    isAuthenticated,
    hasConnectedProfile: Boolean(connectedProfile?.handle),
  });
  return {
    key: getViewerIdentityKey({
      address,
      proxyId: activeProfileProxy?.id,
      hasValidWalletAuthorization,
      hasAuthenticatedProfile,
    }),
    enabled: !(address && (!hasValidWalletAuthorization || fetchingProfile)),
    canUseCollections: hasAuthenticatedProfile && !activeProfileProxy,
  };
}
