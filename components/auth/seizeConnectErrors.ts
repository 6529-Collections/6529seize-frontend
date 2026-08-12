import {
  clearAllWalletAuth,
  getConnectedWalletAccounts,
  getWalletAddress,
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

interface AuthenticatedProfileSnapshot {
  readonly address: string;
}

const getAuthenticatedProfilesForLogoutAll =
  (): readonly AuthenticatedProfileSnapshot[] => {
    const connectedProfiles = getConnectedWalletAccounts();
    if (connectedProfiles.length > 0) {
      return connectedProfiles.map(({ address }) => ({ address }));
    }

    const activeAddress = getWalletAddress();
    return activeAddress ? [{ address: activeAddress }] : [];
  };

const revokeProfileSessionForLogoutAll = async ({
  address,
}: AuthenticatedProfileSnapshot): Promise<void> => {
  try {
    await logoutSessionV2({
      address,
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
  const authenticatedProfiles = getAuthenticatedProfilesForLogoutAll();
  await Promise.all(
    authenticatedProfiles.map((profile) =>
      revokeProfileSessionForLogoutAll(profile)
    )
  );

  await clearAllWalletAuth();
};
