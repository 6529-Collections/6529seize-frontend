"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiWavePoll } from "@/generated/models/ApiWavePoll";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  fetchDropsV2ByIds,
  fetchWavePollsV2,
  mapLeaderboardDropV2,
  type ApiWavePollDropRow,
  type WavePollsSort,
  type WavePollsState,
} from "@/services/api/wave-drops-v2-api";
import { normalizeWaveMin } from "@/services/api/drop-v2-mappers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const WAVE_POLLS_PAGE_SIZE = 20;

interface UseWavePollDropsProps {
  readonly wave: ApiWave | ApiWaveMin;
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
  readonly drop: ApiDrop | null;
}

type StandaloneWavePollFields = Pick<
  ApiWavePoll,
  | "id"
  | "drop_id"
  | "options"
  | "voted"
  | "multichoice"
  | "anonymous"
  | "closing_time"
  | "is_open"
> &
  Partial<Pick<ApiWavePoll, "only_droppers_can_respond">>;

type WavePollDropRow = ApiWavePollDropRow & Partial<ApiDropV2>;

type EmbeddableDropRow = WavePollDropRow &
  Pick<
    ApiDropV2,
    | "id"
    | "serial_no"
    | "created_at"
    | "is_signed"
    | "hide_link_preview"
    | "parts_count"
    | "author"
    | "drop_type"
    | "boosts"
  >;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const hasEmbeddableDropFields = (
  row: WavePollDropRow
): row is EmbeddableDropRow => {
  const author = row.author;

  return (
    isNonEmptyString(row.id) &&
    typeof row.serial_no === "number" &&
    typeof row.created_at === "number" &&
    typeof row.is_signed === "boolean" &&
    typeof row.hide_link_preview === "boolean" &&
    typeof row.parts_count === "number" &&
    isRecord(author) &&
    isNonEmptyString(author.id) &&
    isNonEmptyString(author.primary_address) &&
    typeof author.level === "number" &&
    isRecord(author.badges) &&
    typeof row.drop_type === "string" &&
    typeof row.boosts === "number"
  );
};

const hasStandalonePollFields = (
  row: ApiWavePollDropRow
): row is StandaloneWavePollFields =>
  isNonEmptyString(row.id) &&
  isNonEmptyString(row.drop_id) &&
  Array.isArray(row.options) &&
  Array.isArray(row.voted) &&
  typeof row.multichoice === "boolean" &&
  typeof row.anonymous === "boolean" &&
  typeof row.closing_time === "number" &&
  typeof row.is_open === "boolean";

const mapWavePollToDropPoll = (
  poll: StandaloneWavePollFields
): ApiDropPoll => ({
  id: poll.id,
  options: poll.options,
  voted: poll.voted,
  multichoice: poll.multichoice,
  anonymous: poll.anonymous,
  only_droppers_can_respond: poll.only_droppers_can_respond ?? false,
  closing_time: poll.closing_time,
  is_open: poll.is_open,
});

const getWavePollRowPoll = (row: ApiWavePollDropRow): ApiDropPoll | null => {
  const embeddedPoll = row.poll ?? null;

  if (!embeddedPoll) {
    return hasStandalonePollFields(row) ? mapWavePollToDropPoll(row) : null;
  }

  if (!hasStandalonePollFields(row)) {
    return embeddedPoll;
  }

  return {
    ...embeddedPoll,
    options: row.options,
    voted: row.voted,
    multichoice: row.multichoice,
    anonymous: row.anonymous,
    only_droppers_can_respond:
      row.only_droppers_can_respond ??
      embeddedPoll.only_droppers_can_respond ??
      false,
    closing_time: row.closing_time,
    is_open: row.is_open,
  };
};

const normalizeWavePollRow = (
  row: ApiWavePollDropRow,
  wave: ApiWaveMin
): NormalizedWavePollRow | null => {
  const pollDropRow = row as WavePollDropRow;

  if (hasEmbeddableDropFields(pollDropRow)) {
    const poll = getWavePollRowPoll(pollDropRow);
    const mappedDrop = {
      ...mapLeaderboardDropV2({ drop: pollDropRow, wave }),
      wave,
    };

    return {
      dropId: pollDropRow.id,
      poll,
      drop: poll ? { ...mappedDrop, poll } : mappedDrop,
    };
  }

  if (isNonEmptyString(row.drop_id)) {
    return {
      dropId: row.drop_id,
      poll: getWavePollRowPoll(row),
      drop: null,
    };
  }

  if (row.poll && isNonEmptyString(row.id)) {
    return {
      dropId: row.id,
      poll: row.poll,
      drop: null,
    };
  }

  return null;
};

const normalizeWavePollRows = (
  rows: readonly ApiWavePollDropRow[],
  wave: ApiWaveMin
): NormalizedWavePollRow[] =>
  rows.reduce<NormalizedWavePollRow[]>((acc, row) => {
    const normalizedRow = normalizeWavePollRow(row, wave);
    if (normalizedRow) {
      acc.push(normalizedRow);
    }
    return acc;
  }, []);

const resolvePollDrops = ({
  fetchedDrops,
  pollRows,
}: {
  readonly fetchedDrops: readonly ApiDrop[];
  readonly pollRows: readonly NormalizedWavePollRow[];
}): ApiDrop[] => {
  const fetchedDropsById = new Map(fetchedDrops.map((drop) => [drop.id, drop]));

  return pollRows.reduce<ApiDrop[]>((acc, pollRow) => {
    if (pollRow.drop) {
      acc.push(pollRow.drop);
      return acc;
    }

    const fetchedDrop = fetchedDropsById.get(pollRow.dropId);
    if (!fetchedDrop) {
      return acc;
    }

    acc.push({
      ...fetchedDrop,
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
  wave,
  sortDirection,
  sort,
  state,
  enabled = true,
}: UseWavePollDropsProps) {
  const waveMin = useMemo(() => normalizeWaveMin(wave), [wave]);
  const waveId = waveMin.id;
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
      const pollRows = normalizeWavePollRows(pollsPage.data, waveMin);
      const fallbackDropIds = [
        ...new Set(
          pollRows
            .filter((pollRow) => !pollRow.drop)
            .map((pollRow) => pollRow.dropId)
        ),
      ];
      const drops =
        fallbackDropIds.length > 0
          ? await fetchDropsV2ByIds({
              dropIds: fallbackDropIds,
              signal,
              includeFullMetadata: false,
              includeTopRaters: false,
            })
          : [];

      return {
        drops: resolvePollDrops({ fetchedDrops: drops, pollRows }),
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
