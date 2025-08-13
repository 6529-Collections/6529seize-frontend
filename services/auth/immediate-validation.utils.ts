import { validateJwt } from "./jwt-validation.utils";
import { validateRoleForAuthentication } from "../../utils/role-validation";
import {
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError
} from "../../errors/authentication";
import { ApiProfileProxy } from "../../generated/models/ApiProfileProxy";

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

// Helper function to handle invalid JWT
const handleInvalidJwt = (
  isConnected: boolean,
  callbacks: ImmediateValidationCallbacks
): void => {
  if (!isConnected) {
    callbacks.onReset();
  } else {
    callbacks.onRemoveJwt();
    callbacks.onInvalidateCache();
    callbacks.onShowSignModal(true);
  }
};

export const validateAuthImmediate = async ({
  params,
  callbacks
}: {
  params: ImmediateValidationParams;
  callbacks: ImmediateValidationCallbacks;
}): Promise<ImmediateValidationResult> => {
  const {
    currentAddress,
    connectionAddress,
    jwt,
    activeProfileProxy,
    isConnected,
    operationId,
    abortSignal
  } = params;
  
  const {
    onShowSignModal,
    onInvalidateCache,
    onReset: _onReset,
    onRemoveJwt,
    onLogError
  } = callbacks;

  try {
    // Early validation checks - return immediately if operation is invalid
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

    // Post-validation check - ensure operation is still valid
    if (!isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      return createCancelledResult();
    }

    // Handle cancelled operation
    if (wasCancelled) {
      return {
        validationCompleted: true,
        wasCancelled: true,
        shouldShowModal: false
      };
    }

    // Handle valid JWT
    if (isValid) {
      return {
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false
      };
    }

    // Handle invalid JWT
    handleInvalidJwt(isConnected, callbacks);
    return {
      validationCompleted: true,
      wasCancelled: false,
      shouldShowModal: isConnected
    };

  } catch (error) {
    // Handle validation errors only if operation is still valid
    if (isOperationValid(currentAddress, connectionAddress, abortSignal)) {
      // Handle authentication role errors
      if (isAuthenticationRoleError(error)) {
        onLogError('validateJwt_role_error', error);
        onRemoveJwt();
        onInvalidateCache();
        onShowSignModal(true);
      } else {
        onLogError('validateJwt_general_error', error);
        if (isConnected) {
          onShowSignModal(true);
        }
      }
    }

    return {
      validationCompleted: false,
      wasCancelled: abortSignal.aborted,
      shouldShowModal: isConnected && !abortSignal.aborted
    };
  }
};

export type {
  ImmediateValidationParams,
  ImmediateValidationCallbacks,
  ImmediateValidationResult
};