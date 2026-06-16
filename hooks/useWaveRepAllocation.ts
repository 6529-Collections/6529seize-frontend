"use client";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiAvailableRatingCredit } from "@/generated/models/ApiAvailableRatingCredit";
import type { ApiWaveRepRating } from "@/generated/models/ApiWaveRepRating";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";

export function useWaveRepAllocation({
  waveId,
  category,
}: {
  readonly waveId: string;
  readonly category: string | null;
}): {
  readonly currentRating: number;
  readonly availableWaveRep: number;
  readonly minMaxValues: { readonly min: number; readonly max: number };
  readonly isLoading: boolean;
} {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const raterIdentity = connectedProfile?.handle?.trim().toLowerCase() ?? "";
  const trimmedCategory = category?.trim() || null;
  const enabled = !!raterIdentity && !activeProfileProxy;

  const {
    data: credit,
    isFetching: isFetchingCredit,
    isPending: isPendingCredit,
  } = useQuery<ApiAvailableRatingCredit>({
    queryKey: [
      QueryKey.WAVE_REP_CREDIT,
      {
        rater: raterIdentity,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiAvailableRatingCredit>({
        endpoint: "ratings/credit",
        params: {
          rater: raterIdentity,
        },
      }),
    enabled,
  });

  const {
    data: rating,
    isFetching: isFetchingRating,
    isPending: isPendingRating,
  } = useQuery<ApiWaveRepRating>({
    queryKey: [
      QueryKey.WAVE_REP_RATING,
      {
        waveId,
        rater: raterIdentity,
        category: trimmedCategory,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiWaveRepRating>({
        endpoint: `waves/${waveId}/rep/rating`,
        params: {
          from_identity: raterIdentity,
          category: trimmedCategory ?? "",
        },
      }),
    enabled: enabled && !!trimmedCategory,
  });

  const currentRating = rating?.rating ?? 0;
  const availableWaveRep = credit?.wave_rep_credit ?? 0;

  const minMaxValues = useMemo(() => {
    const absoluteCurrentRating = Math.abs(currentRating);
    return {
      min: 0 - (absoluteCurrentRating + availableWaveRep),
      max: absoluteCurrentRating + availableWaveRep,
    };
  }, [availableWaveRep, currentRating]);

  return {
    currentRating,
    availableWaveRep,
    minMaxValues,
    isLoading:
      (enabled && isPendingCredit) ||
      (!!trimmedCategory && enabled && isPendingRating) ||
      isFetchingCredit ||
      isFetchingRating,
  };
}
