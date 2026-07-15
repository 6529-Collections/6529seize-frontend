import {
  getAuthJwt,
  hasActiveSessionV2Auth,
  removeAuthJwt,
} from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { validateAuthImmediate } from "@/services/auth/immediate-validation.utils";
import {
  resetAuthSessionRefreshProductImpactDedupe,
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

export const getAuthTerminalTransitionScope = ({
  activeProfileProxyId,
  authJwt,
  authRolloutSettings,
  canSignActiveWallet,
  currentAddress,
  hasActiveWalletAddress,
  hasSessionV2Auth,
}: {
  readonly activeProfileProxyId: string | null;
  readonly authJwt: string | null;
  readonly authRolloutSettings: RunImmediateAuthValidationParams["authRolloutSettings"];
  readonly canSignActiveWallet: boolean;
  readonly currentAddress: string;
  readonly hasActiveWalletAddress: boolean;
  readonly hasSessionV2Auth: boolean;
}): string =>
  getAuthTokenFingerprint(
    [
      currentAddress.toLowerCase(),
      getAuthTokenFingerprint(authJwt),
      activeProfileProxyId ?? "none",
      authRolloutSettings.structuredSignaturesRequired,
      authRolloutSettings.sessionV2MigrationDeadline ?? "none",
      canSignActiveWallet,
      hasActiveWalletAddress,
      hasSessionV2Auth,
    ].join(":")
  );

export const getCurrentAuthTerminalTransitionScope = ({
  activeProfileProxy,
  authRolloutSettings,
  canSignActiveWallet,
  currentAddress,
  hasActiveWalletAddress,
}: Pick<
  RunImmediateAuthValidationParams,
  | "activeProfileProxy"
  | "authRolloutSettings"
  | "canSignActiveWallet"
  | "currentAddress"
  | "hasActiveWalletAddress"
>): string =>
  getAuthTerminalTransitionScope({
    activeProfileProxyId: activeProfileProxy?.id ?? null,
    authJwt: getAuthJwt(),
    authRolloutSettings,
    canSignActiveWallet,
    currentAddress,
    hasActiveWalletAddress,
    hasSessionV2Auth: hasActiveSessionV2Auth({ address: currentAddress }),
  });

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
  dedupeScope,
  hadLocalJwt,
  hasActiveWalletAddress,
}: {
  readonly result: ImmediateAuthValidationResult;
  readonly dedupeScope: string;
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
    if (refreshOutcome === "local_valid_after_failure") {
      trackAuthSessionRefreshProductImpact({
        clientType,
        dedupeScope,
        hadLocalJwt,
        outcome: "failed_without_prompt",
        refreshOutcome,
        requiresReauth: false,
      });
      return;
    }

    resetAuthSessionRefreshProductImpactDedupe(dedupeScope);
    if (refreshOutcome === "success") {
      trackAuthSessionRefreshSucceeded({
        clientType,
        hadLocalJwt,
        refreshOutcome,
      });
    }
    return;
  }

  if (result.requiresSessionUpgrade) {
    trackAuthSessionRefreshProductImpact({
      clientType,
      dedupeScope,
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
      dedupeScope,
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
      dedupeScope,
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
      dedupeScope,
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
  terminalAuthTransitionScopeRef,
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
  const hadLocalJwt = Boolean(authJwt);
  const terminalAuthTransitionScope = getAuthTerminalTransitionScope({
    activeProfileProxyId: activeProfileProxy?.id ?? null,
    authJwt,
    authRolloutSettings,
    canSignActiveWallet,
    currentAddress,
    hasActiveWalletAddress,
    hasSessionV2Auth: hasActiveSessionV2Auth({ address: currentAddress }),
  });
  const telemetryDedupeScope = terminalAuthTransitionScope;

  const beginTerminalAuthTransition = (): boolean => {
    if (
      terminalAuthTransitionScopeRef.current === terminalAuthTransitionScope
    ) {
      return false;
    }
    terminalAuthTransitionScopeRef.current = terminalAuthTransitionScope;
    return true;
  };

  const markSessionUpgradeRequired = () => {
    if (!beginTerminalAuthTransition()) {
      return;
    }
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
            onReset: () => {
              if (beginTerminalAuthTransition()) {
                reset();
              }
            },
            onRemoveJwt: () => {
              if (!beginTerminalAuthTransition()) {
                return;
              }
              return removeAuthJwt().catch((error: unknown) => {
                if (
                  terminalAuthTransitionScopeRef.current ===
                  terminalAuthTransitionScope
                ) {
                  terminalAuthTransitionScopeRef.current = null;
                }
                throw error;
              });
            },
            onLogError: logErrorSecurely,
          },
        })
    );

    if (result.wasCancelled) {
      trackImmediateAuthValidationTelemetry({
        result,
        dedupeScope: telemetryDedupeScope,
        hadLocalJwt,
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
      dedupeScope: telemetryDedupeScope,
      hadLocalJwt,
      hasActiveWalletAddress,
    });
    if (
      result.isValid &&
      terminalAuthTransitionScopeRef.current === terminalAuthTransitionScope
    ) {
      terminalAuthTransitionScopeRef.current = null;
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
