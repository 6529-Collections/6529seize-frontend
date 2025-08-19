"use client";

import { WagmiProvider } from "wagmi";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  AppWallet,
  appWalletsEventEmitter,
  useAppWallets,
} from "../app-wallets/AppWalletsContext";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { AppKitAdapterManager } from './AppKitAdapterManager';
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from "@/constants";
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '@/src/errors/adapter';
import { AppKitInitializationError, AppKitValidationError, AppKitTimeoutError, AppKitRetryError } from '@/src/errors/appkit-initialization';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../auth/Auth';
import { sanitizeErrorForUser, logErrorSecurely } from '@/utils/error-sanitizer';
import {
  initializeAppKit as initializeAppKitUtil,
  AppKitInitializationConfig,
  AppKitInitializationCallbacks
} from '@/utils/appkit-initialization.utils';

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const { setToast } = useAuth();
  const { appWallets, fetchingAppWallets } = useAppWallets();
  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appKitInitialized, setAppKitInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Retry tracking state for fail-fast behavior
  const [retryCount, setRetryCount] = useState(0);
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

  // Use the same adapter manager for both mobile and web
  // AppKit will automatically handle the appropriate connectors
  const adapterManager = useMemo(
    () => new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword]
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

      const config: AppKitInitializationConfig = {
        wallets,
        adapterManager: adapterManager as AppKitAdapterManager,
        isCapacitor,
        appKitInitialized,
        maxRetries: MAX_RETRIES,
        retryDelayMs: RETRY_DELAY_MS,
        initTimeoutMs: INIT_TIMEOUT_MS
      };

      const callbacks: AppKitInitializationCallbacks = {
        onToast: setToast,
        onRetryUpdate: (count, lastFailure) => {
          setRetryCount(count);
          setLastFailureTime(lastFailure);
        },
        onAppKitInitialized: () => setAppKitInitialized(true),
        validatePreconditions: validateInitializationPreconditions
      };

      const result = await initializeAppKitUtil(config, callbacks);

      setCurrentAdapter(result.adapter);
      setIsInitialized(true);

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

  // Initialize only after mounting and when AppWallets are ready
  useEffect(() => {

    alert(`[DEBUG 2] isMounted: ${isMounted}, fetchingAppWallets: ${fetchingAppWallets}, appWalletsLength: ${appWallets.length}`);

    if (isMounted && !fetchingAppWallets) {
      // Use IIFE pattern for async operations in useEffect
      (async () => {
        try {
          // Pass actual appWallets instead of empty array
          await initializeAppKit(appWallets);
        } catch (error) {
          logErrorSecurely('[WagmiSetup] Failed to initialize AppKit on mount', error);
        }
      })();
    }
  }, [isMounted, fetchingAppWallets, appWallets]);


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
