"use client";

import { useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiProfileRepRatesState, RatingStats } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import {
  chainRatingTargetOf,
  useChainRatingAllowance,
} from "@/components/chain-identity/useChainRatingAllowance";

/** A chain amount as the forms' numbers; REP and NIC stay far below 2^53. */
const toFormNumber = (value: bigint): number => Number(value);

export function useRepAllocation({
  profile,
  category,
  enabled = true,
}: {
  readonly profile: ApiIdentity;
  readonly category: string | null;
  readonly enabled?: boolean;
}): {
  repState: RatingStats | null;
  ratingStats: readonly RatingStats[] | undefined;
  heroAvailableRep: number;
  proxyAvailableCredit: number | null;
  minMaxValues: { readonly min: number; readonly max: number };
  isError: boolean;
  /** The 6529 Network read's error, for words a retry can't fix. */
  chainError: unknown;
  isFetching: boolean;
  retry: () => void;
} {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const profileIdentity = (
    profile.query ??
    profile.handle ??
    profile.display
  ).toLowerCase();

  const rater = activeProfileProxy
    ? activeProfileProxy.created_by.handle
    : connectedProfile?.handle;
  const allocation = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      { rater, handleOrWallet: profileIdentity },
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${profileIdentity}/rep/ratings/received`,
        params: rater ? { rater } : {},
        signal,
      }),
    enabled: enabled && !!rater,
  });
  // On the 6529 Network the chain's numbers count: the rater's TDH less what
  // it has given, and its rating in this category. 6529.io's copy can lag.
  const chain = useChainRatingAllowance({
    matter: "REP",
    target: chainRatingTargetOf(profile),
    category,
    enabled,
  });
  const chainData = chain.active ? chain.data : undefined;
  const data = allocation.data;
  // Derive the contribution and limits from one query snapshot. Mirroring each
  // value in state briefly paired new credit with an old contribution/limit.
  const repState = useMemo((): RatingStats | null => {
    if (!category || (!data && !chainData)) return null;
    const stats = data?.rating_stats.find(
      (item) => item.category === category
    ) ?? {
      category,
      rating: 0,
      contributor_count: 0,
      rater_contribution: 0,
    };
    return chainData
      ? { ...stats, rater_contribution: toFormNumber(chainData.current) }
      : stats;
  }, [category, data, chainData]);
  const repProxy = activeProfileProxy?.actions.find(
    (action) => action.action_type === ApiProfileProxyActionType.AllocateRep
  );
  const proxyAvailableCredit = repProxy
    ? Math.max((repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0), 0)
    : null;
  // Before the chain has counted the day's TDH it can't say what is left;
  // 6529.io's figure stands in, and the chain still checks the change.
  const chainAvailable = chainData?.available ?? null;
  const heroAvailableRep =
    chain.active && chainAvailable !== null
      ? toFormNumber(chainAvailable)
      : (data?.rep_rates_left_for_rater ?? 0);
  const currentRep = repState?.rater_contribution ?? 0;
  const minMaxValues = useMemo(() => {
    const minHeroRep = -(Math.abs(currentRep) + heroAvailableRep);
    const maxHeroRep = Math.abs(currentRep) + heroAvailableRep;
    if (proxyAvailableCredit === null)
      return { min: minHeroRep, max: maxHeroRep };
    const minProxyRep = currentRep - proxyAvailableCredit;
    return {
      min:
        Math.abs(minHeroRep) < Math.abs(minProxyRep) ? minHeroRep : minProxyRep,
      max: Math.min(maxHeroRep, currentRep + proxyAvailableCredit),
    };
  }, [currentRep, heroAvailableRep, proxyAvailableCredit]);

  return {
    repState,
    ratingStats: data?.rating_stats,
    heroAvailableRep,
    proxyAvailableCredit,
    minMaxValues,
    isError: allocation.isError || (chain.active && chain.isError),
    chainError: chain.active ? chain.error : null,
    isFetching: allocation.isFetching || (chain.active && chain.isFetching),
    retry: () => {
      void allocation.refetch();
      if (chain.active) {
        void chain.refetch();
      }
    },
  };
}
