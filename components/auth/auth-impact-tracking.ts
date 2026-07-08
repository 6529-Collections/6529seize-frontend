"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackAuthImpactEvent,
  type AuthImpactAuthState,
  type AuthImpactEventName,
  type AuthImpactProperties,
  type AuthImpactReason,
} from "@/services/analytics/mixpanel";
import { classifyPageView } from "@/services/analytics/pageClassification";
import { getSessionClientType } from "@/services/auth/session-v2.utils";
import type { SignModalReason } from "./authTypes";

interface UseAuthImpactTrackingParams {
  readonly address: string | undefined;
  readonly hasActiveWalletAddress: boolean;
  readonly isAddressAuthorized: boolean;
}

interface VisiblePromptParams {
  readonly shouldShowSignModal: boolean;
  readonly signModalReason: SignModalReason;
}

export function useAuthImpactTracking({
  address,
  hasActiveWalletAddress,
  isAddressAuthorized,
}: UseAuthImpactTrackingParams) {
  const pathname = usePathname();
  const authImpactPage = useMemo(
    () => classifyPageView({ pathname }),
    [pathname]
  );
  const authPromptTrackingReasonRef =
    useRef<AuthImpactReason>("auth_validation_failed");
  const visibleAuthPromptEventRef = useRef<SignModalReason | null>(null);
  const lastTrackedForcedLogoutKeyRef = useRef<string | null>(null);
  const lastTrackedValidationFailureKeyRef = useRef<string | null>(null);

  const trackAuthImpact = useCallback(
    (
      eventName: AuthImpactEventName,
      properties: AuthImpactProperties
    ): void => {
      trackAuthImpactEvent(eventName, {
        client_type: getSessionClientType(),
        page_group: authImpactPage.pageGroup,
        route_pattern: authImpactPage.routePattern,
        was_connected_wallet: hasActiveWalletAddress,
        ...properties,
      });
    },
    [
      authImpactPage.pageGroup,
      authImpactPage.routePattern,
      hasActiveWalletAddress,
    ]
  );

  const trackForcedLogout = useCallback(
    ({
      reason,
      wasConnectedWallet,
    }: {
      readonly reason: AuthImpactReason;
      readonly wasConnectedWallet: boolean;
    }): void => {
      const trackingKey = `${reason}:${wasConnectedWallet ? "connected" : "disconnected"}`;
      if (lastTrackedForcedLogoutKeyRef.current === trackingKey) {
        return;
      }

      lastTrackedForcedLogoutKeyRef.current = trackingKey;
      trackAuthImpact("Auth Forced Logout", {
        auth_state_after: "logged_out",
        auth_state_before: "authenticated",
        reason,
        was_connected_wallet: wasConnectedWallet,
      });
    },
    [trackAuthImpact]
  );

  const trackValidationFailedWhileConnected = useCallback(
    (reason: AuthImpactReason): void => {
      if (!hasActiveWalletAddress || !isAddressAuthorized) {
        return;
      }

      const trackingKey = `${address ?? "unknown"}:${reason}`;
      if (lastTrackedValidationFailureKeyRef.current === trackingKey) {
        return;
      }

      lastTrackedValidationFailureKeyRef.current = trackingKey;
      trackAuthImpact("Auth Validation Failed While Connected", {
        auth_state_after: "auth_validation_failed",
        auth_state_before: "authenticated",
        reason,
        was_connected_wallet: true,
      });
    },
    [address, hasActiveWalletAddress, isAddressAuthorized, trackAuthImpact]
  );

  const resetTrackedAuthImpactKeys = useCallback((): void => {
    lastTrackedForcedLogoutKeyRef.current = null;
    lastTrackedValidationFailureKeyRef.current = null;
  }, []);

  const syncVisibleAuthPromptTracking = useCallback(
    ({
      shouldShowSignModal,
      signModalReason,
    }: VisiblePromptParams): void => {
      if (!shouldShowSignModal) {
        visibleAuthPromptEventRef.current = null;
        return;
      }

      if (visibleAuthPromptEventRef.current === signModalReason) {
        return;
      }

      visibleAuthPromptEventRef.current = signModalReason;
      if (signModalReason === "session-upgrade") {
        trackAuthImpact("Auth Session Upgrade Prompt Shown", {
          auth_state_after: "session_upgrade_prompt",
          auth_state_before: "session_upgrade_required",
          reason: "session_upgrade_required",
        });
        return;
      }

      const reason = authPromptTrackingReasonRef.current;
      const authStateBefore: AuthImpactAuthState =
        reason === "wallet_not_authorized"
          ? "wallet_connected"
          : "authenticated";
      trackAuthImpact("Auth Reauth Prompt Shown", {
        auth_state_after: "reauth_prompt",
        auth_state_before: authStateBefore,
        reason,
      });

      if (reason !== "wallet_not_authorized") {
        trackValidationFailedWhileConnected(reason);
      }
    },
    [trackAuthImpact, trackValidationFailedWhileConnected]
  );

  return {
    authPromptTrackingReasonRef,
    resetTrackedAuthImpactKeys,
    syncVisibleAuthPromptTracking,
    trackForcedLogout,
  };
}
