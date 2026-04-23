"use client";

import {
  getCommunityCurationsMediaType,
  type CommunityCurationsMediaType,
} from "@/components/community-curations/communityCurations.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type CommunityCurationsMediaFilter =
  | "all"
  | Exclude<CommunityCurationsMediaType, "other">;

const COMMUNITY_CURATIONS_DROPS_QUERY_KEY = "COMMUNITY_CURATIONS_DROPS";
const TEMPORARY_COMMUNITY_CURATIONS_SOURCE_CURATION_NAME = "ART";

interface UseCommunityCurationsDropsProps {
  readonly mediaFilter?: CommunityCurationsMediaFilter | undefined;
  readonly limit: number;
  readonly enabled?: boolean | undefined;
}

const getUniqueDrops = (pages: ApiDrop[][] | undefined): ExtendedDrop[] => {
  if (!pages) {
    return [];
  }

  const seen = new Set<string>();
  const drops: ExtendedDrop[] = [];

  for (const drop of pages.flat()) {
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

  return drops;
};

const matchesMediaFilter = (
  drop: ExtendedDrop,
  mediaFilter: CommunityCurationsMediaFilter
): boolean =>
  mediaFilter === "all" || getCommunityCurationsMediaType(drop) === mediaFilter;

const fetchTemporaryCommunityCurationsDrops = ({
  cursor,
  limit,
}: {
  readonly cursor: number | null;
  readonly limit: number;
}): Promise<ApiDrop[]> => {
  const params: Record<string, string> = {
    curation_name: TEMPORARY_COMMUNITY_CURATIONS_SOURCE_CURATION_NAME,
    limit: `${limit}`,
  };

  if (typeof cursor === "number") {
    params["serial_no_less_than"] = `${cursor}`;
  }

  return commonApiFetch<ApiDrop[]>({
    endpoint: "drops",
    params,
  });
};

export function useCommunityCurationsDrops({
  mediaFilter = "all",
  limit,
  enabled = true,
}: UseCommunityCurationsDropsProps) {
  const query = useInfiniteQuery({
    queryKey: [COMMUNITY_CURATIONS_DROPS_QUERY_KEY, { limit }],
    queryFn: ({ pageParam }: { pageParam: number | null }) =>
      fetchTemporaryCommunityCurationsDrops({
        cursor: pageParam,
        limit,
      }),
    enabled,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.length === limit ? lastPage.at(-1)?.serial_no : undefined,
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
