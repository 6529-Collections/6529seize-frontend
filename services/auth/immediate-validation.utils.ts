import { validateJwt } from "./jwt-validation.utils";
import { validateRoleForAuthentication } from "@/utils/role-validation";
import {
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError
} from "@/errors/authentication";
import { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
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
  onInvalidateCache: () => void;
  onReset: () => void;
  onRemoveJwt: () => void;
  onLogError: (type: string, error: unknown) => void;
}

interface ImmediateValidationResult {
  validationCompleted: boolean;
  wasCancelled: boolean;
  shouldShowModal: boolean;
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
  validationCompleted: false,
  wasCancelled: true,
  shouldShowModal: false
});

// Helper function to check if error is an authentication role error
const isAuthenticationRoleError = (error: unknown): boolean => {
  return error instanceof MissingActiveProfileError ||
    error instanceof RoleValidationError ||
    error instanceof AuthenticationRoleError ||
    error instanceof InvalidRoleStateError;
};

// Helper function to handle invalid JWT when user is disconnected
const handleInvalidJwtWhenDisconnected = (
  callbacks: ImmediateValidationCallbacks
): void => {
  callbacks.onReset();
};

// Helper function to handle invalid JWT when user is connected
const handleInvalidJwtWhenConnected = (
  callbacks: ImmediateValidationCallbacks
): void => {
  callbacks.onRemoveJwt();
  callbacks.onInvalidateCache();
  callbacks.onShowSignModal(true);
};

// Helper function to create validation result
const createValidationResult = (
  validationCompleted: boolean,
  wasCancelled: boolean,
  shouldShowModal: boolean
): ImmediateValidationResult => ({
  validationCompleted,
  wasCancelled,
  shouldShowModal
});

// Helper function to handle JWT validation results
const handleJwtValidationResult = (
  isValid: boolean,
  wasCancelled: boolean,
  isConnected: boolean,
  callbacks: ImmediateValidationCallbacks
): ImmediateValidationResult => {
  if (wasCancelled) {
    return createValidationResult(true, true, false);
  }

  if (isValid) {
    return createValidationResult(true, false, false);
  }

  // Handle invalid JWT
  if (isConnected) {
    handleInvalidJwtWhenConnected(callbacks);
  } else {
    handleInvalidJwtWhenDisconnected(callbacks);
  }
  
  return createValidationResult(true, false, isConnected);
};

// Helper function to handle validation errors
const handleValidationError = (
  error: unknown,
  isConnected: boolean,
  abortSignal: AbortSignal,
  callbacks: ImmediateValidationCallbacks
): ImmediateValidationResult => {
  if (isAuthenticationRoleError(error)) {
    callbacks.onLogError('validateJwt_role_error', error);
    callbacks.onRemoveJwt();
    callbacks.onInvalidateCache();
    callbacks.onShowSignModal(true);
  } else {
    callbacks.onLogError('validateJwt_general_error', error);
    if (isConnected) {
      callbacks.onShowSignModal(true);
    }
  }

  return createValidationResult(
    false,
    abortSignal.aborted,
    isConnected && !abortSignal.aborted
  );
};

export const validateAuthImmediate = async ({
  params,
  callbacks
}: {
  params: ImmediateValidationParams;
  callbacks: ImmediateValidationCallbacks;
}): Promise<ImmediateValidationResult> => {
  const nodeEnv = getNodeEnv();
  const isDevLikeEnv = nodeEnv === "development" || nodeEnv === "test";

  if (publicEnv.USE_DEV_AUTH === "true" && isDevLikeEnv) {
    return createValidationResult(true, false, false);
  }

  const {
    currentAddress,
    connectionAddress,
    jwt,
    activeProfileProxy,
    isConnected,
    operationId,
    abortSignal
  } = params;

  try {
    // Early validation check
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    const { isValid, wasCancelled } = await validateJwt({
      jwt,
      wallet: currentAddress,
      role: activeProfileProxy ? validateRoleForAuthentication(activeProfileProxy) : null,
      operationId,
      abortSignal,
      activeProfileProxy
    });

    // Post-validation check
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    return handleJwtValidationResult(isValid, wasCancelled, isConnected, callbacks);

  } catch (error) {
    // Only handle errors if operation is still valid
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    return handleValidationError(error, isConnected, abortSignal, callbacks);
  }
};
