"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";

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
  userAgent: string;
  supportsDeepLinking: boolean;
  detectedWallet?: string;
}

interface UseMobileWalletConnectionReturn {
  mobileInfo: MobileWalletInfo;
  connectionState: MobileConnectionState;
  connectionTimeout: number;
  isConnecting: boolean;
  handleMobileConnection: (connectorId?: string) => Promise<void>;
  handleDeepLinkReturn: () => void;
  resetConnection: () => void;
  getMobileInstructions: () => string;
}

/**
 * Hook for handling mobile wallet connections with deep linking and timeout management
 */
export const useMobileWalletConnection = (): UseMobileWalletConnectionReturn => {
  const [connectionState, setConnectionState] = useState<MobileConnectionState>(
    MobileConnectionState.IDLE
  );
  const [connectionTimeout, setConnectionTimeout] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  // Detect mobile environment and wallet capabilities
  const mobileInfo: MobileWalletInfo = getMobileWalletInfo();

  // Handle connection timeout for mobile
  useEffect(() => {
    if (connectionState === MobileConnectionState.CONNECTING || 
        connectionState === MobileConnectionState.DEEP_LINKING ||
        connectionState === MobileConnectionState.WAITING_FOR_RETURN) {
      
      const timeout = setTimeout(() => {
        setConnectionState(MobileConnectionState.TIMEOUT);
        setConnectionTimeout(30); // 30 seconds timeout
      }, 30000);
      
      setTimeoutId(timeout);
      
      return () => {
        clearTimeout(timeout);
        setTimeoutId(null);
      };
    }
  }, [connectionState]);

  // Monitor connection success
  useEffect(() => {
    if (isConnected && connectionState !== MobileConnectionState.IDLE) {
      setConnectionState(MobileConnectionState.CONNECTED);
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  }, [isConnected, connectionState, timeoutId]);

  // Handle mobile wallet connection with deep linking support
  const handleMobileConnection = useCallback(async (connectorId?: string) => {
    try {
      setConnectionState(MobileConnectionState.CONNECTING);

      // Handle deep linking for mobile wallets
      if (mobileInfo.isMobile && mobileInfo.supportsDeepLinking) {
        setConnectionState(MobileConnectionState.DEEP_LINKING);
        
        // Add event listener for when user returns from wallet app
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            setConnectionState(MobileConnectionState.WAITING_FOR_RETURN);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      // Use AppKit modal to handle connection with proper namespace
      await open({ 
        view: 'Connect', 
        namespace: connectorId === 'solana' ? 'solana' : 'eip155' 
      });
      
    } catch (error: any) {
      setConnectionState(MobileConnectionState.FAILED);
      
      // Re-throw for upstream error handling
      throw error;
    }
  }, [open, mobileInfo]);

  // Handle return from deep link
  const handleDeepLinkReturn = useCallback(() => {
    if (connectionState === MobileConnectionState.WAITING_FOR_RETURN) {
      // Check if connection was successful
      setTimeout(() => {
        if (!isConnected) {
          setConnectionState(MobileConnectionState.FAILED);
        }
      }, 2000); // Give some time for connection to establish
    }
  }, [connectionState, isConnected]);

  // Reset connection state
  const resetConnection = useCallback(() => {
    setConnectionState(MobileConnectionState.IDLE);
    setConnectionTimeout(0);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

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
 * Detect mobile environment and wallet capabilities
 */
function getMobileWalletInfo(): MobileWalletInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isInAppBrowser: false,
      userAgent: '',
      supportsDeepLinking: false,
    };
  }

  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Detect in-app browsers
  const isInAppBrowser = 
    /FBAN|FBAV|Instagram|Twitter|Line|WeChat|MicroMessenger/i.test(userAgent) ||
    // MetaMask in-app browser
    /MetaMaskMobile/i.test(userAgent) ||
    // Trust Wallet in-app browser
    /Trust/i.test(userAgent) ||
    // Coinbase Wallet in-app browser
    /CoinbaseWallet/i.test(userAgent);

  // Detect specific wallet apps
  let detectedWallet: string | undefined;
  if (/MetaMask/i.test(userAgent)) {
    detectedWallet = 'MetaMask';
  } else if (/Trust/i.test(userAgent)) {
    detectedWallet = 'Trust Wallet';
  } else if (/CoinbaseWallet/i.test(userAgent)) {
    detectedWallet = 'Coinbase Wallet';
  }

  // Most mobile browsers support deep linking
  const supportsDeepLinking = isMobile && !isInAppBrowser;

  return {
    isMobile,
    isInAppBrowser,
    userAgent,
    supportsDeepLinking,
    detectedWallet,
  };
}