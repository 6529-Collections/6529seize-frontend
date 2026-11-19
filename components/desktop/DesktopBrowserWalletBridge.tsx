"use client";

import {
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  cancelDesktopWalletRequest,
  forgetBrowserWalletProfile,
  getDesktopWalletRequestStatus,
  isBrowserWalletProfile,
  subscribeBrowserWalletProfiles,
} from "@/services/desktop/desktopBrowserWallet";
import { DESKTOP_BROWSER_WALLET_CONNECTOR_ID } from "@/wagmiConfig/desktopBrowserWalletConnector";

/**
 * Inside 6529 Desktop with wallet forwarding:
 * - connects the forwarding connector for the active profile only when it
 *   signed in with a browser wallet and no other wallet is connected;
 * - disconnects it when the active profile changes to one it may not sign
 *   for, and cancels an open request on a profile switch or sign-out;
 * - forgets a profile that connects with WalletConnect, so forwarding is
 *   never offered to it.
 * Does nothing when the connector is not installed (the web, and desktop
 * builds without forwarding).
 */
export default function DesktopBrowserWalletBridge() {
  const { address: activeAddress } = useSeizeConnectContext();
  const account = useAccount();
  const connectors = useConnectors();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const connector = connectors.find(
    (candidate) => candidate.id === DESKTOP_BROWSER_WALLET_CONNECTOR_ID
  );
  const connectorId = account.connector?.id ?? null;
  const isForwarding = connectorId === DESKTOP_BROWSER_WALLET_CONNECTOR_ID;
  const active = activeAddress?.toLowerCase() ?? null;
  const connectedAddress = account.address?.toLowerCase() ?? null;
  const mayForward = useSyncExternalStore(
    subscribeBrowserWalletProfiles,
    () => isBrowserWalletProfile(active),
    () => false
  );

  const connecting = useRef(false);
  const [connectionRevision, retryForActiveProfile] = useReducer(
    (revision: number) => revision + 1,
    0
  );
  const finishConnection = useEffectEvent((startedFor: string | null) => {
    connecting.current = false;
    if (startedFor !== active) retryForActiveProfile();
  });

  // A request belongs to the profile that started it.
  const requestProfile = useRef(active);
  useEffect(() => {
    if (requestProfile.current === active) return;
    requestProfile.current = active;
    if (getDesktopWalletRequestStatus().kind === "waiting") {
      cancelDesktopWalletRequest();
    }
  }, [active]);

  useEffect(() => {
    if (!connector) return;
    if (
      connectorId !== null &&
      !isForwarding &&
      mayForward &&
      connectedAddress === active &&
      active !== null
    ) {
      forgetBrowserWalletProfile(active).catch(() => undefined);
      return;
    }
    if (isForwarding && (!mayForward || connectedAddress !== active)) {
      disconnectAsync({ connector }).catch(() => undefined);
      return;
    }
    if (
      !isForwarding &&
      mayForward &&
      account.status === "disconnected" &&
      !connecting.current
    ) {
      // One connect at a time: wagmi reports "disconnected" until it lands.
      connecting.current = true;
      connectAsync({ connector })
        .catch(() => undefined)
        .finally(() => finishConnection(active));
    }
  }, [
    account.status,
    active,
    connectAsync,
    connectedAddress,
    connector,
    connectorId,
    connectionRevision,
    disconnectAsync,
    isForwarding,
    mayForward,
  ]);

  return null;
}
