"use client";

import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import { useAccount } from "wagmi";
import { getNodeEnv, publicEnv } from "@/config/env";
import { MAX_CONNECTED_PROFILES } from "@/constants/constants";
import {
  canStoreAnotherWalletAccount,
  clearAgentLoginActiveAddress,
  type ConnectedWalletAccount,
  getAgentLoginActiveAddress,
  getConnectedWalletAccounts,
  getWalletAddress,
  isAuthAddressAuthorized,
  removeAuthJwt,
  setActiveWalletAccount,
} from "@/services/auth/auth.utils";
import { logoutSessionV2 } from "@/services/auth/session-v2.utils";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";
import { SecurityEventType } from "@/types/security";
import {
  createConnectionEventContext,
  createValidationEventContext,
  logError,
  logSecurityEvent,
} from "@/utils/security-logger";
import { isSafeWalletInfo } from "@/utils/wallet-detection";
import { APP_WALLET_CONNECTOR_TYPE } from "@/wagmiConfig/wagmiAppWalletConnector";
import { WalletErrorBoundary } from "./error-boundary";
import { SeizeConnectContext } from "./seizeConnectContextValue";
import {
  AuthenticationError,
  clearAllAuthenticatedProfiles,
  createWalletError,
  WalletConnectionError,
  WalletDisconnectionError,
} from "./seizeConnectErrors";
import { useSeizeConnectProviderEffects } from "./seizeConnectEffects";
import type { SeizeConnectContextType } from "./seizeConnectTypes";
import {
  CONNECT_AFTER_DISCONNECT_DELAY_MS,
  CONNECT_INTENT_HANDOFF_GRACE_MS,
  normalizeAddress,
  useConsolidatedWalletState,
} from "./seizeConnectWalletState";

export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useAppKitAccount();
  const wagmiAccount = useAccount();
  const { walletInfo } = useWalletInfo();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const state = useAppKitState();
  const { isReady: isAppKitReady, waitForReady: waitForAppKitReady } =
    useAppKitBootstrap();
  const [storedConnectedAccounts, setStoredConnectedAccounts] = useState<
    ConnectedWalletAccount[]
  >(() => getConnectedWalletAccounts());
  const [isAddingConnectedAccount, setIsAddingConnectedAccount] =
    useState(false);
  const [isConnectIntentWaitingForAppKit, setIsConnectIntentWaitingForAppKit] =
    useState(false);

  // Use consolidated wallet state management
  const {
    walletState,
    connectedAddress,
    setConnecting,
    setConnected,
    setDisconnected,
    hasInitializationError,
    initializationError,
    isInitialized,
  } = useConsolidatedWalletState();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addFlowOriginAddressRef = useRef<string | null>(null);
  const retryConnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectIntentHandoffTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAddingConnectedAccountRef = useRef(false);
  const isMountedRef = useRef(true);
  const nodeEnv = getNodeEnv();
  const isDevLikeEnv =
    nodeEnv === "development" || nodeEnv === "test" || nodeEnv === "local";
  const isLocalHost =
    globalThis.window !== undefined &&
    (globalThis.window.location.hostname === "localhost" ||
      globalThis.window.location.hostname === "127.0.0.1" ||
      globalThis.window.location.hostname === "::1" ||
      globalThis.window.location.hostname.endsWith(".local"));
  const devAuthImpersonatedAddress =
    isDevLikeEnv &&
    isLocalHost &&
    publicEnv.USE_DEV_AUTH === "true" &&
    publicEnv.DEV_MODE_WALLET_ADDRESS &&
    isAddress(publicEnv.DEV_MODE_WALLET_ADDRESS)
      ? getAddress(publicEnv.DEV_MODE_WALLET_ADDRESS)
      : undefined;
  const canUseAgentLoginImpersonation =
    isDevLikeEnv && isLocalHost && publicEnv.USE_DEV_AUTH !== "true";
  const agentLoginActiveAddress = canUseAgentLoginImpersonation
    ? getAgentLoginActiveAddress()
    : null;
  const agentLoginImpersonatedAddress =
    agentLoginActiveAddress && isAddress(agentLoginActiveAddress)
      ? getAddress(agentLoginActiveAddress)
      : undefined;
  const impersonatedAddress =
    agentLoginImpersonatedAddress ?? devAuthImpersonatedAddress;

  const refreshStoredConnectedAccounts = useCallback(() => {
    setStoredConnectedAccounts(getConnectedWalletAccounts());
  }, []);

  const clearConnectIntentHandoffTimeout = useCallback((): void => {
    if (connectIntentHandoffTimeoutRef.current) {
      clearTimeout(connectIntentHandoffTimeoutRef.current);
      connectIntentHandoffTimeoutRef.current = null;
    }
  }, []);

  const clearConnectIntentWaitingForAppKit = useCallback((): void => {
    clearConnectIntentHandoffTimeout();
    if (isMountedRef.current) {
      setIsConnectIntentWaitingForAppKit(false);
    }
  }, [clearConnectIntentHandoffTimeout]);

  const scheduleConnectIntentHandoffFallback = useCallback((): void => {
    clearConnectIntentHandoffTimeout();
    connectIntentHandoffTimeoutRef.current = setTimeout(() => {
      connectIntentHandoffTimeoutRef.current = null;
      if (isMountedRef.current) {
        setIsConnectIntentWaitingForAppKit(false);
      }
    }, CONNECT_INTENT_HANDOFF_GRACE_MS);
  }, [clearConnectIntentHandoffTimeout]);

  useSeizeConnectProviderEffects({
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
    stateOpen: state.open,
    storedConnectedAccounts,
    walletState,
  });

  const activeAddress = impersonatedAddress ?? connectedAddress;
  const liveConnectedAddress =
    impersonatedAddress ||
    (account.address && account.isConnected && isAddress(account.address)
      ? getAddress(account.address)
      : undefined);
  const isActiveWalletConnected = !!(
    activeAddress &&
    liveConnectedAddress &&
    normalizeAddress(activeAddress) === normalizeAddress(liveConnectedAddress)
  );
  const activeConnectorType = wagmiAccount.connector?.type;
  const isActiveAppWalletConnector =
    activeConnectorType === APP_WALLET_CONNECTOR_TYPE;

  const openConnectModal = useCallback(
    async (source: string): Promise<void> => {
      try {
        clearConnectIntentHandoffTimeout();
        setIsConnectIntentWaitingForAppKit(true);
        if (!isAppKitReady) {
          await waitForAppKitReady();
        }

        if (!isMountedRef.current) {
          return;
        }

        await open({ view: "Connect" });

        logSecurityEvent(
          SecurityEventType.WALLET_MODAL_OPENED,
          createConnectionEventContext(source)
        );
        scheduleConnectIntentHandoffFallback();
      } catch (error) {
        clearConnectIntentWaitingForAppKit();
        const connectionError = new WalletConnectionError(
          "Failed to open wallet connection modal",
          error
        );
        logError(source, connectionError);
        throw connectionError;
      }
    },
    [
      clearConnectIntentHandoffTimeout,
      clearConnectIntentWaitingForAppKit,
      isAppKitReady,
      open,
      scheduleConnectIntentHandoffFallback,
      waitForAppKitReady,
    ]
  );

  const seizeConnectOrThrow = useCallback(
    async (source: string): Promise<void> => {
      // Log connection attempt for security monitoring
      logSecurityEvent(
        SecurityEventType.WALLET_CONNECTION_ATTEMPT,
        createConnectionEventContext(source)
      );

      await openConnectModal(source);
    },
    [openConnectModal]
  );

  const seizeConnect = useCallback((): void => {
    seizeConnectOrThrow("seizeConnect").then(undefined, () => undefined);
  }, [seizeConnectOrThrow]);

  const handleAddConnectedAccountConnectFailure = useCallback(
    (clearAddConnectedAccountGuard: () => void, error: unknown): void => {
      clearAddConnectedAccountGuard();
      setIsAddingConnectedAccount(false);
      const connectionError = createWalletError(
        WalletConnectionError,
        "start add-account connection flow",
        error
      );
      logError("seizeAddConnectedAccount", connectionError);
    },
    []
  );

  const seizeConnectFresh = useCallback(async (): Promise<void> => {
    const liveConnectedWallet =
      account.address && account.isConnected && isAddress(account.address)
        ? getAddress(account.address)
        : null;

    if (!liveConnectedWallet || isActiveAppWalletConnector) {
      await seizeConnectOrThrow("seizeConnectFresh");
      return;
    }

    try {
      await disconnect();
    } catch (error: unknown) {
      const walletError = createWalletError(
        WalletDisconnectionError,
        "disconnect wallet before opening connection modal",
        error
      );
      logError("seizeConnectFresh", walletError);
      throw walletError;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, CONNECT_AFTER_DISCONNECT_DELAY_MS);
    });

    if (!isMountedRef.current) {
      return;
    }

    await seizeConnectOrThrow("seizeConnectFresh");
  }, [
    account.address,
    account.isConnected,
    disconnect,
    isActiveAppWalletConnector,
    seizeConnectOrThrow,
  ]);

  const seizeDisconnect = useCallback(async (): Promise<void> => {
    const hasLiveProviderConnection = !!(
      account.address &&
      account.isConnected &&
      isAddress(account.address)
    );

    if (!hasLiveProviderConnection && !isActiveWalletConnected) {
      return;
    }

    try {
      await disconnect();
    } catch (error: unknown) {
      const walletError = createWalletError(
        WalletDisconnectionError,
        "disconnect wallet",
        error
      );
      logError("seizeDisconnect", walletError);
      throw walletError;
    }
  }, [
    account.address,
    account.isConnected,
    disconnect,
    isActiveWalletConnected,
  ]);

  const seizeDisconnectAndLogout = useCallback(async (): Promise<void> => {
    // CRITICAL: Wallet disconnect MUST succeed before auth cleanup
    try {
      await disconnect();
    } catch (error: unknown) {
      const walletError = createWalletError(
        WalletDisconnectionError,
        "disconnect wallet during logout",
        error
      );
      logError("seizeDisconnectAndLogout", walletError);

      // SECURITY: Throw AuthenticationError to prevent auth bypass
      throw new AuthenticationError(
        "Cannot complete logout: wallet disconnection failed. User may still have active wallet connection.",
        walletError
      );
    }

    try {
      try {
        await logoutSessionV2({ address: getWalletAddress() });
      } catch (error: unknown) {
        const revokeError =
          error instanceof Error
            ? error
            : new Error("Failed to revoke session during logout");
        logError("seizeDisconnectAndLogout.logoutSessionV2", revokeError);
      }
      await removeAuthJwt();
      refreshStoredConnectedAccounts();

      const nextActiveAddress = getWalletAddress();
      if (nextActiveAddress && isAddress(nextActiveAddress)) {
        setConnected(getAddress(nextActiveAddress));
      } else {
        setDisconnected();
      }
    } catch (error: unknown) {
      const authError = new AuthenticationError(
        "Failed to revoke authentication state after successful wallet disconnect",
        error
      );
      logError("seizeDisconnectAndLogout", authError);
      throw authError;
    }
  }, [
    disconnect,
    refreshStoredConnectedAccounts,
    setConnected,
    setDisconnected,
  ]);

  const seizeDisconnectAndLogoutAll = useCallback(async (): Promise<void> => {
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
  }, [disconnect, refreshStoredConnectedAccounts, setDisconnected]);

  const seizeAcceptConnection = useCallback(
    (address: string): void => {
      // Extract diagnostic data before validation check
      const addressLength = address.length;
      const addressFormat = address.startsWith("0x") ? "hex_prefixed" : "other";

      if (!isAddress(address)) {
        // Log security event with NO address data
        logSecurityEvent(
          SecurityEventType.INVALID_ADDRESS_DETECTED,
          createValidationEventContext(
            "seizeAcceptConnection",
            false,
            addressLength,
            addressFormat
          )
        );

        const error = new AuthenticationError(
          "Invalid Ethereum address format. Address must be a valid EIP-55 checksummed format."
        );
        logError("seizeAcceptConnection", error);
        throw error;
      }

      // Log successful address validation with NO address data
      logSecurityEvent(
        SecurityEventType.ADDRESS_VALIDATION_SUCCESS,
        createValidationEventContext("seizeAcceptConnection", true)
      );

      // Normalize address to checksummed format for consistency
      const checksummedAddress = getAddress(address);
      clearAgentLoginActiveAddress();
      setConnected(checksummedAddress);
      refreshStoredConnectedAccounts();
    },
    [refreshStoredConnectedAccounts, setConnected]
  );

  const seizeSwitchConnectedAccount = useCallback(
    (address: string): void => {
      if (!isAddress(address)) {
        throw new AuthenticationError(
          "Cannot switch account: invalid Ethereum address format."
        );
      }

      const checksummedAddress = getAddress(address);
      if (
        activeAddress &&
        normalizeAddress(activeAddress) === normalizeAddress(checksummedAddress)
      ) {
        return;
      }

      const didSwitch = setActiveWalletAccount(checksummedAddress);
      if (!didSwitch) {
        throw new AuthenticationError(
          "Cannot switch account: requested account is not available."
        );
      }

      refreshStoredConnectedAccounts();
      setConnected(checksummedAddress);
    },
    [activeAddress, refreshStoredConnectedAccounts, setConnected]
  );

  const canAddConnectedAccount = useMemo(() => {
    return storedConnectedAccounts.length < MAX_CONNECTED_PROFILES;
  }, [storedConnectedAccounts]);

  const openAddConnectedAccountModal = useCallback(
    (clearAddConnectedAccountGuard: () => void): void => {
      seizeConnectOrThrow("seizeAddConnectedAccount").catch(
        (error: unknown) => {
          handleAddConnectedAccountConnectFailure(
            clearAddConnectedAccountGuard,
            error
          );
        }
      );
    },
    [handleAddConnectedAccountConnectFailure, seizeConnectOrThrow]
  );

  const seizeAddConnectedAccount = useCallback((): void => {
    const clearAddConnectedAccountGuard = (): void => {
      isAddingConnectedAccountRef.current = false;
      addFlowOriginAddressRef.current = null;
      if (retryConnectTimeoutRef.current) {
        clearTimeout(retryConnectTimeoutRef.current);
        retryConnectTimeoutRef.current = null;
      }
    };

    if (!canAddConnectedAccount || !canStoreAnotherWalletAccount()) {
      return;
    }

    const liveConnectedWallet =
      account.address && account.isConnected && isAddress(account.address)
        ? getAddress(account.address)
        : null;
    const addFlowOriginAddress = addFlowOriginAddressRef.current;
    const addFlowReturnedToOrigin =
      !state.open &&
      !isConnectIntentWaitingForAppKit &&
      !!liveConnectedWallet &&
      !!addFlowOriginAddress &&
      normalizeAddress(liveConnectedWallet) ===
        normalizeAddress(addFlowOriginAddress);
    const hasStaleAddConnectedAccountGuard =
      isAddingConnectedAccountRef.current &&
      (!isAddingConnectedAccount ||
        addFlowReturnedToOrigin ||
        (!state.open &&
          !isConnectIntentWaitingForAppKit &&
          !retryConnectTimeoutRef.current &&
          !liveConnectedWallet &&
          account.status !== "connecting" &&
          account.status !== "reconnecting"));

    if (hasStaleAddConnectedAccountGuard) {
      clearAddConnectedAccountGuard();
      setIsAddingConnectedAccount(false);
    }

    if (isAddingConnectedAccountRef.current) {
      return;
    }

    if (!liveConnectedWallet || isActiveAppWalletConnector) {
      isAddingConnectedAccountRef.current = true;
      addFlowOriginAddressRef.current = liveConnectedWallet;
      setIsAddingConnectedAccount(true);

      openAddConnectedAccountModal(clearAddConnectedAccountGuard);
      return;
    }

    isAddingConnectedAccountRef.current = true;
    addFlowOriginAddressRef.current = liveConnectedWallet;
    setIsAddingConnectedAccount(true);

    if (retryConnectTimeoutRef.current) {
      clearTimeout(retryConnectTimeoutRef.current);
      retryConnectTimeoutRef.current = null;
    }

    try {
      disconnect()
        .then(() => {
          retryConnectTimeoutRef.current = setTimeout(() => {
            retryConnectTimeoutRef.current = null;
            if (!isMountedRef.current) {
              clearAddConnectedAccountGuard();
              return;
            }
            openAddConnectedAccountModal(clearAddConnectedAccountGuard);
          }, CONNECT_AFTER_DISCONNECT_DELAY_MS);
        })
        .catch((error: unknown) => {
          clearAddConnectedAccountGuard();
          setIsAddingConnectedAccount(false);
          const walletError = createWalletError(
            WalletDisconnectionError,
            "disconnect wallet before adding account",
            error
          );
          logError("seizeAddConnectedAccount", walletError);
        });
    } catch (error: unknown) {
      clearAddConnectedAccountGuard();
      setIsAddingConnectedAccount(false);
      const walletError = createWalletError(
        WalletDisconnectionError,
        "disconnect wallet before adding account",
        error
      );
      logError("seizeAddConnectedAccount", walletError);
    }
  }, [
    account.address,
    account.isConnected,
    account.status,
    canAddConnectedAccount,
    disconnect,
    isActiveAppWalletConnector,
    isAddingConnectedAccount,
    isConnectIntentWaitingForAppKit,
    openAddConnectedAccountModal,
    state.open,
  ]);

  const connectedAccounts = useMemo(() => {
    return storedConnectedAccounts.map((storedAccount) => {
      const isActive =
        !!activeAddress &&
        normalizeAddress(storedAccount.address) ===
          normalizeAddress(activeAddress);
      const isConnectedForAccount = !!(
        liveConnectedAddress &&
        normalizeAddress(storedAccount.address) ===
          normalizeAddress(liveConnectedAddress)
      );

      return {
        address: storedAccount.address,
        role: storedAccount.role,
        profileId: storedAccount.profileId,
        profileHandle: storedAccount.profileHandle,
        isActive,
        isConnected: isConnectedForAccount,
      };
    });
  }, [activeAddress, liveConnectedAddress, storedConnectedAccounts]);

  const activeStoredAccount = useMemo(() => {
    if (!activeAddress) {
      return null;
    }

    return (
      storedConnectedAccounts.find(
        (storedAccount) =>
          normalizeAddress(storedAccount.address) ===
          normalizeAddress(activeAddress)
      ) ?? null
    );
  }, [activeAddress, storedConnectedAccounts]);

  const hasActiveWalletAddress = !!activeAddress;
  const hasValidWalletAuth = useMemo(
    () =>
      isAuthAddressAuthorized({
        address: activeAddress,
        connectedAccounts: storedConnectedAccounts,
      }),
    [activeAddress, storedConnectedAccounts]
  );

  const jwtPollingStoredConnectedAccounts = useMemo(() => {
    if (!activeAddress) {
      return storedConnectedAccounts;
    }

    if (!activeStoredAccount?.profileHandle) {
      return storedConnectedAccounts;
    }

    return storedConnectedAccounts.filter(
      (storedAccount) =>
        normalizeAddress(storedAccount.address) !==
        normalizeAddress(activeAddress)
    );
  }, [
    activeAddress,
    activeStoredAccount?.profileHandle,
    storedConnectedAccounts,
  ]);

  const jwtConnectedAccountUnreadNotifications =
    useConnectedAccountsUnreadNotifications(jwtPollingStoredConnectedAccounts);

  const { notifications: activeUnreadNotifications } = useUnreadNotifications(
    hasValidWalletAuth ? (activeStoredAccount?.profileHandle ?? null) : null,
    { enabled: hasValidWalletAuth }
  );

  const connectedAccountUnreadNotifications = useMemo(() => {
    const unreadNotificationsByAddress = {
      ...jwtConnectedAccountUnreadNotifications,
    };

    if (activeStoredAccount?.profileHandle) {
      const activeAccountAddress = normalizeAddress(
        activeStoredAccount.address
      );
      const activeUnreadCount = activeUnreadNotifications?.unread_count;

      if (typeof activeUnreadCount === "number") {
        unreadNotificationsByAddress[activeAccountAddress] = activeUnreadCount;
      }
    } else if (activeStoredAccount) {
      const activeAccountAddress = normalizeAddress(
        activeStoredAccount.address
      );
      unreadNotificationsByAddress[activeAccountAddress] ??= 0;
    }

    return unreadNotificationsByAddress;
  }, [
    activeStoredAccount,
    activeUnreadNotifications?.unread_count,
    jwtConnectedAccountUnreadNotifications,
  ]);

  const contextValue = useMemo(
    (): SeizeConnectContextType => ({
      address: activeAddress,
      walletName: isActiveWalletConnected ? walletInfo?.name : undefined,
      walletIcon: isActiveWalletConnected ? walletInfo?.icon : undefined,
      isSafeWallet: isActiveWalletConnected
        ? isSafeWalletInfo(walletInfo)
        : false,
      seizeConnect,
      seizeConnectFresh,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeDisconnectAndLogoutAll,
      seizeAcceptConnection,
      seizeSwitchConnectedAccount,
      seizeAddConnectedAccount,
      seizeConnectOpen: state.open || isConnectIntentWaitingForAppKit,
      isConnected: isActiveWalletConnected,
      canSignActiveWallet: isActiveWalletConnected,
      hasActiveWalletAddress,
      hasValidWalletAuth,
      isAuthenticated: hasValidWalletAuth,
      connectionState: walletState.status, // Unified state machine
      walletState, // Expose unified state for advanced consumers
      hasInitializationError,
      initializationError,
      connectedAccounts,
      canAddConnectedAccount,
      connectedAccountUnreadNotifications,
    }),
    [
      activeAddress,
      hasActiveWalletAddress,
      hasValidWalletAuth,
      isActiveWalletConnected,
      connectedAccounts,
      walletInfo?.name,
      walletInfo?.icon,
      walletInfo?.type,
      seizeConnect,
      seizeConnectFresh,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeDisconnectAndLogoutAll,
      seizeAcceptConnection,
      seizeSwitchConnectedAccount,
      seizeAddConnectedAccount,
      isConnectIntentWaitingForAppKit,
      state.open,
      account.isConnected,
      walletState,
      hasInitializationError,
      initializationError,
      canAddConnectedAccount,
      connectedAccountUnreadNotifications,
    ]
  );

  return (
    <WalletErrorBoundary>
      <SeizeConnectContext.Provider value={contextValue}>
        {children}
      </SeizeConnectContext.Provider>
    </WalletErrorBoundary>
  );
};
