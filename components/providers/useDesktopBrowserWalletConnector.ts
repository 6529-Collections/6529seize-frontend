"use client";

import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { useEffect } from "react";
import { isDesktopShell } from "@/helpers/desktop-shell";
import {
  desktopWalletSendsTransactions,
  getDesktopWalletMethods,
  isBrowserWalletProfile,
  loadBrowserWalletProfiles,
  runDesktopWalletRequest,
  showDesktopWalletTransactionRefusal,
  watchDesktopWalletStatus,
} from "@/services/desktop/desktopBrowserWallet";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  DESKTOP_BROWSER_WALLET_CONNECTOR_ID,
  desktopBrowserWalletConnector,
} from "@/wagmiConfig/desktopBrowserWalletConnector";

// Loaded with the connector, inside 6529 Desktop only, so the web never
// loads the auth helpers or the request rules for it.
const loadWalletAddressReader = () =>
  import("@/services/auth/auth.utils").then(
    (module) => module.getWalletAddress
  );
const loadPrecheck = () =>
  import("@/services/desktop/walletForwardingPrecheck").then(
    (module) => module.walletForwardingPrecheck
  );

/**
 * Installs the 6529 Desktop wallet-forwarding connector on the wallet-stack
 * adapter, only inside 6529 Desktop and only when the shell says it
 * forwards wallet requests. Does nothing on the web and in desktop builds
 * without forwarding.
 */
export function useDesktopBrowserWalletConnector(
  currentAdapter: WagmiAdapter | null
): void {
  useEffect(() => {
    if (currentAdapter === null || !isDesktopShell()) return undefined;
    let cancelled = false;
    const install = async () => {
      const [methods, , getWalletAddress, precheck] = await Promise.all([
        getDesktopWalletMethods(),
        loadBrowserWalletProfiles(),
        loadWalletAddressReader(),
        loadPrecheck(),
      ]);
      const { wagmiConfig } = currentAdapter;
      if (
        cancelled ||
        methods.length === 0 ||
        wagmiConfig.connectors.some(
          (connector) => connector.id === DESKTOP_BROWSER_WALLET_CONNECTOR_ID
        )
      ) {
        return;
      }
      const connector = wagmiConfig._internal.connectors.setup(
        desktopBrowserWalletConnector({
          // The active profile, when it signed in with a browser wallet.
          getAddress: () => {
            const address = getWalletAddress();
            return isBrowserWalletProfile(address) ? address : null;
          },
          prepare: precheck,
          runRequest: runDesktopWalletRequest,
          onTransactionRefused: showDesktopWalletTransactionRefusal,
          sendsTransactions: desktopWalletSendsTransactions,
        })
      );
      wagmiConfig._internal.connectors.setState((connectors) => [
        ...connectors,
        connector,
      ]);
      watchDesktopWalletStatus();
    };
    install().catch((error_: unknown) => {
      logErrorSecurely("[WagmiSetup] Wallet forwarding unavailable", error_);
    });
    return () => {
      cancelled = true;
    };
  }, [currentAdapter]);
}
