"use client";

import { WagmiProvider } from "wagmi";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  AppWallet,
  useAppWallets,
} from "../app-wallets/AppWalletsContext";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { AppKitAdapterManager } from './AppKitAdapterManager';
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from "@/constants";
import { AdapterError, AdapterCacheError } from '@/src/errors/adapter';
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
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdatingWallets, setIsUpdatingWallets] = useState(false);

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

  // Create adapter with current wallets - extracted for reusability
  const createAdapterWithWallets = async (wallets: AppWallet[]): Promise<WagmiAdapter> => {
    const config: AppKitInitializationConfig = {
      wallets,
      adapterManager: adapterManager as AppKitAdapterManager,
      isCapacitor,
      appKitInitialized: false, // Always treat as fresh initialization
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
      onAppKitInitialized: () => {}, // No longer needed since we recreate adapters
      validatePreconditions: validateInitializationPreconditions
    };

    const result = await initializeAppKitUtil(config, callbacks);
    return result.adapter;
  };

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

      const adapter = await createAdapterWithWallets(wallets);
      setCurrentAdapter(adapter);

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

  // Initialize adapter eagerly on mount with empty wallets
  useEffect(() => {
    if (isMounted && !currentAdapter) {
      // Use IIFE pattern for async operations in useEffect
      (async () => {
        try {
          // Initialize with empty wallets for immediate UI rendering
          await initializeAppKit([]);
        } catch (error) {
          logErrorSecurely('[WagmiSetup] Failed to initialize AppKit on mount', error);
        }
      })();
    }
  }, [isMounted]);

  // Recreate adapter when appWallets change
  useEffect(() => {
    if (currentAdapter && !fetchingAppWallets && appWallets.length > 0) {
      // Use IIFE pattern for async operations in useEffect
      (async () => {
        try {
          setIsUpdatingWallets(true);
          const newAdapter = await createAdapterWithWallets(appWallets);
          setCurrentAdapter(newAdapter);
        } catch (error) {
          logErrorSecurely('[WagmiSetup] Failed to update AppKit with new wallets', error);
          // Keep existing adapter on failure rather than breaking the app
        } finally {
          setIsUpdatingWallets(false);
        }
      })();
    }
  }, [appWallets, fetchingAppWallets, currentAdapter]);


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

  // Show brief updating indicator during wallet transitions (optional)
  if (isUpdatingWallets) {
    return (
      <WagmiProvider config={currentAdapter!.wagmiConfig}>
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show" role="alert">
            <div className="toast-body d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
              Updating wallet configuration...
            </div>
          </div>
        </div>
        {children}
        {appWalletPasswordModal.modal}
      </WagmiProvider>
    );
  }

  // This should rarely happen now since we initialize eagerly
  if (!currentAdapter) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2">
            Initializing wallet service...
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
