/* eslint-disable max-lines-per-function, react-compiler/react-compiler -- This hook owns one cohesive asynchronous wallet handoff and its mutable coordination refs. */
import {
  useCallback,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { getAddress, isAddress } from "viem";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
import { logError } from "@/utils/security-logger";
import {
  createWalletError,
  WalletConnectionError,
  WalletDisconnectionError,
} from "./seizeConnectErrors";
import {
  CONNECT_AFTER_DISCONNECT_DELAY_MS,
  normalizeAddress,
} from "./seizeConnectWalletState";

interface UseAddConnectedAccountParams {
  readonly account: {
    readonly address?: string | undefined;
    readonly isConnected: boolean;
    readonly status?: string | undefined;
  };
  readonly addFlowOriginAddressRef: RefObject<string | null>;
  readonly appKitModalOpen: boolean;
  readonly canAddConnectedAccount: boolean;
  readonly disconnect: () => Promise<unknown>;
  readonly deferDisconnectUntilSelection: boolean;
  readonly getSignOutAllGeneration: () => number;
  readonly hasSignOutAllGenerationChanged: (generation: number) => boolean;
  readonly isActiveAppWalletConnector: boolean;
  readonly isAddingConnectedAccount: boolean;
  readonly isAddingConnectedAccountRef: RefObject<boolean>;
  readonly isConnectIntentWaitingForAppKit: boolean;
  readonly isMountedRef: RefObject<boolean>;
  readonly isSigningOutAllRef: RefObject<boolean>;
  readonly retryConnectTimeoutRef: RefObject<NodeJS.Timeout | null>;
  readonly seizeConnectOrThrow: (source: string) => Promise<void>;
  readonly setIsAddingConnectedAccount: Dispatch<SetStateAction<boolean>>;
}

export function useAddConnectedAccount({
  account,
  addFlowOriginAddressRef,
  appKitModalOpen,
  canAddConnectedAccount,
  disconnect,
  deferDisconnectUntilSelection,
  getSignOutAllGeneration,
  hasSignOutAllGenerationChanged,
  isActiveAppWalletConnector,
  isAddingConnectedAccount,
  isAddingConnectedAccountRef,
  isConnectIntentWaitingForAppKit,
  isMountedRef,
  isSigningOutAllRef,
  retryConnectTimeoutRef,
  seizeConnectOrThrow,
  setIsAddingConnectedAccount,
}: UseAddConnectedAccountParams): () => void {
  const addConnectedAccountAttemptRef = useRef(0);

  const cancelAddConnectedAccount = useCallback((): void => {
    addConnectedAccountAttemptRef.current += 1;
    isAddingConnectedAccountRef.current = false;
    addFlowOriginAddressRef.current = null;
    if (retryConnectTimeoutRef.current) {
      clearTimeout(retryConnectTimeoutRef.current);
      retryConnectTimeoutRef.current = null;
    }
    setIsAddingConnectedAccount(false);
  }, [
    addFlowOriginAddressRef,
    isAddingConnectedAccountRef,
    retryConnectTimeoutRef,
    setIsAddingConnectedAccount,
  ]);

  return useCallback((): void => {
    if (
      isSigningOutAllRef.current ||
      !canAddConnectedAccount ||
      !canStoreAnotherWalletAccount()
    ) {
      return;
    }

    const liveConnectedWallet =
      account.address && account.isConnected && isAddress(account.address)
        ? getAddress(account.address)
        : null;
    const addFlowOriginAddress = addFlowOriginAddressRef.current;
    const addFlowReturnedToOrigin =
      !appKitModalOpen &&
      !isConnectIntentWaitingForAppKit &&
      !!liveConnectedWallet &&
      !!addFlowOriginAddress &&
      normalizeAddress(liveConnectedWallet) ===
        normalizeAddress(addFlowOriginAddress);
    const hasStaleAddConnectedAccountGuard =
      isAddingConnectedAccountRef.current &&
      (!isAddingConnectedAccount ||
        addFlowReturnedToOrigin ||
        (!appKitModalOpen &&
          !isConnectIntentWaitingForAppKit &&
          !retryConnectTimeoutRef.current &&
          !liveConnectedWallet &&
          account.status !== "connecting" &&
          account.status !== "reconnecting"));

    if (hasStaleAddConnectedAccountGuard) {
      cancelAddConnectedAccount();
    }

    if (isAddingConnectedAccountRef.current) {
      return;
    }

    isAddingConnectedAccountRef.current = true;
    addFlowOriginAddressRef.current = liveConnectedWallet;
    setIsAddingConnectedAccount(true);

    const addConnectedAccountAttempt =
      addConnectedAccountAttemptRef.current + 1;
    addConnectedAccountAttemptRef.current = addConnectedAccountAttempt;
    const isCurrentAttempt = (): boolean =>
      addConnectedAccountAttemptRef.current === addConnectedAccountAttempt;
    const clearAddConnectedAccountGuard = (): void => {
      if (isCurrentAttempt()) {
        cancelAddConnectedAccount();
      }
    };
    const handleConnectFailure = (error: unknown): void => {
      if (!isCurrentAttempt()) {
        return;
      }
      clearAddConnectedAccountGuard();
      const connectionError = createWalletError(
        WalletConnectionError,
        "start add-account connection flow",
        error
      );
      logError("seizeAddConnectedAccount", connectionError);
    };

    const signOutGeneration = getSignOutAllGeneration();
    const openAddConnectedAccountModal = (): void => {
      if (!isCurrentAttempt()) {
        return;
      }
      if (
        isSigningOutAllRef.current ||
        hasSignOutAllGenerationChanged(signOutGeneration)
      ) {
        clearAddConnectedAccountGuard();
        return;
      }

      seizeConnectOrThrow("seizeAddConnectedAccount").catch(
        handleConnectFailure
      );
    };

    if (
      deferDisconnectUntilSelection ||
      !liveConnectedWallet ||
      isActiveAppWalletConnector
    ) {
      openAddConnectedAccountModal();
      return;
    }

    if (retryConnectTimeoutRef.current) {
      clearTimeout(retryConnectTimeoutRef.current);
      retryConnectTimeoutRef.current = null;
    }

    const handleDisconnectFailure = (error: unknown): void => {
      if (!isCurrentAttempt()) {
        return;
      }
      clearAddConnectedAccountGuard();
      const walletError = createWalletError(
        WalletDisconnectionError,
        "disconnect wallet before adding account",
        error
      );
      logError("seizeAddConnectedAccount", walletError);
    };

    const disconnectBeforeAddingAccount = async (): Promise<void> => {
      try {
        await disconnect();
      } catch (error: unknown) {
        handleDisconnectFailure(error);
        return;
      }

      if (!isCurrentAttempt()) {
        return;
      }
      retryConnectTimeoutRef.current = setTimeout(() => {
        if (!isCurrentAttempt()) {
          return;
        }
        retryConnectTimeoutRef.current = null;
        if (
          !isMountedRef.current ||
          isSigningOutAllRef.current ||
          hasSignOutAllGenerationChanged(signOutGeneration)
        ) {
          clearAddConnectedAccountGuard();
          return;
        }
        openAddConnectedAccountModal();
      }, CONNECT_AFTER_DISCONNECT_DELAY_MS);
    };

    void disconnectBeforeAddingAccount();
  }, [
    account.address,
    account.isConnected,
    account.status,
    addFlowOriginAddressRef,
    appKitModalOpen,
    cancelAddConnectedAccount,
    canAddConnectedAccount,
    disconnect,
    deferDisconnectUntilSelection,
    getSignOutAllGeneration,
    hasSignOutAllGenerationChanged,
    isActiveAppWalletConnector,
    isAddingConnectedAccount,
    isAddingConnectedAccountRef,
    isConnectIntentWaitingForAppKit,
    isMountedRef,
    isSigningOutAllRef,
    retryConnectTimeoutRef,
    seizeConnectOrThrow,
    setIsAddingConnectedAccount,
  ]);
}
