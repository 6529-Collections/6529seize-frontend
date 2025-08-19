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
import { SecurityEventType } from "../../src/types/security";
import { 
  logSecurityEvent, 
  logError, 
  createConnectionEventContext, 
  createValidationEventContext
} from "../../src/utils/security-logger";

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

// REMOVED: Old insecure logging functions replaced with secure logger from src/utils/security-logger.ts

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
        
        // Check if we're in Capacitor for more lenient validation
        const isCapacitor = typeof window !== 'undefined' && 
                           window.Capacitor?.isNativePlatform?.();
        
        if (isCapacitor) {
          // Simplified validation for Capacitor
          if (storedAddress.startsWith('0x') && storedAddress.length === 42) {
            setConnectedAddress(storedAddress.toLowerCase());
            setIsInitialized(true);
            return;
          }
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
        logSecurityEvent(
          SecurityEventType.INVALID_ADDRESS_DETECTED,
          createValidationEventContext(
            'wallet_initialization',
            false,
            addressLength,
            addressFormat
          )
        );
        
        // Clear the invalid stored address immediately
        try {
          removeAuthJwt();
        } catch (cleanupError) {
          // Enhanced mobile debugging for cleanup errors during init
          alert(
            `🧹 CLEANUP ERROR DURING INIT\n\n` +
            `Action: Remove invalid auth state\n` +
            `Problem: Cleanup failed\n` +
            `Cleanup Error: ${cleanupError instanceof Error ? cleanupError.message : cleanupError}\n\n` +
            `Impact: Invalid auth may persist\n` +
            `Time: ${new Date().toISOString()}\n\n` +
            `Continuing with error creation...`
          );
          // Log cleanup failure but continue with error throwing
          logError('auth_cleanup_during_init', new Error('Failed to clear invalid auth state', { cause: cleanupError }));
        }
        
        // Create initialization error to prevent silent authentication bypass
        const initError = new WalletInitializationError(
          'Invalid wallet address found in storage during initialization. This indicates potential data corruption or security breach.',
          undefined,
          debugAddress
        );
        // Enhanced mobile debugging for initialization errors
        alert(
          `🔧 WALLET INIT VALIDATION ERROR\n\n` +
          `Problem: Invalid address in storage\n` +
          `Address Length: ${addressLength}\n` +
          `Address Format: ${addressFormat}\n` +
          `Debug Preview: ${debugAddress}\n\n` +
          `Action: Cleared invalid auth state\n` +
          `Next: User needs to reconnect wallet\n\n` +
          `Full Error: ${initError.message}`
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
        // Enhanced mobile debugging for unexpected initialization errors
        alert(
          `⚠️ UNEXPECTED WALLET INIT ERROR\n\n` +
          `Type: ${initError.name}\n` +
          `Message: ${initError.message}\n\n` +
          `Cause: ${error instanceof Error ? error.message : 'Unknown cause'}\n` +
          `Time: ${new Date().toISOString()}\n\n` +
          `This was an unexpected error during wallet initialization.`
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
  errorDetails?: {
    name: string;
    message: string;
    stack?: string;
    toString: string;
    isMinified: boolean;
    timestamp: string;
    componentStack?: string;
  };
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
    this.state = { hasError: false, error: null, errorDetails: undefined };
  }

  static getDerivedStateFromError(error: Error): WalletInitializationErrorBoundaryState {
    // Capture detailed error info before React minifies it
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      toString: error.toString(),
      isMinified: !!(error.message && error.message.includes('Minified React error')),
      timestamp: new Date().toISOString()
    };
    
    // Brief alert to indicate error captured, details will be in UI
    alert(
      `🚨 WALLET INIT ERROR DETECTED\n\n` +
      `Error: ${errorDetails.name}\n` +
      `Minified: ${errorDetails.isMinified}\n\n` +
      `Full details will be displayed in the error UI.`
    );
    
    return { hasError: true, error, errorDetails };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with component stack information
    this.setState(prevState => ({
      ...prevState,
      errorDetails: prevState.errorDetails ? {
        ...prevState.errorDetails,
        componentStack: errorInfo.componentStack || undefined
      } : undefined
    }));
    
    // Brief alert to indicate component context captured
    alert(
      `📍 COMPONENT CONTEXT CAPTURED\n\n` +
      `Location: WalletInitializationErrorBoundary\n` +
      `Component stack added to error details.\n\n` +
      `View full details in the error UI below.`
    );
    
    // Still log for any server-side monitoring
    logError('wallet_initialization_boundary', error);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for initialization errors with comprehensive debugging
      return (
        <div style={{
          padding: '20px',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#cc0000',
          margin: '20px',
          textAlign: 'left' as const,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>🚨 Wallet Initialization Error</h3>
          <p style={{ textAlign: 'center', marginBottom: '20px' }}>
            There was an error initializing the wallet connection. 
            This may be due to corrupted storage data or a security issue.
          </p>
          
          {/* Error Summary */}
          <div style={{
            backgroundColor: '#ffebee',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid #ffcdd2'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>Error Summary</h4>
            <p><strong>Type:</strong> {this.state.errorDetails?.name || this.state.error?.name || 'Unknown'}</p>
            <p><strong>Time:</strong> {this.state.errorDetails?.timestamp || new Date().toISOString()}</p>
            <p><strong>Is Minified React Error:</strong> {this.state.errorDetails?.isMinified ? 'Yes' : 'No'}</p>
            <p><strong>Message:</strong></p>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: '1px solid #ddd',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {this.state.errorDetails?.message || this.state.error?.message || 'No message available'}
            </div>
          </div>

          {/* Stack Trace */}
          {this.state.errorDetails?.stack && (
            <div style={{
              backgroundColor: '#fff3e0',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #ffcc02'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#ef6c00' }}>Stack Trace</h4>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '1px solid #ddd',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {this.state.errorDetails.stack}
              </div>
            </div>
          )}

          {/* Component Stack */}
          {this.state.errorDetails?.componentStack && (
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #c8e6c9'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Component Stack</h4>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '1px solid #ddd',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                {this.state.errorDetails.componentStack}
              </div>
            </div>
          )}

          {/* Error String Representation */}
          {this.state.errorDetails?.toString && (
            <div style={{
              backgroundColor: '#f3e5f5',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #e1bee7'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Error toString()</h4>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                border: '1px solid #ddd',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.errorDetails.toString}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                // Copy error details to clipboard if available
                const errorInfo = {
                  timestamp: this.state.errorDetails?.timestamp,
                  type: this.state.errorDetails?.name,
                  message: this.state.errorDetails?.message,
                  isMinified: this.state.errorDetails?.isMinified,
                  stack: this.state.errorDetails?.stack,
                  componentStack: this.state.errorDetails?.componentStack,
                  toString: this.state.errorDetails?.toString
                };
                
                const errorText = JSON.stringify(errorInfo, null, 2);
                
                // Try to copy to clipboard, fallback to alert
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(errorText).then(() => {
                    alert('Error details copied to clipboard!');
                  }).catch(() => {
                    alert(`Error details:\n\n${errorText}`);
                  });
                } else {
                  alert(`Error details:\n\n${errorText}`);
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Copy Error Details
            </button>
            <button
              onClick={() => {
                // Clear local storage and reload
                try {
                  removeAuthJwt();
                  localStorage.clear();
                  window.location.reload();
                } catch (error) {
                  alert(`Failed to clear storage: ${error}`);
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#cc0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Storage and Reload
            </button>
          </div>
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
          logSecurityEvent(
            SecurityEventType.INVALID_ADDRESS_DETECTED,
            createValidationEventContext(
              'wallet_provider',
              false,
              addressStr?.length || 0,
              addressStr?.startsWith('0x') ? 'hex_prefixed' : 'other'
            )
          );
          
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
      logSecurityEvent(
        SecurityEventType.WALLET_CONNECTION_ATTEMPT,
        createConnectionEventContext('seizeConnect')
      );
      
      open({ view: "Connect" });
      
      // Log successful modal opening
      logSecurityEvent(
        SecurityEventType.WALLET_MODAL_OPENED,
        createConnectionEventContext('seizeConnect')
      );
    } catch (error) {
      const connectionError = new WalletConnectionError(
        'Failed to open wallet connection modal',
        error
      );
      // Enhanced mobile debugging for connection errors
      alert(
        `🔌 WALLET CONNECTION ERROR\n\n` +
        `Action: Opening wallet modal\n` +
        `Error Type: ${connectionError.name}\n` +
        `Message: ${connectionError.message}\n\n` +
        `Cause: ${error instanceof Error ? error.message : 'Unknown'}\n` +
        `Time: ${new Date().toISOString()}\n\n` +
        `The wallet connection modal failed to open.`
      );
      logError('seizeConnect', connectionError);
      throw connectionError;
    }
  }, [open, account, state]);

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
      // Enhanced mobile debugging for disconnect errors
      alert(
        `🔓 WALLET DISCONNECT ERROR\n\n` +
        `Action: Disconnecting wallet\n` +
        `Error Type: ${walletError.name}\n` +
        `Message: ${walletError.message}\n\n` +
        `Original Error: ${error instanceof Error ? error.message : 'Unknown'}\n` +
        `Time: ${new Date().toISOString()}\n\n` +
        `Failed to disconnect wallet properly.`
      );
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
        // Enhanced mobile debugging for logout disconnect errors
        alert(
          `🚪 LOGOUT DISCONNECT ERROR\n\n` +
          `Action: Disconnect during logout\n` +
          `Error Type: ${walletError.name}\n` +
          `Message: ${walletError.message}\n\n` +
          `Security Risk: User may still have active wallet connection\n` +
          `Result: Logout process halted for security\n\n` +
          `Time: ${new Date().toISOString()}`
        );
        
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
        // Enhanced mobile debugging for auth cleanup errors
        alert(
          `🔑 AUTH CLEANUP ERROR\n\n` +
          `Action: Clear auth after disconnect\n` +
          `Error Type: ${authError.name}\n` +
          `Message: ${authError.message}\n\n` +
          `Status: Wallet disconnected successfully\n` +
          `Problem: Failed to clear auth tokens\n` +
          `Time: ${new Date().toISOString()}\n\n` +
          `Auth state may be inconsistent.`
        );
        throw authError;
      }
    },
    [disconnect, seizeConnect, setConnectedAddress]
  );

  const seizeAcceptConnection = useCallback((address: string): void => {
    // Extract diagnostic data before validation check
    const addressLength = address.length;
    const addressFormat = address.startsWith('0x') ? 'hex_prefixed' : 'other';
    const isValidAddr = isValidAddress(address);

    if (!isValidAddr) {
      // Log security event with NO address data
      logSecurityEvent(
        SecurityEventType.INVALID_ADDRESS_DETECTED,
        createValidationEventContext(
          'seizeAcceptConnection',
          false,
          addressLength,
          addressFormat
        )
      );
      
      const error = new AuthenticationError(
        'Invalid Ethereum address format. Address must be a valid EIP-55 checksummed format.'
      );
      logError('seizeAcceptConnection', error);
      // Enhanced mobile debugging for address validation errors
      alert(
        `📧 ADDRESS VALIDATION ERROR\n\n` +
        `Action: Accept wallet connection\n` +
        `Problem: Invalid Ethereum address\n` +
        `Address Length: ${addressLength}\n` +
        `Address Format: ${addressFormat}\n\n` +
        `Error: ${error.message}\n` +
        `Time: ${new Date().toISOString()}\n\n` +
        `Address must be valid EIP-55 format.`
      );
      throw error;
    }
    
    // Log successful address validation with NO address data
    logSecurityEvent(
      SecurityEventType.ADDRESS_VALIDATION_SUCCESS,
      createValidationEventContext(
        'seizeAcceptConnection',
        true
      )
    );
    
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
    // Enhanced mobile debugging for context hook errors
    alert(
      `🎯 CONTEXT HOOK ERROR\n\n` +
      `Problem: useSeizeConnectContext called outside provider\n` +
      `Context Value: ${context}\n` +
      `Location: Check your component tree\n\n` +
      `Fix: Wrap component with SeizeConnectProvider\n` +
      `Time: ${new Date().toISOString()}`
    );
    throw new Error(
      "useSeizeConnectContext must be used within a SeizeConnectProvider"
    );
  }
  return context;
};