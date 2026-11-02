"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MIN_WAVE_SEARCH_QUERY_LENGTH } from "@/components/waves/drops/search/waveDropsSearch.utils";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";
import { fetchGlobalDropsSearchV2 } from "@/services/api/global-drops-search-api";
import { fetchWaveDropsSearchV2 } from "@/services/api/wave-drops-v2-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useWaveDropsSearch({
  wave,
  term,
  authorId,
  after,
  before,
  enabled,
  size = 50,
  allowGlobalSearch = false,
  readContext,
}: {
  readonly wave: ApiWave | null;
  readonly term: string;
  readonly authorId?: string | undefined;
  readonly after?: number | undefined;
  readonly before?: number | undefined;
  readonly enabled: boolean;
  readonly size?: number | undefined;
  readonly allowGlobalSearch?: boolean | undefined;
  readonly readContext?: string | null | undefined;
}) {
  const trimmedTerm = term.trim();
  const isTermValid =
    trimmedTerm.length === 0 ||
    trimmedTerm.length >= MIN_WAVE_SEARCH_QUERY_LENGTH;

  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: wave?.id ?? null,
        term: trimmedTerm,
        authorId: authorId ?? null,
        after: after ?? null,
        before: before ?? null,
        size,
        context: "wave-search",
        ...(allowGlobalSearch ? { allowGlobalSearch, readContext } : {}),
      },
    ],
    enabled:
      enabled &&
      (wave !== null || allowGlobalSearch) &&
      isTermValid &&
      (trimmedTerm.length >= MIN_WAVE_SEARCH_QUERY_LENGTH ||
        authorId !== undefined ||
        after !== undefined ||
        before !== undefined),
    initialPageParam: 1 as number | { page: number; cursor: string },
    queryFn: async ({ pageParam, signal }) => {
      const page = typeof pageParam === "number" ? pageParam : pageParam.page;
      const cursor =
        typeof pageParam === "number" ? undefined : pageParam.cursor;
      if (!wave && allowGlobalSearch) {
        return fetchGlobalDropsSearchV2({
          term: trimmedTerm,
          authorId,
          page,
          size,
          signal,
          cursor,
        });
      }
      if (!wave) {
        throw new Error("Wave is required to search drops");
      }

      const response = await fetchWaveDropsSearchV2({
        wave,
        term: trimmedTerm,
        authorId,
        after,
        before,
        page,
        size,
        signal,
      });
      return {
        ...response,
        data: response.data.map((drop) => ({
          ...drop,
          wave: {
            ...toApiWaveMin(wave),
            is_dm_wave: wave.chat.scope.group?.is_direct_message === true,
          },
        })),
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      if (allowGlobalSearch && !wave) {
        return "cursor" in lastPage && typeof lastPage.cursor === "string"
          ? { page: lastPage.page + 1, cursor: lastPage.cursor }
          : undefined;
      }
      return lastPage.page + 1;
    },
    staleTime: 30_000,
  });

  const drops = useMemo<ExtendedDrop[]>(() => {
    const all = query.data?.pages.flatMap((page) => page.data) ?? [];
    if (all.length === 0) return [];
    const mapped = mapToExtendedDrops(
      all.map((drop) => ({ wave: drop.wave, drops: [drop] })),
      [],
      false
    );
    return generateUniqueKeys(mapped, []);
  }, [query.data?.pages]);

  return {
    ...query,
    drops,
  };
}
