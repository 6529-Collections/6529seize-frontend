"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useAuth } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepCategoriesPage } from "@/generated/models/ApiRepCategoriesPage";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { commonApiFetch } from "@/services/api/common-api";
import {
  MEMES_NOMINEE_CATEGORY,
  MEMES_NOMINEE_REQUIRED_REP,
} from "./memesNomination.constants";

const REP_CATEGORIES_PAGE_SIZE = 100;
const REP_CATEGORIES_STALE_TIME_MS = 5 * 60 * 1000;

export interface NominationProgress {
  readonly currentRep: number;
  readonly remainingRep: number;
  readonly percent: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeCategoryName = (category: string): string =>
  category.trim().toLowerCase();

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

export const getMemesNomineeRep = (
  categories: readonly ApiRepCategory[] | null | undefined
): number => {
  const nomineeCategory = (categories ?? []).find(
    (category) =>
      normalizeCategoryName(category.category) ===
      normalizeCategoryName(MEMES_NOMINEE_CATEGORY)
  );

  return nomineeCategory?.total_rep ?? 0;
};

export const getNominationProgress = (
  currentRep: number,
  requiredRep = MEMES_NOMINEE_REQUIRED_REP
): NominationProgress => {
  const finiteCurrentRep = Number.isFinite(currentRep) ? currentRep : 0;
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

export function useMemesNomineeProgress() {
  const { connectedProfile } = useAuth();
  const profileIdentity = getProfileIdentity(connectedProfile);

  const { data, isFetching } = useQuery<ApiRepCategoriesPage>({
    queryKey: [
      QueryKey.REP_CATEGORIES,
      {
        handleOrWallet: profileIdentity,
        category: MEMES_NOMINEE_CATEGORY,
        direction: "incoming",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiRepCategoriesPage>({
        endpoint: `profiles/${encodeURIComponent(profileIdentity!)}/rep/categories`,
        params: {
          page: "1",
          page_size: REP_CATEGORIES_PAGE_SIZE.toString(),
          top_contributors_limit: "1",
        },
      }),
    enabled: !!profileIdentity,
    staleTime: REP_CATEGORIES_STALE_TIME_MS,
  });

  const progress = useMemo(() => {
    if (!profileIdentity || !data) {
      return null;
    }

    return getNominationProgress(getMemesNomineeRep(data.data));
  }, [data, profileIdentity]);

  return {
    isLoading: !!profileIdentity && isFetching && !data,
    progress,
  };
}
