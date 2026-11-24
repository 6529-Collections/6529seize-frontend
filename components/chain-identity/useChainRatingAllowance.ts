"use client";

import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import type { Hex } from "viem";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import type { RatingMatter } from "@/lib/chain-identity/identityOps";
import {
  readRatingAllowance,
  type ChainRatingTarget,
} from "@/lib/chain-identity/ratings";

/** A 6529.io profile as the chain finds it: its handle, then its wallets. */
export function chainRatingTargetOf(profile: ApiIdentity): ChainRatingTarget {
  return {
    handle: profile.handle,
    wallets: [
      ...(profile.primary_wallet ? [profile.primary_wallet] : []),
      ...(profile.wallets ?? []).map((item) => item.wallet),
    ],
  };
}

/** Every allowance read starts with this key; a rating write refreshes them. */
export const CHAIN_RATING_ALLOWANCE_KEY = [
  QueryKey.CHAIN_IDENTITY,
  "rating-allowance",
] as const;

/**
 * Once identities are on the 6529 Network: how much the connected wallet's
 * identity can still give `target` in REP (one category) or NIC, read from
 * the chain at its head. Disabled, and never fetched, before the switch-on
 * or without the chain flows.
 */
export function useChainRatingAllowance({
  matter,
  target,
  category,
  enabled = true,
}: {
  readonly matter: RatingMatter;
  readonly target: ChainRatingTarget;
  readonly category: string | null;
  readonly enabled?: boolean;
}) {
  const active = useChainIdentityActive();
  const wallet = useContext(SeizeConnectContext)?.address?.toLowerCase() as
    | Hex
    | undefined;
  const targetKey = [
    target.handle?.toLowerCase() ?? "",
    ...(target.wallets ?? []).map((item) => item.toLowerCase()),
  ].join(",");
  const query = useQuery({
    queryKey: [
      ...CHAIN_RATING_ALLOWANCE_KEY,
      wallet,
      matter,
      targetKey,
      category?.toLowerCase() ?? null,
    ],
    queryFn: ({ signal }) =>
      readRatingAllowance(wallet as Hex, { matter, target, category }, signal),
    enabled:
      active &&
      enabled &&
      wallet !== undefined &&
      (matter === "NIC" || category !== null),
    staleTime: 5_000,
    retry: 1,
  });
  return { active, ...query } as const;
}
