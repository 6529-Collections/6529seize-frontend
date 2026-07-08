"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AuthImpactReason } from "@/services/analytics/mixpanel";
import { removeAuthJwt } from "@/services/auth/auth.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  clearSessionUpgradeReminder,
  getOrCreateSessionUpgradePromptStatus,
  hasSessionUpgradeRollout,
} from "./authSessionUpgrade";
import type { AuthRolloutSettings, SignModalReason } from "./authTypes";

type TrackForcedLogout = (params: {
  readonly reason: AuthImpactReason;
  readonly wasConnectedWallet: boolean;
}) => void;

interface UseSessionUpgradeExpiryParams {
  readonly hasActiveWalletAddress: boolean;
  readonly invalidateAll: () => void;
  readonly setSessionUpgradeHasDeadline: (hasDeadline: boolean) => void;
  readonly setSessionUpgradeRequired: (required: boolean) => void;
  readonly setShowSignModal: (show: boolean) => void;
  readonly setSignModalReason: (reason: SignModalReason) => void;
  readonly trackForcedLogout: TrackForcedLogout;
}

export function useSessionUpgradeExpiry({
  hasActiveWalletAddress,
  invalidateAll,
  setSessionUpgradeHasDeadline,
  setSessionUpgradeRequired,
  setShowSignModal,
  setSignModalReason,
  trackForcedLogout,
}: UseSessionUpgradeExpiryParams) {
  const expiredSessionUpgradeAddressRef = useRef<string | null>(null);

  const resetSessionUpgradeExpiryDedupe = useCallback(
    (walletAddress: string) => {
      if (
        expiredSessionUpgradeAddressRef.current ===
        walletAddress.toLowerCase()
      ) {
        expiredSessionUpgradeAddressRef.current = null;
      }
    },
    []
  );

  const expireSessionUpgradeAuth = useCallback(
    async (walletAddress: string): Promise<void> => {
      const normalizedAddress = walletAddress.toLowerCase();
      if (expiredSessionUpgradeAddressRef.current === normalizedAddress) {
        return;
      }
      expiredSessionUpgradeAddressRef.current = normalizedAddress;

      clearSessionUpgradeReminder(walletAddress);
      setShowSignModal(false);
      setSignModalReason("auth");
      setSessionUpgradeHasDeadline(false);
      setSessionUpgradeRequired(false);
      trackForcedLogout({
        reason: "session_upgrade_deadline_expired",
        wasConnectedWallet: hasActiveWalletAddress,
      });
      try {
        await removeAuthJwt();
        invalidateAll();
      } catch (error) {
        expiredSessionUpgradeAddressRef.current = null;
        throw error;
      }
    },
    [
      hasActiveWalletAddress,
      invalidateAll,
      setSessionUpgradeHasDeadline,
      setSessionUpgradeRequired,
      setShowSignModal,
      setSignModalReason,
      trackForcedLogout,
    ]
  );

  return { expireSessionUpgradeAuth, resetSessionUpgradeExpiryDedupe };
}

interface UseSessionUpgradeDeadlineRefreshParams {
  readonly address: string | undefined;
  readonly authRolloutSettings: AuthRolloutSettings;
  readonly expireSessionUpgradeAuth: (walletAddress: string) => Promise<void>;
  readonly signModalReason: SignModalReason;
  readonly setSessionUpgradeCanDismiss: (canDismiss: boolean) => void;
  readonly setSessionUpgradeTimeLeftMs: (timeLeftMs: number) => void;
  readonly setShowSignModal: (show: boolean) => void;
}

export function useSessionUpgradeDeadlineRefresh({
  address,
  authRolloutSettings,
  expireSessionUpgradeAuth,
  signModalReason,
  setSessionUpgradeCanDismiss,
  setSessionUpgradeTimeLeftMs,
  setShowSignModal,
}: UseSessionUpgradeDeadlineRefreshParams) {
  useEffect(() => {
    if (
      !address ||
      signModalReason !== "session-upgrade" ||
      !hasSessionUpgradeRollout(authRolloutSettings)
    ) {
      return;
    }

    const refreshSessionUpgradePrompt = () => {
      const status = getOrCreateSessionUpgradePromptStatus(
        address,
        authRolloutSettings
      );
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      if (status.timeLeftMs <= 0) {
        expireSessionUpgradeAuth(address).catch((error) => {
          logErrorSecurely("session_upgrade_deadline_expired_logout", error);
        });
        return;
      }
      if (status.shouldShow) {
        setShowSignModal(true);
      }
    };

    refreshSessionUpgradePrompt();
    const interval = globalThis.setInterval(
      refreshSessionUpgradePrompt,
      60 * 1000
    );

    return () => {
      globalThis.clearInterval(interval);
    };
  }, [
    address,
    authRolloutSettings,
    expireSessionUpgradeAuth,
    setSessionUpgradeCanDismiss,
    setSessionUpgradeTimeLeftMs,
    setShowSignModal,
    signModalReason,
  ]);
}
