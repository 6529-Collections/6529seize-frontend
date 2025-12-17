"use client";

import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { AppKitValidationError } from "@/src/errors/appkit-initialization";
import {
  AppKitInitializationConfig,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";
import {
  logErrorSecurely,
  sanitizeErrorForUser,
} from "@/utils/error-sanitizer";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "@/wagmiConfig/wagmiAppWalletConnector";
import { Capacitor } from "@capacitor/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WagmiProvider } from "wagmi";
import { AppWallet, useAppWallets } from "../app-wallets/AppWalletsContext";
import { useAuth } from "../auth/Auth";
import { AppKitAdapterManager } from "./AppKitAdapterManager";

function installSafeEthereumProxy(): void {
  if (typeof window === "undefined") return;

  const w = window as unknown as {
    ethereum?: unknown;
    __6529_safeEthereumProxyInstalled?: boolean;
  };

  if (w.__6529_safeEthereumProxyInstalled) return;

  const ethereum = (w as any).ethereum;
  if (!ethereum || (typeof ethereum !== "object" && typeof ethereum !== "function")) {
    w.__6529_safeEthereumProxyInstalled = true;
    return;
  }

  try {
    const proxy = new Proxy(ethereum as object, {
      get(target, prop) {
        try {
          const value = Reflect.get(target, prop);
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        } catch {
          return undefined;
        }
      },
    });

    (w as any).ethereum = proxy;
    w.__6529_safeEthereumProxyInstalled = true;
  } catch (error) {
    logErrorSecurely("[WagmiSetup] Failed to install safe ethereum proxy", error);
    w.__6529_safeEthereumProxyInstalled = true;
  }
}

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const { setToast } = useAuth();
  const { appWallets } = useAppWallets();

  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(
    null
  );
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

  // Handle client-side mounting for App Router
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent concurrent initialization attempts
  const [isInitializing, setIsInitializing] = useState(false);

  // Create adapter with essential configuration only
  const createAdapterWithWallets = useCallback(
    (wallets: AppWallet[]): WagmiAdapter => {
      // Basic validation - let util handle detailed validation
      if (!adapterManager) {
        throw new AppKitValidationError("Internal API failed");
      }

      const config: AppKitInitializationConfig = {
        wallets,
        adapterManager: adapterManager as AppKitAdapterManager,
        isCapacitor,
      };

      const result = initializeAppKit(config);
      return result.adapter;
    },
    [adapterManager, isCapacitor]
  );

  // Initialize AppKit with fail-fast approach
  const setupAppKitAdapter = useCallback(
    (wallets: AppWallet[]) => {
      if (isInitializing) {
        throw new AppKitValidationError("Internal API failed");
      }

      setIsInitializing(true);

      try {
        const adapter = createAdapterWithWallets(wallets);
        setCurrentAdapter(adapter);
      } catch (error) {
        logErrorSecurely("[WagmiSetup] AppKit initialization failed", error);
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        throw error; // FAIL-FAST: Re-throw to prevent app from continuing in broken state
      } finally {
        setIsInitializing(false);
      }
    },
    [isInitializing, createAdapterWithWallets, setToast]
  );

  // Initialize adapter eagerly on mount with empty wallets
  useEffect(() => {
    if (isMounted && !currentAdapter && !isInitializing) {
      installSafeEthereumProxy();
      try {
        setupAppKitAdapter([]);
      } catch {
        // Prevent unhandled errors during eager initialization.
        // Fail-fast behavior is preserved by leaving `currentAdapter` unset.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, currentAdapter, isInitializing]); // setupAppKitAdapter intentionally excluded to prevent loops

  // Inject wallet connectors dynamically using hooks (simplified approach)
  useEffect(() => {
    if (!currentAdapter) return;

    // Check if wallets have actually changed to prevent unnecessary re-injection
    const currentAddresses = new Set(appWallets.map((w) => w.address));
    const addressesEqual =
      processedWallets.current.size === currentAddresses.size &&
      Array.from(processedWallets.current).every((addr) =>
        currentAddresses.has(addr)
      );

    if (addressesEqual) return;

    try {
      // Create connectors for current wallets
      const connectors = appWallets
        .map((wallet) => {
          const connector = createAppWalletConnector(
            Array.from(currentAdapter.wagmiConfig.chains),
            { appWallet: wallet },
            () =>
              appWalletPasswordModal.requestPassword(
                wallet.address,
                wallet.address_hashed
              )
          );
          return currentAdapter.wagmiConfig._internal.connectors.setup(
            connector
          );
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
      processedWallets.current = currentAddresses;
    } catch (error) {
      logErrorSecurely("[WagmiSetup] Connector injection failed", error);
      const userMessage = sanitizeErrorForUser(error);
      setToast({
        message: userMessage,
        type: "error",
      });
      // Don't throw here - let the component continue but notify the user
    }
  }, [currentAdapter, appWallets, appWalletPasswordModal, setToast]);

  // Show loading state until fully initialized
  if (!isMounted || !currentAdapter) {
    return null;
  }

  return (
    <WagmiProvider config={currentAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
