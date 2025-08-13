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
    onReset,
    onRemoveJwt,
    onLogError
  } = callbacks;

  try {
    // Address consistency check - ensure address hasn't changed since effect start
    if (currentAddress !== connectionAddress) {
      // Address changed during setup - abort this operation
      return {
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false
      };
    }

    // Pre-validation address check - fail fast if address changed
    if (abortSignal.aborted || currentAddress !== connectionAddress) {
      return {
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false
      };
    }

    const { isValid, wasCancelled } = await validateJwt({
      jwt,
      wallet: currentAddress, // Use captured address, not current state
      role: activeProfileProxy ? validateRoleForAuthentication(activeProfileProxy) : null,
      operationId,
      abortSignal,
      activeProfileProxy
    });

    // Post-validation address check - ensure address is still consistent
    if (abortSignal.aborted || currentAddress !== connectionAddress) {
      return {
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false
      };
    }

    // Skip processing if operation was cancelled
    if (wasCancelled) {
      return {
        validationCompleted: true,
        wasCancelled: true,
        shouldShowModal: false
      };
    }

    // Skip processing if JWT is valid
    if (isValid) {
      return {
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false
      };
    }

    // Handle invalid JWT based on connection status
    if (!isConnected) {
      onReset();
    } else {
      onRemoveJwt();
      onInvalidateCache();
      onShowSignModal(true);
    }

    return {
      validationCompleted: true,
      wasCancelled: false,
      shouldShowModal: isConnected
    };

  } catch (error) {
    // Handle validation errors only if not cancelled and address hasn't changed
    if (!abortSignal.aborted && currentAddress === connectionAddress) {
      // Handle specific authentication role errors
      if (error instanceof MissingActiveProfileError ||
        error instanceof RoleValidationError ||
        error instanceof AuthenticationRoleError ||
        error instanceof InvalidRoleStateError) {
        // These are critical authentication failures - log and force re-authentication
        onLogError('validateJwt_role_error', error);
        // Force user to re-authenticate with proper role
        onRemoveJwt();
        onInvalidateCache();
        onShowSignModal(true);
      } else {
        // Handle other validation errors
        onLogError('validateJwt_general_error', error);
      }

      // Show sign modal on error if still connected
      if (isConnected) {
        onShowSignModal(true);
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