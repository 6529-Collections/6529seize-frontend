import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type {
  XtdhEcosystemCollectionsResponse,
  XtdhEcosystemTokensResponse,
  XtdhOverviewStats,
} from "@/types/xtdh";

export interface UseXtdhCollectionsParams {
  readonly sort: "total_rate" | "total_allocated" | "grantors";
  readonly dir: "asc" | "desc";
  readonly page: number;
  readonly pageSize?: number;
  readonly networks?: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly grantorProfileId?: string | null;
  readonly holderProfileId?: string | null;
  readonly enabled?: boolean;
}

export interface UseXtdhTokensParams {
  readonly sort: "rate" | "total_allocated" | "grantors";
  readonly dir: "asc" | "desc";
  readonly page: number;
  readonly pageSize?: number;
  readonly networks?: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly grantorProfileId?: string | null;
  readonly holderProfileId?: string | null;
  readonly enabled?: boolean;
}

function buildQueryParams(
  params: Record<string, string | number | undefined | null | (string | number)[]>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length) {
        searchParams.set(key, value.join(","));
      }
      return;
    }

    searchParams.set(key, value.toString());
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function fetchJson<T>(input: RequestInfo | URL): Promise<T> {
  return fetch(input).then(async (response) => {
    if (!response.ok) {
      let message = "Unable to load xTDH data";
      try {
        const body = (await response.json()) as { message?: string };
        if (body?.message) {
          message = body.message;
        }
      } catch {
        // ignore errors parsing body
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  });
}

export function useXtdhOverviewStats(
  enabled: boolean = true
): UseQueryResult<XtdhOverviewStats, Error> {
  return useQuery<XtdhOverviewStats, Error>({
    queryKey: [QueryKey.XTDH_OVERVIEW_STATS],
    queryFn: async () => await fetchJson<XtdhOverviewStats>("/api/xtdh/stats"),
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
  });
}

export function useXtdhCollections(
  params: UseXtdhCollectionsParams
): UseQueryResult<XtdhEcosystemCollectionsResponse, Error> {
  const {
    sort,
    dir,
    page,
    pageSize,
    networks,
    minRate,
    minGrantors,
    grantorProfileId,
    holderProfileId,
    enabled = true,
  } = params;

  const query = buildQueryParams({
    sort,
    dir,
    page,
    page_size: pageSize,
    network: networks,
    min_rate: minRate,
    min_grantors: minGrantors,
    grantor: grantorProfileId,
    holder: holderProfileId,
  });

  return useQuery<XtdhEcosystemCollectionsResponse, Error>({
    queryKey: [
      QueryKey.XTDH_COLLECTIONS,
      sort,
      dir,
      page,
      pageSize ?? null,
      networks?.slice().sort() ?? [],
      minRate ?? null,
      minGrantors ?? null,
      grantorProfileId ?? null,
      holderProfileId ?? null,
    ],
    queryFn: async () =>
      await fetchJson<XtdhEcosystemCollectionsResponse>(
        `/api/xtdh/collections${query}`
      ),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 180_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
  });
}

export function useXtdhTokens(
  params: UseXtdhTokensParams
): UseQueryResult<XtdhEcosystemTokensResponse, Error> {
  const {
    sort,
    dir,
    page,
    pageSize,
    networks,
    minRate,
    minGrantors,
    grantorProfileId,
    holderProfileId,
    enabled = true,
  } = params;

  const query = buildQueryParams({
    sort,
    dir,
    page,
    page_size: pageSize,
    network: networks,
    min_rate: minRate,
    min_grantors: minGrantors,
    grantor: grantorProfileId,
    holder: holderProfileId,
  });

  return useQuery<XtdhEcosystemTokensResponse, Error>({
    queryKey: [
      QueryKey.XTDH_TOKENS,
      sort,
      dir,
      page,
      pageSize ?? null,
      networks?.slice().sort() ?? [],
      minRate ?? null,
      minGrantors ?? null,
      grantorProfileId ?? null,
      holderProfileId ?? null,
    ],
    queryFn: async () =>
      await fetchJson<XtdhEcosystemTokensResponse>(`/api/xtdh/tokens${query}`),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 180_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
  });
}
