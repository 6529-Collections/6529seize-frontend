"use client";

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

export function useAuthenticatedContent() {
  const { showWaves, connectedProfile, fetchingProfile, isAuthenticated } =
    useContext(AuthContext);
  const { spaces } = useLayout();
  const { address, isAuthenticated: hasConnectedAccount } =
    useSeizeConnectContext();
  const hasAuthenticatedProfile =
    isAuthenticated ?? (!!connectedProfile?.handle && showWaves);

  const contentState = useMemo<ContentState>(() => {
    // Not authenticated at all - check this FIRST before any loading states
    if (!hasConnectedAccount && !address) {
      return "not-authenticated";
    }

    if (fetchingProfile) {
      return "loading";
    }

    // Authenticated but no profile
    if (!connectedProfile?.handle) {
      return hasConnectedAccount ? "needs-profile" : "loading";
    }

    if (!hasAuthenticatedProfile) {
      return "loading";
    }

    // Profile exists but waves not enabled (proxy or other reason)
    if (!showWaves) {
      return "not-available";
    }

    // Everything ready but still measuring layout
    if (!spaces.measurementsComplete) {
      return "measuring";
    }

    // All good, show content
    return "ready";
  }, [
    hasConnectedAccount,
    address,
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
