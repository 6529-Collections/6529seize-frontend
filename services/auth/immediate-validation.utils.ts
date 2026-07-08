import {
  validateJwt,
  type SessionRefreshValidationOutcome,
} from "./jwt-validation.utils";
import { validateRoleForAuthentication } from "@/utils/role-validation";
import {
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError,
} from "@/errors/authentication";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { getNodeEnv, publicEnv } from "@/config/env";

interface ImmediateValidationParams {
  currentAddress: string;
  connectionAddress: string;
  jwt: string | null;
  activeProfileProxy: ApiProfileProxy | null;
  isConnected: boolean;
  operationId: string;
  abortSignal: AbortSignal;
}

interface ImmediateValidationCallbacks {
  onShowSignModal: (show: boolean) => void;
  onSessionUpgradeRequired?: (() => void) | undefined;
  onInvalidateCache: () => void;
  onReset: () => void;
  onRemoveJwt: () => void | Promise<void>;
  onLogError: (type: string, error: unknown) => void;
}

interface ImmediateValidationResult {
  isValid: boolean;
  validationCompleted: boolean;
  wasCancelled: boolean;
  shouldShowModal: boolean;
  authRefreshOutcome: SessionRefreshValidationOutcome;
  requiresSessionUpgrade?: boolean;
}

// Helper function to check if address is consistent and operation not cancelled
const isOperationValid = (
  currentAddress: string,
  connectionAddress: string,
  abortSignal: AbortSignal
): boolean => {
  return !abortSignal.aborted && currentAddress === connectionAddress;
};

// Helper function to create a cancelled result
const createCancelledResult = (): ImmediateValidationResult => ({
  isValid: false,
  validationCompleted: false,
  wasCancelled: true,
  shouldShowModal: false,
  authRefreshOutcome: "cancelled",
});

// Helper function to check if error is an authentication role error
const isAuthenticationRoleError = (error: unknown): boolean => {
  return (
    error instanceof MissingActiveProfileError ||
    error instanceof RoleValidationError ||
    error instanceof AuthenticationRoleError ||
    error instanceof InvalidRoleStateError
  );
};

// Helper function to handle invalid JWT when user is disconnected
const handleInvalidJwtWhenDisconnected = (
  callbacks: ImmediateValidationCallbacks
): void => {
  callbacks.onReset();
};

// Helper function to handle invalid JWT when user is connected
const handleInvalidJwtWhenConnected = async (
  callbacks: ImmediateValidationCallbacks,
  abortSignal: AbortSignal
): Promise<boolean> => {
  await callbacks.onRemoveJwt();
  if (abortSignal.aborted) {
    return false;
  }
  callbacks.onInvalidateCache();
  callbacks.onShowSignModal(true);
  return true;
};

// Helper function to create validation result
const createValidationResult = (
  validationCompleted: boolean,
  wasCancelled: boolean,
  shouldShowModal: boolean,
  authRefreshOutcome: SessionRefreshValidationOutcome = "not_attempted",
  requiresSessionUpgrade?: boolean,
  isValid: boolean = false
): ImmediateValidationResult => ({
  isValid,
  validationCompleted,
  wasCancelled,
  shouldShowModal,
  authRefreshOutcome,
  ...(requiresSessionUpgrade !== undefined ? { requiresSessionUpgrade } : {}),
});

// Helper function to handle JWT validation results
const handleJwtValidationResult = async (
  isValid: boolean,
  wasCancelled: boolean,
  requiresSessionUpgrade: boolean | undefined,
  authRefreshOutcome: SessionRefreshValidationOutcome,
  isConnected: boolean,
  abortSignal: AbortSignal,
  callbacks: ImmediateValidationCallbacks
): Promise<ImmediateValidationResult> => {
  if (wasCancelled) {
    return createValidationResult(true, true, false, authRefreshOutcome);
  }

  if (isValid) {
    return createValidationResult(
      true,
      false,
      false,
      authRefreshOutcome,
      undefined,
      true
    );
  }

  if (requiresSessionUpgrade) {
    callbacks.onSessionUpgradeRequired?.();
    return createValidationResult(true, false, true, authRefreshOutcome, true);
  }

  // Handle invalid JWT
  if (isConnected) {
    const handled = await handleInvalidJwtWhenConnected(callbacks, abortSignal);
    if (!handled) {
      return createCancelledResult();
    }
  } else {
    handleInvalidJwtWhenDisconnected(callbacks);
  }

  return createValidationResult(true, false, isConnected, authRefreshOutcome);
};

// Helper function to handle validation errors
const handleValidationError = async (
  error: unknown,
  isConnected: boolean,
  abortSignal: AbortSignal,
  callbacks: ImmediateValidationCallbacks
): Promise<ImmediateValidationResult> => {
  if (isAuthenticationRoleError(error)) {
    callbacks.onLogError("validateJwt_role_error", error);
    await callbacks.onRemoveJwt();
    if (abortSignal.aborted) {
      return createCancelledResult();
    }
    callbacks.onInvalidateCache();
    callbacks.onShowSignModal(true);
  } else {
    callbacks.onLogError("validateJwt_general_error", error);
    if (isConnected) {
      callbacks.onShowSignModal(true);
    }
  }

  return createValidationResult(
    false,
    abortSignal.aborted,
    isConnected && !abortSignal.aborted,
    abortSignal.aborted ? "cancelled" : "failed"
  );
};

export const validateAuthImmediate = async ({
  params,
  callbacks,
}: {
  params: ImmediateValidationParams;
  callbacks: ImmediateValidationCallbacks;
}): Promise<ImmediateValidationResult> => {
  const nodeEnv = getNodeEnv();
  const isDevLikeEnv = nodeEnv === "development" || nodeEnv === "test";

  if (publicEnv.USE_DEV_AUTH === "true" && isDevLikeEnv) {
    return createValidationResult(
      true,
      false,
      false,
      "not_attempted",
      undefined,
      true
    );
  }

  const {
    currentAddress,
    connectionAddress,
    jwt,
    activeProfileProxy,
    isConnected,
    operationId,
    abortSignal,
  } = params;

  try {
    // Early validation check
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    const { isValid, wasCancelled, refreshOutcome, requiresSessionUpgrade } =
      await validateJwt({
        jwt,
        wallet: currentAddress,
        role: activeProfileProxy
          ? validateRoleForAuthentication(activeProfileProxy)
          : null,
        operationId,
        abortSignal,
        activeProfileProxy,
      });

    // Post-validation check
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    return await handleJwtValidationResult(
      isValid,
      wasCancelled,
      requiresSessionUpgrade,
      refreshOutcome ?? "not_attempted",
      isConnected,
      abortSignal,
      callbacks
    );
  } catch (error) {
    // Only handle errors if operation is still valid
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    return await handleValidationError(
      error,
      isConnected,
      abortSignal,
      callbacks
    );
  }
};
