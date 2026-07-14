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

type AccountSnapshot = SeizeConnectProviderEffectsParams["account"];

interface WalletStateSyncParams {
  readonly account: AccountSnapshot;
  readonly addFlowOriginAddressRef: MutableRefObject<string | null>;
  readonly agentLoginImpersonatedAddress: string | undefined;
  readonly impersonatedAddress: string | undefined;
  readonly isAddingConnectedAccount: boolean;
  readonly setConnected: (address: string) => void;
  readonly setConnecting: () => void;
  readonly setDisconnected: () => void;
  readonly storedConnectedAccounts: readonly ConnectedWalletAccount[];
  readonly walletState: WalletState;
}

function getChecksummedAddress(
  address: string | null | undefined
): string | null {
  if (!address || !isAddress(address)) {
    return null;
  }
  return getAddress(address);
}

function setConnectedIfNeeded(
  address: string,
  {
    setConnected,
    walletState,
  }: Pick<WalletStateSyncParams, "setConnected" | "walletState">
): void {
  if (walletState.status === "connected" && walletState.address === address) {
    return;
  }
  setConnected(address);
}

function setConnectingIfNeeded({
  setConnecting,
  walletState,
}: Pick<WalletStateSyncParams, "setConnecting" | "walletState">): void {
  if (walletState.status !== "connecting") {
    setConnecting();
  }
}

function setDisconnectedIfNeeded({
  setDisconnected,
  walletState,
}: Pick<WalletStateSyncParams, "setDisconnected" | "walletState">): void {
  if (walletState.status !== "disconnected") {
    setDisconnected();
  }
}

function isStoredConnectedAccount(
  storedConnectedAccounts: readonly ConnectedWalletAccount[],
  address: string
): boolean {
  return storedConnectedAccounts.some(
    (storedAccount) =>
      normalizeAddress(storedAccount.address) === normalizeAddress(address)
  );
}

function handleAgentLoginConnection(params: WalletStateSyncParams): boolean {
  const connectedAddress = getChecksummedAddress(params.account.address);
  if (
    !params.agentLoginImpersonatedAddress ||
    !connectedAddress ||
    !params.account.isConnected
  ) {
    return false;
  }

  clearAgentLoginActiveAddress();
  setConnectedIfNeeded(connectedAddress, params);
  return true;
}

function handleImpersonatedConnection(params: WalletStateSyncParams): boolean {
  if (!params.impersonatedAddress) {
    return false;
  }

  setConnectedIfNeeded(params.impersonatedAddress, params);
  return true;
}

function handleAddingLiveConnection(params: WalletStateSyncParams): boolean {
  const connectedAddress = getChecksummedAddress(params.account.address);
  if (
    !params.isAddingConnectedAccount ||
    !connectedAddress ||
    !params.account.isConnected
  ) {
    return false;
  }

  clearAgentLoginActiveAddress();
  setConnectedIfNeeded(connectedAddress, params);
  return true;
}

function selectStoredSwitchAddress(
  params: WalletStateSyncParams,
  connectedAddress: string,
  activeStoredAddress: string | null | undefined
): string | null {
  if (
    !activeStoredAddress ||
    !isStoredConnectedAccount(params.storedConnectedAccounts, connectedAddress)
  ) {
    return null;
  }

  const storedActiveAddress = getChecksummedAddress(activeStoredAddress);
  if (
    !storedActiveAddress ||
    !isStoredConnectedAccount(
      params.storedConnectedAccounts,
      storedActiveAddress
    )
  ) {
    return null;
  }

  if (
    normalizeAddress(connectedAddress) === normalizeAddress(storedActiveAddress)
  ) {
    return null;
  }
  return storedActiveAddress;
}

function handleLiveConnectedAccount(
  params: WalletStateSyncParams,
  activeStoredAddress: string | null | undefined
): boolean {
  const connectedAddress = getChecksummedAddress(params.account.address);
  if (!connectedAddress || !params.account.isConnected) {
    return false;
  }

  clearAgentLoginActiveAddress();
  const storedSwitchAddress = selectStoredSwitchAddress(
    params,
    connectedAddress,
    activeStoredAddress
  );
  if (storedSwitchAddress) {
    setConnectedIfNeeded(storedSwitchAddress, params);
    return true;
  }

  if (
    !isStoredConnectedAccount(params.storedConnectedAccounts, connectedAddress)
  ) {
    setConnectedIfNeeded(connectedAddress, params);
    return true;
  }
  return false;
}

function handleAddingPendingCandidate(params: WalletStateSyncParams): boolean {
  if (!params.isAddingConnectedAccount) {
    return false;
  }

  const candidateAddress = getChecksummedAddress(params.account.address);
  const addFlowOriginAddress = params.addFlowOriginAddressRef.current;
  const isCandidateDifferentFromOrigin =
    !addFlowOriginAddress ||
    (!!candidateAddress &&
      normalizeAddress(candidateAddress) !==
        normalizeAddress(addFlowOriginAddress));
  if (
    !candidateAddress ||
    !isCandidateDifferentFromOrigin ||
    params.account.isConnected
  ) {
    return false;
  }

  setConnectingIfNeeded(params);
  return true;
}

function handleActiveStoredAddress(
  params: WalletStateSyncParams,
  activeStoredAddress: string | null | undefined
): boolean {
  const storedAddress = getChecksummedAddress(activeStoredAddress);
  if (!storedAddress) {
    return false;
  }

  setConnectedIfNeeded(storedAddress, params);
  return true;
}

function logInvalidProviderAddress(address: string): void {
  logSecurityEvent(
    SecurityEventType.INVALID_ADDRESS_DETECTED,
    createValidationEventContext(
      "wallet_provider",
      false,
      address.length,
      address.startsWith("0x") ? "hex_prefixed" : "other"
    )
  );
}

function handleProviderAccountFallback(params: WalletStateSyncParams): void {
  if (params.account.address && params.account.isConnected) {
    const checksummedAddress = getChecksummedAddress(params.account.address);
    if (!checksummedAddress) {
      logInvalidProviderAddress(params.account.address);
      params.setDisconnected();
      return;
    }

    clearAgentLoginActiveAddress();
    setConnectedIfNeeded(checksummedAddress, params);
    return;
  }

  if (params.account.isConnected === false) {
    setDisconnectedIfNeeded(params);
    return;
  }

  if (params.account.status === "connecting") {
    setConnectingIfNeeded(params);
    return;
  }

  setDisconnectedIfNeeded(params);
}

function syncWalletConnectionState(params: WalletStateSyncParams): void {
  if (
    handleAgentLoginConnection(params) ||
    handleImpersonatedConnection(params) ||
    handleAddingLiveConnection(params)
  ) {
    return;
  }

  const activeStoredAddress = getWalletAddress();
  if (
    handleLiveConnectedAccount(params, activeStoredAddress) ||
    handleAddingPendingCandidate(params) ||
    handleActiveStoredAddress(params, activeStoredAddress)
  ) {
    return;
  }

  handleProviderAccountFallback(params);
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
      syncWalletConnectionState({
        account: {
          address: account.address,
          isConnected: account.isConnected,
          status: account.status,
        },
        addFlowOriginAddressRef,
        agentLoginImpersonatedAddress,
        impersonatedAddress,
        isAddingConnectedAccount,
        setConnected,
        setConnecting,
        setDisconnected,
        storedConnectedAccounts,
        walletState,
      });
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
