"use client";

import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
  useWalletInfo,
} from "@reown/appkit/react";
import { useEffect } from "react";
import { isSafeWalletInfo } from "@/utils/wallet-detection";
import { useAppKitModalBridgeStore } from "./appKitModalBridgeStoreContext";

/** Mirrors AppKit modal and account state into the bridge store. */
export default function AppKitModalHooks() {
  const store = useAppKitModalBridgeStore();
  const { close, open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { walletInfo } = useWalletInfo();
  const { open: isOpen } = useAppKitState();
  const walletName = walletInfo?.name;
  const walletIcon = walletInfo?.icon;
  const isSafeWallet = isSafeWalletInfo(walletInfo);

  useEffect(() => {
    store.setOpen(open);
    store.setClose(close);
    store.setDisconnect(disconnect);
    return () => {
      store.setOpen(null);
      store.setClose(null);
      store.setDisconnect(null);
    };
  }, [close, disconnect, open, store]);

  useEffect(() => {
    store.setAccount({ address, isConnected, status });
  }, [address, isConnected, status, store]);

  useEffect(() => {
    store.setState({ isOpen, walletName, walletIcon, isSafeWallet });
  }, [isOpen, isSafeWallet, store, walletIcon, walletName]);

  return null;
}
