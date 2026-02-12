"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getNodeEnv, publicEnv } from "@/config/env";
import { getWalletAddress, removeAuthJwt } from "@/services/auth/auth.utils";
import { WalletInitializationError } from "@/src/errors/wallet";
import { SecurityEventType } from "@/src/types/security";
import {
  createConnectionEventContext,
  createValidationEventContext,
  logError,
  logSecurityEvent,
} from "@/src/utils/security-logger";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import { getAddress, isAddress } from "viem";
import { WalletErrorBoundary } from "./error-boundary";
import { isSafeWalletInfo } from "@/utils/wallet-detection";

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
   * @param reconnect - Whether to automatically reopen connection modal after logout
   * @throws {WalletDisconnectionError} When disconnection fails
   * @throws {AuthenticationError} When auth cleanup fails
   */
  seizeDisconnectAndLogout: (reconnect?: boolean) => Promise<void>;

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

      if (account.address && account.isConnected) {
        // Validate and normalize address to checksummed format
        if (isAddress(account.address)) {
          const checksummedAddress = getAddress(account.address);

          // Only update if not already connected with same address
          const isAlreadyConnected =
            walletState.status === "connected" &&
            walletState.address === checksummedAddress;
          if (!isAlreadyConnected) {
            setConnected(checksummedAddress);
          }
        } else {
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
        }
      } else if (account.isConnected === false) {
        const storedAddress = getWalletAddress();
        if (storedAddress && isAddress(storedAddress)) {
          const checksummedAddress = getAddress(storedAddress);
          const isAlreadyConnected =
            walletState.status === "connected" &&
            walletState.address === checksummedAddress;
          if (!isAlreadyConnected) {
            setConnected(checksummedAddress);
          }
        } else if (walletState.status !== "disconnected") {
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
    walletState,
    setConnected,
    setDisconnected,
    setConnecting,
    impersonatedAddress,
  ]);

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
  }, [disconnect]);

  const seizeDisconnectAndLogout = useCallback(
    async (reconnect?: boolean): Promise<void> => {
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

      // Only proceed with auth cleanup after successful disconnect
      try {
        removeAuthJwt();
        setDisconnected();

        // If reconnect requested, delay after successful logout
        if (reconnect) {
          setTimeout(() => {
            // Call open directly to avoid circular dependency with seizeConnect
            try {
              logSecurityEvent(
                SecurityEventType.WALLET_CONNECTION_ATTEMPT,
                createConnectionEventContext(
                  "seizeDisconnectAndLogout_reconnect"
                )
              );
              open({ view: "Connect" });
            } catch (openError) {
              logError(
                "seizeDisconnectAndLogout_reconnect",
                openError instanceof Error
                  ? openError
                  : new Error(
                      `Failed to reopen wallet connection: ${openError}`
                    )
              );
            }
          }, 100);
        }
      } catch (error: unknown) {
        const authError = new AuthenticationError(
          "Failed to clear authentication state after successful wallet disconnect",
          error
        );
        logError("seizeDisconnectAndLogout", authError);
        throw authError;
      }
    },
    [disconnect, open, setDisconnected] // FIXED: Use unified state transition
  );

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
    },
    [setConnected]
  );

  const contextValue = useMemo(
    (): SeizeConnectContextType => ({
      address: impersonatedAddress ?? connectedAddress,
      walletName: walletInfo?.name,
      walletIcon: walletInfo?.icon,
      isSafeWallet: isSafeWalletInfo(walletInfo),
      seizeConnect,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeAcceptConnection,
      seizeConnectOpen: state.open,
      isConnected: impersonatedAddress ? true : account.isConnected,
      isAuthenticated: !!(impersonatedAddress ?? connectedAddress),
      connectionState: walletState.status, // Unified state machine
      walletState, // Expose unified state for advanced consumers
      hasInitializationError,
      initializationError,
    }),
    [
      connectedAddress,
      impersonatedAddress,
      walletInfo?.name,
      walletInfo?.icon,
      walletInfo?.type,
      seizeConnect,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeAcceptConnection,
      state.open,
      account.isConnected,
      walletState,
      hasInitializationError,
      initializationError,
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
