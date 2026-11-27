"use client";

import type { ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { STREAM_CHAIN } from "@/lib/stream/client";

/** The wallet that signs: wagmi's connected account and its network. */
export function useStreamWallet() {
  const { seizeConnect } = useSeizeConnectContext();
  const account = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  return {
    address: account.isConnected ? account.address : undefined,
    onSepolia: account.chainId === STREAM_CHAIN.id,
    connect: seizeConnect,
    switchToSepolia: () => switchChain({ chainId: STREAM_CHAIN.id }),
    switching: isPending,
  };
}

/**
 * Shows its children only to a connected wallet on Sepolia. Otherwise it
 * offers the one thing to do next: connect, or switch to Sepolia.
 */
export function WalletGate({
  children,
  reason,
}: {
  readonly children: ReactNode;
  /** One line saying why a wallet is needed here. */
  readonly reason?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  if (!wallet.address) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        {reason ? <p className="tw-m-0 tw-text-sm tw-text-iron-400">{reason}</p> : null}
        <Button variant="action" size="lg" onClick={() => wallet.connect()}>
          {t(locale, "streamSepolia.wallet.connect")}
        </Button>
      </div>
    );
  }
  if (!wallet.onSepolia) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(locale, "streamSepolia.wallet.wrongChain")}
        </p>
        <Button
          variant="action"
          size="lg"
          loading={wallet.switching}
          onClick={wallet.switchToSepolia}
        >
          {t(locale, "streamSepolia.wallet.switch")}
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
