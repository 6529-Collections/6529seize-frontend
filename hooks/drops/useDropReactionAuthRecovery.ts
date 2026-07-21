"use client";

import { useAuth } from "@/components/auth/Auth";
import type { AuthContextType } from "@/components/auth/authTypes";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import { extractErrorStatusCode } from "@/utils/errorStatus";
import { useCallback, useSyncExternalStore } from "react";

type RequestAuth = AuthContextType["requestAuth"];

interface InFlightRecovery {
  readonly id: symbol;
  readonly promise: Promise<boolean>;
}

const recoveryListeners = new Set<() => void>();
let inFlightRecovery: InFlightRecovery | null = null;
let lastAttemptedAuthFingerprint: string | null = null;

const subscribeToRecovery = (listener: () => void): (() => void) => {
  recoveryListeners.add(listener);
  return () => {
    recoveryListeners.delete(listener);
  };
};

const emitRecoveryChange = (): void => {
  for (const listener of recoveryListeners) {
    listener();
  }
};

const clearRecoveryIfCurrent = (recoveryId: symbol): void => {
  if (inFlightRecovery?.id !== recoveryId) {
    return;
  }

  inFlightRecovery = null;
  emitRecoveryChange();
};

export const isDropReactionAuthRecoveryPending = (): boolean =>
  inFlightRecovery !== null;

const getServerRecoverySnapshot = (): boolean => false;

export const getDropReactionAuthStateFingerprint = (): string =>
  getAuthStateFingerprint({
    walletAddress: getWalletAddress(),
    jwt: getAuthJwt(),
  });

const startAuthRecovery = (
  requestAuth: RequestAuth,
  rejectedAuthFingerprint: string
): Promise<boolean> => {
  if (getDropReactionAuthStateFingerprint() !== rejectedAuthFingerprint) {
    return Promise.resolve(false);
  }
  if (inFlightRecovery) {
    return inFlightRecovery.promise;
  }
  if (lastAttemptedAuthFingerprint === rejectedAuthFingerprint) {
    return Promise.resolve(false);
  }

  lastAttemptedAuthFingerprint = rejectedAuthFingerprint;
  const recoveryId = Symbol();
  const recoveryPromise = (async (): Promise<boolean> => {
    try {
      const result = await requestAuth({
        serverRejected: true,
        expectedAuthStateFingerprint: rejectedAuthFingerprint,
      });
      return result.success;
    } catch (error: unknown) {
      logErrorSecurely("drop_reaction_auth_recovery", error);
      return false;
    } finally {
      clearRecoveryIfCurrent(recoveryId);
    }
  })();

  inFlightRecovery = { id: recoveryId, promise: recoveryPromise };
  emitRecoveryChange();
  return recoveryPromise;
};

export const useDropReactionAuthRecovery = () => {
  const { requestAuth } = useAuth();
  const isRecoveryPending = useSyncExternalStore(
    subscribeToRecovery,
    isDropReactionAuthRecoveryPending,
    getServerRecoverySnapshot
  );
  const recoverFromUnauthorized = useCallback(
    (
      error: unknown,
      rejectedAuthFingerprint: string
    ): Promise<boolean> | null => {
      if (extractErrorStatusCode(error) !== 401) {
        return null;
      }
      return startAuthRecovery(requestAuth, rejectedAuthFingerprint);
    },
    [requestAuth]
  );

  return { isRecoveryPending, recoverFromUnauthorized };
};

export const __resetDropReactionAuthRecoveryForTests = (): void => {
  inFlightRecovery = null;
  lastAttemptedAuthFingerprint = null;
  emitRecoveryChange();
};
