"use client";

import { useAccount } from "wagmi";
import { DESKTOP_BROWSER_WALLET_CONNECTOR_ID } from "@/wagmiConfig/desktopBrowserWalletConnector";

/**
 * True when the live wallet is 6529 Desktop's browser forwarding, which
 * signs only the requests its browser page can describe. Always false on
 * the web.
 */
export function useIsDesktopBrowserWallet(): boolean {
  const { connector } = useAccount();
  return connector?.id === DESKTOP_BROWSER_WALLET_CONNECTOR_ID;
}
