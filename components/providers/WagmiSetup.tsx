"use client";

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { mainnet, sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";
import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import {
  AppKitBootstrapContext,
  type AppKitBootstrapContextValue,
  type AppKitBootstrapStatus,
} from "@/components/providers/AppKitBootstrapContext";
import { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { publicEnv } from "@/config/env";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { AppKitValidationError } from "@/errors/appkit-initialization";
import type {
  AppKitAdapterConfig,
  AppKitInitializationConfig,
} from "@/utils/appkit-initialization.utils";
import {
  createAppKitAdapter,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";
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

type MutableRef<T> = {
  current: T;
};

type WagmiAppKitFastPathSnapshot = {
  readonly adapter: WagmiAdapter | null;
  readonly adapterInitializationStarted: boolean;
  readonly configurationKey: string | null;
  readonly initializationPromise: Promise<void> | null;
  readonly isCreated: boolean;
  readonly status: AppKitBootstrapStatus;
};

type WagmiAppKitFastPathStore = {
  snapshot: WagmiAppKitFastPathSnapshot;
  readonly listeners: Set<() => void>;
  readonly processedWallets: MutableRef<Set<string>>;
  passwordRequestDelegate:
    | ((address: string, addressHashed: string) => Promise<string>)
    | null;
  toastDelegate: ((toast: AppToastInput) => void) | null;
};

const WAGMI_APPKIT_FAST_PATH_STORE_KEY = Symbol.for(
  "6529.wagmiAppKitFastPathStore"
);
const INTERNAL_API_FAILED_MESSAGE = "Internal API failed";
// A hung WalletConnect relay must settle the shared bootstrap as an error, not
// leave every present and future connect intent in a perpetual waiting state.
const APPKIT_READY_WAIT_TIMEOUT_MS = 15_000;
const APPKIT_READY_TIMEOUT_MESSAGE =
  "Timed out waiting for wallet connection services to become ready";

const EMPTY_FAST_PATH_SNAPSHOT: WagmiAppKitFastPathSnapshot = Object.freeze({
  adapter: null,
  adapterInitializationStarted: false,
  configurationKey: null,
  initializationPromise: null,
  isCreated: false,
  status: "initializing",
});

function getWagmiAppKitFastPathStore(): WagmiAppKitFastPathStore {
  const existingStore = Reflect.get(
    globalThis,
    WAGMI_APPKIT_FAST_PATH_STORE_KEY
  ) as WagmiAppKitFastPathStore | undefined;
  if (existingStore) {
    return existingStore;
  }

  const store: WagmiAppKitFastPathStore = {
    snapshot: EMPTY_FAST_PATH_SNAPSHOT,
    listeners: new Set(),
    processedWallets: { current: new Set() },
    passwordRequestDelegate: null,
    toastDelegate: null,
  };
  Reflect.set(globalThis, WAGMI_APPKIT_FAST_PATH_STORE_KEY, store);
  return store;
}

function getWagmiAppKitFastPathSnapshot(): WagmiAppKitFastPathSnapshot {
  return getWagmiAppKitFastPathStore().snapshot;
}

function getEmptyWagmiAppKitFastPathSnapshot(): WagmiAppKitFastPathSnapshot {
  return EMPTY_FAST_PATH_SNAPSHOT;
}

function subscribeToWagmiAppKitFastPathStore(listener: () => void): () => void {
  const store = getWagmiAppKitFastPathStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function updateWagmiAppKitFastPathSnapshot(
  update: Partial<WagmiAppKitFastPathSnapshot>
): void {
  const store = getWagmiAppKitFastPathStore();
  store.snapshot = { ...store.snapshot, ...update };
  for (const listener of store.listeners) {
    listener();
  }
}

function requestAppWalletPassword(
  address: string,
  addressHashed: string
): Promise<string> {
  const delegate = getWagmiAppKitFastPathStore().passwordRequestDelegate;
  if (!delegate) {
    return Promise.reject(
      new AppKitValidationError(INTERNAL_API_FAILED_MESSAGE)
    );
  }

  return delegate(address, addressHashed);
}

function showAppKitToast(toast: AppToastInput): void {
  getWagmiAppKitFastPathStore().toastDelegate?.(toast);
}

function assertFastPathConfiguration(configurationKey: string): void {
  const existingConfigurationKey =
    getWagmiAppKitFastPathSnapshot().configurationKey;
  if (
    existingConfigurationKey !== null &&
    existingConfigurationKey !== configurationKey
  ) {
    throw new AppKitValidationError(INTERNAL_API_FAILED_MESSAGE);
  }
}

function createWagmiAdapterOnce(
  configurationKey: string,
  createAdapter: () => WagmiAdapter
): WagmiAdapter {
  assertFastPathConfiguration(configurationKey);
  const snapshot = getWagmiAppKitFastPathSnapshot();
  if (snapshot.adapter) {
    return snapshot.adapter;
  }
  if (snapshot.adapterInitializationStarted) {
    throw new AppKitValidationError(INTERNAL_API_FAILED_MESSAGE);
  }

  updateWagmiAppKitFastPathSnapshot({
    adapterInitializationStarted: true,
    configurationKey,
  });

  try {
    const adapter = createAdapter();
    updateWagmiAppKitFastPathSnapshot({ adapter });
    return adapter;
  } catch (error) {
    updateWagmiAppKitFastPathSnapshot({ status: "error" });
    throw error;
  }
}

async function runAppKitInitialization(
  initialize: () => Promise<void>
): Promise<void> {
  await Promise.resolve();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(APPKIT_READY_TIMEOUT_MESSAGE));
    }, APPKIT_READY_WAIT_TIMEOUT_MS);
  });

  try {
    await Promise.race([initialize(), timeoutPromise]);
    updateWagmiAppKitFastPathSnapshot({ status: "ready" });
  } catch (error) {
    updateWagmiAppKitFastPathSnapshot({ status: "error" });
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function startAppKitInitializationOnce(
  configurationKey: string,
  initialize: () => Promise<void>
): Promise<void> {
  try {
    assertFastPathConfiguration(configurationKey);
  } catch (error) {
    return Promise.reject(error);
  }

  const snapshot = getWagmiAppKitFastPathSnapshot();
  if (snapshot.initializationPromise) {
    return snapshot.initializationPromise;
  }

  const initializationPromise = runAppKitInitialization(initialize);

  updateWagmiAppKitFastPathSnapshot({
    configurationKey,
    initializationPromise,
    status: "initializing",
  });
  return initializationPromise;
}

type InjectAppWalletConnectorsInput = {
  readonly currentAdapter: WagmiAdapter | null;
  readonly appWallets: readonly AppWallet[];
};

type AppKitAdapterManagerPublicShape = Pick<
  AppKitAdapterManager,
  "cleanup" | "createAdapterWithCache" | "shouldRecreateAdapter"
>;

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
      get(target, prop): unknown {
        try {
          const value: unknown = Reflect.get(target, prop, target);
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

function assertAppKitAdapterManager(value: unknown): AppKitAdapterManager {
  if (!isAppKitAdapterManager(value)) {
    throw new AppKitValidationError(INTERNAL_API_FAILED_MESSAGE);
  }

  return value;
}

function isAppKitAdapterManager(value: unknown): value is AppKitAdapterManager {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return false;
  }

  const candidate = value as Partial<
    Record<keyof AppKitAdapterManagerPublicShape, unknown>
  >;

  return (
    typeof candidate.cleanup === "function" &&
    typeof candidate.createAdapterWithCache === "function" &&
    typeof candidate.shouldRecreateAdapter === "function"
  );
}

function markAdapterReadyForLaunchTiming(
  currentAdapter: WagmiAdapter | null
): void {
  if (currentAdapter === null) {
    return;
  }

  markMobileLaunchStep("wagmi_children_unblocked");
}

function injectAppWalletConnectors({
  currentAdapter,
  appWallets,
}: InjectAppWalletConnectorsInput): void {
  if (currentAdapter === null) {
    return;
  }

  const { processedWallets } = getWagmiAppKitFastPathStore();

  // Check if wallets have actually changed to prevent unnecessary re-injection
  const currentAddresses = new Set(appWallets.map((w) => w.address));
  const addressesEqual =
    processedWallets.current.size === currentAddresses.size &&
    Array.from(processedWallets.current).every((addr) =>
      currentAddresses.has(addr)
    );

  if (addressesEqual) {
    return;
  }

  try {
    // Create connectors for current wallets
    const connectors = appWallets.flatMap((wallet) => {
      try {
        validateWalletSafely(wallet);
        const connector = createAppWalletConnector(
          Array.from(currentAdapter.wagmiConfig.chains),
          { appWallet: wallet },
          () => requestAppWalletPassword(wallet.address, wallet.address_hashed)
        );
        const setupConnector =
          currentAdapter.wagmiConfig._internal.connectors.setup(connector);
        return [setupConnector];
      } catch (error) {
        logErrorSecurely(
          "[WagmiSetup] Skipping invalid app-wallet connector",
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
    showAppKitToast({
      message: userMessage,
      type: "error",
    });
    // Don't throw here - let the component continue but notify the user
  }
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

  const fastPathSnapshot = useSyncExternalStore(
    subscribeToWagmiAppKitFastPathStore,
    getWagmiAppKitFastPathSnapshot,
    getEmptyWagmiAppKitFastPathSnapshot
  );

  useEffect(() => {
    const store = getWagmiAppKitFastPathStore();
    const passwordRequestDelegate = appWalletPasswordModal.requestPassword;
    store.passwordRequestDelegate = passwordRequestDelegate;
    store.toastDelegate = setToast;

    return () => {
      if (store.passwordRequestDelegate === passwordRequestDelegate) {
        store.passwordRequestDelegate = null;
      }
      if (store.toastDelegate === setToast) {
        store.toastDelegate = null;
      }
    };
  }, [appWalletPasswordModal.requestPassword, setToast]);

  // Memoize platform detection to avoid repeated calls
  const isCapacitor = useMemo(() => {
    const isNative = Capacitor.isNativePlatform();
    markMobileLaunchStep("wagmi_capacitor_detected");
    return isNative;
  }, []);

  const chains = useMemo<Chain[]>(
    () => (enableTestnet ? [mainnet, sepolia] : [mainnet]),
    [enableTestnet]
  );

  const bootstrapConfigurationKey = `${isCapacitor ? "capacitor" : "web"}:${chains
    .map((chain) => chain.id)
    .join(",")}`;
  const hasFastPathConfigurationMismatch =
    fastPathSnapshot.configurationKey !== null &&
    fastPathSnapshot.configurationKey !== bootstrapConfigurationKey;
  const currentAdapter = hasFastPathConfigurationMismatch
    ? null
    : fastPathSnapshot.adapter;

  useEffect(() => {
    if (
      !hasFastPathConfigurationMismatch ||
      fastPathSnapshot.status === "error"
    ) {
      return;
    }

    const error = new AppKitValidationError(INTERNAL_API_FAILED_MESSAGE);
    updateWagmiAppKitFastPathSnapshot({ status: "error" });
    logErrorSecurely("[WagmiSetup] AppKit configuration changed", error);
    showAppKitToast({
      message: sanitizeErrorForUser(error),
      type: "error",
    });
  }, [fastPathSnapshot.status, hasFastPathConfigurationMismatch]);

  const createWagmiAdapter = useCallback((): WagmiAdapter => {
    const adapterManager = new AppKitAdapterManager(requestAppWalletPassword);

    const config: AppKitAdapterConfig = {
      wallets: [],
      adapterManager: assertAppKitAdapterManager(adapterManager),
      isCapacitor,
      chains,
    };

    return createAppKitAdapter(config);
  }, [chains, isCapacitor]);

  const startAppKitInitialization = useCallback((): Promise<void> => {
    if (currentAdapter === null) {
      return Promise.reject(
        new AppKitValidationError(INTERNAL_API_FAILED_MESSAGE)
      );
    }

    return startAppKitInitializationOnce(
      bootstrapConfigurationKey,
      async () => {
        let result: ReturnType<typeof initializeAppKit>;

        try {
          const config: AppKitInitializationConfig = {
            adapter: currentAdapter,
            isCapacitor,
            chains,
          };
          result = await measureMobileLaunchAsync("wagmi_appkit_init", () =>
            initializeAppKit(config)
          );
          updateWagmiAppKitFastPathSnapshot({ isCreated: true });
        } catch (error) {
          logErrorSecurely("[WagmiSetup] AppKit initialization failed", error);
          showAppKitToast({
            message: sanitizeErrorForUser(error),
            type: "error",
          });
          throw error;
        }

        try {
          await measureMobileLaunchAsync("wagmi_adapter_ready", async () => {
            await (result.ready ?? Promise.resolve());
          });
          markMobileLaunchStep("wagmi_ready");
        } catch (error) {
          showAppKitToast({
            message: sanitizeErrorForUser(error),
            type: "error",
          });
          logErrorSecurely(
            "[WagmiSetup] AppKit ready failed after adapter mount",
            error
          );
          throw error;
        }
      }
    );
  }, [bootstrapConfigurationKey, chains, currentAdapter, isCapacitor]);

  const waitForAppKitReady = useCallback(
    () => startAppKitInitialization(),
    [startAppKitInitialization]
  );

  const appKitBootstrapValue = useMemo(
    (): AppKitBootstrapContextValue => ({
      status: fastPathSnapshot.status,
      isCreated: fastPathSnapshot.isCreated,
      isReady: fastPathSnapshot.status === "ready",
      isWaiting: fastPathSnapshot.status === "initializing",
      waitForReady: waitForAppKitReady,
    }),
    [fastPathSnapshot, waitForAppKitReady]
  );

  // Create only the Wagmi adapter on mount so hooks can render under a stable
  // provider before AppKit performs its heavier initialization.
  useEffect(() => {
    if (fastPathSnapshot.adapterInitializationStarted) {
      return;
    }

    installSafeEthereumProxy();
    markMobileLaunchStep("wagmi_init_start");

    try {
      createWagmiAdapterOnce(bootstrapConfigurationKey, createWagmiAdapter);
      markMobileLaunchStep("wagmi_adapter_created");
    } catch (error) {
      logErrorSecurely("[WagmiSetup] AppKit initialization failed", error);
      showAppKitToast({
        message: sanitizeErrorForUser(error),
        type: "error",
      });
    }
  }, [
    bootstrapConfigurationKey,
    createWagmiAdapter,
    fastPathSnapshot.adapterInitializationStarted,
  ]);

  useEffect(() => {
    markAdapterReadyForLaunchTiming(currentAdapter);
  }, [currentAdapter]);

  // Inject wallet connectors dynamically using hooks (simplified approach)
  useEffect(() => {
    injectAppWalletConnectors({
      currentAdapter,
      appWallets,
    });
  }, [currentAdapter, appWallets]);

  // A new task gives React a paint opportunity after the Wagmi provider and
  // children commit. User connect intent can start the same singleton sooner
  // through waitForAppKitReady without creating a second AppKit instance.
  useEffect(() => {
    if (currentAdapter === null) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      startAppKitInitialization().catch(() => undefined);
    }, 0);

    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [currentAdapter, startAppKitInitialization]);

  // Show loading state until the wagmi adapter exists.
  if (currentAdapter === null) {
    return null;
  }

  return (
    <AppKitBootstrapContext.Provider value={appKitBootstrapValue}>
      <WagmiProvider config={currentAdapter.wagmiConfig}>
        {children}
        {appWalletPasswordModal.modal}
      </WagmiProvider>
    </AppKitBootstrapContext.Provider>
  );
}
