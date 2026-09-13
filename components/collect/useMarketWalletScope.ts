"use client";

import type { useAuth } from "@/components/auth/Auth";
import type { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { Capacitor } from "@capacitor/core";
import { useLayoutEffect, useRef } from "react";
import type { PublicClient, WalletClient } from "viem";
import { useAccount } from "wagmi";
import { collectProfileWallets } from "./collect-recipient.helpers";

interface Snapshot {
  readonly auth: ReturnType<typeof useAuth>;
  readonly connection: ReturnType<typeof useSeizeConnectContext>;
  readonly wallet: WalletClient | undefined;
  readonly client: PublicClient | undefined;
}
type Actor = { readonly profile_id: string; readonly wallet: string };

function compareWallets(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Wallet-client objects may refresh; account, connector and actor authority may not. */
export function useMarketWalletScope(snapshot: Snapshot) {
  const { auth, connection, wallet, client } = snapshot;
  const account = useAccount();
  const address = connection.address?.toLowerCase();
  const scope = JSON.stringify([
    auth.connectedProfile?.id,
    Boolean(auth.isAuthenticated),
    Boolean(auth.activeProfileProxy),
    address,
    connection.canSignActiveWallet,
    connection.isSafeWallet,
    account.address?.toLowerCase(),
    account.chainId,
    account.connector?.uid,
    wallet?.account?.address.toLowerCase(),
    wallet?.chain?.id,
    collectProfileWallets(auth.connectedProfile)
      .map((item) => item.wallet.toLowerCase())
      .sort(compareWallets),
  ]);
  const ready = Boolean(
    client &&
    wallet &&
    account.connector?.uid &&
    auth.connectedProfile?.id &&
    auth.isAuthenticated &&
    !auth.activeProfileProxy &&
    connection.canSignActiveWallet &&
    !connection.isSafeWallet &&
    !Capacitor.isNativePlatform() &&
    address &&
    account.address?.toLowerCase() === address &&
    wallet.account?.address.toLowerCase() === address &&
    account.chainId === 1 &&
    wallet.chain?.id === 1
  );
  const live = useRef({
    scope,
    ready,
    snapshot,
    generation: 0,
    mounted: false,
  });
  useLayoutEffect(() => {
    const previous = live.current;
    live.current = {
      scope,
      ready,
      snapshot,
      generation: previous.generation + Number(previous.scope !== scope),
      mounted: true,
    };
  }, [scope, ready, snapshot]);
  useLayoutEffect(
    () => () => {
      live.current.mounted = false;
      live.current.generation++;
    },
    []
  );
  const capture = (
    actor: Actor,
    recovery = false,
    allowHistoricalProfile = false
  ) => {
    const generation = live.current.generation;
    const assertCurrent = () => {
      const current = live.current,
        state = current.snapshot;
      if (
        !current.mounted ||
        current.generation !== generation ||
        !state.auth.isAuthenticated ||
        state.auth.activeProfileProxy ||
        (!allowHistoricalProfile &&
          state.auth.connectedProfile?.id !== actor.profile_id) ||
        state.connection.address?.toLowerCase() !== actor.wallet.toLowerCase()
      )
        throw new Error("MARKET_CONNECTION_CHANGED");
      if (!recovery && !current.ready)
        throw new Error("MARKET_WALLET_NOT_READY");
    };
    assertCurrent();
    return assertCurrent;
  };
  const unavailableReason =
    account.chainId !== undefined && account.chainId !== 1
      ? ("collect.trade.wrongChain" as const)
      : ("collect.trade.walletNotReady" as const);
  return {
    ready,
    readinessReason: ready ? undefined : unavailableReason,
    capture,
  };
}
