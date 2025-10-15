'use client';

import { SortDirection } from "@/entities/ISort";

import type {
  XtdhReceivedCollectionsResponse,
  XtdhReceivedError,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";
import type {
  XtdhCollectionOwnershipFilter,
  XtdhCollectionsDiscoveryFilter,
  XtdhCollectionsSortField,
  XtdhNftSortField,
} from "./utils/constants";

type ApiSortDirection = "asc" | "desc";

export interface XtdhReceivedCollectionsQueryParams {
  readonly sort: XtdhCollectionsSortField;
  readonly direction: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly collections: readonly string[];
}

export interface XtdhReceivedTokensQueryParams {
  readonly sort: XtdhNftSortField;
  readonly direction: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly collections: readonly string[];
  readonly search?: string;
  readonly ownership?: XtdhCollectionOwnershipFilter;
  readonly discovery?: XtdhCollectionsDiscoveryFilter;
}

function toApiDirection(direction: SortDirection): ApiSortDirection {
  return direction === SortDirection.ASC ? "asc" : "desc";
}

async function fetchWithErrorHandling<T>(
  url: string,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url);
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    // ignore JSON parse errors so we can surface a fallback message instead
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as XtdhReceivedError).message === "string"
        ? (data as XtdhReceivedError).message
        : fallbackMessage;
    throw new Error(message);
  }

  if (data === null) {
    throw new Error(fallbackMessage);
  }

  return data as T;
}

export async function fetchXtdhReceivedCollections(
  params: XtdhReceivedCollectionsQueryParams,
): Promise<XtdhReceivedCollectionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("sort", params.sort);
  searchParams.set("dir", toApiDirection(params.direction));
  searchParams.set("page", params.page.toString());
  searchParams.set("page_size", params.pageSize.toString());

  if (params.collections.length > 0) {
    searchParams.set("collections", params.collections.join(","));
  }

  const queryString = searchParams.toString();

  return await fetchWithErrorHandling<XtdhReceivedCollectionsResponse>(
    `/api/xtdh/collections${queryString ? `?${queryString}` : ""}`,
    "Failed to load xTDH collections",
  );
}

export async function fetchXtdhReceivedTokens(
  params: XtdhReceivedTokensQueryParams,
): Promise<XtdhReceivedNftsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("sort", params.sort);
  searchParams.set("dir", toApiDirection(params.direction));
  searchParams.set("page", params.page.toString());
  searchParams.set("page_size", params.pageSize.toString());

  if (params.collections.length > 0) {
    searchParams.set("collections", params.collections.join(","));
  }
  if (params.search && params.search.trim().length > 0) {
    searchParams.set("search", params.search.trim());
  }
  if (params.ownership && params.ownership !== "all") {
    searchParams.set("ownership", params.ownership);
  }
  if (params.discovery && params.discovery !== "none") {
    searchParams.set("discovery", params.discovery);
  }

  const queryString = searchParams.toString();

  return await fetchWithErrorHandling<XtdhReceivedNftsResponse>(
    `/api/xtdh/tokens${queryString ? `?${queryString}` : ""}`,
    "Failed to load xTDH tokens",
  );
}
