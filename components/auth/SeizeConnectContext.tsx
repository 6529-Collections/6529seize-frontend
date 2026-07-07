"use client";

import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { logoutSessionV2 } from "@/services/auth/session-v2.utils";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";
import { WalletInitializationError } from "@/errors/wallet";
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

// Custom error types for better error handling
class WalletConnectionError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "WalletConnectionError";
  }
}

class WalletDisconnectionError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "WalletDisconnectionError";
  }
}

class AuthenticationError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

interface SeizeConnectContextType {
  /** Current connected wallet address, undefined if not connected */
  address: string | undefined;

  /** Name of the connected wallet (e.g. "MetaMask", "Trust Wallet") */
  walletName: string | undefined;

  /** Icon URL of the connected wallet */
  walletIcon: string | undefined;

  /** Whether the connected wallet is a Safe (Gnosis Safe) wallet */
  isSafeWallet: boolean;

  /** Opens the wallet connection modal once AppKit is ready */
  seizeConnect: () => void;

  /**
   * Disconnects any live provider wallet before opening the connection modal.
   * Use this for user-facing "Connect Wallet" actions that should connect a
   * different authenticated profile.
   */
  seizeConnectFresh: () => Promise<void>;

  /**
   * Disconnects the current wallet connection
   * @throws {WalletDisconnectionError} When disconnection fails
   */
  seizeDisconnect: () => Promise<void>;

  /**
   * Disconnects wallet and clears authentication state
   * @throws {WalletDisconnectionError} When disconnection fails
   * @throws {AuthenticationError} When auth cleanup fails
   */
  seizeDisconnectAndLogout: () => Promise<void>;

  /**
   * Disconnects wallet and clears all authenticated profiles
   * @throws {WalletDisconnectionError} When disconnection fails
   * @throws {AuthenticationError} When auth cleanup fails
   */
  seizeDisconnectAndLogoutAll: () => Promise<void>;

  /**
   * Manually set the connected address (for internal use)
   * @param address - The wallet address to set as connected
   */
  seizeAcceptConnection: (address: string) => void;

  /** Whether the connection modal is currently open */
  seizeConnectOpen: boolean;

  /** Whether a wallet is currently connected to the app */
  isConnected: boolean;

  /** Whether the active wallet has a live signer connection */
  canSignActiveWallet: boolean;

  /** Whether there is an active wallet address, regardless of auth validity */
  hasActiveWalletAddress: boolean;

  /** Whether the active wallet address has valid auth state */
  hasValidWalletAuth: boolean;

  /** @deprecated Use hasActiveWalletAddress or hasValidWalletAuth. */
  isAuthenticated: boolean;

  /** Current connection state for better timing control */
  connectionState:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";

  /** Unified wallet state machine for advanced consumers */
  walletState: WalletState;

  /** Whether there was an initialization error */
  hasInitializationError: boolean;

  /** The initialization error if one occurred */
  initializationError: Error | undefined;

  /** All authenticated wallet accounts available for switching */
  connectedAccounts: readonly {
    readonly address: string;
    readonly role: string | null;
    readonly profileId: string | null;
    readonly profileHandle: string | null;
    readonly isActive: boolean;
    readonly isConnected: boolean;
  }[];

  /** Switches the active authenticated account */
  seizeSwitchConnectedAccount: (address: string) => void;

  /** Opens wallet flow to add another authorized account */
  seizeAddConnectedAccount: () => void;

  /** Whether another account can be added */
  canAddConnectedAccount: boolean;

  /** Unread notification counts keyed by connected account address (lowercased) */
  connectedAccountUnreadNotifications: Readonly<Record<string, number>>;
}

const SeizeConnectContext = createContext<SeizeConnectContextType | undefined>(
  undefined
);

// Error handling utilities
const createWalletError = (
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

const clearAllAuthenticatedProfiles = async (): Promise<void> => {
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

// Address validation utilities
interface AddressValidationResult {
  isValid: boolean;
  normalizedAddress?: string | undefined;
  errorContext?:
    | {
        length: number;
        format: "hex_prefixed" | "other";
        debugAddress: string;
      }
    | undefined;
}

const normalizeAddress = (address: string): string => address.toLowerCase();

const ADD_FLOW_CANCEL_GRACE_MS: number = 5000;
const CONNECT_AFTER_DISCONNECT_DELAY_MS: number = 100;
const CONNECT_INTENT_HANDOFF_GRACE_MS: number = 1000;

const validateStoredAddress = (
  storedAddress: string
): AddressValidationResult => {
  if (isAddress(storedAddress)) {
    return {
      isValid: true,
      normalizedAddress: getAddress(storedAddress), // checksummed format
    };
  }

  // Invalid address - prepare error context
  const addressLength = storedAddress.length;
  const addressFormat = storedAddress.startsWith("0x")
    ? "hex_prefixed"
    : "other";
  const debugAddress =
    storedAddress.length >= 10
      ? storedAddress.slice(0, 10) + "..."
      : storedAddress;

  return {
    isValid: false,
    errorContext: {
      length: addressLength,
      format: addressFormat,
      debugAddress,
    },
  };
};

const clearInvalidStoredAuthState = async (): Promise<void> => {
  try {
    await removeAuthJwt();
  } catch (cleanupError) {
    logError(
      "auth_cleanup_during_init",
      new Error(`Failed to clear invalid auth state: ${cleanupError}`)
    );
  }
};

// Unified Wallet State Machine - eliminates multiple state variables and inconsistencies
type WalletState =
  | { status: "initializing" }
  | { status: "error"; error: Error }
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string };

const noopWalletAction = (): void => {};
const noopWalletAsyncAction = (): Promise<void> => Promise.resolve();

const createWalletStartupError = (): WalletInitializationError =>
  new WalletInitializationError("Wallet services are still loading.");

export const SeizeConnectStartupFallbackProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { status, waitForReady } = useAppKitBootstrap();
  const hasInitializationError = status === "error";
  const initializationError = useMemo(
    () => (hasInitializationError ? createWalletStartupError() : undefined),
    [hasInitializationError]
  );
  const walletState = useMemo<WalletState>(
    () =>
      initializationError
        ? { status: "error", error: initializationError }
        : { status: "initializing" },
    [initializationError]
  );
  const waitForWalletReady = useCallback(async (): Promise<void> => {
    if (hasInitializationError) {
      throw createWalletStartupError();
    }

    await waitForReady();
  }, [hasInitializationError, waitForReady]);
  const requestWalletReady = useCallback((): void => {
    void waitForWalletReady().catch(() => undefined);
  }, [waitForWalletReady]);

  const contextValue = useMemo(
    (): SeizeConnectContextType => ({
      address: undefined,
      walletName: undefined,
      walletIcon: undefined,
      isSafeWallet: false,
      seizeConnect: requestWalletReady,
      seizeConnectFresh: waitForWalletReady,
      seizeDisconnect: noopWalletAsyncAction,
      seizeDisconnectAndLogout: noopWalletAsyncAction,
      seizeDisconnectAndLogoutAll: noopWalletAsyncAction,
      seizeAcceptConnection: noopWalletAction,
      seizeConnectOpen: false,
      isConnected: false,
      canSignActiveWallet: false,
      hasActiveWalletAddress: false,
      hasValidWalletAuth: false,
      isAuthenticated: false,
      connectionState: walletState.status,
      walletState,
      hasInitializationError,
      initializationError,
      connectedAccounts: [],
      seizeSwitchConnectedAccount: noopWalletAction,
      seizeAddConnectedAccount: requestWalletReady,
      canAddConnectedAccount: false,
      connectedAccountUnreadNotifications: {},
    }),
    [
      hasInitializationError,
      initializationError,
      requestWalletReady,
      waitForWalletReady,
      walletState,
    ]
  );

  return (
    <SeizeConnectContext.Provider value={contextValue}>
      {children}
    </SeizeConnectContext.Provider>
  );
};

// Initialization error handling utility
const handleInitializationError = (
  error: unknown,
  errorContext?: AddressValidationResult["errorContext"]
): WalletInitializationError => {
  if (errorContext) {
    // Invalid address error
    logSecurityEvent(
      SecurityEventType.INVALID_ADDRESS_DETECTED,
      createValidationEventContext(
        "wallet_initialization",
        false,
        errorContext.length,
        errorContext.format
      )
    );

    // Clear invalid stored address
    void clearInvalidStoredAuthState();

    const initError = new WalletInitializationError(
      "Invalid wallet address found in storage during initialization. This indicates potential data corruption or security breach.",
      undefined,
      errorContext.debugAddress
    );
    logError("wallet_initialization", initError);
    return initError;
  }

  // Unexpected error
  const initError = new WalletInitializationError(
    "Unexpected error during wallet initialization",
    error
  );
  logError("wallet_initialization", initError);
  return initError;
};

// Consolidated wallet state management hook with unified state machine
const useConsolidatedWalletState = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    status: "initializing",
  });

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Step 1: Retrieve stored address
        const storedAddress: string | null = getWalletAddress();

        // Step 2: Handle no stored address (legitimate case)
        if (!storedAddress) {
          setWalletState({ status: "disconnected" });
          return;
        }

        // Step 3: Validate stored address
        const validationResult = validateStoredAddress(storedAddress);

        if (validationResult.isValid && validationResult.normalizedAddress) {
          // Step 4: Success - set connected state with valid address
          setWalletState({
            status: "connected",
            address: validationResult.normalizedAddress,
          });
        } else {
          // Step 4: Error - handle invalid address
          const error = handleInitializationError(
            undefined,
            validationResult.errorContext
          );
          setWalletState({ status: "error", error });
        }
      } catch (error) {
        // Step 4: Error - handle unexpected errors
        const initError = handleInitializationError(error);
        setWalletState({ status: "error", error: initError });
      }
    };

    initializeWallet();
  }, []);

  // State transition methods
  const setConnecting = useCallback(() => {
    setWalletState({ status: "connecting" });
  }, []);

  const setConnected = useCallback((address: string) => {
    setWalletState({ status: "connected", address });
  }, []);

  const setDisconnected = useCallback(() => {
    setWalletState({ status: "disconnected" });
  }, []);

  const setError = useCallback((error: Error) => {
    setWalletState({ status: "error", error });
  }, []);

  // Computed properties for backward compatibility
  const connectedAddress =
    walletState.status === "connected" ? walletState.address : undefined;
  const hasInitializationError = walletState.status === "error";
  const initializationError =
    walletState.status === "error" ? walletState.error : undefined;
  const isInitialized = walletState.status !== "initializing";

  return {
    walletState,
    connectedAddress,
    setConnecting,
    setConnected,
    setDisconnected,
    setError,
    // Backward compatibility properties
    hasInitializationError,
    initializationError,
    isInitialized,
  };
};

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
  }, [clearConnectIntentHandoffTimeout]);

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
    // Wait for initialization to complete before processing account changes
    if (!isInitialized) {
      return;
    }

    // Clear any existing timeout to debounce rapid changes
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Use debounced state update to prevent race conditions
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

        // If wallet is connected to an address that is not in stored profiles yet,
        // prefer the live wallet address so auth can prompt and add it.
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

        // During add-account flow, avoid snapping back to the stored active wallet
        // when we've detected a different candidate address but connection isn't
        // fully established yet.
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
          // Invalid address from wallet - log security event and disconnect
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
    }, 50); // Small delay to debounce rapid changes

    // Cleanup on unmount
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
      !state.open &&
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
      !state.open &&
      !isConnectIntentWaitingForAppKit &&
      account.status !== "connecting" &&
      account.status !== "reconnecting" &&
      !account.isConnected &&
      !hasPendingDifferentCandidate;
    if (addFlowCancelled) {
      // AppKit/connector state can briefly report "closed + not connected"
      // during successful transitions. Use a short grace period before treating
      // this as a real user-cancelled add flow.
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
    isConnectIntentWaitingForAppKit,
    state.open,
  ]);

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

  useEffect(() => {
    if (state.open && isConnectIntentWaitingForAppKit) {
      clearConnectIntentWaitingForAppKit();
    }
  }, [
    clearConnectIntentWaitingForAppKit,
    isConnectIntentWaitingForAppKit,
    state.open,
  ]);

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
      isSafeWallet: isSafeWalletInfo(walletInfo),
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

export const useSeizeConnectContext = (): SeizeConnectContextType => {
  const context = useContext(SeizeConnectContext);
  if (!context) {
    throw new Error(
      "useSeizeConnectContext must be used within a SeizeConnectProvider"
    );
  }
  return context;
};
