import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import type { RequestAuthOptions } from "./authTypes";

export interface AuthRequestGuard {
  readonly isCurrent: () => boolean;
  readonly acceptCurrentState: (walletAddress: string) => boolean;
}

export const isAuthRequestStale = (
  authRequestGuard: AuthRequestGuard | undefined
): boolean => authRequestGuard?.isCurrent() === false;

const getCurrentAuthStateFingerprint = (): string =>
  getAuthStateFingerprint({
    walletAddress: getWalletAddress(),
    jwt: getAuthJwt(),
  });

export const createAuthRequestGuard = (
  { expectedAuthStateFingerprint }: RequestAuthOptions,
  isRequestContextCurrent: () => boolean = () => true
): AuthRequestGuard => {
  let expectedFingerprint = expectedAuthStateFingerprint;

  const isCurrent = (): boolean =>
    isRequestContextCurrent() &&
    (expectedFingerprint === undefined ||
      getCurrentAuthStateFingerprint() === expectedFingerprint);

  return {
    isCurrent,
    acceptCurrentState: (walletAddress: string) => {
      if (!isCurrent()) {
        return false;
      }

      if (expectedFingerprint === undefined) {
        return true;
      }

      const currentWalletAddress = getWalletAddress();
      if (currentWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
        return false;
      }

      expectedFingerprint = getCurrentAuthStateFingerprint();
      return true;
    },
  };
};
