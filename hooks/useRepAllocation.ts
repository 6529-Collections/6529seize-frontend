"use client";

import { useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiProfileRepRatesState, RatingStats } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

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
  heroAvailableRep: number;
  proxyAvailableCredit: number | null;
  minMaxValues: { readonly min: number; readonly max: number };
  isError: boolean;
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
  const data = allocation.data;
  // Derive the contribution and limits from one query snapshot. Mirroring each
  // value in state briefly paired new credit with an old contribution/limit.
  const repState = useMemo((): RatingStats | null => {
    if (!category || !data) return null;
    return (
      data.rating_stats.find((item) => item.category === category) ?? {
        category,
        rating: 0,
        contributor_count: 0,
        rater_contribution: 0,
      }
    );
  }, [category, data]);
  const repProxy = activeProfileProxy?.actions.find(
    (action) => action.action_type === ApiProfileProxyActionType.AllocateRep
  );
  const proxyAvailableCredit = repProxy
    ? Math.max((repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0), 0)
    : null;
  const heroAvailableRep = data?.rep_rates_left_for_rater ?? 0;
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
    heroAvailableRep,
    proxyAvailableCredit,
    minMaxValues,
    isError: allocation.isError,
    isFetching: allocation.isFetching,
    retry: () => {
      void allocation.refetch();
    },
  };
}
