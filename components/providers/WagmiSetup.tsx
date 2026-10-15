"use client";

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { mainnet, sepolia } from "viem/chains";
import DeferredWagmiProvider from "./DeferredWagmiProvider";
import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useAuth } from "@/components/auth/Auth";
import {
  AppKitBootstrapContext,
  type AppKitBootstrapContextValue,
  type AppKitBootstrapStatus,
} from "@/components/providers/AppKitBootstrapContext";
import type { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import { createPublicWagmiConfig } from "@/components/providers/createPublicWagmiConfig";
import { installSafeEthereumProxy } from "@/components/providers/safeEthereumProxy";
import {
  hasPersistedWalletSession,
  subscribeToWalletSessionChanges,
} from "@/components/providers/walletSessionGate";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { publicEnv } from "@/config/env";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { AppKitValidationError } from "@/errors/appkit-initialization";
import type {
  AppKitAdapterConfig,
  AppKitInitializationConfig,
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
  readonly hasTerminalError: boolean;
  readonly initializationPromise: Promise<void> | null;
  readonly isCreated: boolean;
  readonly status: AppKitBootstrapStatus;
  readonly walletStackRequested: boolean;
};

// Reown AppKit, WalletConnect and the Coinbase connector are only fetched once
// a returning wallet session or a connect intent needs them.
type WalletStackModules = {
  readonly AppKitAdapterManager: typeof AppKitAdapterManager;
  readonly createAppKitAdapter: typeof createAppKitAdapter;
  readonly initializeAppKit: typeof initializeAppKit;
};

type WagmiAppKitFastPathStore = {
  snapshot: WagmiAppKitFastPathSnapshot;
  readonly listeners: Set<() => void>;
  readonly processedWallets: MutableRef<Set<string>>;
  passwordRequestDelegate:
    | ((address: string, addressHashed: string) => Promise<string>)
    | null;
  toastDelegate: ((toast: AppToastInput) => void) | null;
  walletStackModules?: Promise<WalletStackModules> | null | undefined;
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

// Server HTML and the hydration render cannot read stored sessions, so the
// stack is "initializing" until the mount effect resolves the session gate.
const EMPTY_FAST_PATH_SNAPSHOT: WagmiAppKitFastPathSnapshot = Object.freeze({
  adapter: null,
  adapterInitializationStarted: false,
  configurationKey: null,
  hasTerminalError: false,
  initializationPromise: null,
  isCreated: false,
  status: "initializing",
  walletStackRequested: false,
});

function upgradeFastPathSnapshot(
  snapshot: WagmiAppKitFastPathSnapshot
): WagmiAppKitFastPathSnapshot {
  const hasTerminalError: unknown = Reflect.get(snapshot, "hasTerminalError");
  const walletStackRequested: unknown = Reflect.get(
    snapshot,
    "walletStackRequested"
  );
  if (
    typeof hasTerminalError === "boolean" &&
    typeof walletStackRequested === "boolean"
  ) {
    return snapshot;
  }

  return {
    ...snapshot,
    hasTerminalError:
      typeof hasTerminalError === "boolean"
        ? hasTerminalError
        : snapshot.status === "error",
    walletStackRequested:
      typeof walletStackRequested === "boolean"
        ? walletStackRequested
        : snapshot.adapterInitializationStarted ||
          snapshot.initializationPromise !== null,
  };
}

function getWagmiAppKitFastPathStore(): WagmiAppKitFastPathStore {
  const existingStore = Reflect.get(
    globalThis,
    WAGMI_APPKIT_FAST_PATH_STORE_KEY
  ) as WagmiAppKitFastPathStore | undefined;
  if (existingStore) {
    // Preserve the retained adapter across HMR while safely upgrading stores
    // created by an earlier module version.
    existingStore.snapshot = upgradeFastPathSnapshot(existingStore.snapshot);
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
    updateWagmiAppKitFastPathSnapshot({
      hasTerminalError: true,
      status: "error",
    });
    throw error;
  }
}

async function importWalletStackModules(): Promise<WalletStackModules> {
  const [adapterManagerModule, appKitModule] = await Promise.all([
    import("@/components/providers/AppKitAdapterManager"),
    import("@/utils/appkit-initialization.utils"),
  ]);
  return {
    AppKitAdapterManager: adapterManagerModule.AppKitAdapterManager,
    createAppKitAdapter: appKitModule.createAppKitAdapter,
    initializeAppKit: appKitModule.initializeAppKit,
  };
}

function loadWalletStackModules(): Promise<WalletStackModules> {
  const store = getWagmiAppKitFastPathStore();
  if (store.walletStackModules) {
    return store.walletStackModules;
  }

  const walletStackModules = importWalletStackModules();
  store.walletStackModules = walletStackModules;
  // A failed chunk request must not block a later connect intent.
  walletStackModules.catch(() => {
    if (store.walletStackModules === walletStackModules) {
      store.walletStackModules = null;
    }
  });
  return walletStackModules;
}

function markWalletStackRequested(): void {
  const snapshot = getWagmiAppKitFastPathSnapshot();
  const status = snapshot.hasTerminalError ? "error" : "initializing";
  if (snapshot.walletStackRequested && snapshot.status === status) {
    return;
  }
  updateWagmiAppKitFastPathSnapshot({ status, walletStackRequested: true });
}

// Loading failures stay retryable: the next connect intent fetches again.
function markWalletStackLoadFailed(): void {
  const snapshot = getWagmiAppKitFastPathSnapshot();
  if (snapshot.adapter === null && !snapshot.hasTerminalError) {
    updateWagmiAppKitFastPathSnapshot({ status: "error" });
  }
}

async function requestWalletStackAdapter(
  configurationKey: string,
  createAdapter: (modules: WalletStackModules) => WagmiAdapter
): Promise<WagmiAdapter> {
  assertFastPathConfiguration(configurationKey);
  const { adapter } = getWagmiAppKitFastPathSnapshot();
  if (adapter) {
    return adapter;
  }

  markWalletStackRequested();
  let modules: WalletStackModules;
  try {
    modules = await loadWalletStackModules();
  } catch (error) {
    markWalletStackLoadFailed();
    throw error;
  }
  return createWagmiAdapterOnce(configurationKey, () => createAdapter(modules));
}

function reportWalletStackFailure(error: unknown): void {
  logErrorSecurely("[WagmiSetup] AppKit initialization failed", error);
  showAppKitToast({
    message: sanitizeErrorForUser(error),
    type: "error",
  });
}

// Bounds how long a connect intent waits for the wallet stack. A late chunk
// still creates the adapter, so the next intent can use it immediately.
function waitForWalletStackAdapter(
  adapterRequest: Promise<WagmiAdapter>
): Promise<WagmiAdapter> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      markWalletStackLoadFailed();
      reject(new Error(APPKIT_READY_TIMEOUT_MESSAGE));
    }, APPKIT_READY_WAIT_TIMEOUT_MS);
  });

  return Promise.race([adapterRequest, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

function markWalletStackIdle(): void {
  const snapshot = getWagmiAppKitFastPathSnapshot();
  if (!snapshot.walletStackRequested && snapshot.status === "initializing") {
    updateWagmiAppKitFastPathSnapshot({ status: "idle" });
  }
}

async function runAppKitInitialization(
  initialize: () => Promise<void>
): Promise<void> {
  await Promise.resolve();
  let didTimeout = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      didTimeout = true;
      reject(new Error(APPKIT_READY_TIMEOUT_MESSAGE));
    }, APPKIT_READY_WAIT_TIMEOUT_MS);
  });

  try {
    const sdkInitializationPromise = initialize().then(
      () => {
        // The caller still receives the bounded timeout rejection, but a
        // genuine late SDK readiness signal makes future attempts usable.
        if (didTimeout) {
          updateWagmiAppKitFastPathSnapshot({
            hasTerminalError: false,
            status: "ready",
          });
        }
        return undefined;
      },
      (error: unknown) => {
        if (didTimeout) {
          updateWagmiAppKitFastPathSnapshot({
            hasTerminalError: true,
            status: "error",
          });
        }
        throw error;
      }
    );
    await Promise.race([sdkInitializationPromise, timeoutPromise]);
    updateWagmiAppKitFastPathSnapshot({
      hasTerminalError: false,
      status: "ready",
    });
  } catch (error) {
    updateWagmiAppKitFastPathSnapshot({
      hasTerminalError: !didTimeout,
      status: "error",
    });
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
  if (snapshot.status === "ready") {
    return Promise.resolve();
  }
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

  const chains = useMemo<[Chain, ...Chain[]]>(
    () => (enableTestnet ? [mainnet, sepolia] : [mainnet]),
    [enableTestnet]
  );

  // Server requests and the first hydration render get disconnected context.
  // Keep this instance local: wallet state must never cross server requests.
  const publicWagmiConfig = useMemo(
    () => createPublicWagmiConfig(chains),
    [chains]
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
    updateWagmiAppKitFastPathSnapshot({
      hasTerminalError: true,
      status: "error",
    });
    logErrorSecurely("[WagmiSetup] AppKit configuration changed", error);
    showAppKitToast({
      message: sanitizeErrorForUser(error),
      type: "error",
    });
  }, [fastPathSnapshot.status, hasFastPathConfigurationMismatch]);

  const createWagmiAdapter = useCallback(
    (modules: WalletStackModules): WagmiAdapter => {
      installSafeEthereumProxy();
      markMobileLaunchStep("wagmi_init_start");
      const adapterManager = new modules.AppKitAdapterManager(
        requestAppWalletPassword
      );

      const config: AppKitAdapterConfig = {
        wallets: [],
        adapterManager: assertAppKitAdapterManager(adapterManager),
        isCapacitor,
        chains,
      };

      const adapter = modules.createAppKitAdapter(config);
      markMobileLaunchStep("wagmi_adapter_created");
      return adapter;
    },
    [chains, isCapacitor]
  );

  const requestWalletStack = useCallback(
    (): Promise<WagmiAdapter> =>
      requestWalletStackAdapter(bootstrapConfigurationKey, createWagmiAdapter),
    [bootstrapConfigurationKey, createWagmiAdapter]
  );

  const startAppKitInitialization = useCallback(async (): Promise<void> => {
    // Hydration can replay connect intent before the passive mount effect.
    // Use the same singleton creation path so the first click is not lost.
    const adapter = await waitForWalletStackAdapter(requestWalletStack());

    return startAppKitInitializationOnce(
      bootstrapConfigurationKey,
      async () => {
        let result: ReturnType<typeof initializeAppKit>;

        try {
          const modules = await loadWalletStackModules();
          const config: AppKitInitializationConfig = {
            adapter,
            isCapacitor,
            chains,
          };
          result = await measureMobileLaunchAsync("wagmi_appkit_init", () =>
            modules.initializeAppKit(config)
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
  }, [bootstrapConfigurationKey, chains, isCapacitor, requestWalletStack]);

  const waitForAppKitReady = useCallback(
    () => startAppKitInitialization(),
    [startAppKitInitialization]
  );

  const appKitBootstrapValue = useMemo(
    (): AppKitBootstrapContextValue => ({
      status: fastPathSnapshot.status,
      hasTerminalError: fastPathSnapshot.hasTerminalError,
      isCreated: fastPathSnapshot.isCreated,
      isReady: fastPathSnapshot.status === "ready",
      isWaiting: fastPathSnapshot.status === "initializing",
      waitForReady: waitForAppKitReady,
    }),
    [fastPathSnapshot, waitForAppKitReady]
  );

  // A stored wallet session restores its connection after mount, replacing
  // the wallet-free config while preserving the provider tree. The native app
  // always loads, because its App Wallet connectors live in the adapter.
  // Other visitors fetch the wallet stack only when they ask to connect.
  useEffect(() => {
    if (fastPathSnapshot.walletStackRequested) {
      return;
    }

    const loadForStoredSession = (): boolean => {
      if (!isCapacitor && !hasPersistedWalletSession()) {
        return false;
      }

      requestWalletStack().catch(reportWalletStackFailure);
      return true;
    };

    if (loadForStoredSession()) {
      return;
    }

    markWalletStackIdle();
    return subscribeToWalletSessionChanges(() => {
      loadForStoredSession();
    });
  }, [fastPathSnapshot.walletStackRequested, isCapacitor, requestWalletStack]);

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

  return (
    <AppKitBootstrapContext.Provider value={appKitBootstrapValue}>
      {/* The temporary config must not compete for Wagmi's reconnect lock. */}
      <DeferredWagmiProvider
        config={currentAdapter?.wagmiConfig ?? publicWagmiConfig}
        reconnectOnMount={currentAdapter !== null}
      >
        {children}
        {appWalletPasswordModal.modal}
      </DeferredWagmiProvider>
    </AppKitBootstrapContext.Provider>
  );
}
