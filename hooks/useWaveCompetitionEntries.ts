import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import {
  DROP_BATCH_STALE_TIME_MS,
  seedDropCache,
} from "@/services/api/drop-api";
import { fetchWaveCompetitionDropsV2 } from "@/services/api/wave-drops-v2-api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

const COMPETITION_ENTRIES_PAGE_SIZE = 50;

interface UseWaveCompetitionEntriesProps {
  readonly authorId: string;
  readonly wave: ApiWaveMin;
  readonly kind: "active" | "winners";
  readonly enabled: boolean;
}

export const getWaveCompetitionEntriesQueryKey = ({
  authorId,
  waveId,
  kind,
}: {
  readonly authorId: string;
  readonly waveId: string;
  readonly kind: "active" | "winners";
}) =>
  [
    QueryKey.DROPS,
    {
      author_id: authorId,
      wave_id: waveId,
      scope: `wave-competition-${kind}`,
    },
  ] as const;

export const useWaveCompetitionEntries = ({
  authorId,
  wave,
  kind,
  enabled,
}: UseWaveCompetitionEntriesProps) => {
  const queryClient = useQueryClient();
  const expectedDropType =
    kind === "active" ? ApiDropType.Participatory : ApiDropType.Winner;

  const query = useInfiniteQuery({
    queryKey: getWaveCompetitionEntriesQueryKey({
      authorId,
      waveId: wave.id,
      kind,
    }),
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal: AbortSignal;
    }) => {
      const page = await fetchWaveCompetitionDropsV2({
        wave,
        authorId,
        dropType: expectedDropType,
        page: pageParam,
        pageSize: COMPETITION_ENTRIES_PAGE_SIZE,
        signal,
      });
      seedDropCache(queryClient, page.data);
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    enabled: enabled && authorId.length > 0,
    staleTime: DROP_BATCH_STALE_TIME_MS,
  });

  const entries = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages]
  );

  return {
    entries,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};
