"use client";

import { Connector, WagmiProvider } from "wagmi";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  AppWallet,
  useAppWallets,
} from "../app-wallets/AppWalletsContext";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "@/wagmiConfig/wagmiAppWalletConnector";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { AppKitAdapterManager } from './AppKitAdapterManager';
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from "@/constants";
import { AppKitValidationError } from '@/src/errors/appkit-initialization';
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
  const { appWallets } = useAppWallets();
  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track processed wallets by address for efficient comparison
  const processedWallets = useRef<Set<string>>(new Set());

  // Memoize platform detection to avoid repeated calls
  const isCapacitor = useMemo(() => Capacitor.isNativePlatform(), []);

  // Use the same adapter manager for both mobile and web
  // AppKit will automatically handle the appropriate connectors
  const adapterManager = useMemo(
    () => new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword]
  );

  // Fail-fast validation for essential requirements
  const validateEssentials = useCallback((): void => {
    if (!CW_PROJECT_ID) {
      throw new AppKitValidationError('Internal API failed');
    }
    if (!VALIDATED_BASE_ENDPOINT) {
      throw new AppKitValidationError('Internal API failed');
    }
    if (!adapterManager) {
      throw new AppKitValidationError('Internal API failed');
    }
  }, [adapterManager]);

  // Handle client-side mounting for App Router
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent concurrent initialization attempts
  const [isInitializing, setIsInitializing] = useState(false);

  // Create adapter with simplified configuration
  const createAdapterWithWallets = useCallback(async (wallets: AppWallet[]): Promise<WagmiAdapter> => {
    validateEssentials();
    
    const config: AppKitInitializationConfig = {
      wallets,
      adapterManager: adapterManager as AppKitAdapterManager,
      isCapacitor,
      appKitInitialized: false
    };

    const callbacks: AppKitInitializationCallbacks = {
      onToast: setToast,
      onRetryUpdate: () => {},
      onAppKitInitialized: () => {},
      validatePreconditions: () => {}
    };

    const result = await initializeAppKitUtil(config, callbacks);
    return result.adapter;
  }, [adapterManager, isCapacitor, setToast, validateEssentials]);

  // Initialize AppKit with fail-fast approach
  const initializeAppKit = useCallback(async (wallets: AppWallet[]): Promise<void> => {
    if (isInitializing) {
      throw new AppKitValidationError('Internal API failed');
    }

    setIsInitializing(true);

    try {
      const adapter = await createAdapterWithWallets(wallets);
      setCurrentAdapter(adapter);
    } catch (error) {
      logErrorSecurely('[WagmiSetup] AppKit initialization failed', error);
      const userMessage = sanitizeErrorForUser(error);
      setToast({
        message: userMessage,
        type: "error",
      });
      throw error; // FAIL-FAST: Re-throw to prevent app from continuing in broken state
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, createAdapterWithWallets, setToast]);

  // Initialize adapter eagerly on mount with empty wallets
  useEffect(() => {
    if (isMounted && !currentAdapter && !isInitializing) {
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
  }, [isMounted, currentAdapter, isInitializing, initializeAppKit]);

  // Inject wallet connectors dynamically using hooks (simplified approach)
  useEffect(() => {
    if (!currentAdapter) return;

    try {
      // Create connectors for current wallets
      const connectors = appWallets
        .map((wallet) => {
          const connector = createAppWalletConnector(
            Array.from(currentAdapter.wagmiConfig.chains),
            { appWallet: wallet },
            () => appWalletPasswordModal.requestPassword(wallet.address, wallet.address_hashed)
          );
          return currentAdapter.wagmiConfig._internal.connectors.setup(connector);
        })
        .filter((connector) => connector !== null);

      // Get existing non-app-wallet connectors
      const existingConnectors = currentAdapter.wagmiConfig.connectors.filter(
        (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
      );

      // Update connector state with fail-fast approach
      currentAdapter.wagmiConfig._internal.connectors.setState([
        ...connectors,
        ...existingConnectors,
      ]);

      // Update processed wallets tracking
      processedWallets.current = new Set(appWallets.map(w => w.address));

    } catch (error) {
      logErrorSecurely('[WagmiSetup] Connector injection failed', error);
      const userMessage = sanitizeErrorForUser(error);
      setToast({
        message: userMessage,
        type: "error",
      });
      // Don't throw here - let the component continue but notify the user
    }
  }, [currentAdapter, appWallets, appWalletPasswordModal, setToast]);

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

  // Fallback if adapter is not ready
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
