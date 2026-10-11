"use client";

import { useAuth } from "@/components/auth/authContext";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Delegation } from "@/entities/IDelegation";
import { fetchUrl } from "@/services/6529api";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getSetupChecklist,
  getSetupWalletFacts,
  type SetupChecklist,
  type SetupWallet,
  type SetupWalletFacts,
} from "./safe-collecting-setup";

export type SafeCollectingSetupState =
  | { readonly kind: "disconnected" }
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly retry: () => void }
  | {
      readonly kind: "ready";
      readonly connectedWallet: string;
      readonly primaryWallet: string | undefined;
      readonly wallets: readonly SetupWalletFacts[];
      readonly checklist: SetupChecklist;
    };

interface WalletDelegations {
  readonly rows: readonly Delegation[];
  /** When the rows were fetched, used to skip expired delegations. */
  readonly fetchedAtSeconds: number;
}

interface CombinedDelegations {
  readonly isError: boolean;
  readonly data: readonly (WalletDelegations | undefined)[];
  readonly refetch: () => void;
}

async function fetchWalletDelegations(
  wallet: string
): Promise<WalletDelegations> {
  const response = await fetchUrl<DBResponse<Delegation>>(
    `${publicEnv.API_ENDPOINT}/api/delegations/${wallet}`
  );
  return {
    rows: Array.isArray(response.data) ? response.data : [],
    fetchedAtSeconds: Math.floor(Date.now() / 1000),
  };
}

function combineDelegations(
  results: UseQueryResult<WalletDelegations>[]
): CombinedDelegations {
  return {
    isError: results.some((result) => result.isError),
    data: results.map((result) => result.data),
    refetch: () => {
      for (const result of results) {
        void result.refetch();
      }
    },
  };
}

function displayName(display: string | undefined, wallet: string) {
  return display?.trim() ? display : wallet;
}

function getProfileWallets(
  connectedAddress: string,
  profileWallets:
    | readonly { wallet: string; display?: string; tdh?: number }[]
    | undefined
): SetupWallet[] {
  const connectedKey = connectedAddress.toLowerCase();
  const wallets = (profileWallets ?? []).map((wallet) => ({
    wallet: wallet.wallet.toLowerCase(),
    display: displayName(wallet.display, wallet.wallet),
    tdh: wallet.tdh ?? 0,
  }));
  if (!wallets.some((wallet) => wallet.wallet === connectedKey)) {
    wallets.push({ wallet: connectedKey, display: connectedAddress, tdh: 0 });
  }
  return wallets;
}

function getReadyData(
  wallets: readonly SetupWallet[],
  data: readonly (WalletDelegations | undefined)[]
) {
  const loaded = data.filter(
    (item): item is WalletDelegations => item !== undefined
  );
  if (loaded.length !== wallets.length) {
    return undefined;
  }
  const delegationsByWallet = new Map(
    wallets.map(({ wallet }, index) => [wallet, loaded[index]?.rows ?? []])
  );
  const nowSeconds = Math.max(...loaded.map((item) => item.fetchedAtSeconds));
  const facts = getSetupWalletFacts(wallets, delegationsByWallet, nowSeconds);
  return { facts, checklist: getSetupChecklist(facts) };
}

/**
 * The connected collector's wallets (their profile's consolidation, or just
 * the connected wallet) with each wallet's delegations from the backend.
 */
export function useSafeCollectingSetup(): SafeCollectingSetupState {
  const { address } = useSeizeConnectContext();
  const { connectedProfile } = useAuth();

  const wallets = useMemo(
    () =>
      address ? getProfileWallets(address, connectedProfile?.wallets) : [],
    [address, connectedProfile?.wallets]
  );

  const delegations = useQueries({
    queries: wallets.map(({ wallet }) => ({
      queryKey: ["safe-collecting-delegations", wallet],
      queryFn: () => fetchWalletDelegations(wallet),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    })),
    combine: combineDelegations,
  });

  const ready = useMemo(
    () => getReadyData(wallets, delegations.data),
    [wallets, delegations.data]
  );

  if (!address) {
    return { kind: "disconnected" };
  }
  if (delegations.isError) {
    return { kind: "error", retry: delegations.refetch };
  }
  if (!ready) {
    return { kind: "loading" };
  }
  // The generated type says primary_wallet is always set, but a new or
  // incomplete profile can arrive without it.
  const primaryWallet: string | null | undefined =
    connectedProfile?.primary_wallet;
  return {
    kind: "ready",
    connectedWallet: address.toLowerCase(),
    primaryWallet: primaryWallet?.toLowerCase(),
    wallets: ready.facts,
    checklist: ready.checklist,
  };
}
