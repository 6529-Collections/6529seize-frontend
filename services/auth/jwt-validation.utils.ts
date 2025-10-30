import { jwtDecode } from "jwt-decode";
import {
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  setAuthJwt,
  syncWalletRoleWithServer,
} from "./auth.utils";
import { redeemRefreshTokenWithRetries } from "./token-refresh.utils";
import { areEqualAddresses } from "@/helpers/Helpers";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  TokenRefreshCancelledError,
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError,
} from "@/errors/authentication";
import { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

interface JwtPayload {
  id: string;
  sub: string;
  iat: number;
  exp: number;
  role: string;
}

interface ValidateJwtParams {
  jwt: string | null;
  wallet: string;
  role: string | null;
  operationId: string;
  abortSignal: AbortSignal;
  activeProfileProxy?: ApiProfileProxy | null;
}

interface ValidateJwtResult {
  isValid: boolean;
  wasCancelled: boolean;
}

export const getRole = (jwt: string | null): string | null => {
  if (!jwt) return null;
  const decodedJwt = jwtDecode<JwtPayload>(jwt);
  return decodedJwt.role;
};

const doJWTValidation = ({
  jwt,
  wallet,
  role,
}: {
  jwt: string | null;
  wallet: string;
  role: string | null;
}): boolean => {
  if (!jwt) return false;
  const decodedJwt = jwtDecode<JwtPayload>(jwt);
  if (role && decodedJwt.role !== role) return false;
  return (
    decodedJwt.sub.toLowerCase() === wallet.toLowerCase() &&
    decodedJwt.exp > Date.now() / 1000
  );
};

const validateJwtInputs = (wallet: string, operationId: string): void => {
  if (!wallet || typeof wallet !== 'string') {
    throw new Error('Invalid wallet address: must be non-empty string');
  }
  if (!operationId || typeof operationId !== 'string') {
    throw new Error('Invalid operationId: must be non-empty string');
  }
};

const validateProxyRole = ({
  role,
  activeProfileProxy,
  freshTokenRole,
}: {
  role: string;
  activeProfileProxy: ApiProfileProxy | null | undefined;
  freshTokenRole: string | null;
}): void => {
  // Ensure we have an active profile proxy for role-based auth
  if (!activeProfileProxy) {
    throw new MissingActiveProfileError();
  }

  // Validate proxy structure
  const proxyCreatorId = activeProfileProxy.created_by?.id;
  if (!proxyCreatorId || typeof proxyCreatorId !== 'string' || proxyCreatorId.trim().length === 0) {
    throw new AuthenticationRoleError(
      'Active profile proxy has invalid created_by.id - role validation cannot proceed'
    );
  }

  // The requested role should match the proxy creator's ID
  if (role !== proxyCreatorId) {
    throw new InvalidRoleStateError(
      `Role mismatch: requested role ${role} does not match proxy creator ${proxyCreatorId}`
    );
  }

  // Ensure server provided the correct role in the token
  if (freshTokenRole !== role) {
    throw new RoleValidationError(role, freshTokenRole);
  }
};

const synchronizeRoles = ({
  walletRole,
  freshTokenRole,
  address,
  refreshToken,
  newToken,
}: {
  walletRole: string | null;
  freshTokenRole: string | null;
  address: string;
  refreshToken: string;
  newToken: string;
}): void => {
  // UPDATE LOCAL STORAGE: Sync local wallet role with server response
  // The server response is authoritative - update local storage to match
  if (walletRole !== freshTokenRole) {
    // Log the role change for security monitoring
    logErrorSecurely('JWT_ROLE_UPDATE', {
      message: `Updating local wallet role from ${walletRole} to ${freshTokenRole}`,
      oldRole: walletRole,
      newRole: freshTokenRole,
      address
    });
  }

  // Success - store the new JWT with the SERVER-PROVIDED role (not local role)
  setAuthJwt(
    address,
    newToken,
    refreshToken,
    freshTokenRole ?? undefined  // ✅ USE SERVER ROLE, NOT LOCAL ROLE
  );

  // Sync local wallet role with server role
  syncWalletRoleWithServer(freshTokenRole, address);
};

const handleTokenRefresh = async ({
  wallet,
  role,
  abortSignal,
  activeProfileProxy,
}: {
  wallet: string;
  role: string | null;
  abortSignal: AbortSignal;
  activeProfileProxy?: ApiProfileProxy | null;
}): Promise<ValidateJwtResult> => {
  const refreshToken = getRefreshToken();
  const walletAddress = getWalletAddress();

  // If there's no refresh token, this is a first-time sign-in scenario
  // Return false to trigger the sign modal, don't throw an error
  if (!refreshToken) {
    return { isValid: false, wasCancelled: false };
  }

  // If we have a refresh token but no wallet address, that's an error
  if (!walletAddress) {
    throw new Error('No wallet address available for JWT renewal');
  }

  // Check for cancellation before proceeding
  if (abortSignal.aborted) {
    return { isValid: false, wasCancelled: true };
  }

  try {
    const redeemResponse = await redeemRefreshTokenWithRetries(
      walletAddress,
      refreshToken,
      role,
      3,
      abortSignal
    );

    // Check if operation was cancelled during token refresh
    if (abortSignal.aborted) {
      return { isValid: false, wasCancelled: true };
    }

    // Validate response data - fail fast on invalid response
    if (!areEqualAddresses(redeemResponse.address, wallet)) {
      throw new Error(
        `Address mismatch in token response: expected ${wallet}, got ${redeemResponse.address}`
      );
    }

    const walletRole = getWalletRole();
    // CRITICAL FIX: Get role from the NEW token, not the old one  
    const freshTokenRole = getRole(redeemResponse.token);

    // Role validation: Only validate when doing role-based authentication (proxy users)
    if (role) {
      validateProxyRole({
        role,
        activeProfileProxy,
        freshTokenRole,
      });
    }

    // Synchronize roles and update storage
    synchronizeRoles({
      walletRole,
      freshTokenRole,
      address: redeemResponse.address,
      refreshToken,
      newToken: redeemResponse.token,
    });

    return { isValid: true, wasCancelled: false };
  } catch (error: any) {
    // Handle cancellation errors
    if (error instanceof TokenRefreshCancelledError || error.name === 'AbortError') {
      return { isValid: false, wasCancelled: true };
    }
    // Re-throw all other errors (including TokenRefreshError subclasses)
    throw error;
  }
};

export const validateJwt = async ({
  jwt,
  wallet,
  role,
  operationId,
  abortSignal,
  activeProfileProxy,
}: ValidateJwtParams): Promise<ValidateJwtResult> => {
  // Input validation - fail fast on invalid parameters
  validateJwtInputs(wallet, operationId);

  // Check if already aborted
  if (abortSignal.aborted) {
    return { isValid: false, wasCancelled: true };
  }

  // Validate the current JWT
  const isValid = doJWTValidation({ jwt, wallet, role });

  // If JWT is valid, return success
  if (isValid) {
    return { isValid: true, wasCancelled: false };
  }

  // JWT is invalid, attempt token refresh
  return await handleTokenRefresh({
    wallet,
    role,
    abortSignal,
    activeProfileProxy,
  });
};
