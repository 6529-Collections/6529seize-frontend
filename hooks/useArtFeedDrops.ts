"use client";

import { ART_FEED_CURATION_NAME } from "@/components/art-feed/artFeed.constants";
import {
  getArtFeedMediaType,
  type ArtFeedMediaType,
} from "@/components/art-feed/artFeed.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type ArtFeedAudience = "everyone" | "following";
export type ArtFeedMediaFilter = "all" | Exclude<ArtFeedMediaType, "other">;

const ART_FEED_DROPS_QUERY_KEY = "ART_FEED_DROPS";

interface UseArtFeedDropsProps {
  readonly audience?: ArtFeedAudience | undefined;
  readonly mediaFilter?: ArtFeedMediaFilter | undefined;
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

const isDropFromFollowedAuthor = (drop: ExtendedDrop): boolean =>
  drop.author.subscribed_actions.length > 0;

const matchesMediaFilter = (
  drop: ExtendedDrop,
  mediaFilter: ArtFeedMediaFilter
): boolean =>
  mediaFilter === "all" || getArtFeedMediaType(drop) === mediaFilter;

export function useArtFeedDrops({
  audience = "everyone",
  mediaFilter = "all",
  limit,
  enabled = true,
}: UseArtFeedDropsProps) {
  const query = useInfiniteQuery({
    queryKey: [
      ART_FEED_DROPS_QUERY_KEY,
      { curation_name: ART_FEED_CURATION_NAME, limit },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        curation_name: ART_FEED_CURATION_NAME,
        limit: `${limit}`,
      };

      if (typeof pageParam === "number") {
        params["serial_no_less_than"] = `${pageParam}`;
      }

      return await commonApiFetch<ApiDrop[]>({
        endpoint: "drops",
        params,
      });
    },
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
    () =>
      allDrops.filter(
        (drop) =>
          matchesMediaFilter(drop, mediaFilter) &&
          (audience === "everyone" || isDropFromFollowedAuthor(drop))
      ),
    [allDrops, audience, mediaFilter]
  );

  return {
    ...query,
    allDrops,
    curationName: ART_FEED_CURATION_NAME,
    drops,
  };
}
