"use client";

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mainnet, sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";
import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import { publicEnv } from "@/config/env";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { AppKitValidationError } from "@/src/errors/appkit-initialization";
import type { AppKitInitializationConfig } from "@/utils/appkit-initialization.utils";
import { initializeAppKit } from "@/utils/appkit-initialization.utils";
import {
  logErrorSecurely,
  sanitizeErrorForUser,
} from "@/utils/error-sanitizer";
import {
  markMobileLaunchStep,
  measureMobileLaunchAsync,
} from "@/utils/monitoring/mobileLaunchTiming";
import { validateWalletSafely } from "@/utils/wallet-validation.utils";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "@/wagmiConfig/wagmiAppWalletConnector";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { Chain } from "viem";

/**
 * Installs a defensive wrapper around `window.ethereum` (EIP-1193 provider).
 *
 * Why this exists:
 * - Some injected providers expose methods (e.g. `request`, `on`) that rely on `this`
 *   being the provider object. If a consumer reads a method and calls it later, the
 *   binding can be lost (often surfacing as "Illegal invocation" / broken requests).
 * - Some providers can throw during property access (early initialization, unusual
 *   getters). The proxy catches these reads to avoid crashing app initialization.
 *
 * What the proxy does:
 * - Binds function properties to the underlying provider so `this` is preserved.
 * - Returns `undefined` for properties whose access throws.
 *
 * This runs once per page load and only touches `window.ethereum`.
 */
function installSafeEthereumProxy(): void {
  if (typeof window === "undefined") return;

  const w = globalThis as unknown as {
    ethereum?: unknown;
    __6529_safeEthereumProxyInstalled?: boolean | undefined;
  };

  if (w.__6529_safeEthereumProxyInstalled === true) return;

  const ethereum = w.ethereum;
  if (
    ethereum === undefined ||
    ethereum === null ||
    (typeof ethereum !== "object" && typeof ethereum !== "function")
  ) {
    w.__6529_safeEthereumProxyInstalled = true;
    return;
  }

  const ownEthereumDescriptor = Object.getOwnPropertyDescriptor(w, "ethereum");
  if (
    ownEthereumDescriptor?.configurable === false &&
    !canAssignProperty(ownEthereumDescriptor)
  ) {
    logErrorSecurely(
      "[WagmiSetup] Skipping safe ethereum proxy install for read-only window.ethereum",
      new Error("window.ethereum cannot be reassigned")
    );
    w.__6529_safeEthereumProxyInstalled = true;
    return;
  }

  try {
    let hasLoggedProxyGetError = false;
    const ethereumTarget = ethereum;
    const proxy = new Proxy(ethereumTarget, {
      get(target, prop, receiver): unknown {
        try {
          const value: unknown = Reflect.get(target, prop, receiver);
          if (typeof value === "function") {
            const method = value as (
              this: unknown,
              ...args: unknown[]
            ) => unknown;
            return method.bind(target);
          }
          return value;
        } catch (error) {
          if (!hasLoggedProxyGetError) {
            hasLoggedProxyGetError = true;
            const propLabel =
              typeof prop === "symbol" ? prop.toString() : String(prop);
            logErrorSecurely(
              `[WagmiSetup] ethereum proxy getter failed (prop: ${propLabel})`,
              error
            );
          }
          return undefined;
        }
      },
    });

    if (ownEthereumDescriptor?.configurable === false) {
      w.ethereum = proxy;
    } else {
      Object.defineProperty(w, "ethereum", {
        configurable: true,
        enumerable: ownEthereumDescriptor?.enumerable ?? true,
        writable: true,
        value: proxy,
      });
    }
    w.__6529_safeEthereumProxyInstalled = true;
  } catch (error) {
    logErrorSecurely(
      "[WagmiSetup] Failed to install safe ethereum proxy",
      error
    );
    w.__6529_safeEthereumProxyInstalled = true;
  }
}

function canAssignProperty(descriptor: PropertyDescriptor): boolean {
  if ("get" in descriptor || "set" in descriptor) {
    return typeof descriptor.set === "function";
  }

  return descriptor.writable !== false;
}

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const enableTestnet = publicEnv.DROP_FORGE_TESTNET === true;

  const { setToast } = useAuth();
  const { appWallets, migrateAppWallet } = useAppWallets();
  const appWalletPasswordModal = useAppWalletPasswordModal(migrateAppWallet);

  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(
    null
  );

  // Track processed wallets by address for efficient comparison
  const processedWallets = useRef<Set<string>>(new Set());
  const isInitializingRef = useRef(false);

  // Memoize platform detection to avoid repeated calls
  const isCapacitor = useMemo(() => {
    const isNative = Capacitor.isNativePlatform();
    markMobileLaunchStep("wagmi_capacitor_detected");
    return isNative;
  }, []);

  // Use the same adapter manager for both mobile and web
  // AppKit will automatically handle the appropriate connectors
  const adapterManager = useMemo(
    () => new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword]
  );

  // Create adapter with essential configuration only
  const initializeAppKitWithWallets = useCallback(
    (wallets: AppWallet[]) => {
      const chains: Chain[] = [mainnet];
      if (enableTestnet) {
        chains.push(sepolia);
      }

      const config: AppKitInitializationConfig = {
        wallets,
        adapterManager,
        isCapacitor,
        chains,
      };

      return initializeAppKit(config);
    },
    [adapterManager, isCapacitor, enableTestnet]
  );

  // Initialize AppKit with fail-fast approach
  const setupAppKitAdapter = useCallback(
    async (wallets: AppWallet[]) => {
      if (isInitializingRef.current) {
        throw new AppKitValidationError("Internal API failed");
      }

      isInitializingRef.current = true;

      try {
        markMobileLaunchStep("wagmi_init_start");
        const result = await measureMobileLaunchAsync("wagmi_appkit_init", () =>
          initializeAppKitWithWallets(wallets)
        );
        markMobileLaunchStep("wagmi_adapter_created");
        await measureMobileLaunchAsync("wagmi_adapter_ready", async () => {
          await (result.ready ?? Promise.resolve());
        });
        markMobileLaunchStep("wagmi_ready");
        setCurrentAdapter(result.adapter);
      } catch (error) {
        logErrorSecurely("[WagmiSetup] AppKit initialization failed", error);
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        throw error; // FAIL-FAST: Re-throw to prevent app from continuing in broken state
      } finally {
        isInitializingRef.current = false;
      }
    },
    [initializeAppKitWithWallets, setToast]
  );

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- These effects synchronize imperative AppKit/Wagmi systems and launch telemetry with React state. */
  // Initialize adapter eagerly on mount with empty wallets
  useEffect(() => {
    if (currentAdapter !== null || isInitializingRef.current) {
      return;
    }

    installSafeEthereumProxy();
    // Prevent unhandled promise rejections during eager initialization.
    // Fail-fast behavior is preserved by leaving `currentAdapter` unset.
    void setupAppKitAdapter([]).catch(() => undefined);
  }, [currentAdapter, setupAppKitAdapter]);

  useEffect(() => {
    if (currentAdapter === null) {
      return;
    }

    markMobileLaunchStep("wagmi_children_unblocked");
  }, [currentAdapter]);

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
      const connectors = appWallets.flatMap((wallet) => {
        try {
          validateWalletSafely(wallet);
          const connector = createAppWalletConnector(
            Array.from(currentAdapter.wagmiConfig.chains),
            { appWallet: wallet },
            () =>
              appWalletPasswordModal.requestPassword(
                wallet.address,
                wallet.address_hashed
              )
          );
          const setupConnector =
            currentAdapter.wagmiConfig._internal.connectors.setup(connector);
          return [setupConnector];
        } catch (error) {
          logErrorSecurely(
            `[WagmiSetup] Skipping invalid app-wallet connector ${wallet.address}`,
            error
          );
          return [];
        }
      });

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
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  // Show loading state until fully initialized
  if (currentAdapter === null) {
    return null;
  }

  return (
    <WagmiProvider config={currentAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
