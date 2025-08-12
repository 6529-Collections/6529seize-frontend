"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { 
  WalletConnectionError, 
  DeepLinkTimeoutError, 
  ConnectionVerificationError 
} from "./errors/WalletConnectionError";
import { 
  sanitizeUserAgent, 
  SafeUserAgentInfo, 
  UserAgentSecurityError 
} from "./security/UserAgentSanitizer";

/**
 * Mobile wallet connection states
 */
export enum MobileConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  DEEP_LINKING = 'deep_linking',
  WAITING_FOR_RETURN = 'waiting_for_return',
  CONNECTED = 'connected',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

export interface MobileWalletInfo {
  isMobile: boolean;
  isInAppBrowser: boolean;
  userAgentHash: string; // SECURITY: Hash instead of raw user agent to prevent XSS
  supportsDeepLinking: boolean;
  detectedWallet?: string;
  platformInfo: {
    isAndroid: boolean;
    isIOS: boolean;
    isWindows: boolean;
    isMac: boolean;
    isLinux: boolean;
  };
}

interface UseMobileWalletConnectionReturn {
  mobileInfo: MobileWalletInfo;
  connectionState: MobileConnectionState;
  connectionTimeout: number;
  isConnecting: boolean;
  handleMobileConnection: (connectorId?: string) => Promise<void>;
  handleDeepLinkReturn: () => Promise<void>;
  resetConnection: () => void;
  getMobileInstructions: () => string;
}

/**
 * Hook for handling mobile wallet connections with deep linking and timeout management
 * SECURITY: Implements proper cleanup to prevent memory leaks and DoS attacks
 */
export const useMobileWalletConnection = (): UseMobileWalletConnectionReturn => {
  const [connectionState, setConnectionState] = useState<MobileConnectionState>(
    MobileConnectionState.IDLE
  );
  const [connectionTimeout, setConnectionTimeout] = useState(0);
  
  // SECURITY: Use refs for cleanup tracking to prevent memory leaks
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const visibilityControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  // SECURITY: Cleanup all resources on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Clear all timeouts
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Abort any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // SECURITY: Abort visibility listener to prevent memory leak
      if (visibilityControllerRef.current) {
        visibilityControllerRef.current.abort();
        visibilityControllerRef.current = null;
      }
      
      // SECURITY: Safety net - AbortController handles cleanup automatically
      // No manual removeEventListener needed as AbortController cleans up
    };
  }, []);

  // Detect mobile environment and wallet capabilities
  const mobileInfo: MobileWalletInfo = getMobileWalletInfo();

  // Handle connection timeout for mobile with proper cleanup
  useEffect(() => {
    // Clear existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (connectionState === MobileConnectionState.CONNECTING || 
        connectionState === MobileConnectionState.DEEP_LINKING ||
        connectionState === MobileConnectionState.WAITING_FOR_RETURN) {
      
      const timeout = setTimeout(() => {
        // SECURITY: Guard state updates with mount check
        if (isMountedRef.current) {
          setConnectionState(MobileConnectionState.TIMEOUT);
          setConnectionTimeout(30); // 30 seconds timeout
        }
      }, 30000);
      
      timeoutIdRef.current = timeout;
    }
    
    // Cleanup function runs on state change or unmount
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [connectionState]);

  // Monitor connection success with mount guard
  useEffect(() => {
    if (isConnected && connectionState !== MobileConnectionState.IDLE && isMountedRef.current) {
      setConnectionState(MobileConnectionState.CONNECTED);
      
      // Clear timeout when connected
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }
  }, [isConnected, connectionState]);

  // Handle mobile wallet connection with deep linking support
  const handleMobileConnection = useCallback(async (connectorId?: string) => {
    try {
      // SECURITY: Guard state updates with mount check
      if (!isMountedRef.current) {
        alert('Component unmounted during connection')
        throw new WalletConnectionError('Component unmounted during connection');
      }
      
      setConnectionState(MobileConnectionState.CONNECTING);

      // Handle deep linking for mobile wallets
      if (mobileInfo.isMobile && mobileInfo.supportsDeepLinking) {
        if (!isMountedRef.current) {
          alert('Component unmounted during deep linking setup')
          throw new WalletConnectionError('Component unmounted during deep linking setup');
        }
        
        setConnectionState(MobileConnectionState.DEEP_LINKING);
        
        // SECURITY: Create AbortController for visibility listener cleanup
        // Abort previous controller if it exists to prevent accumulation
        if (visibilityControllerRef.current) {
          visibilityControllerRef.current.abort();
        }
        
        const visibilityController = new AbortController();
        visibilityControllerRef.current = visibilityController;
        
        // Add event listener for when user returns from wallet app with guaranteed cleanup
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && isMountedRef.current) {
            setConnectionState(MobileConnectionState.WAITING_FOR_RETURN);
            // SECURITY: Immediately abort to ensure cleanup
            visibilityController.abort();
            visibilityControllerRef.current = null;
          }
        };
        
        // SECURITY: Use AbortController signal to guarantee cleanup
        document.addEventListener('visibilitychange', handleVisibilityChange, {
          signal: visibilityController.signal
        });
      }

      // Use AppKit modal to handle connection with proper namespace
      await open({ 
        view: 'Connect', 
        namespace: connectorId === 'solana' ? 'solana' : 'eip155' 
      });
      
    } catch (error: any) {
      // SECURITY: Guard state updates with mount check
      if (isMountedRef.current) {
        alert('Connection failed')
        setConnectionState(MobileConnectionState.FAILED);
      }
      
      // Re-throw for upstream error handling
      throw error;
    }
  }, [open, mobileInfo]);

  // SECURITY: Handle return from deep link with proper cleanup pattern
  const handleDeepLinkReturn = useCallback(async (): Promise<void> => {
    // Validate current state - fail fast if not in correct state
    if (connectionState !== MobileConnectionState.WAITING_FOR_RETURN) {
      alert('Connection state is not waiting for return')
      throw new ConnectionVerificationError(connectionState, 'waiting_for_return');
    }

    // SECURITY: Guard against unmounted component
    if (!isMountedRef.current) {
      alert('Component unmounted during deep link return')
      throw new WalletConnectionError('Component unmounted during deep link return');
    }

    // Create AbortController for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Promise-based connection verification with proper cleanup
      return new Promise<void>((resolve, reject) => {
        const TIMEOUT_MS = 10000; // 10 seconds
        const POLL_INTERVAL_MS = 500; // 500ms polling
        const startTime = Date.now();
        
        const checkConnection = () => {
          // SECURITY: Check if operation was aborted
          if (abortController.signal.aborted) {
            alert('Operation aborted')
            reject(new WalletConnectionError('Operation aborted'));
            return;
          }
          
          // SECURITY: Check if component is still mounted
          if (!isMountedRef.current) {
            alert('Component unmounted during connection check')
            reject(new WalletConnectionError('Component unmounted during connection check'));
            return;
          }
          
          const elapsed = Date.now() - startTime;
          
          // Check if we've exceeded timeout
          if (elapsed >= TIMEOUT_MS) {
            alert('Connection timed out')
            setConnectionState(MobileConnectionState.TIMEOUT);
            reject(new DeepLinkTimeoutError(TIMEOUT_MS));
            return;
          }
          
          // Check if connection is established
          if (isConnected) {
            alert('Connection established')
            setConnectionState(MobileConnectionState.CONNECTED);
            resolve();
            return;
          }
          
          // SECURITY: Use ref-tracked timeout instead of recursive setTimeout
          pollingTimeoutRef.current = setTimeout(checkConnection, POLL_INTERVAL_MS);
        };
        
        // Start the polling
        checkConnection();
      });
    } finally {
      // SECURITY: Always clean up the AbortController reference
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [connectionState, isConnected]);

  // SECURITY: Enhanced reset with proper cleanup
  const resetConnection = useCallback(() => {
    // Clear all timeouts
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    // Abort any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // SECURITY: Abort visibility listener to prevent memory leak
    if (visibilityControllerRef.current) {
      visibilityControllerRef.current.abort();
      visibilityControllerRef.current = null;
    }
    
    // SECURITY: Guard state updates with mount check
    if (isMountedRef.current) {
      setConnectionState(MobileConnectionState.IDLE);
      setConnectionTimeout(0);
    }
  }, []);

  // Get mobile-specific instructions
  const getMobileInstructions = useCallback((): string => {
    if (!mobileInfo.isMobile) {
      return 'Click to connect your wallet';
    }

    switch (connectionState) {
      case MobileConnectionState.CONNECTING:
        return 'Connecting to your wallet...';
      
      case MobileConnectionState.DEEP_LINKING:
        return 'Opening your wallet app. Please approve the connection and return to this page.';
      
      case MobileConnectionState.WAITING_FOR_RETURN:
        return 'Waiting for connection confirmation. If your wallet app is still open, please complete the connection.';
      
      case MobileConnectionState.TIMEOUT:
        return 'Connection timed out. Please try again or check your wallet app.';
      
      case MobileConnectionState.FAILED:
        if (mobileInfo.isInAppBrowser) {
          return 'Connection failed. Try opening this page in your device\'s default browser.';
        }
        return 'Connection failed. Please make sure your wallet app is installed and try again.';
      
      case MobileConnectionState.CONNECTED:
        return 'Wallet connected successfully!';
      
      default:
        if (mobileInfo.isInAppBrowser) {
          return 'Tap to connect. Note: Some wallet features may be limited in this browser.';
        }
        return 'Tap to connect your mobile wallet';
    }
  }, [mobileInfo, connectionState]);

  return {
    mobileInfo,
    connectionState,
    connectionTimeout,
    isConnecting: connectionState === MobileConnectionState.CONNECTING,
    handleMobileConnection,
    handleDeepLinkReturn,
    resetConnection,
    getMobileInstructions,
  };
};

/**
 * Detect mobile environment and wallet capabilities with security sanitization
 * SECURITY: This function now uses sanitizeUserAgent() to prevent XSS attacks
 * and never exposes raw user agent strings
 */
function getMobileWalletInfo(): MobileWalletInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isInAppBrowser: false,
      userAgentHash: '',
      supportsDeepLinking: false,
      platformInfo: {
        isAndroid: false,
        isIOS: false,
        isWindows: false,
        isMac: false,
        isLinux: false,
      },
    };
  }

  try {
    // SECURITY: Use sanitizeUserAgent to prevent XSS and other attacks
    const safeUserAgentInfo = sanitizeUserAgent(window.navigator.userAgent);
    
    // Return sanitized information with hash instead of raw user agent
    return {
      isMobile: safeUserAgentInfo.isMobile,
      isInAppBrowser: safeUserAgentInfo.isInAppBrowser,
      userAgentHash: safeUserAgentInfo.userAgentHash, // Hash instead of raw string
      supportsDeepLinking: safeUserAgentInfo.supportsDeepLinking,
      detectedWallet: safeUserAgentInfo.detectedWallet,
      platformInfo: safeUserAgentInfo.platformInfo,
    };
  } catch (error) {
    // SECURITY: Fail fast on security errors - do not provide fallbacks
    if (error instanceof UserAgentSecurityError) {
      alert('Security violation in user agent processing')
      throw new WalletConnectionError(
        `Security violation in user agent processing: ${error.message}`
      );
    }
    
    // Re-throw unexpected errors for upstream handling
    throw error;
  }
}