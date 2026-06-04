"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useAuth } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepRating } from "@/generated/models/ApiRepRating";
import { commonApiFetch } from "@/services/api/common-api";
import {
  MEMES_NOMINEE_CATEGORY,
  MEMES_NOMINEE_REQUIRED_REP,
} from "./memesNomination.constants";

const REP_RATING_STALE_TIME_MS = 30_000;

export interface NominationProgress {
  readonly currentRep: number;
  readonly remainingRep: number;
  readonly percent: number;
}

interface UseMemesNomineeProgressResult {
  readonly hasProfile: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly progress: NominationProgress | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getProfileIdentity = (profile: ApiIdentity | null): string | null => {
  if (!profile) {
    return null;
  }

  const handle = profile.handle?.trim();

  if (handle !== undefined && handle.length > 0) {
    return handle;
  }

  const primaryWallet = profile.primary_wallet.trim();

  if (primaryWallet.length > 0) {
    return primaryWallet;
  }

  const query = profile.query?.trim();

  if (query !== undefined && query.length > 0) {
    return query;
  }

  return null;
};

const getNominationProgress = (
  currentRep: number | null | undefined,
  requiredRep = MEMES_NOMINEE_REQUIRED_REP
): NominationProgress => {
  const finiteCurrentRep =
    typeof currentRep === "number" && Number.isFinite(currentRep)
      ? currentRep
      : 0;
  const finiteRequiredRep =
    Number.isFinite(requiredRep) && requiredRep > 0
      ? requiredRep
      : MEMES_NOMINEE_REQUIRED_REP;

  return {
    currentRep: finiteCurrentRep,
    remainingRep: Math.max(0, finiteRequiredRep - finiteCurrentRep),
    percent: clamp((finiteCurrentRep / finiteRequiredRep) * 100, 0, 100),
  };
};

export function useMemesNomineeProgress(): UseMemesNomineeProgressResult {
  const { connectedProfile, fetchingProfile } = useAuth();
  const profileIdentity = getProfileIdentity(connectedProfile);
  const profileIdentityQueryKey = profileIdentity?.toLowerCase() ?? null;
  const hasProfile = !!profileIdentity;

  const { data, isError, isFetching } = useQuery<ApiRepRating>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      {
        handleOrWallet: profileIdentityQueryKey,
        category: MEMES_NOMINEE_CATEGORY,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiRepRating>({
        endpoint: `profiles/${encodeURIComponent(profileIdentity!)}/rep/rating`,
        params: {
          category: MEMES_NOMINEE_CATEGORY,
        },
      }),
    enabled: hasProfile,
    staleTime: REP_RATING_STALE_TIME_MS,
  });

  const progress = useMemo(() => {
    if (!hasProfile || !data) {
      return null;
    }

    return getNominationProgress(data.rating);
  }, [data, hasProfile]);

  return {
    hasProfile,
    isError,
    isLoading: fetchingProfile || (hasProfile && isFetching && !data),
    progress,
  };
}
