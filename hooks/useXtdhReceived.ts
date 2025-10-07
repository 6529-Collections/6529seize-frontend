import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type {
  XtdhReceivedCollectionsResponse,
  XtdhReceivedError,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";

export interface UseReceivedCollectionsFilters {
  readonly collections?: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
}

export interface UseReceivedCollectionsOptions {
  readonly profile: string | null;
  readonly sort: string;
  readonly dir: "asc" | "desc";
  readonly page: number;
  readonly pageSize?: number;
  readonly filters: UseReceivedCollectionsFilters;
  readonly enabled?: boolean;
}

export interface UseReceivedNftsOptions {
  readonly profile: string | null;
  readonly sort: string;
  readonly dir: "asc" | "desc";
  readonly page: number;
  readonly pageSize?: number;
  readonly filters: UseReceivedCollectionsFilters;
  readonly enabled?: boolean;
}

async function fetchWithErrorHandling<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(endpoint);

  if (!response.ok) {
    let message = "Failed to load xTDH received data";

    try {
      const errorBody = (await response.json()) as Partial<XtdhReceivedError>;
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // ignore body parse errors
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function buildCollectionsUrl({
  profile,
  sort,
  dir,
  page,
  pageSize,
  filters,
}: UseReceivedCollectionsOptions): string {
  if (!profile) {
    throw new Error("Profile is required to fetch received collections");
  }

  const params = new URLSearchParams();
  params.set("sort", sort);
  params.set("dir", dir);
  params.set("page", page.toString());

  if (pageSize) {
    params.set("page_size", pageSize.toString());
  }

  if (filters.collections && filters.collections.length > 0) {
    params.set("collections", filters.collections.join(","));
  }

  if (typeof filters.minRate === "number") {
    params.set("min_rate", filters.minRate.toString());
  }

  if (typeof filters.minGrantors === "number") {
    params.set("min_grantors", filters.minGrantors.toString());
  }

  const queryString = params.toString();

  return `/api/profiles/${encodeURIComponent(
    profile
  )}/xtdh/received/collections${queryString ? `?${queryString}` : ""}`;
}

function buildNftsUrl({
  profile,
  sort,
  dir,
  page,
  pageSize,
  filters,
}: UseReceivedNftsOptions): string {
  if (!profile) {
    throw new Error("Profile is required to fetch received NFTs");
  }

  const params = new URLSearchParams();
  params.set("sort", sort);
  params.set("dir", dir);
  params.set("page", page.toString());

  if (pageSize) {
    params.set("page_size", pageSize.toString());
  }

  if (filters.collections && filters.collections.length > 0) {
    params.set("collections", filters.collections.join(","));
  }

  if (typeof filters.minRate === "number") {
    params.set("min_rate", filters.minRate.toString());
  }

  if (typeof filters.minGrantors === "number") {
    params.set("min_grantors", filters.minGrantors.toString());
  }

  const queryString = params.toString();

  return `/api/profiles/${encodeURIComponent(
    profile
  )}/xtdh/received/nfts${queryString ? `?${queryString}` : ""}`;
}

export function useReceivedCollections(
  options: UseReceivedCollectionsOptions
): UseQueryResult<XtdhReceivedCollectionsResponse, Error> {
  const {
    profile,
    sort,
    dir,
    page,
    pageSize,
    filters,
    enabled = true,
  } = options;

  return useQuery<XtdhReceivedCollectionsResponse, Error>({
    queryKey: [
      QueryKey.XTDH_RECEIVED_COLLECTIONS,
      profile,
      sort,
      dir,
      page,
      pageSize ?? null,
      JSON.stringify(filters ?? {}),
    ],
    queryFn: async () =>
      await fetchWithErrorHandling<XtdhReceivedCollectionsResponse>(
        buildCollectionsUrl(options)
      ),
    enabled: Boolean(profile) && enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1_000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
}

export function useReceivedNfts(
  options: UseReceivedNftsOptions
): UseQueryResult<XtdhReceivedNftsResponse, Error> {
  const { profile, sort, dir, page, pageSize, filters, enabled = true } = options;

  return useQuery<XtdhReceivedNftsResponse, Error>({
    queryKey: [
      QueryKey.XTDH_RECEIVED_NFTS,
      profile,
      sort,
      dir,
      page,
      pageSize ?? null,
      JSON.stringify(filters ?? {}),
    ],
    queryFn: async () =>
      await fetchWithErrorHandling<XtdhReceivedNftsResponse>(
        buildNftsUrl(options)
      ),
    enabled: Boolean(profile) && enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1_000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
}
