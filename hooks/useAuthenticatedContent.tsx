"use client";

import { isAuthResolving } from "@/components/auth/authResolution";
import { useContext, useMemo } from "react";
import { AuthContext } from "../components/auth/Auth";
import { useLayout } from "../components/brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "../components/auth/SeizeConnectContext";

type ContentState =
  | "not-authenticated"
  | "loading"
  | "needs-profile"
  | "not-available"
  | "measuring"
  | "ready";

export function useAuthenticatedContent({
  waitForAuth = false,
}: { readonly waitForAuth?: boolean } = {}) {
  const { showWaves, connectedProfile, fetchingProfile, isAuthenticated } =
    useContext(AuthContext);
  const { spaces } = useLayout();
  const { address, hasValidWalletAuth, connectionState } =
    useSeizeConnectContext();
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile =
    hasValidWalletAuthorization &&
    (isAuthenticated ?? (!!connectedProfile?.handle && showWaves));

  const contentState = useMemo<ContentState>(() => {
    if (waitForAuth && isAuthResolving(connectionState, fetchingProfile)) {
      return "loading";
    }

    if (!address) {
      return "not-authenticated";
    }

    if (!hasValidWalletAuthorization && !fetchingProfile) {
      return "not-authenticated";
    }

    if (fetchingProfile) {
      return "loading";
    }

    if (!connectedProfile?.handle) {
      return hasValidWalletAuthorization ? "needs-profile" : "loading";
    }

    if (!hasAuthenticatedProfile) {
      return "loading";
    }

    if (!showWaves) {
      return "not-available";
    }

    if (!spaces.measurementsComplete) {
      return "measuring";
    }

    return "ready";
  }, [
    waitForAuth,
    connectionState,
    address,
    hasValidWalletAuthorization,
    hasAuthenticatedProfile,
    fetchingProfile,
    connectedProfile,
    showWaves,
    spaces.measurementsComplete,
  ]);

  return {
    contentState,
    isAuthenticated: hasAuthenticatedProfile,
    connectedProfile,
    showWaves,
    fetchingProfile,
    spaces,
  };
}
