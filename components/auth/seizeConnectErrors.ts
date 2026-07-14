import { MAX_CONNECTED_PROFILES } from "@/constants/constants";
import {
  getConnectedWalletAccounts,
  getWalletAddress,
  removeAuthJwt,
} from "@/services/auth/auth.utils";
import { logoutSessionV2 } from "@/services/auth/session-v2.utils";
import { logError } from "@/utils/security-logger";

export class WalletConnectionError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "WalletConnectionError";
  }
}

export class WalletDisconnectionError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "WalletDisconnectionError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export const createWalletError = (
  ErrorClass: typeof WalletConnectionError | typeof WalletDisconnectionError,
  operation: string,
  originalError: unknown
): WalletConnectionError | WalletDisconnectionError => {
  const message =
    originalError instanceof Error
      ? originalError.message
      : `Unknown error during ${operation}`;

  return new ErrorClass(
    `Failed to ${operation}: ${message}`,
    originalError,
    originalError instanceof Error ? originalError.name : undefined
  );
};

const getLogoutSessionError = (error: unknown, message: string): Error =>
  error instanceof Error ? error : new Error(message);

const revokeActiveSessionForLogoutAll = async (): Promise<void> => {
  const activeAddress = getWalletAddress();
  if (!activeAddress) {
    return;
  }

  try {
    await logoutSessionV2({
      address: activeAddress,
      allSessions: true,
    });
  } catch (error: unknown) {
    logError(
      "seizeDisconnectAndLogoutAll.logoutSessionV2",
      getLogoutSessionError(error, "Failed to revoke session during logout all")
    );
  }
};

export const clearAllAuthenticatedProfiles = async (): Promise<void> => {
  let remainingProfiles = getConnectedWalletAccounts().length;
  let activeWalletAddress = getWalletAddress();
  const maxIterations = Math.max(
    MAX_CONNECTED_PROFILES * 2,
    remainingProfiles + 2
  );
  let iterations = 0;

  while (remainingProfiles > 0 || activeWalletAddress) {
    iterations += 1;
    if (iterations > maxIterations) {
      const iterationError = new AuthenticationError(
        `Failed to clear all authenticated profiles: exceeded ${maxIterations} iterations during logout cleanup.`
      );
      logError("seizeDisconnectAndLogoutAll", iterationError);
      throw iterationError;
    }

    await revokeActiveSessionForLogoutAll();
    await removeAuthJwt();

    const nextRemainingProfiles = getConnectedWalletAccounts().length;
    const nextActiveWalletAddress = getWalletAddress();
    if (
      nextRemainingProfiles >= remainingProfiles &&
      nextActiveWalletAddress === activeWalletAddress
    ) {
      throw new Error("Failed to clear all authenticated profiles.");
    }
    remainingProfiles = nextRemainingProfiles;
    activeWalletAddress = nextActiveWalletAddress;
  }
};
