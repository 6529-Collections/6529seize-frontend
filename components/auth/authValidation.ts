import { getAuthJwt, removeAuthJwt } from "@/services/auth/auth.utils";
import { validateAuthImmediate } from "@/services/auth/immediate-validation.utils";
import {
  trackAuthSessionRefreshProductImpact,
  trackAuthSessionRefreshSucceeded,
  trackAuthValidationCancelled,
} from "@/services/analytics/productImpactTelemetry";
import { getSessionClientType } from "@/services/auth/session-v2.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import { measureMobileLaunchAsync } from "@/utils/monitoring/mobileLaunchTiming";
import {
  getOrCreateSessionUpgradePromptStatus,
  getSessionUpgradePromptMode,
  hasSessionUpgradeRollout,
} from "./authSessionUpgrade";
import type { RunImmediateAuthValidationParams } from "./authTypes";

type ImmediateAuthValidationResult = Awaited<
  ReturnType<typeof validateAuthImmediate>
>;

const isCurrentValidationOperation = ({
  latestAddressRef,
  activeValidationOperationIdRef,
  currentAddress,
  operationId,
}: {
  readonly latestAddressRef: RunImmediateAuthValidationParams["latestAddressRef"];
  readonly activeValidationOperationIdRef: RunImmediateAuthValidationParams["activeValidationOperationIdRef"];
  readonly currentAddress: string;
  readonly operationId: string;
}): boolean =>
  latestAddressRef.current === currentAddress &&
  activeValidationOperationIdRef.current === operationId;

const trackImmediateAuthValidationTelemetry = ({
  result,
  hadLocalJwt,
  hasActiveWalletAddress,
}: {
  readonly result: ImmediateAuthValidationResult;
  readonly hadLocalJwt: boolean;
  readonly hasActiveWalletAddress: boolean;
}): void => {
  const refreshOutcome = result.authRefreshOutcome;
  const clientType = getSessionClientType();

  if (result.wasCancelled) {
    trackAuthValidationCancelled({
      clientType,
      hadLocalJwt,
      refreshOutcome,
    });
    return;
  }

  if (result.isValid) {
    if (refreshOutcome === "success") {
      trackAuthSessionRefreshSucceeded({
        clientType,
        hadLocalJwt,
        refreshOutcome,
      });
      return;
    }

    if (refreshOutcome === "local_valid_after_failure") {
      trackAuthSessionRefreshProductImpact({
        clientType,
        hadLocalJwt,
        outcome: "failed_without_prompt",
        refreshOutcome,
        requiresReauth: false,
      });
    }
    return;
  }

  if (result.requiresSessionUpgrade) {
    trackAuthSessionRefreshProductImpact({
      clientType,
      hadLocalJwt,
      outcome: "session_upgrade_required",
      refreshOutcome,
      requiresReauth: true,
    });
    return;
  }

  if (result.shouldShowModal) {
    trackAuthSessionRefreshProductImpact({
      clientType,
      hadLocalJwt,
      outcome: "reauth_required",
      refreshOutcome,
      requiresReauth: true,
    });
    return;
  }

  if (!hasActiveWalletAddress) {
    trackAuthSessionRefreshProductImpact({
      clientType,
      hadLocalJwt,
      outcome: "logout_required",
      refreshOutcome,
      requiresReauth: true,
    });
    return;
  }

  if (refreshOutcome !== "not_attempted") {
    trackAuthSessionRefreshProductImpact({
      clientType,
      hadLocalJwt,
      outcome: "failed_without_prompt",
      refreshOutcome,
      requiresReauth: false,
    });
  }
};

export const runImmediateAuthValidation = async ({
  currentAddress,
  operationId,
  latestAddressRef,
  activeValidationOperationIdRef,
  abortControllerRef,
  activeProfileProxy,
  hasActiveWalletAddress,
  canSignActiveWallet,
  setAuthLoadingState,
  setSignModalReason,
  setSessionUpgradePromptMode,
  setSessionUpgradeTimeLeftMs,
  setSessionUpgradeCanDismiss,
  setSessionUpgradeHasDeadline,
  setSessionUpgradeRequired,
  setShowSignModal,
  invalidateAll,
  reset,
  resetSessionUpgradeExpiryDedupe,
  authRolloutSettings,
}: RunImmediateAuthValidationParams): Promise<void> => {
  if (
    isCurrentValidationOperation({
      latestAddressRef,
      activeValidationOperationIdRef,
      currentAddress,
      operationId,
    }) === false
  ) {
    return;
  }

  const abortController = new AbortController();
  abortControllerRef.current = abortController;
  setAuthLoadingState("validating");
  const authJwt = getAuthJwt();

  const markSessionUpgradeRequired = () => {
    resetSessionUpgradeExpiryDedupe(currentAddress);
    setSessionUpgradeRequired(true);
    if (!hasSessionUpgradeRollout(authRolloutSettings)) {
      setSessionUpgradeHasDeadline(false);
      return;
    }

    setSessionUpgradeHasDeadline(true);
    const status = getOrCreateSessionUpgradePromptStatus(
      currentAddress,
      authRolloutSettings
    );
    setSignModalReason("session-upgrade");
    setSessionUpgradePromptMode(
      getSessionUpgradePromptMode(canSignActiveWallet)
    );
    setSessionUpgradeTimeLeftMs(status.timeLeftMs);
    setSessionUpgradeCanDismiss(status.canDismiss);
    setShowSignModal(status.shouldShow);
  };

  try {
    const result = await measureMobileLaunchAsync(
      "auth_immediate_validation",
      () =>
        validateAuthImmediate({
          params: {
            currentAddress,
            connectionAddress: currentAddress,
            jwt: authJwt,
            activeProfileProxy,
            isConnected: hasActiveWalletAddress,
            operationId,
            abortSignal: abortController.signal,
          },
          callbacks: {
            onShowSignModal: setShowSignModal,
            onSessionUpgradeRequired: markSessionUpgradeRequired,
            onInvalidateCache: invalidateAll,
            onReset: reset,
            onRemoveJwt: () => removeAuthJwt(),
            onLogError: logErrorSecurely,
          },
        })
    );

    if (result.wasCancelled) {
      trackImmediateAuthValidationTelemetry({
        result,
        hadLocalJwt: authJwt !== null,
        hasActiveWalletAddress,
      });
      return;
    }

    if (
      isCurrentValidationOperation({
        latestAddressRef,
        activeValidationOperationIdRef,
        currentAddress,
        operationId,
      }) === false
    ) {
      return;
    }

    trackImmediateAuthValidationTelemetry({
      result,
      hadLocalJwt: authJwt !== null,
      hasActiveWalletAddress,
    });
  } finally {
    if (
      abortControllerRef.current === abortController &&
      activeValidationOperationIdRef.current === operationId
    ) {
      abortControllerRef.current = null;
      activeValidationOperationIdRef.current = null;
      setAuthLoadingState("idle");
    }
  }
};
