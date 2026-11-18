/**
 * Opens the 6529 Desktop connect choice from the shared connect flow. The
 * flow passes how to open WalletConnect for this request; the dialog calls
 * it if the user picks WalletConnect.
 */

import {
  cancelBrowserConnectorSignIn,
  resetFinishedBrowserConnectorStatus,
} from "./browserConnectorSignIn";

type OpenWalletConnect = () => Promise<void>;

export type DesktopWalletSetupStatus =
  | "picker"
  | "browser"
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
let walletSetup: DesktopWalletSetup | undefined;
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
  if (walletSetup) closeDesktopConnectDialog();
  else if (setup) cancelBrowserConnectorSignIn();
  // A finished or failed earlier browser sign-in must not show again.
  resetFinishedBrowserConnectorStatus();
  openWalletConnect = open;
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
  reason: "cancelled" | "signed-in" | "walletconnect" = "cancelled"
): void {
  if (openWalletConnect === null) return;
  const setup = walletSetup;
  walletSetup = undefined;
  openWalletConnect = null;
  stopWatchingAbort?.();
  stopWatchingAbort = undefined;
  if (setup && reason === "cancelled") {
    cancelBrowserConnectorSignIn();
    if (!setup.signal.aborted) setup.onStatus("cancelled");
  }
  notify();
}

export const getDesktopWalletSetup = (): DesktopWalletSetup | undefined =>
  walletSetup;

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
