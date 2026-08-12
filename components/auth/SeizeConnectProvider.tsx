"use client";

import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAddress, isAddress } from "viem";
import { useAccount } from "wagmi";
import { MAX_CONNECTED_PROFILES } from "@/constants/constants";
import {
  canStoreAnotherWalletAccount,
  clearAgentLoginActiveAddress,
  type ConnectedWalletAccount,
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
import { APP_WALLET_CONNECTOR_TYPE } from "@/wagmiConfig/wagmiAppWalletConnector";
import {
  AppKitModalBridge,
  createAppKitModalBridgeStore,
  useAppKitModalBridgeState,
} from "./AppKitModalBridge";
import { WalletErrorBoundary } from "./error-boundary";
import { SeizeConnectContext } from "./seizeConnectContextValue";
import {
  AuthenticationError,
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
import { getSeizeConnectImpersonation } from "./seizeConnectImpersonation";
import { useSignOutAllTransaction } from "./useSignOutAllTransaction";

export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useAppKitAccount();
  const wagmiAccount = useAccount();
  const { disconnect } = useDisconnect();
  const {
    hasTerminalError: hasTerminalBootstrapError,
    isCreated: isAppKitCreated,
    isReady: isAppKitReady,
    status: appKitBootstrapStatus,
    waitForReady: waitForAppKitReady,
  } = useAppKitBootstrap();
  const appKitModalBridgeStore = useMemo(createAppKitModalBridgeStore, []);
  const appKitModalState = useAppKitModalBridgeState(appKitModalBridgeStore);
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
  const { agentLoginImpersonatedAddress, impersonatedAddress } =
    getSeizeConnectImpersonation();

  const refreshStoredConnectedAccounts = useCallback(() => {
    setStoredConnectedAccounts(getConnectedWalletAccounts());
  }, []);

  const {
    isSigningOutAll,
    isSigningOutAllRef,
    seizeDisconnectAndLogoutAll,
  } = useSignOutAllTransaction({
    disconnect,
    isMountedRef,
    refreshStoredConnectedAccounts,
    setDisconnected,
  });

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

  useEffect(() => {
    if (!isSigningOutAll) {
      return;
    }

    if (retryConnectTimeoutRef.current) {
      clearTimeout(retryConnectTimeoutRef.current);
      retryConnectTimeoutRef.current = null;
    }
    isAddingConnectedAccountRef.current = false;
    addFlowOriginAddressRef.current = null;
    setIsAddingConnectedAccount(false);
    clearConnectIntentWaitingForAppKit();
  }, [clearConnectIntentWaitingForAppKit, isSigningOutAll]);

  useEffect(() => {
    if (appKitBootstrapStatus === "error" && hasTerminalBootstrapError) {
      appKitModalBridgeStore.failBootstrap();
    }
  }, [
    appKitBootstrapStatus,
    appKitModalBridgeStore,
    hasTerminalBootstrapError,
  ]);

  useEffect(
    () => () => {
      appKitModalBridgeStore.dispose();
    },
    [appKitModalBridgeStore]
  );

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
    isSigningOutAll,
    isSigningOutAllRef,
    isMountedRef,
    refreshStoredConnectedAccounts,
    retryConnectTimeoutRef,
    setConnected,
    setConnecting,
    setDisconnected,
    setIsAddingConnectedAccount,
    setIsConnectIntentWaitingForAppKit,
    stateOpen: appKitModalState.isOpen,
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
      if (isSigningOutAllRef.current) {
        return;
      }

      try {
        clearConnectIntentHandoffTimeout();
        setIsConnectIntentWaitingForAppKit(true);
        if (!isAppKitReady) {
          await waitForAppKitReady();
        }

        if (!isMountedRef.current) {
          return;
        }
        if (isSigningOutAllRef.current) {
          clearConnectIntentWaitingForAppKit();
          return;
        }

        const openAppKit = await appKitModalBridgeStore.waitForOpen();

        if (isSigningOutAllRef.current) {
          clearConnectIntentWaitingForAppKit();
          return;
        }

        await openAppKit({ view: "Connect" });

        if (isSigningOutAllRef.current) {
          clearConnectIntentWaitingForAppKit();
          return;
        }

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
      appKitModalBridgeStore,
      isAppKitReady,
      isSigningOutAllRef,
      scheduleConnectIntentHandoffFallback,
      waitForAppKitReady,
    ]
  );

  const seizeConnectOrThrow = useCallback(
    async (source: string): Promise<void> => {
      if (isSigningOutAllRef.current) {
        return;
      }

      // Log connection attempt for security monitoring
      logSecurityEvent(
        SecurityEventType.WALLET_CONNECTION_ATTEMPT,
        createConnectionEventContext(source)
      );

      await openConnectModal(source);
    },
    [isSigningOutAllRef, openConnectModal]
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
    if (isSigningOutAllRef.current) {
      return;
    }

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

    if (!isMountedRef.current || isSigningOutAllRef.current) {
      return;
    }

    await seizeConnectOrThrow("seizeConnectFresh");
  }, [
    account.address,
    account.isConnected,
    disconnect,
    isActiveAppWalletConnector,
    isSigningOutAllRef,
    seizeConnectOrThrow,
  ]);

  const seizeDisconnect = useCallback(async (): Promise<void> => {
    if (isSigningOutAllRef.current) {
      return;
    }

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
    isSigningOutAllRef,
  ]);

  const seizeDisconnectAndLogout = useCallback(async (): Promise<void> => {
    if (isSigningOutAllRef.current) {
      return;
    }

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
    isSigningOutAllRef,
    refreshStoredConnectedAccounts,
    setConnected,
    setDisconnected,
  ]);

  const seizeAcceptConnection = useCallback(
    (address: string): void => {
      if (isSigningOutAllRef.current) {
        return;
      }

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
    [isSigningOutAllRef, refreshStoredConnectedAccounts, setConnected]
  );

  const seizeSwitchConnectedAccount = useCallback(
    (address: string): void => {
      if (isSigningOutAllRef.current) {
        return;
      }

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
    [
      activeAddress,
      isSigningOutAllRef,
      refreshStoredConnectedAccounts,
      setConnected,
    ]
  );

  const canAddConnectedAccount =
    storedConnectedAccounts.length < MAX_CONNECTED_PROFILES;

  const openAddConnectedAccountModal = useCallback(
    (clearAddConnectedAccountGuard: () => void): void => {
      if (isSigningOutAllRef.current) {
        clearAddConnectedAccountGuard();
        return;
      }

      seizeConnectOrThrow("seizeAddConnectedAccount").catch(
        (error: unknown) => {
          handleAddConnectedAccountConnectFailure(
            clearAddConnectedAccountGuard,
            error
          );
        }
      );
    },
    [
      handleAddConnectedAccountConnectFailure,
      isSigningOutAllRef,
      seizeConnectOrThrow,
    ]
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
      !appKitModalState.isOpen &&
      !isConnectIntentWaitingForAppKit &&
      !!liveConnectedWallet &&
      !!addFlowOriginAddress &&
      normalizeAddress(liveConnectedWallet) ===
        normalizeAddress(addFlowOriginAddress);
    const hasStaleAddConnectedAccountGuard =
      isAddingConnectedAccountRef.current &&
      (!isAddingConnectedAccount ||
        addFlowReturnedToOrigin ||
        (!appKitModalState.isOpen &&
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
            if (!isMountedRef.current || isSigningOutAllRef.current) {
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
    isSigningOutAllRef,
    openAddConnectedAccountModal,
    appKitModalState.isOpen,
  ]);

  const connectedAccounts = useMemo(() => {
    if (isSigningOutAll) {
      return [];
    }
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
  }, [
    activeAddress,
    isSigningOutAll,
    liveConnectedAddress,
    storedConnectedAccounts,
  ]);

  const activeStoredAccount = useMemo(() => {
    if (!activeAddress || isSigningOutAll) {
      return null;
    }

    return (
      storedConnectedAccounts.find(
        (storedAccount) =>
          normalizeAddress(storedAccount.address) ===
          normalizeAddress(activeAddress)
      ) ?? null
    );
  }, [activeAddress, isSigningOutAll, storedConnectedAccounts]);

  const hasActiveWalletAddress = !isSigningOutAll && !!activeAddress;
  const hasValidWalletAuth = useMemo(
    () =>
      !isSigningOutAll &&
      isAuthAddressAuthorized({
        address: activeAddress,
        connectedAccounts: storedConnectedAccounts,
      }),
    [activeAddress, isSigningOutAll, storedConnectedAccounts]
  );

  const jwtPollingStoredConnectedAccounts = useMemo(() => {
    if (isSigningOutAll) {
      return [];
    }
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
    isSigningOutAll,
    storedConnectedAccounts,
  ]);

  const jwtConnectedAccountUnreadNotifications =
    useConnectedAccountsUnreadNotifications(jwtPollingStoredConnectedAccounts);

  const { notifications: activeUnreadNotifications } = useUnreadNotifications(
    hasValidWalletAuth ? (activeStoredAccount?.profileHandle ?? null) : null,
    {
      enabled: hasValidWalletAuth,
      profileId: activeStoredAccount?.profileId,
    }
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
      address: isSigningOutAll ? undefined : activeAddress,
      walletName: !isSigningOutAll && isActiveWalletConnected
        ? appKitModalState.walletName
        : undefined,
      walletIcon: !isSigningOutAll && isActiveWalletConnected
        ? appKitModalState.walletIcon
        : undefined,
      isSafeWallet: !isSigningOutAll && isActiveWalletConnected
        ? appKitModalState.isSafeWallet
        : false,
      seizeConnect,
      seizeConnectFresh,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeDisconnectAndLogoutAll,
      seizeAcceptConnection,
      seizeSwitchConnectedAccount,
      seizeAddConnectedAccount,
      seizeConnectOpen:
        appKitModalState.isOpen || isConnectIntentWaitingForAppKit,
      isConnected: !isSigningOutAll && isActiveWalletConnected,
      canSignActiveWallet: !isSigningOutAll && isActiveWalletConnected,
      hasActiveWalletAddress,
      hasValidWalletAuth,
      isSigningOutAll,
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
      isSigningOutAll,
      isActiveWalletConnected,
      connectedAccounts,
      appKitModalState.walletName,
      appKitModalState.walletIcon,
      appKitModalState.isSafeWallet,
      seizeConnect,
      seizeConnectFresh,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeDisconnectAndLogoutAll,
      seizeAcceptConnection,
      seizeSwitchConnectedAccount,
      seizeAddConnectedAccount,
      isConnectIntentWaitingForAppKit,
      appKitModalState.isOpen,
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
        {isAppKitCreated && (
          <AppKitModalBridge store={appKitModalBridgeStore} />
        )}
      </SeizeConnectContext.Provider>
    </WalletErrorBoundary>
  );
};
