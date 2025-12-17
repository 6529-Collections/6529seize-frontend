import { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import { publicEnv } from "@/config/env";
import { CW_PROJECT_ID } from "@/constants";
import { AdapterCacheError, AdapterError } from "@/src/errors/adapter";
import { isIndexedDBError, logErrorSecurely } from "@/utils/error-sanitizer";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit-common";
import { createAppKit } from "@reown/appkit/react";
import { mainnet } from "viem/chains";

// Configuration interface for AppKit initialization
export interface AppKitInitializationConfig {
  wallets: AppWallet[];
  adapterManager: AppKitAdapterManager;
  isCapacitor: boolean;
}

// Result interface
interface AppKitInitializationResult {
  adapter: WagmiAdapter;
}

/**
 * Debug logger helper to reduce conditional complexity
 */
function debugLog(message: string, ...args: any[]): void {
  if (publicEnv.NODE_ENV === "development") {
    console.log(`[AppKitInitialization] ${message}`, ...args);
  }
}

/**
 * Creates adapter with proper error handling
 */
function createAdapter(
  wallets: AppWallet[],
  adapterManager: AppKitAdapterManager,
  isCapacitor: boolean
): WagmiAdapter {
  debugLog(
    `Initializing AppKit adapter (${isCapacitor ? "mobile" : "web"}) with`,
    wallets.length,
    "AppWallets"
  );

  try {
    return adapterManager.createAdapterWithCache(wallets, isCapacitor);
  } catch (error) {
    if (isIndexedDBError(error)) {
      logErrorSecurely(
        "[AppKitInitialization] IndexedDB connection lost during adapter creation",
        error
      );
      throw new Error(
        "Browser storage connection lost. Please refresh the page to try again."
      );
    }

    if (error instanceof AdapterError || error instanceof AdapterCacheError) {
      logErrorSecurely("[AppKitInitialization] Adapter creation failed", error);
      throw new Error(
        `Wallet adapter setup failed: ${error.message}. Please refresh the page and try again.`
      );
    }

    logErrorSecurely(
      "[AppKitInitialization] Adapter creation failed with unexpected error",
      error
    );
    throw new Error(
      "Failed to initialize wallet connection. Please refresh the page and try again."
    );
  }
}

/**
 * Initializes AppKit with wallets using a fail-fast approach with retry logic
 * Extracted from WagmiSetup component for better maintainability and testability
 */
export function initializeAppKit(
  config: AppKitInitializationConfig
): AppKitInitializationResult {
  const { wallets, adapterManager, isCapacitor } = config;

  const newAdapter = createAdapter(wallets, adapterManager, isCapacitor);
  const appKitConfig = buildAppKitConfig(newAdapter);
  const appKit = createAppKit(appKitConfig);
  void appKit.ready().catch((error) => {
    logErrorSecurely("[AppKitInitialization] AppKit ready() failed", error);
  });

  return {
    adapter: newAdapter,
  };
}

/**
 * Builds the AppKit configuration object
 */
function buildAppKitConfig(adapter: WagmiAdapter) {
  return {
    adapters: [adapter],
    networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
    projectId: CW_PROJECT_ID,
    metadata: {
      name: "6529.io",
      description: "6529.io",
      url: publicEnv.BASE_ENDPOINT,
      icons: [
        "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
      ],
    },
    themeVariables: {
      "--w3m-font-family": "'Montserrat', sans-serif",
    },
    enableWalletGuide: false,
    featuredWalletIds: ["metamask", "walletConnect"],
    allWallets: "SHOW" as const,
    features: {
      analytics: true,
      email: false,
      socials: [],
      connectMethodsOrder: ["wallet" as const],
    },
    enableOnramp: false,
    enableSwaps: false,
  };
}
