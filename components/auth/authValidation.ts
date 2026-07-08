import { getAuthJwt, removeAuthJwt } from "@/services/auth/auth.utils";
import { validateAuthImmediate } from "@/services/auth/immediate-validation.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import { measureMobileLaunchAsync } from "@/utils/monitoring/mobileLaunchTiming";
import {
  getOrCreateSessionUpgradePromptStatus,
  getSessionUpgradePromptMode,
  hasSessionUpgradeRollout,
} from "./authSessionUpgrade";
import type { RunImmediateAuthValidationParams } from "./authTypes";

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
            jwt: getAuthJwt(),
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

    if (
      result.wasCancelled ||
      isCurrentValidationOperation({
        latestAddressRef,
        activeValidationOperationIdRef,
        currentAddress,
        operationId,
      }) === false
    ) {
      return;
    }
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
