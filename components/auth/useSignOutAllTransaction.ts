import { useCallback, useRef, useState, type RefObject } from "react";
import {
  noteSignOutAllFinished,
  noteSignOutAllStarted,
} from "@/services/auth/sign-out-all-state";
import { cancelBrowserConnectorSignIn } from "@/services/desktop/browserConnectorSignIn";
import { forgetAllBrowserWalletProfiles } from "@/services/desktop/desktopBrowserWallet";
import { logError } from "@/utils/security-logger";
import {
  AuthenticationError,
  clearAllAuthenticatedProfiles,
  createWalletError,
  WalletDisconnectionError,
} from "./seizeConnectErrors";

interface UseSignOutAllTransactionParams {
  readonly disconnect: () => Promise<unknown>;
  readonly isMountedRef: RefObject<boolean>;
  readonly refreshStoredConnectedAccounts: () => void;
  readonly setDisconnected: () => void;
}

export function useSignOutAllTransaction({
  disconnect,
  isMountedRef,
  refreshStoredConnectedAccounts,
  setDisconnected,
}: UseSignOutAllTransactionParams) {
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const isSigningOutAllRef = useRef(false);
  const signOutAllGenerationRef = useRef(0);
  const getSignOutAllGeneration = useCallback(
    (): number => signOutAllGenerationRef.current,
    []
  );
  const hasSignOutAllGenerationChanged = useCallback(
    (generation: number): boolean =>
      generation !== signOutAllGenerationRef.current,
    []
  );

  const seizeDisconnectAndLogoutAll = useCallback(async (): Promise<void> => {
    if (isSigningOutAllRef.current) {
      return;
    }
    isSigningOutAllRef.current = true;
    signOutAllGenerationRef.current += 1;
    // A 6529 Desktop browser sign-in still waiting for its link must not
    // sign in after this sign-out (a no-op outside the desktop app).
    cancelBrowserConnectorSignIn();
    noteSignOutAllStarted();
    setIsSigningOutAll(true);

    try {
      try {
        await disconnect();
      } catch (error: unknown) {
        const walletError = createWalletError(
          WalletDisconnectionError,
          "disconnect wallet during logout all profiles",
          error
        );
        logError("seizeDisconnectAndLogoutAll", walletError);
        throw new AuthenticationError(
          "Cannot complete sign out: wallet disconnection failed. User may still have active wallet connection.",
          walletError
        );
      }

      try {
        await clearAllAuthenticatedProfiles();
        // 6529 Desktop: no profile keeps browser-wallet forwarding.
        await forgetAllBrowserWalletProfiles();
        refreshStoredConnectedAccounts();
        setDisconnected();
      } catch (error: unknown) {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        const authError = new AuthenticationError(
          "Failed to clear all authenticated profiles after successful wallet disconnect",
          error
        );
        logError("seizeDisconnectAndLogoutAll", authError);
        throw authError;
      }
    } finally {
      isSigningOutAllRef.current = false;
      noteSignOutAllFinished();
      if (isMountedRef.current) {
        setIsSigningOutAll(false);
      }
    }
  }, [
    disconnect,
    isMountedRef,
    refreshStoredConnectedAccounts,
    setDisconnected,
  ]);

  return {
    getSignOutAllGeneration,
    hasSignOutAllGenerationChanged,
    isSigningOutAll,
    isSigningOutAllRef,
    seizeDisconnectAndLogoutAll,
  };
}
