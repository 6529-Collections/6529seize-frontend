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
import { getNodeEnv, publicEnv } from "@/config/env";
import { MAX_CONNECTED_PROFILES } from "@/constants/constants";
import {
  canStoreAnotherWalletAccount,
  type ConnectedWalletAccount,
  getConnectedWalletAccounts,
  getWalletAddress,
  removeAuthJwt,
  setActiveWalletAccount,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { WalletInitializationError } from "@/src/errors/wallet";
import { SecurityEventType } from "@/src/types/security";
import {
  createConnectionEventContext,
  createValidationEventContext,
  logError,
  logSecurityEvent,
} from "@/src/utils/security-logger";
import { isSafeWalletInfo } from "@/utils/wallet-detection";
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

  /** Opens the wallet connection modal */
  seizeConnect: () => void;

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

  /** Whether the user is authenticated with a wallet address */
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
    readonly isActive: boolean;
    readonly isConnected: boolean;
  }[];

  /** Switches the active authenticated account */
  seizeSwitchConnectedAccount: (address: string) => void;

  /** Opens wallet flow to add another authorized account */
  seizeAddConnectedAccount: () => void;

  /** Whether another account can be added */
  canAddConnectedAccount: boolean;
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

const isCapacitorPlatform = (): boolean => {
  return !!globalThis.window?.Capacitor?.isNativePlatform?.();
};

const normalizeAddress = (address: string): string => address.toLowerCase();
const ADD_FLOW_CANCEL_GRACE_MS = 5000;

const validateStoredAddress = (
  storedAddress: string
): AddressValidationResult => {
  // Capacitor-specific validation (more lenient)
  if (isCapacitorPlatform()) {
    if (storedAddress.startsWith("0x") && storedAddress.length === 42) {
      return {
        isValid: true,
        normalizedAddress: storedAddress.toLowerCase(),
      };
    }
  }

  // Standard validation using viem
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

// Unified Wallet State Machine - eliminates multiple state variables and inconsistencies
type WalletState =
  | { status: "initializing" }
  | { status: "error"; error: Error }
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string };

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
    try {
      removeAuthJwt();
    } catch (cleanupError) {
      logError(
        "auth_cleanup_during_init",
        new Error(`Failed to clear invalid auth state: ${cleanupError}`)
      );
    }

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
  const { walletInfo } = useWalletInfo();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const state = useAppKitState();
  const [storedConnectedAccounts, setStoredConnectedAccounts] = useState<
    ConnectedWalletAccount[]
  >(() => getConnectedWalletAccounts());
  const [isAddingConnectedAccount, setIsAddingConnectedAccount] =
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
  const impersonatedAddress =
    isDevLikeEnv &&
    isLocalHost &&
    publicEnv.USE_DEV_AUTH === "true" &&
    publicEnv.DEV_MODE_WALLET_ADDRESS &&
    isAddress(publicEnv.DEV_MODE_WALLET_ADDRESS)
      ? getAddress(publicEnv.DEV_MODE_WALLET_ADDRESS)
      : undefined;

  const refreshStoredConnectedAccounts = useCallback(() => {
    setStoredConnectedAccounts(getConnectedWalletAccounts());
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (retryConnectTimeoutRef.current) {
        clearTimeout(retryConnectTimeoutRef.current);
        retryConnectTimeoutRef.current = null;
      }
    };
  }, []);

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
        const isAlreadyConnected =
          walletState.status === "connected" &&
          walletState.address === checksummedConnectedAddress;
        if (!isAlreadyConnected) {
          setConnected(checksummedConnectedAddress);
        }
        return;
      }

      if (
        account.address &&
        account.isConnected &&
        isAddress(account.address)
      ) {
        const checksummedConnectedAddress = getAddress(account.address);
        const isKnownStoredAccount = storedConnectedAccounts.some(
          (storedAccount) =>
            normalizeAddress(storedAccount.address) ===
            normalizeAddress(checksummedConnectedAddress)
        );

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

      const activeStoredAddress = getWalletAddress();

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
    impersonatedAddress,
    isAddingConnectedAccount,
  ]);

  useEffect(() => {
    if (!isAddingConnectedAccount) {
      addFlowOriginAddressRef.current = null;
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

  const seizeConnect = useCallback((): void => {
    try {
      // Log connection attempt for security monitoring
      logSecurityEvent(
        SecurityEventType.WALLET_CONNECTION_ATTEMPT,
        createConnectionEventContext("seizeConnect")
      );

      open({ view: "Connect" });

      // Log successful modal opening
      logSecurityEvent(
        SecurityEventType.WALLET_MODAL_OPENED,
        createConnectionEventContext("seizeConnect")
      );
    } catch (error) {
      const connectionError = new WalletConnectionError(
        "Failed to open wallet connection modal",
        error
      );
      logError("seizeConnect", connectionError);
      throw connectionError;
    }
  }, [open]);

  const seizeDisconnect = useCallback(async (): Promise<void> => {
    if (!isActiveWalletConnected) {
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
  }, [disconnect, isActiveWalletConnected]);

  const seizeDisconnectAndLogout = useCallback(async (): Promise<void> => {
    if (isActiveWalletConnected) {
      // CRITICAL: Current-profile wallet disconnect MUST succeed before auth cleanup
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
    }

    try {
      removeAuthJwt();
      refreshStoredConnectedAccounts();

      const nextActiveAddress = getWalletAddress();
      if (nextActiveAddress && isAddress(nextActiveAddress)) {
        setConnected(getAddress(nextActiveAddress));
      } else {
        setDisconnected();
      }
    } catch (error: unknown) {
      const authError = new AuthenticationError(
        "Failed to clear authentication state after successful wallet disconnect",
        error
      );
      logError("seizeDisconnectAndLogout", authError);
      throw authError;
    }
  }, [
    disconnect,
    isActiveWalletConnected,
    refreshStoredConnectedAccounts,
    setConnected,
    setDisconnected,
  ]);

  const seizeDisconnectAndLogoutAll = useCallback(async (): Promise<void> => {
    if (isActiveWalletConnected) {
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
    }

    try {
      let remainingProfiles = getConnectedWalletAccounts().length;
      while (remainingProfiles > 0) {
        removeAuthJwt();
        const nextRemainingProfiles = getConnectedWalletAccounts().length;
        if (nextRemainingProfiles >= remainingProfiles) {
          throw new Error("Failed to clear all authenticated profiles.");
        }
        remainingProfiles = nextRemainingProfiles;
      }

      refreshStoredConnectedAccounts();
      setDisconnected();
    } catch (error: unknown) {
      const authError = new AuthenticationError(
        "Failed to clear all authenticated profiles after successful wallet disconnect",
        error
      );
      logError("seizeDisconnectAndLogoutAll", authError);
      throw authError;
    }
  }, [
    disconnect,
    isActiveWalletConnected,
    refreshStoredConnectedAccounts,
    setDisconnected,
  ]);

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
      const didSwitch = setActiveWalletAccount(checksummedAddress);
      if (!didSwitch) {
        throw new AuthenticationError(
          "Cannot switch account: requested account is not available."
        );
      }

      refreshStoredConnectedAccounts();
      setConnected(checksummedAddress);
    },
    [refreshStoredConnectedAccounts, setConnected]
  );

  const seizeAddConnectedAccount = useCallback((): void => {
    if (!canStoreAnotherWalletAccount()) {
      return;
    }

    const liveConnectedWallet =
      account.address && account.isConnected && isAddress(account.address)
        ? getAddress(account.address)
        : null;

    addFlowOriginAddressRef.current = liveConnectedWallet;
    setIsAddingConnectedAccount(true);

    if (liveConnectedWallet) {
      if (retryConnectTimeoutRef.current) {
        clearTimeout(retryConnectTimeoutRef.current);
        retryConnectTimeoutRef.current = null;
      }

      disconnect()
        .then(() => {
          retryConnectTimeoutRef.current = setTimeout(() => {
            retryConnectTimeoutRef.current = null;
            if (!isMountedRef.current) {
              return;
            }
            seizeConnect();
          }, 100);
        })
        .catch((error: unknown) => {
          addFlowOriginAddressRef.current = null;
          setIsAddingConnectedAccount(false);
          const walletError = createWalletError(
            WalletDisconnectionError,
            "disconnect wallet before adding account",
            error
          );
          logError("seizeAddConnectedAccount", walletError);
        });
      return;
    }

    seizeConnect();
  }, [
    account.address,
    account.isConnected,
    disconnect,
    seizeConnect,
    storedConnectedAccounts.length,
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
        isActive,
        isConnected: isConnectedForAccount,
      };
    });
  }, [activeAddress, liveConnectedAddress, storedConnectedAccounts]);
  const canAddConnectedAccount = useMemo(() => {
    return storedConnectedAccounts.length < MAX_CONNECTED_PROFILES;
  }, [storedConnectedAccounts.length]);

  const contextValue = useMemo(
    (): SeizeConnectContextType => ({
      address: activeAddress,
      walletName: isActiveWalletConnected ? walletInfo?.name : undefined,
      walletIcon: isActiveWalletConnected ? walletInfo?.icon : undefined,
      isSafeWallet: isSafeWalletInfo(walletInfo),
      seizeConnect,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeDisconnectAndLogoutAll,
      seizeAcceptConnection,
      seizeSwitchConnectedAccount,
      seizeAddConnectedAccount,
      seizeConnectOpen: state.open,
      isConnected: isActiveWalletConnected,
      isAuthenticated: !!activeAddress,
      connectionState: walletState.status, // Unified state machine
      walletState, // Expose unified state for advanced consumers
      hasInitializationError,
      initializationError,
      connectedAccounts,
      canAddConnectedAccount,
    }),
    [
      activeAddress,
      isActiveWalletConnected,
      connectedAccounts,
      connectedAddress,
      impersonatedAddress,
      walletInfo?.name,
      walletInfo?.icon,
      walletInfo?.type,
      seizeConnect,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeDisconnectAndLogoutAll,
      seizeAcceptConnection,
      seizeSwitchConnectedAccount,
      seizeAddConnectedAccount,
      state.open,
      account.isConnected,
      walletState,
      hasInitializationError,
      initializationError,
      canAddConnectedAccount,
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
