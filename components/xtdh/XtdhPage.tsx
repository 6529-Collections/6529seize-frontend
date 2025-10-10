"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import XtdhStatsOverview from "./XtdhStatsOverview";
import XtdhReceivedSection from "./received";
import type {
  XtdhReceivedCollectionOption,
  XtdhReceivedCollectionsResponse,
  XtdhReceivedError,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";
import type {
  XtdhReceivedCollectionsViewState,
  XtdhReceivedNftsViewState,
} from "./received/subcomponents";
import {
  COLLECTIONS_PAGE_SIZE,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_NFT_SORT,
  NFTS_PAGE_SIZE,
  type XtdhCollectionsSortField,
  type XtdhNftSortField,
  type XtdhReceivedView,
} from "./received/utils/constants";
import {
  mergeXtdhCollectionOptions,
  xtdhHasActiveFilters,
} from "./received/utils";
import {
  DEFAULT_CLEAR_FILTERS_LABEL as COLLECTIONS_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY as COLLECTIONS_EMPTY_STATE_COPY,
} from "./received/subcomponents/XtdhReceivedCollectionsView.constants";
import {
  DEFAULT_CLEAR_FILTERS_LABEL as NFTS_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY as NFTS_EMPTY_STATE_COPY,
} from "./received/subcomponents/XtdhReceivedNftsView.constants";
import { SortDirection } from "@/entities/ISort";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface EcosystemCollectionsQueryParams {
  readonly sort: XtdhCollectionsSortField;
  readonly direction: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly collections: string[];
}

interface EcosystemTokensQueryParams {
  readonly sort: XtdhNftSortField;
  readonly direction: SortDirection;
  readonly page: number;
  readonly pageSize: number;
  readonly collections: string[];
}

function toApiDirection(direction: SortDirection): "asc" | "desc" {
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

async function fetchEcosystemCollections(
  params: EcosystemCollectionsQueryParams,
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

async function fetchEcosystemTokens(
  params: EcosystemTokensQueryParams,
): Promise<XtdhReceivedNftsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("sort", params.sort);
  searchParams.set("dir", toApiDirection(params.direction));
  searchParams.set("page", params.page.toString());
  searchParams.set("page_size", params.pageSize.toString());

  if (params.collections.length > 0) {
    searchParams.set("collections", params.collections.join(","));
  }

  const queryString = searchParams.toString();

  return await fetchWithErrorHandling<XtdhReceivedNftsResponse>(
    `/api/xtdh/tokens${queryString ? `?${queryString}` : ""}`,
    "Failed to load xTDH tokens",
  );
}

export default function XtdhPage() {
  const [view, setView] = useState<XtdhReceivedView>("collections");
  const [hasViewedNfts, setHasViewedNfts] = useState<boolean>(false);

  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const [collectionsSort, setCollectionsSort] =
    useState<XtdhCollectionsSortField>(DEFAULT_COLLECTION_SORT);
  const [collectionsDirection, setCollectionsDirection] = useState<SortDirection>(
    DEFAULT_DIRECTION,
  );
  const [collectionsPage, setCollectionsPage] = useState<number>(1);
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(
    null,
  );

  const [nftsSort, setNftsSort] = useState<XtdhNftSortField>(DEFAULT_NFT_SORT);
  const [nftsDirection, setNftsDirection] = useState<SortDirection>(
    DEFAULT_DIRECTION,
  );
  const [nftsPage, setNftsPage] = useState<number>(1);

  const collectionsQuery = useQuery({
    queryKey: [
      QueryKey.XTDH_RECEIVED_COLLECTIONS,
      "ecosystem",
      collectionsSort,
      collectionsDirection,
      collectionsPage,
      selectedCollections.join(","),
    ],
    queryFn: async () =>
      await fetchEcosystemCollections({
        sort: collectionsSort,
        direction: collectionsDirection,
        page: collectionsPage,
        pageSize: COLLECTIONS_PAGE_SIZE,
        collections: selectedCollections,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const nftsQuery = useQuery({
    queryKey: [
      QueryKey.XTDH_RECEIVED_NFTS,
      "ecosystem",
      nftsSort,
      nftsDirection,
      nftsPage,
      selectedCollections.join(","),
    ],
    queryFn: async () =>
      await fetchEcosystemTokens({
        sort: nftsSort,
        direction: nftsDirection,
        page: nftsPage,
        pageSize: NFTS_PAGE_SIZE,
        collections: selectedCollections,
      }),
    enabled: hasViewedNfts || view === "nfts",
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const handleViewChange = useCallback((nextView: XtdhReceivedView) => {
    setView(nextView);
    if (nextView === "nfts") {
      setHasViewedNfts(true);
    }
  }, []);

  const handleCollectionsSortChange = useCallback(
    (nextSort: XtdhCollectionsSortField) => {
      setCollectionsDirection((prevDirection) => {
        if (nextSort === collectionsSort) {
          return prevDirection === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC;
        }
        return DEFAULT_DIRECTION;
      });
      setCollectionsSort(nextSort);
      setCollectionsPage(1);
    },
    [collectionsSort],
  );

  const handleNftsSortChange = useCallback(
    (nextSort: XtdhNftSortField) => {
      setNftsDirection((prevDirection) => {
        if (nextSort === nftsSort) {
          return prevDirection === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC;
        }
        return DEFAULT_DIRECTION;
      });
      setNftsSort(nextSort);
      setNftsPage(1);
    },
    [nftsSort],
  );

  const handleCollectionsFilterChange = useCallback((nextSelected: string[]) => {
    setSelectedCollections(nextSelected);
    setCollectionsPage(1);
    setNftsPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCollections([]);
    setCollectionsPage(1);
    setNftsPage(1);
  }, []);

  const handleCollectionsPageChange = useCallback((page: number) => {
    setCollectionsPage(page);
  }, []);

  const handleNftsPageChange = useCallback((page: number) => {
    setNftsPage(page);
  }, []);

  const handleCollectionsRetry = useCallback(() => {
    void collectionsQuery.refetch();
  }, [collectionsQuery.refetch]);

  const handleNftsRetry = useCallback(() => {
    void nftsQuery.refetch();
  }, [nftsQuery.refetch]);

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollectionId((prev) =>
      prev === collectionId ? null : collectionId,
    );
  }, []);

  const filtersAreActive = useMemo(
    () =>
      xtdhHasActiveFilters({
        collections: selectedCollections,
      }),
    [selectedCollections],
  );

  const availableCollectionOptions = useMemo(() => {
    const options: XtdhReceivedCollectionOption[] = [
      ...(collectionsQuery.data?.availableCollections ?? []),
      ...(nftsQuery.data?.availableCollections ?? []),
    ];

    if (!options.length) {
      return [];
    }

    const map = new Map<string, XtdhReceivedCollectionOption>();
    for (const option of options) {
      if (!map.has(option.collectionId)) {
        map.set(option.collectionId, option);
      }
    }

    return Array.from(map.values());
  }, [collectionsQuery.data?.availableCollections, nftsQuery.data?.availableCollections]);

  const mergedCollectionOptions = useMemo(
    () => mergeXtdhCollectionOptions(availableCollectionOptions, selectedCollections),
    [availableCollectionOptions, selectedCollections],
  );

  const collectionFilterOptions = useMemo(
    () =>
      mergedCollectionOptions.map((option) => ({
        id: option.collectionId,
        name: option.collectionName,
        tokenCount: option.tokenCount,
      })),
    [mergedCollectionOptions],
  );

  const collectionsTotalCount = collectionsQuery.data?.totalCount ?? 0;
  const nftsTotalCount = nftsQuery.data?.totalCount ?? 0;

  const collectionsTotalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(collectionsTotalCount / COLLECTIONS_PAGE_SIZE),
      ),
    [collectionsTotalCount],
  );

  const nftsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(nftsTotalCount / NFTS_PAGE_SIZE)),
    [nftsTotalCount],
  );

  const collectionsHaveNextPage = collectionsPage < collectionsTotalPages;
  const nftsHaveNextPage = nftsPage < nftsTotalPages;

  const collectionsResultSummary = useMemo(() => {
    if (collectionsQuery.isLoading) {
      return "Loading collections...";
    }
    if (collectionsQuery.isFetching) {
      return "Updating collections...";
    }
    const label = collectionsTotalCount === 1 ? "collection" : "collections";
    return `Showing ${collectionsTotalCount.toLocaleString()} ${label}`;
  }, [
    collectionsQuery.isFetching,
    collectionsQuery.isLoading,
    collectionsTotalCount,
  ]);

  const nftsResultSummary = useMemo(() => {
    if (nftsQuery.isLoading) {
      return "Loading NFTs...";
    }
    if (nftsQuery.isFetching) {
      return "Updating NFTs...";
    }
    const label = nftsTotalCount === 1 ? "NFT" : "NFTs";
    return `Showing ${nftsTotalCount.toLocaleString()} ${label}`;
  }, [nftsQuery.isFetching, nftsQuery.isLoading, nftsTotalCount]);

  const collectionsErrorMessage =
    collectionsQuery.error instanceof Error
      ? collectionsQuery.error.message
      : undefined;

  const nftsErrorMessage =
    nftsQuery.error instanceof Error ? nftsQuery.error.message : undefined;

  const collectionsState: XtdhReceivedCollectionsViewState = {
    missingScopeMessage: undefined,
    isLoading: collectionsQuery.isLoading,
    isFetching: collectionsQuery.isFetching,
    isError: collectionsQuery.isError,
    errorMessage: collectionsErrorMessage,
    collections: collectionsQuery.data?.collections ?? [],
    activeSort: collectionsSort,
    activeDirection: collectionsDirection,
    collectionFilterOptions,
    filtersAreActive,
    selectedCollections,
    resultSummary: collectionsResultSummary,
    page: collectionsPage,
    totalPages: collectionsTotalPages,
    haveNextPage: collectionsHaveNextPage,
    handleSortChange: handleCollectionsSortChange,
    handleCollectionsFilterChange,
    handleClearFilters,
    handlePageChange: handleCollectionsPageChange,
    handleRetry: handleCollectionsRetry,
    expandedCollectionId,
    toggleCollection,
    emptyStateCopy: COLLECTIONS_EMPTY_STATE_COPY,
    clearFiltersLabel: COLLECTIONS_CLEAR_FILTERS_LABEL,
  };

  const nftsState: XtdhReceivedNftsViewState = {
    missingScopeMessage: undefined,
    isLoading: nftsQuery.isLoading,
    isFetching: nftsQuery.isFetching,
    isError: nftsQuery.isError,
    errorMessage: nftsErrorMessage,
    nfts: nftsQuery.data?.nfts ?? [],
    activeSort: nftsSort,
    activeDirection: nftsDirection,
    collectionFilterOptions,
    filtersAreActive,
    selectedCollections,
    resultSummary: nftsResultSummary,
    page: nftsPage,
    totalPages: nftsTotalPages,
    haveNextPage: nftsHaveNextPage,
    handleSortChange: handleNftsSortChange,
    handleCollectionsFilterChange,
    handleClearFilters,
    handlePageChange: handleNftsPageChange,
    handleRetry: handleNftsRetry,
    clearFiltersLabel: NFTS_CLEAR_FILTERS_LABEL,
    emptyStateCopy: NFTS_EMPTY_STATE_COPY,
  };

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-pb-16">
      <XtdhStatsOverview />
      <XtdhReceivedSection
        view={view}
        onViewChange={handleViewChange}
        collectionsState={collectionsState}
        nftsState={nftsState}
        description="Explore xTDH allocations across the ecosystem, switching between collection and token-level views as needed."
      />
    </div>
  );
}
