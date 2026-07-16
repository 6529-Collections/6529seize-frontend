import {
  createAppKit,
  type ChainAdapter,
  type CreateAppKit,
  type WalletFeature,
} from "@reown/appkit/react";
import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import type { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import { publicEnv } from "@/config/env";
import { CW_PROJECT_ID } from "@/constants/constants";
import { AdapterCacheError, AdapterError } from "@/errors/adapter";
import { isIndexedDBError, logErrorSecurely } from "@/utils/error-sanitizer";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit-common";
import type { Chain } from "viem";

// Configuration interface for AppKit initialization
export interface AppKitAdapterConfig {
  wallets: AppWallet[];
  adapterManager: AppKitAdapterManager;
  isCapacitor: boolean;
  chains: Chain[];
}

export interface AppKitInitializationConfig {
  adapter: WagmiAdapter;
  isCapacitor: boolean;
  chains: Chain[];
}

// Result interface
interface AppKitInitializationResult {
  adapter: WagmiAdapter;
  /**
   * Optional to preserve backwards compatibility with mocks.
   * When provided, callers can await it before opening AppKit UI.
   */
  ready?: Promise<void> | undefined;
}

/**
 * Debug logger helper to reduce conditional complexity
 */
function debugLog(message: string, ...args: unknown[]): void {
  if (publicEnv.NODE_ENV === "development") {
    console.warn(`[AppKitInitialization] ${message}`, ...args);
  }
}

/**
 * Creates adapter with proper error handling
 */
function createAdapter(
  wallets: AppWallet[],
  adapterManager: AppKitAdapterManager,
  isCapacitor: boolean,
  chains: Chain[]
): WagmiAdapter {
  debugLog(
    `Initializing AppKit adapter (${isCapacitor ? "mobile" : "web"}) with`,
    wallets.length,
    "AppWallets"
  );

  try {
    return adapterManager.createAdapterWithCache(wallets, isCapacitor, chains);
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
 * Creates the stable Wagmi adapter before the heavier AppKit bootstrap starts.
 */
export function createAppKitAdapter(config: AppKitAdapterConfig): WagmiAdapter {
  const { wallets, adapterManager, isCapacitor } = config;

  return createAdapter(wallets, adapterManager, isCapacitor, config.chains);
}

/**
 * Initializes AppKit around an already-mounted Wagmi adapter.
 */
export function initializeAppKit(
  config: AppKitInitializationConfig
): AppKitInitializationResult {
  const appKitConfig = buildAppKitConfig(
    config.adapter,
    config.chains,
    config.isCapacitor
  );
  const appKit = createAppKit(appKitConfig);
  const ready = appKit.ready();
  // Prevent unhandled rejections if a caller chooses not to await `ready`.
  void logAppKitReadyFailure(ready);

  return {
    adapter: config.adapter,
    ready,
  };
}

async function logAppKitReadyFailure(ready: Promise<void>): Promise<void> {
  try {
    await ready;
  } catch (error) {
    logErrorSecurely("[AppKitInitialization] AppKit ready() failed", error);
  }
}

/**
 * Builds the AppKit configuration object
 */
function buildAppKitConfig(
  adapter: WagmiAdapter,
  chains: Chain[],
  isCapacitor: boolean
): CreateAppKit {
  if (chains.length === 0) {
    throw new Error(
      "AppKit initialization requires at least one configured chain."
    );
  }

  const walletFeaturesOrder: WalletFeature[] = ["send"];

  return {
    adapters: [adapter] as ChainAdapter[],
    networks: chains as [AppKitNetwork, ...AppKitNetwork[]],
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
    enableCoinbase: !isCapacitor,
    featuredWalletIds: ["metamask", "walletConnect"],
    allWallets: "SHOW" as const,
    features: {
      analytics: true,
      email: false,
      socials: [],
      onramp: false,
      swaps: false,
      connectMethodsOrder: ["wallet" as const],
      walletFeaturesOrder,
    },
  };
}
