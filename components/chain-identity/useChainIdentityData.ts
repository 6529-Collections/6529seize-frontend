"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Hex } from "viem";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { RATING_MATTER } from "@/lib/chain-identity/identityOps";
import { usableSessionKey } from "@/lib/chain-identity/session";
import {
  readIdentityBalance,
  readRaterSpent,
  readWalletBalance,
} from "@/lib/chain-identity/state";

/** The connected wallet's identity, balances and session key, read at the head. */
export function useChainIdentityData(wallet: Hex | undefined) {
  const queryClient = useQueryClient();
  const walletKey = wallet?.toLowerCase();

  const identity = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "by-wallet", walletKey],
    queryFn: ({ signal }) =>
      chainGateway.getIdentityByWallet(wallet as Hex, signal),
    enabled: !!wallet,
    staleTime: 5_000,
  });

  const ops = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "ops"],
    queryFn: ({ signal }) => chainGateway.getOps(signal),
    staleTime: 60_000,
  });

  const principalId = identity.data?.principalId ?? null;
  const asset = ops.data?.currencyAsset ?? null;

  const balances = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "balances", walletKey, principalId],
    queryFn: async ({ signal }) => ({
      wallet: await readWalletBalance(wallet as Hex, asset as Hex, signal),
      identity:
        principalId === null
          ? null
          : await readIdentityBalance(principalId, asset as Hex, signal),
    }),
    enabled: !!wallet && asset !== null && identity.isSuccess,
    staleTime: 5_000,
  });

  // What the identity has given in REP and in NIC; its TDH caps each.
  const given = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "given", principalId],
    queryFn: async ({ signal }) => {
      const [rep, nic] = await Promise.all([
        readRaterSpent(principalId as Hex, RATING_MATTER.REP, signal),
        readRaterSpent(principalId as Hex, RATING_MATTER.NIC, signal),
      ]);
      return { rep, nic };
    },
    enabled: principalId !== null,
    staleTime: 5_000,
  });

  const session = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "session", principalId],
    queryFn: () => usableSessionKey(principalId as Hex),
    enabled: principalId !== null,
    staleTime: 30_000,
  });

  const refresh = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: [QueryKey.CHAIN_IDENTITY] }),
    [queryClient]
  );

  return { identity, ops, balances, given, session, refresh } as const;
}
