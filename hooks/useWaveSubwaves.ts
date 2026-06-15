"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import {
  fetchWaveSubwavesPage,
  type WaveSubwavesQueryKeyParams,
} from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";
import { useQueries } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export const WAVE_SUBWAVES_PAGE_SIZE = 100;

export function getWaveSubwavesQueryKeyParams(
  parentWaveId: string,
  viewerIdentityKey?: string | null | undefined
): WaveSubwavesQueryKeyParams {
  const normalizedViewerIdentityKey =
    viewerIdentityKey?.trim().toLowerCase() ?? null;

  return {
    parent_wave_id: parentWaveId,
    page: 1,
    page_size: WAVE_SUBWAVES_PAGE_SIZE,
    sort: ApiSubwavesSort.CreatedAt,
    ...(normalizedViewerIdentityKey
      ? { viewer_identity: normalizedViewerIdentityKey }
      : {}),
  };
}

export function getWaveSubwavesQueryKey(
  parentWaveId: string,
  viewerIdentityKey?: string | null | undefined
) {
  return [
    QueryKey.WAVE_SUBWAVES,
    getWaveSubwavesQueryKeyParams(parentWaveId, viewerIdentityKey),
  ] as const;
}

export function getWaveSubwavesQueryOptions(
  parentWaveId: string,
  viewerIdentityKey?: string | null | undefined
) {
  return {
    queryKey: getWaveSubwavesQueryKey(parentWaveId, viewerIdentityKey),
    queryFn: () =>
      fetchAllWaveSubwaves({
        parentWaveId,
        pageSize: WAVE_SUBWAVES_PAGE_SIZE,
        sort: ApiSubwavesSort.CreatedAt,
      }),
    staleTime: 60_000,
  } as const;
}

interface WaveSubwavesMapValue {
  readonly subwaves: readonly SidebarWave[];
  readonly isFetching: boolean;
}

export async function fetchAllWaveSubwaves({
  parentWaveId,
  pageSize = WAVE_SUBWAVES_PAGE_SIZE,
  sort = ApiSubwavesSort.CreatedAt,
}: {
  readonly parentWaveId: string;
  readonly pageSize?: number | undefined;
  readonly sort?: ApiSubwavesSort | undefined;
}): Promise<SidebarWave[]> {
  const waves: SidebarWave[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const subwavesPage = await fetchWaveSubwavesPage({
      parentWaveId,
      page,
      pageSize,
      sort,
    });

    waves.push(...subwavesPage.waves);
    hasNextPage = subwavesPage.next;
    page += 1;
  }

  return waves;
}

export function useWaveSubwavesMap({
  parentWaveIds,
  viewerIdentityKey,
  refetchInterval = SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
}: {
  readonly parentWaveIds: readonly string[];
  readonly viewerIdentityKey?: string | null | undefined;
  readonly refetchInterval?: number | undefined;
}) {
  const uniqueParentWaveIds = useMemo(
    () => Array.from(new Set(parentWaveIds.filter(Boolean))),
    [parentWaveIds]
  );

  const queries = useQueries({
    queries: uniqueParentWaveIds.map((parentWaveId) => ({
      ...getWaveSubwavesQueryOptions(parentWaveId, viewerIdentityKey),
      enabled: Boolean(parentWaveId),
      refetchInterval,
      refetchIntervalInBackground: false,
    })),
  });

  const subwavesByParentId = useMemo(() => {
    const map = new Map<string, WaveSubwavesMapValue>();

    uniqueParentWaveIds.forEach((parentWaveId, index) => {
      const query = queries[index];
      map.set(parentWaveId, {
        subwaves: query?.data ?? [],
        isFetching: query?.isFetching ?? false,
      });
    });

    return map;
  }, [queries, uniqueParentWaveIds]);

  const subwaves = useMemo(
    () =>
      uniqueParentWaveIds.flatMap(
        (parentWaveId) => subwavesByParentId.get(parentWaveId)?.subwaves ?? []
      ),
    [subwavesByParentId, uniqueParentWaveIds]
  );

  const isFetching = queries.some((query) => query.isFetching);

  const refetch = useCallback(() => {
    queries.forEach((query) => {
      query.refetch().catch(() => undefined);
    });
  }, [queries]);

  return useMemo(
    () => ({
      subwaves,
      subwavesByParentId,
      isFetching,
      refetch,
    }),
    [isFetching, refetch, subwaves, subwavesByParentId]
  );
}
