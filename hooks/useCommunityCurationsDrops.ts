"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { createFallbackWaveMin } from "@/services/api/drop-v2-mappers";
import { mapLeaderboardDropV2 } from "@/services/api/wave-drops-v2-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const COMMUNITY_CURATIONS_DROPS_QUERY_KEY = "COMMUNITY_CURATIONS_DROPS";

interface UseCommunityCurationsDropsProps {
  readonly limit: number;
  readonly enabled?: boolean | undefined;
}

interface CommunityCurationsDropsPage {
  readonly data: ApiDrop[];
  readonly page: number;
  readonly next: boolean;
}

const getUniqueDrops = (
  pages: CommunityCurationsDropsPage[] | undefined
): ExtendedDrop[] => {
  if (!pages) {
    return [];
  }

  const seen = new Set<string>();
  const drops: ExtendedDrop[] = [];

  for (const page of pages) {
    for (const drop of page.data) {
      if (seen.has(drop.id)) {
        continue;
      }
      seen.add(drop.id);
      drops.push({
        ...drop,
        type: DropSize.FULL,
        stableKey: drop.id,
        stableHash: drop.id,
      });
    }
  }

  return drops;
};

const mapCommunityCurationDropV2 = (drop: ApiDropV2): ApiDrop => {
  const authorBadges = drop.author.badges;
  const wave = {
    ...createFallbackWaveMin(authorBadges.profile_wave_id ?? ""),
    name: authorBadges.profile_wave_name ?? authorBadges.profile_wave_id ?? "",
    picture: authorBadges.profile_wave_pfp ?? null,
  };
  const mappedDrop = mapLeaderboardDropV2({ drop, wave });

  return {
    ...mappedDrop,
    wave,
  };
};

const fetchCommunityCurationsDrops = ({
  limit,
  page,
}: {
  readonly limit: number;
  readonly page: number;
}): Promise<CommunityCurationsDropsPage> =>
  commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: "v2/curated-profile-wave-drops",
    params: {
      page: `${page}`,
      page_size: `${limit}`,
    },
  }).then((response) => ({
    data: response.data.map(mapCommunityCurationDropV2),
    page: response.page,
    next: response.next,
  }));

export function useCommunityCurationsDrops({
  limit,
  enabled = true,
}: UseCommunityCurationsDropsProps) {
  const query = useInfiniteQuery({
    queryKey: [COMMUNITY_CURATIONS_DROPS_QUERY_KEY, { limit }],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchCommunityCurationsDrops({
        limit,
        page: pageParam,
      }),
    enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
  });

  const allDrops = useMemo(
    () => getUniqueDrops(query.data?.pages),
    [query.data?.pages]
  );

  return {
    ...query,
    allDrops,
    drops: allDrops,
  };
}
