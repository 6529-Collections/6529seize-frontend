import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { AppKitNetwork } from '@reown/appkit-common';
import { mainnet } from 'viem/chains';
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from '@/constants';
import { AppKitAdapterManager } from '@/components/providers/AppKitAdapterManager';
import { AppWallet } from '@/components/app-wallets/AppWalletsContext';
import { AdapterError, AdapterCacheError } from '@/src/errors/adapter';
import { AppKitRetryError, AppKitTimeoutError } from '@/src/errors/appkit-initialization';
import { sanitizeErrorForUser, logErrorSecurely } from '@/utils/error-sanitizer';

// Configuration interface for AppKit initialization
export interface AppKitInitializationConfig {
  wallets: AppWallet[];
  adapterManager: AppKitAdapterManager;
  isCapacitor: boolean;
  appKitInitialized: boolean;
  maxRetries?: number;
  retryDelayMs?: number[];
  initTimeoutMs?: number;
}

// Callbacks interface for state updates
export interface AppKitInitializationCallbacks {
  onToast: (toast: { message: string; type: 'error' | 'success' | 'info' }) => void;
  onRetryUpdate: (count: number, lastFailure: number | null) => void;
  onAppKitInitialized: () => void;
  validatePreconditions: (wallets: AppWallet[]) => void;
}

// Result interface
export interface AppKitInitializationResult {
  adapter: WagmiAdapter;
}

// Default configuration constants
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY_MS = [1000, 2000, 4000]; // Exponential backoff
export const DEFAULT_INIT_TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Debug logger helper to reduce conditional complexity
 */
function debugLog(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AppKitInitialization] ${message}`, ...args);
  }
}

/**
 * Creates adapter with proper error handling
 */
function createAdapter(
  wallets: AppWallet[],
  adapterManager: AppKitAdapterManager,
  isCapacitor: boolean,
  onToast: (toast: { message: string; type: 'error' | 'success' | 'info' }) => void
): WagmiAdapter {
  debugLog(`Initializing AppKit adapter (${isCapacitor ? 'mobile' : 'web'}) with`, wallets.length, 'AppWallets');

  try {
    return adapterManager.createAdapterWithCache(wallets);
  } catch (error) {
    if (error instanceof AdapterError || error instanceof AdapterCacheError) {
      logErrorSecurely('[AppKitInitialization] Adapter creation failed', error);
      const userMessage = sanitizeErrorForUser(error);
      onToast({
        message: userMessage,
        type: "error",
      });
      throw new Error(`Wallet adapter setup failed: ${error.message}. Please refresh the page and try again.`);
    }
    
    logErrorSecurely('[AppKitInitialization] Adapter creation failed with unexpected error', error);
    const userMessage = sanitizeErrorForUser(error);
    onToast({
      message: userMessage,
      type: "error",
    });
    throw new Error('Failed to initialize wallet connection. Please refresh the page and try again.');
  }
}

/**
 * Creates AppKit with retry logic
 */
async function createAppKitWithRetry(
  adapter: WagmiAdapter,
  maxRetries: number,
  retryDelayMs: number[],
  onRetryUpdate: (count: number, lastFailure: number | null) => void,
  onAppKitInitialized: () => void
): Promise<void> {
  debugLog('Creating AppKit instance for the first time');
  
  const appKitConfig = buildAppKitConfig(adapter);

  // Iterative retry loop - NO RECURSION
  let currentRetry = 0;
  while (currentRetry < maxRetries) {
    try {
      createAppKit(appKitConfig);
      onAppKitInitialized();
      debugLog('AppKit initialized successfully');
      return; // Exit function on success
    } catch (appKitError) {
      currentRetry++;
      onRetryUpdate(currentRetry, Date.now());

      console.error('[AppKitInitialization] Failed to create AppKit:', appKitError);

      // If we've exceeded max retries, throw final error
      if (currentRetry >= maxRetries) {
        const finalError = new AppKitRetryError(
          `AppKit initialization permanently failed after ${currentRetry} attempts`,
          currentRetry,
          appKitError
        );
        logErrorSecurely('[AppKitInitialization] AppKit initialization permanently failed', finalError);
        throw finalError;
      }

      // Wait for retry with exponential backoff
      const retryDelay = retryDelayMs[currentRetry - 1] || retryDelayMs[retryDelayMs.length - 1];
      debugLog(`Retry attempt ${currentRetry}/${maxRetries} in ${retryDelay}ms`);

      // Use atomic sleep instead of setTimeout to avoid Promise recursion
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Initializes AppKit with wallets using a fail-fast approach with retry logic
 * Extracted from WagmiSetup component for better maintainability and testability
 */
export async function initializeAppKit(
  config: AppKitInitializationConfig,
  callbacks: AppKitInitializationCallbacks
): Promise<AppKitInitializationResult> {
  const {
    wallets,
    adapterManager,
    isCapacitor,
    appKitInitialized,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    initTimeoutMs = DEFAULT_INIT_TIMEOUT_MS
  } = config;

  const {
    onToast,
    onRetryUpdate,
    onAppKitInitialized,
    validatePreconditions
  } = callbacks;

  // Set timeout protection - FAIL-FAST after timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      const timeoutError = new AppKitTimeoutError(`AppKit initialization timed out after ${initTimeoutMs}ms`);
      logErrorSecurely('[AppKitInitialization] Initialization timeout', timeoutError);
      onToast({
        message: 'Wallet initialization timed out. Please refresh and try again.',
        type: "error",
      });
      reject(timeoutError);
    }, initTimeoutMs);

    // Return cleanup function
    return () => clearTimeout(timeoutId);
  });

  // Main initialization logic
  const initializationPromise = (async (): Promise<AppKitInitializationResult> => {
    // FAIL-FAST: Validate all preconditions before proceeding
    validatePreconditions(wallets);

    // Create adapter with error handling
    const newAdapter = createAdapter(wallets, adapterManager, isCapacitor, onToast);

    await createAppKitWithRetry(
      newAdapter,
      maxRetries,
      retryDelayMs,
      onRetryUpdate,
      onAppKitInitialized
    );

    // Reset retry state on success
    onRetryUpdate(0, null);

    return { adapter: newAdapter };
  })();

  // Race between timeout and initialization
  return await Promise.race([initializationPromise, timeoutPromise]);
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
      url: VALIDATED_BASE_ENDPOINT,
      icons: [
        "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
      ],
    },
    enableWalletGuide: false,
    featuredWalletIds: ['metamask', 'walletConnect'],
    allWallets: 'SHOW' as const,
    features: {
      analytics: true,
      email: false,
      socials: [],
      connectMethodsOrder: ['wallet' as const]
    },
    enableOnramp: false,
    enableSwaps: false
  };
}