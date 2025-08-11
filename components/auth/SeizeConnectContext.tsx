"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  ReactNode,
  Component,
  ErrorInfo,
} from "react";

import {
  migrateCookiesToLocalStorage,
  getWalletAddress,
  removeAuthJwt,
} from "../../services/auth/auth.utils";
import { WalletInitializationError } from "../../src/errors/wallet";
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

// Secure wallet initialization hook that moves initialization logic from useState to useEffect
const useSecureWalletInitialization = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(undefined);
  const [hasInitializationError, setHasInitializationError] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Perform secure initialization in useEffect to prevent application crashes
    const initializeWallet = async () => {
      try {
        const storedAddress: string | null = getWalletAddress();
        
        // If no stored address, return undefined (legitimate case)
        if (!storedAddress) {
          setConnectedAddress(undefined);
          setIsInitialized(true);
          return;
        }
        
        // At this point, storedAddress is definitely a string (not null)
        // Check if stored address is valid
        if (isValidAddress(storedAddress)) {
          // Valid address - return checksummed format
          const checksummedAddress = getAddress(storedAddress);
          setConnectedAddress(checksummedAddress);
          setIsInitialized(true);
          return;
        }
        
        // If stored address exists but is invalid, this is a critical security issue
        // Store the address string before validation for error handling
        // TypeScript type assertion needed due to complex type narrowing with viem isAddress
        const invalidAddressString = storedAddress as string;
        
        // Extract diagnostic data for logging
        const addressLength = invalidAddressString.length;
        const addressFormat = invalidAddressString.startsWith('0x') ? 'hex_prefixed' : 'other';
        const debugAddress = invalidAddressString.length >= 10 ? 
          invalidAddressString.slice(0, 10) + '...' : 
          invalidAddressString;
        
        // Log security event for monitoring
        logSecurityEvent('invalid_stored_address_detected', {
          address: 'INVALID_FORMAT',
          source: 'wallet_initialization',
          valid: false,
          timestamp: new Date().toISOString(),
          addressLength,
          addressFormat
        });
        
        // Clear the invalid stored address immediately
        try {
          removeAuthJwt();
        } catch (cleanupError) {
          // Log cleanup failure but continue with error throwing
          logError('auth_cleanup_during_init', new Error('Failed to clear invalid auth state', { cause: cleanupError }));
        }
        
        // Create initialization error to prevent silent authentication bypass
        const initError = new WalletInitializationError(
          'Invalid wallet address found in storage during initialization. This indicates potential data corruption or security breach.',
          undefined,
          debugAddress
        );
        
        logError('wallet_initialization', initError);
        setHasInitializationError(true);
        setInitializationError(initError);
        setConnectedAddress(undefined);
        setIsInitialized(true);
        
      } catch (error) {
        // Catch any unexpected errors during initialization
        const initError = new WalletInitializationError(
          'Unexpected error during wallet initialization',
          error
        );
        
        logError('wallet_initialization', initError);
        setHasInitializationError(true);
        setInitializationError(initError);
        setConnectedAddress(undefined);
        setIsInitialized(true);
      }
    };

    initializeWallet();
  }, []);

  return {
    connectedAddress,
    setConnectedAddress,
    hasInitializationError,
    initializationError,
    isInitialized
  };
};

// Error boundary to catch initialization errors and prevent application crashes
interface WalletInitializationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface WalletInitializationErrorBoundaryProps {
  children: ReactNode;
}

class WalletInitializationErrorBoundary extends Component<
  WalletInitializationErrorBoundaryProps,
  WalletInitializationErrorBoundaryState
> {
  constructor(props: WalletInitializationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WalletInitializationErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    logError('wallet_initialization_boundary', error);
    
    // Log additional context for debugging
    console.error('WalletInitializationErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for initialization errors
      return (
        <div style={{
          padding: '20px',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#cc0000',
          margin: '20px',
          textAlign: 'center' as const
        }}>
          <h3>Wallet Initialization Error</h3>
          <p>
            There was an error initializing the wallet connection. 
            This may be due to corrupted storage data or a security issue.
          </p>
          <p>
            <strong>Error:</strong> {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              // Clear local storage and reload
              try {
                removeAuthJwt();
                localStorage.clear();
                window.location.reload();
              } catch (error) {
                console.error('Failed to clear storage:', error);
              }
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Clear Storage and Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const state = useAppKitState();
  const { walletInfo } = useWalletInfo();

  // Use secure initialization hook instead of vulnerable useState initializer
  const {
    connectedAddress,
    setConnectedAddress,
    hasInitializationError,
    initializationError,
    isInitialized
  } = useSecureWalletInitialization();

  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    migrateCookiesToLocalStorage();
  }, []);

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
      if (account.address && account.isConnected) {
        // Validate and normalize address to checksummed format
        if (isValidAddress(account.address)) {
          const checksummedAddress = getAddress(account.address);
          setConnectedAddress(checksummedAddress);
          
          // Use functional state update to prevent unnecessary re-renders
          setConnectionState(currentState => 
            currentState !== 'connected' ? 'connected' : currentState
          );
        } else {
          // Invalid address from wallet - log security event and disconnect
          const addressStr = account.address as string | undefined;
          logSecurityEvent('invalid_address_from_wallet', {
            address: 'INVALID_FORMAT',
            source: 'wallet_provider',
            valid: false,
            timestamp: new Date().toISOString(),
            addressLength: addressStr?.length || 0,
            addressFormat: addressStr?.startsWith('0x') ? 'hex_prefixed' : 'other'
          });
          
          setConnectedAddress(undefined);
          setConnectionState(currentState => 
            currentState !== 'disconnected' ? 'disconnected' : currentState
          );
        }
      } else if (account.isConnected === false) {
        const storedAddress = getWalletAddress();
        if (storedAddress && isValidAddress(storedAddress)) {
          const checksummedAddress = getAddress(storedAddress);
          setConnectedAddress(checksummedAddress);
        } else {
          setConnectedAddress(undefined);
        }
        
        setConnectionState(currentState => 
          currentState !== 'disconnected' ? 'disconnected' : currentState
        );
      } else if (account.status === 'connecting') {
        setConnectionState(currentState => 
          currentState !== 'connecting' ? 'connecting' : currentState
        );
      } else {
        // Default fallback
        setConnectionState(currentState => 
          currentState !== 'disconnected' ? 'disconnected' : currentState
        );
      }
    }, 50); // Small delay to debounce rapid changes

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [account.address, account.isConnected, account.status, isInitialized, setConnectedAddress]);

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
      // CRITICAL: Wallet disconnect MUST succeed before auth cleanup
      try {
        await disconnect();
      } catch (error: unknown) {
        const walletError = createWalletError(
          WalletDisconnectionError,
          'disconnect wallet during logout',
          error
        );
        logError('seizeDisconnectAndLogout', walletError);
        
        // SECURITY: Throw AuthenticationError to prevent auth bypass
        throw new AuthenticationError(
          'Cannot complete logout: wallet disconnection failed. User may still have active wallet connection.',
          walletError
        );
      }
      
      // Only proceed with auth cleanup after successful disconnect
      try {
        removeAuthJwt();
        setConnectedAddress(undefined);
        
        // If reconnect requested, delay after successful logout
        if (reconnect) {
          setTimeout(() => {
            seizeConnect();
          }, 100);
        }
      } catch (error: unknown) {
        const authError = new AuthenticationError(
          'Failed to clear authentication state after successful wallet disconnect',
          error
        );
        logError('seizeDisconnectAndLogout', authError);
        throw authError;
      }
    },
    [disconnect, seizeConnect, setConnectedAddress]
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
  }, [setConnectedAddress]);

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
    hasInitializationError,
    initializationError,
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
    hasInitializationError,
    initializationError,
  ]);

  // Don't render context until initialization is complete
  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' as const }}>
        <p>Initializing wallet connection...</p>
      </div>
    );
  }

  return (
    <WalletInitializationErrorBoundary>
      <SeizeConnectContext.Provider value={contextValue}>
        {children}
      </SeizeConnectContext.Provider>
    </WalletInitializationErrorBoundary>
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