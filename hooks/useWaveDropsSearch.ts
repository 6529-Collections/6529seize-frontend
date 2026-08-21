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
}: {
  readonly wave: ApiWave | null;
  readonly term: string;
  readonly authorId?: string | undefined;
  readonly after?: number | undefined;
  readonly before?: number | undefined;
  readonly enabled: boolean;
  readonly size?: number | undefined;
}) {
  const trimmedTerm = term.trim();
  const isTermValid =
    trimmedTerm.length === 0 ||
    trimmedTerm.length >= MIN_WAVE_SEARCH_QUERY_LENGTH;
  const waveMin = useMemo(() => (wave ? toApiWaveMin(wave) : null), [wave]);

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
      },
    ],
    enabled:
      enabled &&
      wave !== null &&
      isTermValid &&
      (trimmedTerm.length >= MIN_WAVE_SEARCH_QUERY_LENGTH ||
        authorId !== undefined ||
        after !== undefined ||
        before !== undefined),
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!wave) {
        throw new Error("Wave is required to search drops");
      }

      return await fetchWaveDropsSearchV2({
        wave,
        term: trimmedTerm,
        authorId,
        after,
        before,
        page: pageParam,
        size,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });

  const drops = useMemo<ExtendedDrop[]>(() => {
    if (!waveMin) return [];
    const all = query.data?.pages.flatMap((page) => page.data) ?? [];
    if (all.length === 0) return [];
    const mapped = mapToExtendedDrops(
      [{ wave: waveMin, drops: all }],
      [],
      false
    );
    return generateUniqueKeys(mapped, []);
  }, [query.data?.pages, waveMin]);

  return {
    ...query,
    drops,
  };
}
