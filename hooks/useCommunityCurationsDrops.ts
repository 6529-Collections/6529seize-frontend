"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
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

const fetchCommunityCurationsDrops = ({
  limit,
  page,
}: {
  readonly limit: number;
  readonly page: number;
}): Promise<CommunityCurationsDropsPage> => {
  return commonApiFetch<CommunityCurationsDropsPage>({
    endpoint: "curated-profile-wave-drops",
    params: {
      page: `${page}`,
      page_size: `${limit}`,
    },
  });
};

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
