"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  migrateCookiesToLocalStorage,
  getWalletAddress,
  removeAuthJwt,
} from "../../services/auth/auth.utils";
import { useAppKit, useAppKitAccount, useAppKitState, useDisconnect, useWalletInfo } from "@reown/appkit/react";
import { isAddress, getAddress } from "viem";

// Custom error types for better error handling
export class WalletConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class WalletDisconnectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WalletDisconnectionError';
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AuthenticationError';
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
  connectionState: 'disconnected' | 'connecting' | 'connected';
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
  const message = originalError instanceof Error 
    ? originalError.message 
    : `Unknown error during ${operation}`;
  
  return new ErrorClass(
    `Failed to ${operation}: ${message}`,
    originalError,
    originalError instanceof Error ? originalError.name : undefined
  );
};

// Production-safe error logging with data sanitization
const logError = (context: string, error: Error): void => {
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Base error information that's safe to log in production
  const errorInfo = {
    timestamp,
    context,
    name: error.name,
    message: error.message,
    ...(error instanceof WalletConnectionError && { code: error.code }),
    ...(error instanceof WalletDisconnectionError && { code: error.code })
  };
  
  if (isProduction) {
    // In production: sanitize sensitive data, log essential info
    const sanitizedMessage = error.message
      .replace(/0x[a-fA-F0-9]{40}/g, '0x***REDACTED***') // Hide wallet addresses
      .replace(/\b[A-Za-z0-9]{32,}\b/g, '***TOKEN***'); // Hide potential tokens
    
    console.error(`[SEIZE_CONNECT_ERROR] ${context}:`, {
      ...errorInfo,
      message: sanitizedMessage,
      userAgent: navigator.userAgent
    });
  } else {
    // In development: include full details including stack trace
    console.error(`[SEIZE_CONNECT_ERROR] ${context}:`, {
      ...errorInfo,
      stack: error.stack,
      cause: error.cause,
      userAgent: navigator.userAgent
    });
  }
};

// Security event logging for monitoring suspicious activity
const logSecurityEvent = (eventType: string, details: Record<string, unknown>): void => {
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Enhanced sanitization for production logging
  const sanitizedDetails = isProduction ? {
    ...details,
    // Remove any address fields completely in production for maximum privacy
    address: undefined,
    // Keep diagnostic data that's safe to log
    valid: details.valid,
    walletName: details.walletName,
    source: details.source,
    addressLength: details.addressLength,
    addressFormat: details.addressFormat,
    timestamp: details.timestamp
  } : {
    // In development, show first 6 and last 4 characters for debugging
    ...details,
    address: typeof details.address === 'string' && details.address.length >= 10 ?
      details.address.slice(0, 6) + '...' + details.address.slice(-4) :
      details.address
  };
  
  console.warn(`[SEIZE_SECURITY_EVENT] ${eventType}:`, {
    timestamp,
    eventType,
    ...sanitizedDetails,
    userAgent: navigator.userAgent
  });
};

// Type guard for validating wallet addresses with EIP-55 checksum validation
const isValidAddress = (address: unknown): address is string => {
  if (typeof address !== 'string') {
    return false;
  }
  
  // Use viem's comprehensive address validation
  // This includes EIP-55 checksum validation and format checking
  return isAddress(address);
};

export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const state = useAppKitState();
  const { walletInfo } = useWalletInfo();


  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(() => {
    const storedAddress = getWalletAddress();
    if (storedAddress && isValidAddress(storedAddress)) {
      return getAddress(storedAddress);
    }
    return undefined;
  });
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    migrateCookiesToLocalStorage();
  }, []);

  useEffect(() => {
    // Clear any existing timeout to debounce rapid changes
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Use debounced state update to prevent race conditions
    debounceTimeoutRef.current = setTimeout(() => {
      if (account.address && account.isConnected) {
        // Validate and normalize address to checksummed format
        if (isValidAddress(account.address)) {
          const checksummedAddress = getAddress(account.address);
          setConnectedAddress(checksummedAddress);
          setConnectionState('connected');
        } else {
          // Invalid address from wallet - disconnect
          setConnectedAddress(undefined);
          setConnectionState('disconnected');
        }
      } else if (account.isConnected === false) {
        const storedAddress = getWalletAddress();
        if (storedAddress && isValidAddress(storedAddress)) {
          const checksummedAddress = getAddress(storedAddress);
          setConnectedAddress(checksummedAddress);
        } else {
          setConnectedAddress(undefined);
        }
        setConnectionState('disconnected');
      } else if (account.status === 'connecting') {
        setConnectionState('connecting');
      } else {
        // Default fallback
        setConnectionState('disconnected');
      }
    }, 50); // Small delay to debounce rapid changes

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [account.address, account.isConnected, account.status, connectionState]);

  const seizeConnect = useCallback((): void => {
    try {
      // Log connection attempt for security monitoring
      logSecurityEvent('wallet_connection_attempt', {
        source: 'seizeConnect',
        timestamp: new Date().toISOString()
      });
      
      open({ view: "Connect" });
      
      // Log successful modal opening
      logSecurityEvent('wallet_modal_opened', {
        source: 'seizeConnect',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const connectionError = new WalletConnectionError(
        'Failed to open wallet connection modal',
        error
      );
      logError('seizeConnect', connectionError);
      throw connectionError;
    }
  }, [open]);

  const seizeDisconnect = useCallback(async (): Promise<void> => {
    try {
      await disconnect();
    } catch (error: unknown) {
      const walletError = createWalletError(
        WalletDisconnectionError,
        'disconnect wallet',
        error
      );
      logError('seizeDisconnect', walletError);
      throw walletError;
    }
  }, [disconnect]);

  const seizeDisconnectAndLogout = useCallback(
    async (reconnect?: boolean): Promise<void> => {
      try {
        await disconnect();
      } catch (error: unknown) {
        const walletError = createWalletError(
          WalletDisconnectionError,
          'disconnect wallet during logout',
          error
        );
        logError('seizeDisconnectAndLogout', walletError);
        // Continue with cleanup even if disconnect fails
      }
      
      try {
        removeAuthJwt();
        setConnectedAddress(undefined);
        
        if (reconnect) {
          seizeConnect();
        }
      } catch (error: unknown) {
        const authError = new AuthenticationError(
          'Failed to clear authentication state',
          error
        );
        logError('seizeDisconnectAndLogout', authError);
        throw authError;
      }
    },
    [disconnect, seizeConnect]
  );

  const seizeAcceptConnection = useCallback((address: string): void => {
    // Pre-validate and sanitize address for logging
    const isValidAddr = isValidAddress(address);
    const sanitizedAddress = isValidAddr ? 
      getAddress(address).slice(0, 6) + '...' + getAddress(address).slice(-4) :
      'INVALID_FORMAT';

    // Extract diagnostic data before validation check
    const addressLength = address.length;
    const addressFormat = address.startsWith('0x') ? 'hex_prefixed' : 'other';

    if (!isValidAddr) {
      // Log with sanitized address for security monitoring
      logSecurityEvent('invalid_address_attempt', {
        address: sanitizedAddress, // ✅ SANITIZED ADDRESS
        source: 'seizeAcceptConnection',
        valid: false,
        timestamp: new Date().toISOString(),
        addressLength,
        addressFormat
      });
      
      const error = new AuthenticationError(
        'Invalid Ethereum address format. Address must be a valid EIP-55 checksummed format.'
      );
      logError('seizeAcceptConnection', error);
      throw error;
    }
    
    // Log successful address validation with sanitized data
    logSecurityEvent('address_validation_success', {
      address: sanitizedAddress, // ✅ SANITIZED ADDRESS
      source: 'seizeAcceptConnection',
      valid: true,
      timestamp: new Date().toISOString()
    });
    
    // Normalize address to checksummed format for consistency
    const checksummedAddress = getAddress(address);
    setConnectedAddress(checksummedAddress);
  }, []);

  const contextValue = useMemo((): SeizeConnectContextType => ({
    address: connectedAddress,
    walletName: walletInfo?.name,
    walletIcon: walletInfo?.icon,
    isSafeWallet: walletInfo?.name === "Safe{Wallet}",
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    seizeConnectOpen: state.open,
    isConnected: account.isConnected,
    isAuthenticated: !!connectedAddress,
    connectionState,
  }), [
    connectedAddress,
    walletInfo,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    state.open,
    account.isConnected,
    connectionState,
  ]);

  return (
    <SeizeConnectContext.Provider value={contextValue}>
      {children}
    </SeizeConnectContext.Provider>
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
