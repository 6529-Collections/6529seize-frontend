"use client";

import { useAuthChainGuard } from "@/components/auth/useAuthChainGuard";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { useCallback } from "react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";

export type NetworkSwitchOutcome = "switched" | "rejected" | "failed";

/** wagmi's WalletConnect connector id and type (also used by AppKit). */
const WALLET_CONNECT_CONNECTOR = "walletConnect";

interface SignedMessagesWallet {
  /**
   * The live wallet answers through WalletConnect, usually an app on a
   * phone: there is nothing to unlock in this browser.
   */
  readonly isRemoteWallet: boolean;
  /** The network the wallet is asked to switch to. */
  readonly networkName: string;
  /** The auth chain guard's check, read from the latest wallet state. */
  readonly isNetworkSupported: () => boolean;
  readonly switchNetwork: () => Promise<NetworkSwitchOutcome>;
}

/**
 * What "Turn on signed messages" needs from the live wallet: how it answers,
 * and a network the auth chain guard accepts. Switching asks the wallet to
 * move to the first configured network.
 */
export function useSignedMessagesWallet(): SignedMessagesWallet {
  const { connector } = useAccount();
  const { isLatestChainSupported } = useAuthChainGuard();
  const { chains } = useConfig();
  const { switchChainAsync } = useSwitchChain();
  const target = chains[0];

  const switchNetwork = useCallback(async (): Promise<NetworkSwitchOutcome> => {
    try {
      await switchChainAsync({ chainId: target.id });
    } catch (error) {
      return isUserRejectedSigningError(error) ? "rejected" : "failed";
    }
    return isLatestChainSupported() ? "switched" : "failed";
  }, [isLatestChainSupported, switchChainAsync, target]);

  return {
    isRemoteWallet:
      connector?.id === WALLET_CONNECT_CONNECTOR ||
      connector?.type === WALLET_CONNECT_CONNECTOR,
    networkName: target.name,
    isNetworkSupported: isLatestChainSupported,
    switchNetwork,
  };
}
