import { isAddress } from "viem";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import {
  InvalidRoleStateError,
  MissingActiveProfileError,
} from "@/errors/authentication";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  ConnectionMismatchError,
  MobileSigningError,
  SigningProviderError,
} from "@/hooks/useSecureSign";
import { t } from "@/i18n/messages";
import { AUTH_SIGNATURE_FAILED_MESSAGE } from "@/services/auth/auth.messages";
import {
  canStoreAnotherWalletAccount,
  getAuthJwt,
  getWalletAddress,
  PROFILE_SWITCHED_EVENT,
  removeAuthJwt,
} from "@/services/auth/auth.utils";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { validateJwt } from "@/services/auth/jwt-validation.utils";
import {
  getSessionNonce,
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import { validateRoleForAuthentication } from "@/utils/role-validation";
import {
  AUTH_MODAL_LOCALE,
  clearSessionUpgradeReminder,
  getOrCreateSessionUpgradePromptStatus,
  getStoredLegacySessionUpgradeAddress,
  hasSessionUpgradeRollout,
} from "./authSessionUpgrade";
import type {
  AuthLoadingState,
  AuthRolloutSettings,
  AuthorizedWalletValidationResult,
  RequestAuthOptions,
  SessionUpgradePromptStatus,
  SignModalReason,
} from "./authTypes";
import {
  AuthenticationNonceError,
  InvalidSignerAddressError,
  NonceResponseValidationError,
} from "./authErrors";

type SignMessage = (message: string) => Promise<{
  readonly signature: string | null;
  readonly userRejected: boolean;
  readonly error?: unknown;
}>;

interface CreateAuthRequestActionsParams {
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly address: string | undefined;
  readonly authRolloutSettings: AuthRolloutSettings;
  readonly canSignActiveWallet: boolean;
  readonly enableWalletAuthentication: boolean;
  readonly expireSessionUpgradeAuth: (walletAddress: string) => Promise<void>;
  readonly invalidateAll: () => void;
  readonly isAddressAuthorized: boolean;
  readonly seizeDisconnect: () => Promise<void>;
  readonly resetSessionUpgradeExpiryDedupe: (walletAddress: string) => void;
  readonly setActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => void;
  readonly setAuthLoadingState: (state: AuthLoadingState) => void;
  readonly setSessionUpgradeRequired: (required: boolean) => void;
  readonly setShowSignModal: (show: boolean) => void;
  readonly setSignModalReason: (reason: SignModalReason) => void;
  readonly setToast: (toast: AppToastInput) => void;
  readonly showSessionUpgradePrompt: (
    walletAddress: string,
    options?: {
      readonly forceShow?: boolean;
      readonly allowWithoutDeadline?: boolean;
    }
  ) => SessionUpgradePromptStatus;
  readonly signMessage: SignMessage;
  readonly signModalReason: SignModalReason;
}

interface AuthRequestActions {
  readonly onActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => Promise<void>;
  readonly requestAuth: (
    options?: RequestAuthOptions
  ) => Promise<{ success: boolean }>;
  readonly requestSessionUpgrade: () => Promise<{ success: boolean }>;
}

interface AuthRequestGuard {
  readonly isCurrent: () => boolean;
  readonly acceptCurrentState: (walletAddress: string) => boolean;
}

const MANUAL_AUTH_VALIDATION_TIMEOUT_MS = 30_000;

const getCurrentAuthStateFingerprint = (): string =>
  getAuthStateFingerprint({
    walletAddress: getWalletAddress(),
    jwt: getAuthJwt(),
  });

const createAuthRequestGuard = ({
  expectedAuthStateFingerprint,
}: RequestAuthOptions): AuthRequestGuard => {
  let expectedFingerprint = expectedAuthStateFingerprint;

  return {
    isCurrent: () =>
      expectedFingerprint === undefined ||
      getCurrentAuthStateFingerprint() === expectedFingerprint,
    acceptCurrentState: (walletAddress: string) => {
      if (expectedFingerprint === undefined) {
        return true;
      }

      const currentWalletAddress = getWalletAddress();
      if (
        currentWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()
      ) {
        return false;
      }

      expectedFingerprint = getCurrentAuthStateFingerprint();
      return true;
    },
  };
};

const dispatchProfileSwitchedEvent = (profileProxy: ApiProfileProxy | null) => {
  if (globalThis.window === undefined) {
    return;
  }

  globalThis.dispatchEvent(
    new CustomEvent(PROFILE_SWITCHED_EVENT, {
      detail: { profileProxy },
    })
  );
};

const createTimedAbortSignal = ({
  timeoutMs,
}: {
  readonly timeoutMs: number;
}): {
  readonly signal: AbortSignal;
  readonly cleanup: () => void;
} => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
    },
  };
};

export function createAuthRequestActions({
  activeProfileProxy,
  address,
  authRolloutSettings,
  canSignActiveWallet,
  enableWalletAuthentication,
  expireSessionUpgradeAuth,
  invalidateAll,
  isAddressAuthorized,
  seizeDisconnect,
  resetSessionUpgradeExpiryDedupe,
  setActiveProfileProxy,
  setAuthLoadingState,
  setSessionUpgradeRequired,
  setShowSignModal,
  setSignModalReason,
  setToast,
  showSessionUpgradePrompt,
  signMessage,
  signModalReason,
}: CreateAuthRequestActionsParams): AuthRequestActions {
  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<ApiSessionNonceResponse> => {
    if (!signerAddress || typeof signerAddress !== "string") {
      throw new InvalidSignerAddressError(signerAddress);
    }

    if (!isAddress(signerAddress)) {
      throw new InvalidSignerAddressError(signerAddress);
    }

    try {
      const response = await getSessionNonce({ signerAddress });

      if (!response) {
        throw new NonceResponseValidationError(
          "Nonce API returned null or undefined response"
        );
      }

      if (
        !response.signable_message ||
        typeof response.signable_message !== "string" ||
        response.signable_message.length === 0
      ) {
        throw new NonceResponseValidationError(
          "Invalid signable_message in API response",
          response
        );
      }

      if (
        !response.server_signature ||
        typeof response.server_signature !== "string" ||
        response.server_signature.trim().length === 0
      ) {
        throw new NonceResponseValidationError(
          "Invalid server_signature in API response",
          response
        );
      }

      return response;
    } catch (error) {
      if (
        error instanceof NonceResponseValidationError ||
        error instanceof InvalidSignerAddressError
      ) {
        throw error;
      }

      throw new AuthenticationNonceError(
        "Failed to obtain authentication nonce from server",
        error
      );
    }
  };

  const getSignature = async ({
    message,
  }: {
    message: string;
  }): Promise<{
    signature: string | null;
    userRejected: boolean;
    failureToastShown: boolean;
  }> => {
    try {
      const result = await signMessage(message);
      let failureToastShown = false;

      if (result.error) {
        if (result.error instanceof ConnectionMismatchError) {
          setToast({
            message:
              "Wallet address mismatch. Disconnect and reconnect the correct wallet.",
            type: "error",
          });
          failureToastShown = true;
        } else if (result.error instanceof SigningProviderError) {
          setToast({
            message:
              "Wallet provider error. Reconnect your wallet and try again.",
            type: "error",
          });
          failureToastShown = true;
        } else if (result.error instanceof MobileSigningError) {
          setToast({
            type: "error",
            title: "Couldn't sign in with this wallet.",
            description: "Check your wallet and try again.",
            details: getToastErrorDetails(result.error),
          });
          failureToastShown = true;
        }
      }

      return {
        signature: result.signature,
        userRejected: result.userRejected,
        failureToastShown,
      };
    } catch (error) {
      logErrorSecurely("getSignature", error);
      setToast({
        type: "error",
        title: "Couldn't sign in with this wallet.",
        description: "Check your wallet and try again.",
        details: getToastErrorDetails(error),
      });
      return {
        signature: null,
        userRejected: false,
        failureToastShown: true,
      };
    }
  };

  const requestSignIn = async ({
    signerAddress,
    role,
    authRequestGuard,
  }: {
    readonly signerAddress: string;
    readonly role: string | null;
    readonly authRequestGuard?: AuthRequestGuard | undefined;
  }): Promise<{ success: boolean }> => {
    try {
      if (authRequestGuard && !authRequestGuard.isCurrent()) {
        return { success: false };
      }
      if (!canStoreAnotherWalletAccount(signerAddress)) {
        setToast({
          message: "You've reached the connected profile limit.",
          type: "error",
        });
        return { success: false };
      }

      const nonceResponse = await getNonce({ signerAddress });
      if (authRequestGuard && !authRequestGuard.isCurrent()) {
        return { success: false };
      }
      const { signable_message, server_signature } = nonceResponse;

      const clientSignature = await getSignature({ message: signable_message });
      if (authRequestGuard && !authRequestGuard.isCurrent()) {
        return { success: false };
      }
      if (clientSignature.userRejected) {
        setToast({
          message: "Authentication was canceled in your wallet.",
          type: "error",
        });
        return { success: false };
      }

      if (!clientSignature.signature) {
        if (!clientSignature.failureToastShown) {
          setToast({
            message: AUTH_SIGNATURE_FAILED_MESSAGE,
            type: "error",
          });
        }
        return { success: false };
      }

      const sessionResponse = await loginWithSessionV2({
        serverSignature: server_signature,
        clientSignature: clientSignature.signature,
        signerAddress,
        role,
      });
      if (authRequestGuard && !authRequestGuard.isCurrent()) {
        return { success: false };
      }
      const isPersisted = await persistSessionResponse(sessionResponse);
      if (!isPersisted) {
        setToast({
          message: "Couldn't save this connected profile. Please try again.",
          type: "error",
        });
        return { success: false };
      }
      if (
        authRequestGuard &&
        !authRequestGuard.acceptCurrentState(signerAddress)
      ) {
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      if (authRequestGuard && !authRequestGuard.isCurrent()) {
        return { success: false };
      }
      if (error instanceof InvalidSignerAddressError) {
        setToast({
          message: "Enter a valid wallet address.",
          type: "error",
        });
      } else if (error instanceof NonceResponseValidationError) {
        setToast({
          message:
            "Couldn't verify the authentication response. Please try again.",
          type: "error",
        });
      } else if (error instanceof AuthenticationNonceError) {
        setToast({
          message:
            "Couldn't reach the authentication service. Please try again.",
          type: "error",
        });
      } else {
        logErrorSecurely("requestSignIn", error);
        setToast({
          type: "error",
          title: "Couldn't authenticate.",
          description: "Reconnect your wallet and try again.",
          details: getToastErrorDetails(error),
        });
      }
      return { success: false };
    }
  };

  const ensureConnectedWalletAddress = (): string | null => {
    if (address) {
      return address;
    }

    setToast({
      message: t(AUTH_MODAL_LOCALE, "auth.signModal.connectWalletPrompt"),
      type: "error",
    });
    return null;
  };

  const authenticateUnauthorizedWallet = async (
    walletAddress: string,
    authRequestGuard: AuthRequestGuard
  ): Promise<boolean> => {
    const { success } = await requestSignIn({
      signerAddress: walletAddress,
      role: null,
      authRequestGuard,
    });

    if (!authRequestGuard.isCurrent()) {
      return false;
    }
    if (!success) {
      setShowSignModal(false);
      try {
        await seizeDisconnect();
      } catch (error) {
        logErrorSecurely("requestAuth_disconnect_after_failed_signin", error);
      }
      return false;
    }

    invalidateAll();
    setShowSignModal(false);
    return true;
  };

  const disconnectAfterFailedSignIn = async (): Promise<void> => {
    try {
      await seizeDisconnect();
    } catch (error) {
      logErrorSecurely("requestAuth_disconnect_after_failed_signin", error);
    }
  };

  const getAuthorizedWalletValidationResult = async ({
    authRequestGuard,
    serverRejected,
    walletAddress,
    role,
  }: {
    readonly authRequestGuard: AuthRequestGuard;
    readonly serverRejected: boolean;
    readonly walletAddress: string;
    readonly role: string | null;
  }): Promise<AuthorizedWalletValidationResult> => {
    if (signModalReason === "session-upgrade") {
      return { isValid: false, requiresSessionUpgrade: true };
    }

    const validationAbort = createTimedAbortSignal({
      timeoutMs: MANUAL_AUTH_VALIDATION_TIMEOUT_MS,
    });
    const validationResult = await validateJwt({
      jwt: getAuthJwt(),
      wallet: walletAddress,
      role,
      operationId: `manual-auth-${Date.now()}`,
      abortSignal: validationAbort.signal,
      activeProfileProxy,
      serverRejected,
      shouldPersistRefreshedSession: authRequestGuard.isCurrent,
    }).finally(validationAbort.cleanup);

    if (serverRejected && validationResult.isValid) {
      if (!authRequestGuard.acceptCurrentState(walletAddress)) {
        return { isValid: false, wasCancelled: true };
      }
    } else if (!authRequestGuard.isCurrent()) {
      return { isValid: false, wasCancelled: true };
    }

    if (
      validationResult.requiresSessionUpgrade &&
      !hasSessionUpgradeRollout(authRolloutSettings)
    ) {
      return { isValid: true };
    }

    return validationResult;
  };

  const prepareAuthorizedWalletReauthentication = async ({
    serverRejected,
    walletAddress,
    validationResult,
  }: {
    readonly serverRejected: boolean;
    readonly walletAddress: string;
    readonly validationResult: AuthorizedWalletValidationResult;
  }): Promise<boolean> => {
    if (!validationResult.requiresSessionUpgrade) {
      setSignModalReason("auth");
      setSessionUpgradeRequired(false);
      if (!serverRejected) {
        await removeAuthJwt();
      }
      return true;
    }

    setSessionUpgradeRequired(true);
    resetSessionUpgradeExpiryDedupe(walletAddress);
    const promptStatus = showSessionUpgradePrompt(walletAddress, {
      forceShow: true,
      allowWithoutDeadline: true,
    });
    if (
      hasSessionUpgradeRollout(authRolloutSettings) &&
      promptStatus.timeLeftMs <= 0
    ) {
      await expireSessionUpgradeAuth(walletAddress);
      return false;
    }
    return canSignActiveWallet;
  };

  const handleAuthorizedWalletSignInFailure = async (
    requiresSessionUpgrade: boolean | undefined
  ): Promise<false> => {
    setShowSignModal(false);
    if (!requiresSessionUpgrade) {
      await disconnectAfterFailedSignIn();
    }
    return false;
  };

  const finishAuthorizedWalletAuthentication = (): boolean => {
    const isSuccess = !!getAuthJwt();
    if (isSuccess) {
      setSignModalReason("auth");
      setShowSignModal(false);
    }
    return isSuccess;
  };

  const authenticateAuthorizedWallet = async (
    walletAddress: string,
    serverRejected: boolean,
    authRequestGuard: AuthRequestGuard
  ): Promise<boolean> => {
    const role = activeProfileProxy
      ? validateRoleForAuthentication(activeProfileProxy)
      : null;

    const validationResult = await getAuthorizedWalletValidationResult({
      authRequestGuard,
      serverRejected,
      walletAddress,
      role,
    });
    if (!authRequestGuard.isCurrent()) {
      return false;
    }
    if (validationResult.wasCancelled) {
      setToast({
        message: "Couldn't verify your session. Please try again.",
        type: "error",
      });
      return false;
    }
    if (!validationResult.requiresSessionUpgrade) {
      setSessionUpgradeRequired(false);
    }

    if (
      validationResult.requiresSessionUpgrade &&
      signModalReason !== "session-upgrade"
    ) {
      setSessionUpgradeRequired(true);
      resetSessionUpgradeExpiryDedupe(walletAddress);
      const promptStatus = getOrCreateSessionUpgradePromptStatus(
        walletAddress,
        authRolloutSettings
      );
      if (promptStatus.timeLeftMs <= 0) {
        await expireSessionUpgradeAuth(walletAddress);
        return false;
      }
      return finishAuthorizedWalletAuthentication();
    }

    if (!validationResult.isValid) {
      const canReauthenticate = await prepareAuthorizedWalletReauthentication({
        serverRejected,
        walletAddress,
        validationResult,
      });
      if (!canReauthenticate || !authRequestGuard.isCurrent()) {
        return false;
      }

      const { success } = await requestSignIn({
        signerAddress: walletAddress,
        role,
        authRequestGuard,
      });

      if (!authRequestGuard.isCurrent()) {
        return false;
      }

      if (!success) {
        return await handleAuthorizedWalletSignInFailure(
          validationResult.requiresSessionUpgrade
        );
      }

      invalidateAll();
      if (validationResult.requiresSessionUpgrade) {
        clearSessionUpgradeReminder(walletAddress);
        setSessionUpgradeRequired(false);
      }
    }

    return finishAuthorizedWalletAuthentication();
  };

  const requestAuth = async (
    options?: RequestAuthOptions
  ): Promise<{ success: boolean }> => {
    const authRequestGuard = createAuthRequestGuard(options ?? {});
    if (!authRequestGuard.isCurrent()) {
      return { success: false };
    }

    const connectedAddress = ensureConnectedWalletAddress();
    if (!connectedAddress) {
      return { success: false };
    }

    if (!enableWalletAuthentication) {
      return { success: true };
    }

    setAuthLoadingState("signing");

    try {
      const success = isAddressAuthorized
        ? await authenticateAuthorizedWallet(
            connectedAddress,
            options?.serverRejected === true,
            authRequestGuard
          )
        : await authenticateUnauthorizedWallet(
            connectedAddress,
            authRequestGuard
          );
      return { success };
    } finally {
      if (authRequestGuard.isCurrent()) {
        setAuthLoadingState("idle");
      }
    }
  };

  const requestSessionUpgrade = async (): Promise<{ success: boolean }> => {
    const upgradeAddress = address ?? getStoredLegacySessionUpgradeAddress();
    if (!upgradeAddress) {
      setToast({
        message: t(AUTH_MODAL_LOCALE, "auth.signModal.connectWalletPrompt"),
        type: "error",
      });
      return { success: false };
    }

    if (!enableWalletAuthentication) {
      return { success: true };
    }

    setAuthLoadingState("signing");
    setSignModalReason("session-upgrade");
    resetSessionUpgradeExpiryDedupe(upgradeAddress);

    try {
      const promptStatus = showSessionUpgradePrompt(upgradeAddress, {
        forceShow: true,
        allowWithoutDeadline: true,
      });
      if (
        hasSessionUpgradeRollout(authRolloutSettings) &&
        promptStatus.timeLeftMs <= 0
      ) {
        await expireSessionUpgradeAuth(upgradeAddress);
        return { success: false };
      }

      if (!canSignActiveWallet) {
        return { success: false };
      }

      const role = activeProfileProxy
        ? validateRoleForAuthentication(activeProfileProxy)
        : null;
      const { success } = await requestSignIn({
        signerAddress: upgradeAddress,
        role,
      });

      if (!success) {
        return { success: await handleAuthorizedWalletSignInFailure(true) };
      }

      invalidateAll();
      clearSessionUpgradeReminder(upgradeAddress);
      setSessionUpgradeRequired(false);
      return { success: finishAuthorizedWalletAuthentication() };
    } finally {
      setAuthLoadingState("idle");
    }
  };

  const onActiveProfileProxy = async (
    profileProxy: ApiProfileProxy | null
  ): Promise<void> => {
    const isSameSelection =
      (profileProxy?.id ?? null) === (activeProfileProxy?.id ?? null);
    if (isSameSelection) {
      return;
    }

    if (!address) {
      setActiveProfileProxy(null);
      return;
    }

    if (!enableWalletAuthentication) {
      setActiveProfileProxy(profileProxy);
      dispatchProfileSwitchedEvent(profileProxy);
      return;
    }

    await removeAuthJwt();
    try {
      const { success } = await requestSignIn({
        signerAddress: address,
        role: profileProxy ? validateRoleForAuthentication(profileProxy) : null,
      });
      if (success) {
        setActiveProfileProxy(profileProxy);
        dispatchProfileSwitchedEvent(profileProxy);
      }
    } catch (error) {
      if (error instanceof InvalidRoleStateError) {
        logErrorSecurely("onActiveProfileProxy_invalid_role_state", error);
        setToast({
          message: "Select a valid profile and try again.",
          type: "error",
        });
        setActiveProfileProxy(null);
        return;
      }

      if (error instanceof MissingActiveProfileError) {
        logErrorSecurely("onActiveProfileProxy_missing_profile", error);
        setToast({
          message:
            "Couldn't authenticate this profile. Select a profile and try again.",
          type: "error",
        });
        setActiveProfileProxy(null);
        return;
      }

      throw error;
    }
  };

  return {
    onActiveProfileProxy,
    requestAuth,
    requestSessionUpgrade,
  };
}
