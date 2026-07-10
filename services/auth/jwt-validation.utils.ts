import { jwtDecode } from "jwt-decode";
import {
  getWalletRole,
  hasActiveSessionV2Auth,
  syncWalletRoleWithServer,
} from "./auth.utils";
import { persistSessionResponse, refreshSessionV2 } from "./session-v2.utils";
import { areEqualAddresses } from "@/helpers/Helpers";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  TokenRefreshCancelledError,
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError,
} from "@/errors/authentication";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { trackAuthImpactEvent } from "@/services/analytics/mixpanel";

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
  activeProfileProxy?: ApiProfileProxy | null | undefined;
}

export type SessionRefreshValidationOutcome =
  | "cancelled"
  | "empty"
  | "failed"
  | "local_valid_after_failure"
  | "missing_wallet"
  | "not_attempted"
  | "success";

interface ValidateJwtResult {
  isValid: boolean;
  wasCancelled: boolean;
  refreshOutcome?: SessionRefreshValidationOutcome;
  requiresSessionUpgrade?: boolean;
}

type RefreshedSession = NonNullable<
  Awaited<ReturnType<typeof refreshSessionV2>>
>;

const INVALID_JWT_RESULT: ValidateJwtResult = {
  isValid: false,
  wasCancelled: false,
  refreshOutcome: "not_attempted",
};

const CANCELLED_JWT_RESULT: ValidateJwtResult = {
  isValid: false,
  wasCancelled: true,
  refreshOutcome: "cancelled",
};

const VALID_JWT_RESULT: ValidateJwtResult = {
  isValid: true,
  wasCancelled: false,
  refreshOutcome: "not_attempted",
};

const SESSION_UPGRADE_REQUIRED_RESULT: ValidateJwtResult = {
  isValid: false,
  wasCancelled: false,
  refreshOutcome: "failed",
  requiresSessionUpgrade: true,
};

const createInvalidJwtResult = (
  refreshOutcome: SessionRefreshValidationOutcome
): ValidateJwtResult => ({
  ...INVALID_JWT_RESULT,
  refreshOutcome,
});

const createValidJwtResult = (
  refreshOutcome: SessionRefreshValidationOutcome
): ValidateJwtResult => ({
  ...VALID_JWT_RESULT,
  refreshOutcome,
});

const createSessionUpgradeRequiredResult = (
  refreshOutcome: SessionRefreshValidationOutcome
): ValidateJwtResult => ({
  ...SESSION_UPGRADE_REQUIRED_RESULT,
  refreshOutcome,
});

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
  if (!wallet || typeof wallet !== "string") {
    throw new Error("Invalid wallet address: must be non-empty string");
  }
  if (!operationId || typeof operationId !== "string") {
    throw new Error("Invalid operationId: must be non-empty string");
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
  const proxyCreatorId = activeProfileProxy.created_by.id;
  if (
    !proxyCreatorId ||
    typeof proxyCreatorId !== "string" ||
    proxyCreatorId.trim().length === 0
  ) {
    throw new AuthenticationRoleError(
      "Active profile proxy has invalid created_by.id - role validation cannot proceed"
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

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "AbortError";

const isAbortSignalAborted = (abortSignal: AbortSignal): boolean =>
  abortSignal.aborted;

const assertRefreshedSessionMatchesWallet = (
  refreshedSession: RefreshedSession,
  wallet: string
): void => {
  if (!areEqualAddresses(refreshedSession.address, wallet)) {
    throw new Error(
      `Address mismatch in token response: expected ${wallet}, got ${refreshedSession.address}`
    );
  }
};

const persistValidatedRefreshedSession = async ({
  refreshedSession,
  role,
  activeProfileProxy,
}: {
  refreshedSession: RefreshedSession;
  role: string | null;
  activeProfileProxy?: ApiProfileProxy | null | undefined;
}): Promise<void> => {
  const walletRole = getWalletRole();
  const freshTokenRole = getRole(refreshedSession.access_token);

  if (role) {
    validateProxyRole({
      role,
      activeProfileProxy,
      freshTokenRole,
    });
  }

  if (walletRole !== freshTokenRole) {
    const previousRole = walletRole ?? "none";
    const nextRole = freshTokenRole ?? "none";
    logErrorSecurely("JWT_ROLE_UPDATE", {
      message: `Updating local wallet role from ${previousRole} to ${nextRole}`,
      oldRole: walletRole,
      newRole: freshTokenRole,
      address: refreshedSession.address,
    });
  }

  const didPersist = await persistSessionResponse(refreshedSession);
  if (!didPersist) {
    throw new Error("Failed to persist refreshed session");
  }

  syncWalletRoleWithServer(freshTokenRole, refreshedSession.address);
};

const handleTokenRefresh = async ({
  wallet,
  role,
  abortSignal,
  activeProfileProxy,
  trackRecovery,
}: {
  wallet: string;
  role: string | null;
  abortSignal: AbortSignal;
  activeProfileProxy?: ApiProfileProxy | null | undefined;
  trackRecovery: boolean;
}): Promise<ValidateJwtResult> => {
  // Check for cancellation before proceeding
  if (abortSignal.aborted) {
    return CANCELLED_JWT_RESULT;
  }

  try {
    if (!wallet) {
      return createInvalidJwtResult("missing_wallet");
    }

    const refreshedSession = await refreshSessionV2({
      address: wallet,
      abortSignal,
    });

    if (!refreshedSession) {
      return createInvalidJwtResult("empty");
    }

    if (isAbortSignalAborted(abortSignal)) {
      return CANCELLED_JWT_RESULT;
    }

    assertRefreshedSessionMatchesWallet(refreshedSession, wallet);
    await persistValidatedRefreshedSession({
      refreshedSession,
      role,
      activeProfileProxy,
    });
    if (trackRecovery) {
      trackAuthImpactEvent("Auth Session Refresh Recovered", {
        auth_state_after: "authenticated",
        auth_state_before: "refresh_needed",
        client_type: refreshedSession.client_type,
        endpoint_family: "auth_session_refresh",
        product_failure: false,
        reason: "session_refresh",
        refresh_outcome: "success",
        status_bucket: "2xx",
      });
    }

    return createValidJwtResult("success");
  } catch (error: unknown) {
    // Handle cancellation errors
    if (error instanceof TokenRefreshCancelledError || isAbortError(error)) {
      return CANCELLED_JWT_RESULT;
    }
    // Re-throw all other errors.
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
    return CANCELLED_JWT_RESULT;
  }

  const hasValidLocalJwt = doJWTValidation({ jwt, wallet, role });

  if (hasValidLocalJwt && hasActiveSessionV2Auth({ address: wallet })) {
    return VALID_JWT_RESULT;
  }

  let refreshedResult: ValidateJwtResult;
  try {
    refreshedResult = await handleTokenRefresh({
      wallet,
      role,
      abortSignal,
      activeProfileProxy,
      trackRecovery: !hasValidLocalJwt,
    });
  } catch (error: unknown) {
    if (hasValidLocalJwt && hasActiveSessionV2Auth({ address: wallet })) {
      return createValidJwtResult("local_valid_after_failure");
    }
    if (hasValidLocalJwt) {
      return createSessionUpgradeRequiredResult("failed");
    }
    throw error;
  }

  if (refreshedResult.isValid || refreshedResult.wasCancelled) {
    return refreshedResult;
  }

  const refreshOutcome = refreshedResult.refreshOutcome ?? "not_attempted";

  if (hasValidLocalJwt && hasActiveSessionV2Auth({ address: wallet })) {
    return createValidJwtResult("local_valid_after_failure");
  }

  if (hasValidLocalJwt) {
    return createSessionUpgradeRequiredResult(refreshOutcome);
  }

  return createInvalidJwtResult(refreshOutcome);
};
