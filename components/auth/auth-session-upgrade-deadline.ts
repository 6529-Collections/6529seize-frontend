"use client";

import { useEffect } from "react";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  getOrCreateSessionUpgradePromptStatus,
  hasSessionUpgradeRollout,
} from "./authSessionUpgrade";
import type { AuthRolloutSettings, SignModalReason } from "./authTypes";

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
