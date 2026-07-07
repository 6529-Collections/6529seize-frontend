"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect } from "react";
import { getAddress, isAddress } from "viem";
import {
  clearAgentLoginActiveAddress,
  type ConnectedWalletAccount,
  getWalletAddress,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { SecurityEventType } from "@/types/security";
import {
  createValidationEventContext,
  logSecurityEvent,
} from "@/utils/security-logger";
import type { WalletState } from "./seizeConnectTypes";
import {
  ADD_FLOW_CANCEL_GRACE_MS,
  normalizeAddress,
} from "./seizeConnectWalletState";

interface SeizeConnectProviderEffectsParams {
  readonly account: {
    readonly address?: string | undefined;
    readonly isConnected?: boolean | undefined;
    readonly status?: string | undefined;
  };
  readonly addFlowOriginAddressRef: MutableRefObject<string | null>;
  readonly agentLoginImpersonatedAddress: string | undefined;
  readonly clearConnectIntentHandoffTimeout: () => void;
  readonly clearConnectIntentWaitingForAppKit: () => void;
  readonly debounceTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  readonly impersonatedAddress: string | undefined;
  readonly isAddingConnectedAccount: boolean;
  readonly isAddingConnectedAccountRef: MutableRefObject<boolean>;
  readonly isConnectIntentWaitingForAppKit: boolean;
  readonly isInitialized: boolean;
  readonly isMountedRef: MutableRefObject<boolean>;
  readonly refreshStoredConnectedAccounts: () => void;
  readonly retryConnectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  readonly setConnected: (address: string) => void;
  readonly setConnecting: () => void;
  readonly setDisconnected: () => void;
  readonly setIsAddingConnectedAccount: Dispatch<SetStateAction<boolean>>;
  readonly setIsConnectIntentWaitingForAppKit: Dispatch<
    SetStateAction<boolean>
  >;
  readonly stateOpen: boolean;
  readonly storedConnectedAccounts: readonly ConnectedWalletAccount[];
  readonly walletState: WalletState;
}

export function useSeizeConnectProviderEffects({
  account,
  addFlowOriginAddressRef,
  agentLoginImpersonatedAddress,
  clearConnectIntentHandoffTimeout,
  clearConnectIntentWaitingForAppKit,
  debounceTimeoutRef,
  impersonatedAddress,
  isAddingConnectedAccount,
  isAddingConnectedAccountRef,
  isConnectIntentWaitingForAppKit,
  isInitialized,
  isMountedRef,
  refreshStoredConnectedAccounts,
  retryConnectTimeoutRef,
  setConnected,
  setConnecting,
  setDisconnected,
  setIsAddingConnectedAccount,
  setIsConnectIntentWaitingForAppKit,
  stateOpen,
  storedConnectedAccounts,
  walletState,
}: SeizeConnectProviderEffectsParams): void {
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (retryConnectTimeoutRef.current) {
        clearTimeout(retryConnectTimeoutRef.current);
        retryConnectTimeoutRef.current = null;
      }
      clearConnectIntentHandoffTimeout();
    };
  }, [clearConnectIntentHandoffTimeout, isMountedRef, retryConnectTimeoutRef]);

  useEffect(() => {
    refreshStoredConnectedAccounts();

    if (globalThis.window === undefined) return;

    const handleAccountsUpdated = () => {
      refreshStoredConnectedAccounts();
    };

    globalThis.addEventListener(
      WALLET_ACCOUNTS_UPDATED_EVENT,
      handleAccountsUpdated
    );
    return () => {
      globalThis.removeEventListener(
        WALLET_ACCOUNTS_UPDATED_EVENT,
        handleAccountsUpdated
      );
    };
  }, [refreshStoredConnectedAccounts]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (
        agentLoginImpersonatedAddress &&
        account.address &&
        account.isConnected &&
        isAddress(account.address)
      ) {
        const checksummedConnectedAddress = getAddress(account.address);
        clearAgentLoginActiveAddress();
        const isAlreadyConnected =
          walletState.status === "connected" &&
          walletState.address === checksummedConnectedAddress;
        if (!isAlreadyConnected) {
          setConnected(checksummedConnectedAddress);
        }
        return;
      }

      if (impersonatedAddress) {
        const isAlreadyConnected =
          walletState.status === "connected" &&
          walletState.address === impersonatedAddress;
        if (!isAlreadyConnected) {
          setConnected(impersonatedAddress);
        }
        return;
      }

      if (
        isAddingConnectedAccount &&
        account.address &&
        account.isConnected &&
        isAddress(account.address)
      ) {
        const checksummedConnectedAddress = getAddress(account.address);
        clearAgentLoginActiveAddress();
        const isAlreadyConnected =
          walletState.status === "connected" &&
          walletState.address === checksummedConnectedAddress;
        if (!isAlreadyConnected) {
          setConnected(checksummedConnectedAddress);
        }
        return;
      }

      const activeStoredAddress = getWalletAddress();

      if (
        account.address &&
        account.isConnected &&
        isAddress(account.address)
      ) {
        const checksummedConnectedAddress = getAddress(account.address);
        clearAgentLoginActiveAddress();
        const isKnownStoredAccount = storedConnectedAccounts.some(
          (storedAccount) =>
            normalizeAddress(storedAccount.address) ===
            normalizeAddress(checksummedConnectedAddress)
        );

        if (isKnownStoredAccount && activeStoredAddress) {
          const isActiveStoredAddressValid = isAddress(activeStoredAddress);
          if (isActiveStoredAddressValid) {
            const checksummedStoredActiveAddress =
              getAddress(activeStoredAddress);
            const isStoredActiveKnownAccount = storedConnectedAccounts.some(
              (storedAccount) =>
                normalizeAddress(storedAccount.address) ===
                normalizeAddress(checksummedStoredActiveAddress)
            );
            const isSwitchTransition =
              normalizeAddress(checksummedConnectedAddress) !==
              normalizeAddress(checksummedStoredActiveAddress);

            if (isStoredActiveKnownAccount && isSwitchTransition) {
              const isAlreadyConnected =
                walletState.status === "connected" &&
                walletState.address === checksummedStoredActiveAddress;
              if (!isAlreadyConnected) {
                setConnected(checksummedStoredActiveAddress);
              }
              return;
            }
          }
        }

        if (!isKnownStoredAccount) {
          const isAlreadyConnected =
            walletState.status === "connected" &&
            walletState.address === checksummedConnectedAddress;
          if (!isAlreadyConnected) {
            setConnected(checksummedConnectedAddress);
          }
          return;
        }
      }

      if (
        isAddingConnectedAccount &&
        account.address &&
        isAddress(account.address)
      ) {
        const checksummedCandidateAddress = getAddress(account.address);
        const addFlowOriginAddress = addFlowOriginAddressRef.current;
        const isCandidateDifferentFromOrigin =
          !addFlowOriginAddress ||
          normalizeAddress(checksummedCandidateAddress) !==
            normalizeAddress(addFlowOriginAddress);

        if (isCandidateDifferentFromOrigin && !account.isConnected) {
          if (walletState.status !== "connecting") {
            setConnecting();
          }
          return;
        }
      }

      if (activeStoredAddress && isAddress(activeStoredAddress)) {
        const checksummedStoredAddress = getAddress(activeStoredAddress);
        const isAlreadyConnected =
          walletState.status === "connected" &&
          walletState.address === checksummedStoredAddress;
        if (!isAlreadyConnected) {
          setConnected(checksummedStoredAddress);
        }
        return;
      }

      if (account.address && account.isConnected) {
        if (!isAddress(account.address)) {
          const addressStr = account.address as string | undefined;
          logSecurityEvent(
            SecurityEventType.INVALID_ADDRESS_DETECTED,
            createValidationEventContext(
              "wallet_provider",
              false,
              addressStr?.length || 0,
              addressStr?.startsWith("0x") ? "hex_prefixed" : "other"
            )
          );

          setDisconnected();
          return;
        }

        const checksummedAddress = getAddress(account.address);
        clearAgentLoginActiveAddress();
        const isAlreadyConnected =
          walletState.status === "connected" &&
          walletState.address === checksummedAddress;
        if (!isAlreadyConnected) {
          setConnected(checksummedAddress);
        }
      } else if (account.isConnected === false) {
        if (walletState.status !== "disconnected") {
          setDisconnected();
        }
      } else if (account.status === "connecting") {
        if (walletState.status !== "connecting") {
          setConnecting();
        }
      } else if (walletState.status !== "disconnected") {
        setDisconnected();
      }
    }, 50);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    account.address,
    account.isConnected,
    account.status,
    isInitialized,
    storedConnectedAccounts,
    walletState,
    setConnected,
    setDisconnected,
    setConnecting,
    agentLoginImpersonatedAddress,
    impersonatedAddress,
    isAddingConnectedAccount,
    addFlowOriginAddressRef,
    debounceTimeoutRef,
  ]);

  useEffect(() => {
    if (!isAddingConnectedAccount) {
      isAddingConnectedAccountRef.current = false;
      addFlowOriginAddressRef.current = null;
      if (retryConnectTimeoutRef.current) {
        clearTimeout(retryConnectTimeoutRef.current);
        retryConnectTimeoutRef.current = null;
      }
      return;
    }

    let cancelAddFlowTimeout: NodeJS.Timeout | null = null;

    const liveConnectedWallet =
      account.address && account.isConnected && isAddress(account.address)
        ? getAddress(account.address)
        : null;
    const walletAddressCandidate =
      account.address && isAddress(account.address)
        ? getAddress(account.address)
        : null;
    const activeStoredAddress = getWalletAddress();
    const addFlowOriginAddress = addFlowOriginAddressRef.current;
    const isConnectedWalletNowStored =
      !!liveConnectedWallet &&
      !!activeStoredAddress &&
      normalizeAddress(liveConnectedWallet) ===
        normalizeAddress(activeStoredAddress);
    const hasSwitchedFromOrigin =
      !addFlowOriginAddress ||
      !liveConnectedWallet ||
      normalizeAddress(liveConnectedWallet) !==
        normalizeAddress(addFlowOriginAddress);

    if (isConnectedWalletNowStored && hasSwitchedFromOrigin) {
      setIsAddingConnectedAccount(false);
      addFlowOriginAddressRef.current = null;
      return;
    }

    const addFlowReturnedToOrigin =
      !stateOpen &&
      !isConnectIntentWaitingForAppKit &&
      !!liveConnectedWallet &&
      !!addFlowOriginAddress &&
      normalizeAddress(liveConnectedWallet) ===
        normalizeAddress(addFlowOriginAddress);
    if (addFlowReturnedToOrigin) {
      setIsAddingConnectedAccount(false);
      addFlowOriginAddressRef.current = null;
      return;
    }

    const hasPendingDifferentCandidate =
      !!walletAddressCandidate &&
      !!addFlowOriginAddress &&
      normalizeAddress(walletAddressCandidate) !==
        normalizeAddress(addFlowOriginAddress);

    const addFlowCancelled =
      !stateOpen &&
      !isConnectIntentWaitingForAppKit &&
      account.status !== "connecting" &&
      account.status !== "reconnecting" &&
      !account.isConnected &&
      !hasPendingDifferentCandidate;
    if (addFlowCancelled) {
      cancelAddFlowTimeout = setTimeout(() => {
        setIsAddingConnectedAccount(false);
        addFlowOriginAddressRef.current = null;
      }, ADD_FLOW_CANCEL_GRACE_MS);
    }

    return () => {
      if (cancelAddFlowTimeout) {
        clearTimeout(cancelAddFlowTimeout);
      }
    };
  }, [
    account.address,
    account.isConnected,
    account.status,
    isAddingConnectedAccount,
    isAddingConnectedAccountRef,
    isConnectIntentWaitingForAppKit,
    stateOpen,
    addFlowOriginAddressRef,
    retryConnectTimeoutRef,
    setIsAddingConnectedAccount,
    setIsConnectIntentWaitingForAppKit,
  ]);

  useEffect(() => {
    if (stateOpen && isConnectIntentWaitingForAppKit) {
      clearConnectIntentWaitingForAppKit();
    }
  }, [
    clearConnectIntentWaitingForAppKit,
    isConnectIntentWaitingForAppKit,
    stateOpen,
  ]);
}
