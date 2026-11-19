/**
 * Opens the 6529 Desktop connect choice from the shared connect flow. The
 * flow passes how to open WalletConnect for this request; the dialog calls
 * it if the user picks WalletConnect.
 */

import {
  cancelBrowserConnectorSignIn,
  getBrowserConnectorStatus,
  resetFinishedBrowserConnectorStatus,
} from "./browserConnectorSignIn";

type OpenWalletConnect = (signal?: AbortSignal) => Promise<void>;

export type DesktopWalletSetupStatus =
  | "picker"
  | "opening-browser"
  | "browser"
  | "signing-in"
  | "signed-in"
  | "walletconnect"
  | "cancelled"
  | "failed";

/** The permission request that opened this picker, if any. */
export interface DesktopWalletSetup {
  readonly address: string;
  readonly signal: AbortSignal;
  readonly onStatus: (status: DesktopWalletSetupStatus) => void;
}

let openWalletConnect: OpenWalletConnect | null = null;
let pickerVersion = 0;
let walletSetup: DesktopWalletSetup | undefined;
let handoffAbort: AbortController | undefined;
let stopWatchingAbort: (() => void) | undefined;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export function openDesktopConnectDialog(
  open: OpenWalletConnect,
  setup?: DesktopWalletSetup
): void {
  if (setup?.signal.aborted) return;
  // A new picker must not inherit the previous permission request.
  if (walletSetup || handoffAbort) {
    const hadSetup = walletSetup !== undefined;
    closeDesktopConnectDialog();
    if (!hadSetup && getBrowserConnectorStatus() !== "signing-in") {
      cancelBrowserConnectorSignIn();
    }
  } else if (setup) cancelBrowserConnectorSignIn();
  // A finished or failed earlier browser sign-in must not show again.
  resetFinishedBrowserConnectorStatus();
  pickerVersion += 1;
  const controller = new AbortController();
  handoffAbort = controller;
  openWalletConnect = (signal = controller.signal) => open(signal);
  walletSetup = setup;
  if (setup) {
    const abort = () => closeDesktopConnectDialog();
    setup.signal.addEventListener("abort", abort, { once: true });
    stopWatchingAbort = () => setup.signal.removeEventListener("abort", abort);
    setup.onStatus("picker");
  }
  notify();
}

export function closeDesktopConnectDialog(
  reason: "cancelled" | "signed-in" | "walletconnect" | "hidden" = "cancelled"
): void {
  if (openWalletConnect === null && !handoffAbort) return;
  openWalletConnect = null;
  if (reason === "walletconnect" || reason === "hidden") {
    notify();
    return;
  }
  const setup = walletSetup;
  walletSetup = undefined;
  stopWatchingAbort?.();
  stopWatchingAbort = undefined;
  handoffAbort?.abort();
  handoffAbort = undefined;
  if (setup && reason === "cancelled") {
    cancelBrowserConnectorSignIn();
    if (!setup.signal.aborted) setup.onStatus("cancelled");
  }
  notify();
}

/** Release setup ownership before its completion callback can abort the signal. */
export function finishDesktopConnectHandoff(
  version: number,
  status: "walletconnect" | "failed"
): boolean {
  if (version !== pickerVersion || !handoffAbort) return false;
  const setup = walletSetup;
  walletSetup = undefined;
  handoffAbort = undefined;
  stopWatchingAbort?.();
  stopWatchingAbort = undefined;
  if (!setup?.signal.aborted) setup?.onStatus(status);
  return true;
}

export const getDesktopWalletSetup = (): DesktopWalletSetup | undefined =>
  walletSetup;

/** Keep async callbacks scoped to the picker that started them. */
export const getDesktopConnectPickerVersion = (): number => pickerVersion;

export const getDesktopConnectDialogOpener = (): OpenWalletConnect | null =>
  openWalletConnect;

export const getServerDesktopConnectDialogOpener =
  (): OpenWalletConnect | null => null;

export function subscribeDesktopConnectDialog(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
