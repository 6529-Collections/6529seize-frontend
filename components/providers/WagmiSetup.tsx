"use client";

import { WagmiProvider } from "wagmi";
import { useEffect, useState, useMemo, useRef } from "react";
import { 
  AppWallet,
  appWalletsEventEmitter,
} from "../app-wallets/AppWalletsContext";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit-common'
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from "@/constants";
import { mainnet } from "viem/chains";
import { AppKitAdapterManager } from './AppKitAdapterManager';
import { AppKitAdapterCapacitor } from './AppKitAdapterCapacitor';
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '@/src/errors/adapter';
import { AppKitInitializationError, AppKitValidationError, AppKitTimeoutError, AppKitRetryError } from '@/src/errors/appkit-initialization';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../auth/Auth';
import { sanitizeErrorForUser, logErrorSecurely } from '@/utils/error-sanitizer';

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const { setToast } = useAuth();
  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appKitInitialized, setAppKitInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Retry tracking state for fail-fast behavior
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = [1000, 2000, 4000]; // Exponential backoff
  const INIT_TIMEOUT_MS = 10000; // 10 second timeout

  // Memoize platform detection to avoid repeated calls
  const isCapacitor = useMemo(() => Capacitor.isNativePlatform(), []);
  
  // Validate initialization preconditions - FAIL-FAST approach
  const validateInitializationPreconditions = (wallets: AppWallet[]): void => {
    // Validate project ID exists
    if (!CW_PROJECT_ID) {
      throw new AppKitValidationError('CW_PROJECT_ID is not defined - cannot initialize AppKit');
    }
    
    if (typeof CW_PROJECT_ID !== 'string' || CW_PROJECT_ID.length === 0) {
      throw new AppKitValidationError('CW_PROJECT_ID must be a non-empty string');
    }
    
    // Validate base endpoint
    if (!VALIDATED_BASE_ENDPOINT) {
      throw new AppKitValidationError('VALIDATED_BASE_ENDPOINT is not defined');
    }
    
    // Validate wallets array
    if (!Array.isArray(wallets)) {
      throw new AppKitValidationError('Wallets must be an array');
    }
    
    // Validate adapter manager
    if (!adapterManager) {
      throw new AppKitValidationError('Adapter manager is not initialized');
    }
    
    // Check if we're in a retry loop that should fail
    if (retryCount >= MAX_RETRIES) {
      throw new AppKitRetryError('Maximum retry attempts reached', retryCount);
    }
    
    // Check for retry cooldown period
    if (lastFailureTime && Date.now() - lastFailureTime < 5000) {
      throw new AppKitValidationError('Retry attempt too soon after last failure');
    }
  };

  // Handle client-side mounting for App Router
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const adapterManager = useMemo(
    () => isCapacitor 
      ? new AppKitAdapterCapacitor(appWalletPasswordModal.requestPassword)
      : new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword, isCapacitor]
  );

  // Prevent concurrent initialization attempts
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize AppKit with wallets - FAIL-FAST implementation with async/await and iterative retry
  const initializeAppKit = async (wallets: AppWallet[]): Promise<void> => {
    // Prevent concurrent initialization
    if (isInitializing) {
      throw new AppKitValidationError('AppKit initialization already in progress');
    }
    
    setIsInitializing(true);
    
    try {
      // Clear any existing initialization timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      // Set timeout protection - FAIL-FAST after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          const timeoutError = new AppKitTimeoutError(`AppKit initialization timed out after ${INIT_TIMEOUT_MS}ms`);
          logErrorSecurely('[WagmiSetup] Initialization timeout', timeoutError);
          setToast({
            message: 'Wallet initialization timed out. Please refresh and try again.',
            type: "error",
          });
          reject(timeoutError);
        }, INIT_TIMEOUT_MS);
      });
      
      // Main initialization logic
      const initializationPromise = (async () => {
        // FAIL-FAST: Validate all preconditions before proceeding
        validateInitializationPreconditions(wallets);
        
        // Initialize AppKit adapter for platform-specific wallet management
        if (process.env.NODE_ENV === 'development') {
          console.log(`[WagmiSetup] Initializing AppKit adapter (${isCapacitor ? 'mobile' : 'web'}) with`, wallets.length, 'AppWallets');
        }
        
        let newAdapter: WagmiAdapter;
        try {
          newAdapter = isCapacitor 
            ? (adapterManager as AppKitAdapterCapacitor).createAdapter(wallets)
            : (adapterManager as AppKitAdapterManager).createAdapterWithCache(wallets);
        } catch (error) {
          if (error instanceof AdapterError || error instanceof AdapterCacheError) {
            logErrorSecurely('[WagmiSetup] Adapter creation failed', error);
            const userMessage = sanitizeErrorForUser(error);
            setToast({
              message: userMessage,
              type: "error",
            });
            throw new Error(`Wallet adapter setup failed: ${error.message}. Please refresh the page and try again.`);
          }
          logErrorSecurely('[WagmiSetup] Adapter creation failed with unexpected error', error);
          const userMessage = sanitizeErrorForUser(error);
          setToast({
            message: userMessage,
            type: "error",
          });
          throw new Error('Failed to initialize wallet connection. Please refresh the page and try again.');
        }
        
        // Only create AppKit once
        if (!appKitInitialized) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[WagmiSetup] Creating AppKit instance for the first time');
          }
          // Mobile-specific AppKit configuration
          const appKitConfig = isCapacitor ? {
            adapters: [newAdapter],
            networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
            projectId: CW_PROJECT_ID,
            metadata: {
              name: "6529.io",
              description: "6529.io",
              url: VALIDATED_BASE_ENDPOINT,
              icons: [
                "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
              ],
            },
            // Mobile-specific settings
            enableWalletGuide: false,
            featuredWalletIds: ['metamask', 'coinbaseWallet', 'walletConnect'], // Include MetaMask for mobile
            allWallets: 'SHOW' as const, // Show "All Wallets" on mobile to ensure MetaMask is accessible
            features: {
              analytics: true,
              email: false,
              socials: [],
              connectMethodsOrder: ['wallet' as const]
            },
            enableOnramp: false, // Disable for mobile
            enableSwaps: false,   // Disable for mobile
            debug: true,
          } : {
            adapters: [newAdapter],
            networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
            projectId: CW_PROJECT_ID,
            metadata: {
              name: "6529.io",
              description: "6529.io",
              url: VALIDATED_BASE_ENDPOINT,
              icons: [
                "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
              ],
            },
            // Web-specific settings
            enableWalletGuide: false,
            featuredWalletIds: ['metamask', 'walletConnect'],
            allWallets: 'SHOW' as const,
            features: {
              analytics: true,
              email: false,
              socials: [],
              connectMethodsOrder: ['wallet' as const]
            },
            enableOnramp: false, // Keep disabled for now
            enableSwaps: false   // Keep disabled for now
          };
          
          // Iterative retry loop - NO RECURSION
          let currentRetry = 0;
          while (currentRetry < MAX_RETRIES) {
            try {
              createAppKit(appKitConfig);
              setAppKitInitialized(true);
              if (process.env.NODE_ENV === 'development') {
                console.log('[WagmiSetup] AppKit initialized successfully');
              }
              break; // Exit retry loop on success
            } catch (appKitError) {
              currentRetry++;
              setRetryCount(currentRetry);
              setLastFailureTime(Date.now());
              
              console.error('[WagmiSetup] Failed to create AppKit:', appKitError);
              
              // If we've exceeded max retries, throw final error
              if (currentRetry >= MAX_RETRIES) {
                const finalError = new AppKitRetryError(
                  `AppKit initialization permanently failed after ${currentRetry} attempts`,
                  currentRetry,
                  appKitError
                );
                logErrorSecurely('[WagmiSetup] AppKit initialization permanently failed', finalError);
                throw finalError;
              }
              
              // Wait for retry with exponential backoff
              const retryDelay = RETRY_DELAY_MS[currentRetry - 1] || RETRY_DELAY_MS[RETRY_DELAY_MS.length - 1];
              setIsRetrying(true);
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`[WagmiSetup] Retry attempt ${currentRetry}/${MAX_RETRIES} in ${retryDelay}ms`);
              }
              
              // Use atomic sleep instead of setTimeout to avoid Promise recursion
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              setIsRetrying(false);
            }
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[WagmiSetup] AppKit already initialized, only updating adapter');
          }
        }
        
        // Reset retry state on success
        setRetryCount(0);
        setLastFailureTime(null);
        setIsRetrying(false);
        
        setCurrentAdapter(newAdapter);
        setIsInitialized(true);
      })();
      
      // Race between timeout and initialization
      await Promise.race([initializationPromise, timeoutPromise]);
      
    } catch (error) {
      // Handle specific error types
      if (error instanceof AppKitValidationError || 
          error instanceof AppKitTimeoutError || 
          error instanceof AppKitRetryError) {
        logErrorSecurely('[WagmiSetup] AppKit-specific error during initialization', error);
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        throw error; // FAIL-FAST: Re-throw to prevent app from continuing in broken state
      }
      
      // Handle adapter errors
      if (error instanceof AdapterError || error instanceof AdapterCacheError) {
        logErrorSecurely('[WagmiSetup] Adapter error during initialization', error);
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        throw error; // FAIL-FAST: Re-throw to prevent app from continuing in broken state
      }
      
      // Handle unexpected errors
      logErrorSecurely('[WagmiSetup] Unexpected error initializing AppKit', error);
      const userMessage = sanitizeErrorForUser(error);
      setToast({
        message: userMessage,
        type: "error",
      });
      throw new AppKitInitializationError(
        `Unexpected error during AppKit initialization: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    } finally {
      // Clear timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      setIsInitializing(false);
    }
  };

  const handleAppWalletUpdate = (wallets: AppWallet[]) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce updates
    timeoutRef.current = setTimeout(async () => {
      try {
        const shouldRecreate = isCapacitor 
          ? (adapterManager as AppKitAdapterCapacitor).shouldRecreateAdapter(wallets)
          : (adapterManager as AppKitAdapterManager).shouldRecreateAdapter(wallets);
          
        if (shouldRecreate) {
          // Use async/await instead of .catch() to prevent Promise chain issues
          await initializeAppKit(wallets);
        }
      } catch (error) {
        logErrorSecurely('[WagmiSetup] Failed to reinitialize AppKit during wallet update', error);
        // Show user-friendly error message
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        // Error is handled - don't re-throw in timeout callback
      }
    }, 300);
  };

  // Initialize only after mounting to avoid SSR issues
  useEffect(() => {
    if (isMounted) {
      // Use IIFE pattern for async operations in useEffect
      (async () => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('[WagmiSetup] Client-side mounted, initializing AppKit');
          }
          await initializeAppKit([]);
        } catch (error) {
          logErrorSecurely('[WagmiSetup] Failed to initialize AppKit on mount', error);
          // Error is already handled inside initializeAppKit (user toast shown)
          // This catch prevents unhandled promise rejection
          console.error('[WagmiSetup] AppKit initialization failed:', error);
        }
      })();
    }
  }, [isMounted]);

  // Listen for AppWallet changes
  useEffect(() => {
    appWalletsEventEmitter.on("update", handleAppWalletUpdate);
    
    return () => {
      appWalletsEventEmitter.off("update", handleAppWalletUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      try {
        // Clear initialization timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
        
        adapterManager.cleanup();
      } catch (error) {
        logErrorSecurely('[WagmiSetup] Error during cleanup', error);
        if (error instanceof AdapterCleanupError) {
          logErrorSecurely('[WagmiSetup] Adapter cleanup failed', error);
          // Don't throw here as this is in cleanup - just log the error
        }
      }
    };
  }, [adapterManager]);

  // Don't render anything until mounted (fixes SSR issues)
  if (!isMounted) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2">Initializing...</div>
        </div>
      </div>
    );
  }

  if (!currentAdapter || !isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WagmiSetup] Waiting for AppKit initialization...', { 
        hasAdapter: !!currentAdapter, 
        isInitialized,
        isCapacitor,
        isMounted
      });
    }
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2">
            Connecting to {isCapacitor ? 'mobile' : 'web'} wallet service...
          </div>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={currentAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
