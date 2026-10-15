"use client";

import type {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import dynamic from "next/dynamic";
import React, { useSyncExternalStore } from "react";
import { logError } from "@/utils/security-logger";
import { noteWalletChunkFailure } from "@/components/providers/walletChunkRecovery";
import { AppKitModalBridgeStoreContext } from "./appKitModalBridgeStoreContext";

// The AppKit hooks pull in the Reown SDK, so they load only after AppKit has
// been created for a stored session or a connect intent.
const AppKitModalHooks = dynamic(() => import("./AppKitModalHooks"), {
  loading: () => null,
  ssr: false,
});

type OpenAppKitModal = ReturnType<typeof useAppKit>["open"];
type CloseAppKitModal = ReturnType<typeof useAppKit>["close"];
type DisconnectAppKit = ReturnType<typeof useDisconnect>["disconnect"];
type AppKitAccountState = Pick<
  ReturnType<typeof useAppKitAccount>,
  "address" | "isConnected" | "status"
>;
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

export type AppKitModalBridgeStore = {
  readonly dispose: () => void;
  readonly close: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly failBootstrap: () => void;
  readonly getSnapshot: () => AppKitModalState;
  readonly getAccountSnapshot: () => AppKitAccountState;
  readonly setAccount: (account: AppKitAccountState) => void;
  readonly setDisconnect: (disconnect: DisconnectAppKit | null) => void;
  readonly setOpen: (open: OpenAppKitModal | null) => void;
  readonly setClose: (close: CloseAppKitModal | null) => void;
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
const EMPTY_APPKIT_ACCOUNT_STATE: AppKitAccountState = Object.freeze({
  address: undefined,
  isConnected: false,
  status: "disconnected",
});

function getEmptyAppKitModalState(): AppKitModalState {
  return EMPTY_APPKIT_MODAL_STATE;
}

function getEmptyAppKitAccountState(): AppKitAccountState {
  return EMPTY_APPKIT_ACCOUNT_STATE;
}

export function createAppKitModalBridgeStore(): AppKitModalBridgeStore {
  let snapshot = EMPTY_APPKIT_MODAL_STATE;
  let accountSnapshot = EMPTY_APPKIT_ACCOUNT_STATE;
  let disconnectAppKit: DisconnectAppKit | null = null;
  let openAppKit: OpenAppKitModal | null = null;
  let closeAppKit: CloseAppKitModal | null = null;
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
    closeAppKit = null;
    disconnectAppKit = null;
    const stateChanged =
      snapshot !== EMPTY_APPKIT_MODAL_STATE ||
      accountSnapshot !== EMPTY_APPKIT_ACCOUNT_STATE;
    snapshot = EMPTY_APPKIT_MODAL_STATE;
    accountSnapshot = EMPTY_APPKIT_ACCOUNT_STATE;
    rejectWaiters(error);
    if (stateChanged) {
      for (const listener of listeners) {
        listener();
      }
    }
  };

  return {
    close: async () => {
      await closeAppKit?.();
    },
    disconnect: () => {
      if (!disconnectAppKit) {
        return Promise.reject(failure ?? new Error(APPKIT_UNAVAILABLE_MESSAGE));
      }
      return disconnectAppKit();
    },
    dispose: () => {
      fail(new Error("Wallet connection services became unavailable"));
      listeners.clear();
    },
    failBootstrap: () => {
      fail(new Error(APPKIT_UNAVAILABLE_MESSAGE));
    },
    getSnapshot: () => snapshot,
    getAccountSnapshot: () => accountSnapshot,
    setAccount: (account) => {
      if (
        failure ||
        (accountSnapshot.address === account.address &&
          accountSnapshot.isConnected === account.isConnected &&
          accountSnapshot.status === account.status)
      ) {
        return;
      }
      accountSnapshot = account;
      for (const listener of listeners) {
        listener();
      }
    },
    setDisconnect: (disconnect) => {
      if (!failure) {
        disconnectAppKit = disconnect;
      }
    },
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
    setClose: (nextCloseAppKit) => {
      if (!failure) {
        closeAppKit = nextCloseAppKit;
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

export function useAppKitAccountBridgeState(
  store: AppKitModalBridgeStore
): AppKitAccountState {
  return useSyncExternalStore(
    store.subscribe,
    store.getAccountSnapshot,
    getEmptyAppKitAccountState
  );
}

// Also catches a failed AppKitModalHooks chunk, so a network error fails the
// wallet bootstrap instead of the surrounding page.
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
    // A failed hooks chunk cannot load again in this page; the next connect
    // intent reloads it.
    noteWalletChunkFailure(error);
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
