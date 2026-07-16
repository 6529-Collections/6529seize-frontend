"use client";

import { useAppKit, useAppKitState, useWalletInfo } from "@reown/appkit/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { logError } from "@/utils/security-logger";
import { isSafeWalletInfo } from "@/utils/wallet-detection";

type OpenAppKitModal = ReturnType<typeof useAppKit>["open"];
type AppKitWalletInfo = ReturnType<typeof useWalletInfo>["walletInfo"];
type AppKitWalletName = NonNullable<AppKitWalletInfo>["name"];
type AppKitWalletIcon = NonNullable<AppKitWalletInfo>["icon"];

type AppKitModalState = {
  readonly isOpen: boolean;
  readonly walletName: AppKitWalletName | undefined;
  readonly walletIcon: AppKitWalletIcon | undefined;
  readonly isSafeWallet: boolean;
};

type AppKitOpenWaiter = {
  readonly reject: (error: Error) => void;
  readonly resolve: (open: OpenAppKitModal) => void;
  readonly timeoutHandle: ReturnType<typeof setTimeout>;
};

type AppKitModalBridgeStore = {
  readonly dispose: () => void;
  readonly failBootstrap: () => void;
  readonly getSnapshot: () => AppKitModalState;
  readonly setOpen: (open: OpenAppKitModal | null) => void;
  readonly setState: (state: AppKitModalState) => void;
  readonly subscribe: (listener: () => void) => () => void;
  readonly waitForOpen: () => Promise<OpenAppKitModal>;
};

const APPKIT_MODAL_BRIDGE_WAIT_TIMEOUT_MS = 15_000;
const APPKIT_UNAVAILABLE_MESSAGE =
  "Wallet connection services failed to initialize";
const EMPTY_APPKIT_MODAL_STATE: AppKitModalState = Object.freeze({
  isOpen: false,
  walletName: undefined,
  walletIcon: undefined,
  isSafeWallet: false,
});
const AppKitModalBridgeStoreContext =
  createContext<AppKitModalBridgeStore | null>(null);

function getEmptyAppKitModalState(): AppKitModalState {
  return EMPTY_APPKIT_MODAL_STATE;
}

export function createAppKitModalBridgeStore(): AppKitModalBridgeStore {
  let snapshot = EMPTY_APPKIT_MODAL_STATE;
  let openAppKit: OpenAppKitModal | null = null;
  let failure: Error | null = null;
  const listeners = new Set<() => void>();
  const waiters = new Set<AppKitOpenWaiter>();

  const rejectWaiters = (error: Error): void => {
    const pendingWaiters = Array.from(waiters);
    waiters.clear();
    for (const waiter of pendingWaiters) {
      clearTimeout(waiter.timeoutHandle);
      waiter.reject(error);
    }
  };

  const fail = (error: Error): void => {
    if (failure) {
      return;
    }

    failure = error;
    openAppKit = null;
    const stateChanged = snapshot !== EMPTY_APPKIT_MODAL_STATE;
    snapshot = EMPTY_APPKIT_MODAL_STATE;
    rejectWaiters(error);
    if (stateChanged) {
      for (const listener of listeners) {
        listener();
      }
    }
  };

  return {
    dispose: () => {
      fail(new Error("Wallet connection services became unavailable"));
      listeners.clear();
    },
    failBootstrap: () => {
      fail(new Error(APPKIT_UNAVAILABLE_MESSAGE));
    },
    getSnapshot: () => snapshot,
    setOpen: (nextOpenAppKit) => {
      if (failure) {
        return;
      }

      openAppKit = nextOpenAppKit;
      if (!nextOpenAppKit) {
        return;
      }

      const pendingWaiters = Array.from(waiters);
      waiters.clear();
      for (const waiter of pendingWaiters) {
        clearTimeout(waiter.timeoutHandle);
        waiter.resolve(nextOpenAppKit);
      }
    },
    setState: (nextState) => {
      if (failure) {
        return;
      }

      if (
        snapshot.isOpen === nextState.isOpen &&
        snapshot.walletName === nextState.walletName &&
        snapshot.walletIcon === nextState.walletIcon &&
        snapshot.isSafeWallet === nextState.isSafeWallet
      ) {
        return;
      }

      snapshot = nextState;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    waitForOpen: () => {
      if (failure) {
        return Promise.reject(failure);
      }
      if (openAppKit) {
        return Promise.resolve(openAppKit);
      }

      return new Promise((resolve, reject) => {
        const waiter: AppKitOpenWaiter = {
          reject,
          resolve,
          timeoutHandle: setTimeout(() => {
            waiters.delete(waiter);
            reject(
              new Error("Timed out waiting for wallet connection services")
            );
          }, APPKIT_MODAL_BRIDGE_WAIT_TIMEOUT_MS),
        };
        waiters.add(waiter);
      });
    },
  };
}

export function useAppKitModalBridgeState(
  store: AppKitModalBridgeStore
): AppKitModalState {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getEmptyAppKitModalState
  );
}

function useAppKitModalBridgeStore(): AppKitModalBridgeStore {
  const store = useContext(AppKitModalBridgeStoreContext);
  if (!store) {
    throw new Error("AppKit modal bridge store is unavailable");
  }
  return store;
}

const AppKitModalHooks: React.FC = () => {
  const store = useAppKitModalBridgeStore();
  const { open } = useAppKit();
  const { walletInfo } = useWalletInfo();
  const { open: isOpen } = useAppKitState();
  const walletName = walletInfo?.name;
  const walletIcon = walletInfo?.icon;
  const isSafeWallet = isSafeWalletInfo(walletInfo);

  useEffect(() => {
    store.setOpen(open);
    return () => {
      store.setOpen(null);
    };
  }, [open, store]);

  useEffect(() => {
    store.setState({ isOpen, walletName, walletIcon, isSafeWallet });
  }, [isOpen, isSafeWallet, store, walletIcon, walletName]);

  return null;
};

class AppKitModalBridgeErrorBoundary extends React.Component<
  {
    readonly children: React.ReactNode;
    readonly store: AppKitModalBridgeStore;
  },
  { readonly hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError(): { readonly hasError: boolean } {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    this.props.store.failBootstrap();
    logError("appkit_modal_bridge", error);
  }

  override render(): React.ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}

export const AppKitModalBridge: React.FC<{
  readonly store: AppKitModalBridgeStore;
}> = ({ store }) => (
  <AppKitModalBridgeStoreContext.Provider value={store}>
    <AppKitModalBridgeErrorBoundary store={store}>
      <AppKitModalHooks />
    </AppKitModalBridgeErrorBoundary>
  </AppKitModalBridgeStoreContext.Provider>
);
