"use client";

import { WagmiProvider } from "wagmi";
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
  AppKitInitializationConfig
} from '@/utils/appkit-initialization.utils';

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const { setToast } = useAuth();
  const { appWallets } = useAppWallets();

  // Use the same adapter manager for both mobile and web
  // AppKit will automatically handle the appropriate connectors
  const adapterManager = useMemo(
    () => new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword]
  );

  // Memoize platform detection to avoid repeated calls
  const isCapacitor = useMemo(() => Capacitor.isNativePlatform(), []);

  // Create adapter with essential configuration only
  const createAdapterWithWallets = useCallback((wallets: AppWallet[]): WagmiAdapter => {
    // Basic validation - let util handle detailed validation
    if (!CW_PROJECT_ID || !VALIDATED_BASE_ENDPOINT || !adapterManager) {
      throw new AppKitValidationError('Internal API failed');
    }

    const config: AppKitInitializationConfig = {
      wallets,
      adapterManager: adapterManager as AppKitAdapterManager,
      isCapacitor,
    };


    const result = initializeAppKitUtil(config);
    return result.adapter;
  }, [adapterManager, isCapacitor, setToast]);


  const adapter = createAdapterWithWallets([]);

  // Track processed wallets by address for efficient comparison
  const processedWallets = useRef<Set<string>>(new Set());

  // Inject wallet connectors dynamically using hooks (simplified approach)
  useEffect(() => {

    // Check if wallets have actually changed to prevent unnecessary re-injection
    const currentAddresses = new Set(appWallets.map(w => w.address));
    const addressesEqual = processedWallets.current.size === currentAddresses.size &&
      Array.from(processedWallets.current).every(addr => currentAddresses.has(addr));

    if (addressesEqual) return;

    try {
      // Create connectors for current wallets
      const connectors = appWallets
        .map((wallet) => {
          const connector = createAppWalletConnector(
            Array.from(adapter.wagmiConfig.chains),
            { appWallet: wallet },
            () => appWalletPasswordModal.requestPassword(wallet.address, wallet.address_hashed)
          );
          return adapter.wagmiConfig._internal.connectors.setup(connector);
        })
        .filter((connector) => connector !== null);

      // Get existing non-app-wallet connectors
      const existingConnectors = adapter.wagmiConfig.connectors.filter(
        (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
      );

      // Update connector state with fail-fast approach
      adapter.wagmiConfig._internal.connectors.setState([
        ...connectors,
        ...existingConnectors,
      ]);

      // Update processed wallets tracking
      processedWallets.current = currentAddresses;

    } catch (error) {
      logErrorSecurely('[WagmiSetup] Connector injection failed', error);
      const userMessage = sanitizeErrorForUser(error);
      setToast({
        message: userMessage,
        type: "error",
      });
      // Don't throw here - let the component continue but notify the user
    }
  }, [appWallets, appWalletPasswordModal, setToast]);


  return (
    <WagmiProvider config={adapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
