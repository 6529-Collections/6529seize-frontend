"use client";

import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type {
  ApiProfileRepRatesState,
  RatingStats,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { commonApiFetch } from "@/services/api/common-api";

export function useRepAllocation({
  profile,
  category,
}: {
  readonly profile: ApiIdentity;
  readonly category: string | null;
}): {
  repState: RatingStats | null;
  heroAvailableRep: number;
  proxyAvailableCredit: number | null;
  minMaxValues: { readonly min: number; readonly max: number };
} {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const { data: proxyGrantorRepRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      {
        rater: activeProfileProxy?.created_by.handle,
        handleOrWallet: profile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${profile?.query}/rep/ratings/received`,
        params: activeProfileProxy?.created_by.handle
          ? { rater: activeProfileProxy.created_by.handle }
          : {},
      }),
    enabled: !!activeProfileProxy?.created_by.handle,
  });

  const { data: connectedProfileRepRates } =
    useQuery<ApiProfileRepRatesState>({
      queryKey: [
        QueryKey.PROFILE_REP_RATINGS,
        {
          rater: connectedProfile?.handle,
          handleOrWallet: profile?.handle,
        },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiProfileRepRatesState>({
          endpoint: `profiles/${profile?.query}/rep/ratings/received`,
          params: connectedProfile?.handle
            ? { rater: connectedProfile.handle }
            : {},
        }),
      enabled: !!connectedProfile?.handle,
    });

  const getRepState = (): RatingStats | null => {
    if (!category) return null;

    if (activeProfileProxy && proxyGrantorRepRates) {
      const target = proxyGrantorRepRates.rating_stats.find(
        (s) => s.category === category
      );
      return (
        target ?? {
          category,
          rating: 0,
          contributor_count: 0,
          rater_contribution: 0,
        }
      );
    }

    if (activeProfileProxy) return null;

    if (connectedProfileRepRates) {
      const target = connectedProfileRepRates.rating_stats.find(
        (s) => s.category === category
      );
      return (
        target ?? {
          category,
          rating: 0,
          contributor_count: 0,
          rater_contribution: 0,
        }
      );
    }

    return null;
  };

  const getProxyAvailableCredit = (): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ApiProfileProxyActionType.AllocateRep
    );
    if (!repProxy) return null;
    return Math.max(
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0),
      0
    );
  };

  const getHeroAvailableRep = (): number => {
    if (activeProfileProxy) {
      return proxyGrantorRepRates?.rep_rates_left_for_rater ?? 0;
    }
    return connectedProfileRepRates?.rep_rates_left_for_rater ?? 0;
  };

  const [repState, setRepState] = useState<RatingStats | null>(getRepState());
  const [proxyAvailableCredit, setProxyAvailableCredit] = useState<
    number | null
  >(getProxyAvailableCredit());
  const [heroAvailableRep, setHeroAvailableRep] = useState<number>(
    getHeroAvailableRep()
  );

  useEffect(() => {
    setRepState(getRepState());
  }, [
    category,
    proxyGrantorRepRates,
    activeProfileProxy,
    connectedProfileRepRates,
  ]);

  useEffect(
    () => setProxyAvailableCredit(getProxyAvailableCredit()),
    [activeProfileProxy]
  );

  useEffect(
    () => setHeroAvailableRep(getHeroAvailableRep()),
    [activeProfileProxy, proxyGrantorRepRates, connectedProfileRepRates]
  );

  const getMinValue = (): number => {
    const currentRep = repState?.rater_contribution ?? 0;
    const minHeroRep = 0 - (Math.abs(currentRep) + heroAvailableRep);
    if (typeof proxyAvailableCredit !== "number") return minHeroRep;
    const minProxyRep = currentRep - proxyAvailableCredit;
    return Math.abs(minHeroRep) < Math.abs(minProxyRep)
      ? minHeroRep
      : minProxyRep;
  };

  const getMaxValue = (): number => {
    const currentRep = repState?.rater_contribution ?? 0;
    const maxHeroRep = Math.abs(currentRep) + heroAvailableRep;
    if (typeof proxyAvailableCredit !== "number") return maxHeroRep;
    const maxProxyRep = currentRep + proxyAvailableCredit;
    return Math.min(maxHeroRep, maxProxyRep);
  };

  const [minMaxValues, setMinMaxValues] = useState<{
    readonly min: number;
    readonly max: number;
  }>({ min: getMinValue(), max: getMaxValue() });

  useEffect(
    () => setMinMaxValues({ min: getMinValue(), max: getMaxValue() }),
    [repState, proxyGrantorRepRates, proxyAvailableCredit, heroAvailableRep]
  );

  return { repState, heroAvailableRep, proxyAvailableCredit, minMaxValues };
}
