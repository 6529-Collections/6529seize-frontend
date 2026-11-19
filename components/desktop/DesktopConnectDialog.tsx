"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import DesktopConnectDialogView, {
  type DesktopConnectProblem,
} from "./DesktopConnectDialogView";
import {
  cancelBrowserConnectorSignIn,
  getBrowserConnectorStatus,
  getServerBrowserConnectorStatus,
  startBrowserConnectorSignIn,
  subscribeBrowserConnectorStatus,
} from "@/services/desktop/browserConnectorSignIn";
import {
  closeDesktopConnectDialog,
  finishDesktopConnectHandoff,
  getDesktopConnectDialogOpener,
  getDesktopConnectPickerVersion,
  getDesktopWalletSetup,
  openDesktopConnectDialog,
  getServerDesktopConnectDialogOpener,
  subscribeDesktopConnectDialog,
} from "@/services/desktop/desktopConnectDialog";

/**
 * The 6529 Desktop connect choice: sign in with a browser wallet through the
 * browser connector (it opens the system browser, where extensions such as
 * MetaMask live), or scan a QR code with a phone wallet (WalletConnect). Seed wallets of the older desktop app are not offered: they
 * exposed private keys to the page. Renders nothing until the shared connect
 * flow opens it, which happens only inside 6529 Desktop.
 */
export default function DesktopConnectDialog() {
  const openWalletConnect = useSyncExternalStore(
    subscribeDesktopConnectDialog,
    getDesktopConnectDialogOpener,
    getServerDesktopConnectDialogOpener
  );
  const status = useSyncExternalStore(
    subscribeBrowserConnectorStatus,
    getBrowserConnectorStatus,
    getServerBrowserConnectorStatus
  );
  const [problem, setProblem] = useState<DesktopConnectProblem>(null);
  // The browser sign-in start in flight, set synchronously so a double click
  // starts only one. Closing clears it; a cleared attempt's result is ignored.
  const startAttempt = useRef<{ picker: number } | null>(null);
  const [startingPicker, setStartingPicker] = useState<number | null>(null);
  const picker = getDesktopConnectPickerVersion();
  const isOpen = openWalletConnect !== null;
  const isStarting = isOpen && startingPicker === picker;
  const isBusy = isStarting || status === "waiting" || status === "signing-in";

  // A finished browser sign-in closes the choice.
  useEffect(() => {
    if (isOpen && status === "signed-in")
      closeDesktopConnectDialog("signed-in");
  }, [isOpen, status]);

  // Waiting for the browser can be cancelled. Once the app is signing in
  // with the returned signature, closing (the dialog's own Close button or
  // Escape) only hides the dialog: the sign-in finishes on its own.
  const close = () => {
    // Also while the start is still asking the shell for its scheme (the
    // status is idle then), so the browser does not open after closing.
    if (!getDesktopWalletSetup() && (status === "waiting" || isStarting)) {
      cancelBrowserConnectorSignIn();
    }
    startAttempt.current = null;
    setStartingPicker(null);
    setProblem(null);
    closeDesktopConnectDialog(status === "signing-in" ? "hidden" : "cancelled");
  };

  const chooseWalletConnect = () => {
    const open = openWalletConnect;
    if (!open) return;
    const setup = getDesktopWalletSetup();
    setProblem(null);
    closeDesktopConnectDialog("walletconnect");
    open()
      .then(() => {
        finishDesktopConnectHandoff(picker, "walletconnect");
      })
      .catch(() => {
        if (!finishDesktopConnectHandoff(picker, "failed")) return;
        // Bring the unscoped choice back with the reason.
        if (
          !setup &&
          getDesktopConnectPickerVersion() === picker &&
          getDesktopConnectDialogOpener() === null
        ) {
          openDesktopConnectDialog(open);
          setProblem("walletconnect-failed");
        }
      });
  };

  const chooseBrowserWallet = () => {
    if (startAttempt.current?.picker === picker) return;
    const attempt = { picker };
    const stillStarting = () =>
      startAttempt.current === attempt &&
      getDesktopConnectPickerVersion() === picker &&
      getDesktopConnectDialogOpener() !== null;
    startAttempt.current = attempt;
    setStartingPicker(picker);
    setProblem(null);
    const setup = getDesktopWalletSetup();
    startBrowserConnectorSignIn(setup)
      .catch(() => {
        if (!stillStarting()) return;
        if (setup) setup.onStatus("failed");
        else setProblem("start-failed");
      })
      .finally(() => {
        if (!stillStarting()) return;
        startAttempt.current = null;
        setStartingPicker(null);
      });
  };

  return (
    <DesktopConnectDialogView
      isOpen={isOpen}
      isBusy={isBusy}
      status={status}
      problem={problem}
      onClose={close}
      onBrowserWallet={chooseBrowserWallet}
      onWalletConnect={chooseWalletConnect}
      onCancel={() => {
        if (getDesktopWalletSetup()) close();
        else cancelBrowserConnectorSignIn();
      }}
    />
  );
}
