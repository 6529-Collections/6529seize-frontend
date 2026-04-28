"use client";

import {
  getCommunityCurationsMediaType,
  type CommunityCurationsMediaType,
} from "@/components/community-curations/communityCurations.helpers";
import type { ApiCuratedProfileWaveDropsPage } from "@/generated/models/ApiCuratedProfileWaveDropsPage";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type CommunityCurationsMediaFilter =
  | "all"
  | Exclude<CommunityCurationsMediaType, "other">;

const COMMUNITY_CURATIONS_DROPS_QUERY_KEY = "COMMUNITY_CURATIONS_DROPS";

interface UseCommunityCurationsDropsProps {
  readonly mediaFilter?: CommunityCurationsMediaFilter | undefined;
  readonly limit: number;
  readonly enabled?: boolean | undefined;
}

const getUniqueDrops = (
  pages: ApiCuratedProfileWaveDropsPage[] | undefined
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

const matchesMediaFilter = (
  drop: ExtendedDrop,
  mediaFilter: CommunityCurationsMediaFilter
): boolean =>
  mediaFilter === "all" || getCommunityCurationsMediaType(drop) === mediaFilter;

const fetchCommunityCurationsDrops = ({
  limit,
  page,
}: {
  readonly limit: number;
  readonly page: number;
}): Promise<ApiCuratedProfileWaveDropsPage> => {
  return commonApiFetch<ApiCuratedProfileWaveDropsPage>({
    endpoint: "curated-profile-wave-drops",
    params: {
      page: `${page}`,
      page_size: `${limit}`,
    },
  });
};

export function useCommunityCurationsDrops({
  mediaFilter = "all",
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

  const drops = useMemo(
    () => allDrops.filter((drop) => matchesMediaFilter(drop, mediaFilter)),
    [allDrops, mediaFilter]
  );

  return {
    ...query,
    allDrops,
    drops,
  };
}
