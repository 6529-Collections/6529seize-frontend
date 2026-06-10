"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import type { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import type { ApiWavePoll } from "@/generated/models/ApiWavePoll";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  fetchDropsV2ByIds,
  fetchWavePollsV2,
  type ApiWavePollDropRow,
  type WavePollsSort,
  type WavePollsState,
} from "@/services/api/wave-drops-v2-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const WAVE_POLLS_PAGE_SIZE = 20;

interface UseWavePollDropsProps {
  readonly waveId: string;
  readonly sortDirection: ApiPageSortDirection;
  readonly sort: WavePollsSort;
  readonly state?: WavePollsState | undefined;
  readonly enabled?: boolean | undefined;
}

interface WavePollDropsPage {
  readonly drops: ApiDrop[];
  readonly page: number;
  readonly next: boolean;
}

interface NormalizedWavePollRow {
  readonly dropId: string;
  readonly poll: ApiDropPoll | null;
}

type StandaloneWavePollFields = Pick<
  ApiWavePoll,
  | "id"
  | "drop_id"
  | "options"
  | "voted"
  | "multichoice"
  | "closing_time"
  | "is_open"
>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const hasStandalonePollFields = (
  row: ApiWavePollDropRow
): row is StandaloneWavePollFields =>
  isNonEmptyString(row.id) &&
  isNonEmptyString(row.drop_id) &&
  Array.isArray(row.options) &&
  Array.isArray(row.voted) &&
  typeof row.multichoice === "boolean" &&
  typeof row.closing_time === "number" &&
  typeof row.is_open === "boolean";

const mapWavePollToDropPoll = (
  poll: StandaloneWavePollFields
): ApiDropPoll => ({
  id: poll.id,
  options: poll.options,
  voted: poll.voted,
  multichoice: poll.multichoice,
  closing_time: poll.closing_time,
  is_open: poll.is_open,
});

const normalizeWavePollRow = (
  row: ApiWavePollDropRow
): NormalizedWavePollRow | null => {
  if (isNonEmptyString(row.drop_id)) {
    return {
      dropId: row.drop_id,
      poll: hasStandalonePollFields(row)
        ? mapWavePollToDropPoll(row)
        : (row.poll ?? null),
    };
  }

  if (row.poll && isNonEmptyString(row.id)) {
    return {
      dropId: row.id,
      poll: row.poll,
    };
  }

  return null;
};

const normalizeWavePollRows = (
  rows: readonly ApiWavePollDropRow[]
): NormalizedWavePollRow[] =>
  rows.reduce<NormalizedWavePollRow[]>((acc, row) => {
    const normalizedRow = normalizeWavePollRow(row);
    if (normalizedRow) {
      acc.push(normalizedRow);
    }
    return acc;
  }, []);

const overlayPollsOnDrops = ({
  drops,
  pollRows,
}: {
  readonly drops: readonly ApiDrop[];
  readonly pollRows: readonly NormalizedWavePollRow[];
}): ApiDrop[] => {
  const dropsById = new Map(drops.map((drop) => [drop.id, drop]));

  return pollRows.reduce<ApiDrop[]>((acc, pollRow) => {
    const drop = dropsById.get(pollRow.dropId);
    if (!drop) {
      return acc;
    }

    acc.push({
      ...drop,
      ...(pollRow.poll ? { poll: pollRow.poll } : {}),
    });
    return acc;
  }, []);
};

const processPollDrops = (
  pages: readonly WavePollDropsPage[] | undefined
): ExtendedDrop[] => {
  if (!pages) {
    return [];
  }

  const keyCount = new Map<string, number>();

  return pages.flatMap((page) =>
    page.drops.map((drop) => {
      const count = (keyCount.get(drop.id) ?? 0) + 1;
      keyCount.set(drop.id, count);

      return {
        ...drop,
        type: DropSize.FULL,
        stableKey: count > 1 ? `${drop.id}-${count}` : drop.id,
        stableHash: drop.id,
      };
    })
  );
};

export function useWavePollDrops({
  waveId,
  sortDirection,
  sort,
  state,
  enabled = true,
}: UseWavePollDropsProps) {
  const isQueryEnabled = enabled && waveId.trim().length > 0;
  const queryKey = useMemo(
    () =>
      [
        QueryKey.WAVE_POLLS,
        {
          waveId,
          pageSize: WAVE_POLLS_PAGE_SIZE,
          sortDirection,
          sort,
          state: state ?? null,
        },
      ] as const,
    [sortDirection, sort, state, waveId]
  );

  const {
    data,
    fetchNextPage: onFetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({
      pageParam,
      signal,
    }: {
      readonly pageParam: number;
      readonly signal: AbortSignal;
    }): Promise<WavePollDropsPage> => {
      const pollsPage = await fetchWavePollsV2({
        waveId,
        page: pageParam,
        pageSize: WAVE_POLLS_PAGE_SIZE,
        sortDirection,
        sort,
        state,
        signal,
      });
      const pollRows = normalizeWavePollRows(pollsPage.data);
      const dropIds = [...new Set(pollRows.map((pollRow) => pollRow.dropId))];
      const drops =
        dropIds.length > 0
          ? await fetchDropsV2ByIds({
              dropIds,
              signal,
              includeFullMetadata: false,
              includeTopRaters: false,
            })
          : [];

      return {
        drops: overlayPollsOnDrops({ drops, pollRows }),
        page: pollsPage.page,
        next: pollsPage.next,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    enabled: isQueryEnabled,
    staleTime: 60_000,
    ...getDefaultQueryRetry(),
  });

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await onFetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  const drops = useMemo(() => processPollDrops(data?.pages), [data?.pages]);
  const hasInitialized = !!data?.pages;

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching: isQueryEnabled && (isFetching || !hasInitialized),
    isFetchingNextPage,
    refetch,
  };
}
