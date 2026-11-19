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
  getDesktopConnectDialogOpener,
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
  const startAttempt = useRef<number | null>(null);
  const attempts = useRef(0);
  const [isStarting, setIsStarting] = useState(false);
  const isOpen = openWalletConnect !== null;
  const isBusy = isStarting || status === "waiting" || status === "signing-in";

  // A finished browser sign-in closes the choice.
  useEffect(() => {
    if (isOpen && status === "signed-in") closeDesktopConnectDialog();
  }, [isOpen, status]);

  // Waiting for the browser can be cancelled. Once the app is signing in
  // with the returned signature, closing (the dialog's own Close button or
  // Escape) only hides the dialog: the sign-in finishes on its own.
  const close = () => {
    // Also while the start is still asking the shell for its scheme (the
    // status is idle then), so the browser does not open after closing.
    if (status === "waiting" || startAttempt.current !== null) {
      cancelBrowserConnectorSignIn();
    }
    startAttempt.current = null;
    setIsStarting(false);
    setProblem(null);
    closeDesktopConnectDialog();
  };

  const chooseWalletConnect = () => {
    const open = openWalletConnect;
    if (!open) return;
    setProblem(null);
    closeDesktopConnectDialog();
    open().catch(() => {
      // Bring the choice back with the reason, instead of failing silently.
      openDesktopConnectDialog(open);
      setProblem("walletconnect-failed");
    });
  };

  const chooseBrowserWallet = () => {
    if (startAttempt.current !== null) return;
    attempts.current += 1;
    const attempt = attempts.current;
    startAttempt.current = attempt;
    setIsStarting(true);
    setProblem(null);
    startBrowserConnectorSignIn()
      .catch(() => {
        if (startAttempt.current === attempt) setProblem("start-failed");
      })
      .finally(() => {
        if (startAttempt.current !== attempt) return;
        startAttempt.current = null;
        setIsStarting(false);
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
      onCancel={cancelBrowserConnectorSignIn}
    />
  );
}
