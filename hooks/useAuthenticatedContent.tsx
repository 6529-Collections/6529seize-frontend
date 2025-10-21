"use client";

import { useContext, useMemo } from "react";
import { AuthContext } from "../components/auth/Auth";
import { useLayout } from "../components/brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "../components/auth/SeizeConnectContext";

export type ContentState =
  | "not-authenticated"
  | "loading"
  | "needs-profile"
  | "not-available"
  | "measuring"
  | "ready";

export function useAuthenticatedContent() {
  const { showWaves, connectedProfile, fetchingProfile } =
    useContext(AuthContext);
  const { spaces } = useLayout();
  const { isAuthenticated } = useSeizeConnectContext();

  const contentState = useMemo<ContentState>(() => {
    // Not authenticated at all - check this FIRST before any loading states
    if (!isAuthenticated) {
      return "not-authenticated";
    }

    // Only check fetching if we're authenticated
    if (fetchingProfile) {
      return "loading";
    }

    // Authenticated but no profile
    if (!connectedProfile?.handle) {
      return "needs-profile";
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
    isAuthenticated,
    fetchingProfile,
    connectedProfile,
    showWaves,
    spaces.measurementsComplete,
  ]);

  return {
    contentState,
    isAuthenticated,
    connectedProfile,
    showWaves,
    fetchingProfile,
    spaces,
  };
}