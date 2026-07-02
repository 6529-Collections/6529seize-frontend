"use client";

import { useEffect } from "react";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import {
  markMobileLaunchStep,
  setMobileLaunchContext,
  type MobileLaunchAuthState,
} from "@/utils/monitoring/mobileLaunchTiming";
import { useAuth } from "./Auth";
import { useSeizeConnectContext } from "./SeizeConnectContext";

const hasStoredAuthState = (): boolean => {
  try {
    return Boolean(getWalletAddress() && getAuthJwt());
  } catch {
    return false;
  }
};

function getMobileLaunchAuthState({
  activeProxy,
  connectedProfile,
  enableWalletAuthentication,
  fetchingProfile,
  hasValidWalletAuth,
  walletAddress,
  walletConnectionState,
}: {
  readonly activeProxy: boolean;
  readonly connectedProfile: boolean;
  readonly enableWalletAuthentication: boolean;
  readonly fetchingProfile: boolean;
  readonly hasValidWalletAuth: boolean;
  readonly walletAddress: string | undefined;
  readonly walletConnectionState:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";
}): MobileLaunchAuthState {
  if (!enableWalletAuthentication) {
    return "wallet_auth_disabled";
  }

  if (
    walletConnectionState === "initializing" ||
    walletConnectionState === "connecting" ||
    (Boolean(walletAddress) && fetchingProfile)
  ) {
    return "initializing";
  }

  if (connectedProfile && hasValidWalletAuth) {
    return activeProxy
      ? "authenticated_proxy_profile"
      : "authenticated_profile";
  }

  if (walletAddress && hasValidWalletAuth) {
    return "authorized_wallet_no_profile";
  }

  if (walletAddress) {
    return "connected_wallet_needs_auth";
  }

  if (hasStoredAuthState()) {
    return "stored_auth_disconnected";
  }

  return "anonymous";
}

export default function AuthLaunchTimingReporter({
  enableWalletAuthentication,
}: {
  readonly enableWalletAuthentication: boolean;
}) {
  const { activeProfileProxy, connectedProfile, fetchingProfile } = useAuth();
  const { address, connectionState, hasValidWalletAuth } =
    useSeizeConnectContext();

  useEffect(() => {
    markMobileLaunchStep("auth_provider_mounted");
  }, []);

  useEffect(() => {
    const authState = getMobileLaunchAuthState({
      activeProxy: Boolean(activeProfileProxy),
      connectedProfile: Boolean(connectedProfile?.handle),
      enableWalletAuthentication,
      fetchingProfile,
      hasValidWalletAuth,
      walletAddress: address,
      walletConnectionState: connectionState,
    });

    setMobileLaunchContext({
      auth_state: authState,
      wallet_connection_state: connectionState,
    });

    if (authState !== "initializing") {
      markMobileLaunchStep("auth_ready");
    }
  }, [
    activeProfileProxy,
    address,
    connectedProfile?.handle,
    connectionState,
    enableWalletAuthentication,
    fetchingProfile,
    hasValidWalletAuth,
  ]);

  return null;
}
