"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SortDirection } from "@/entities/ISort";
import type {
  XtdhReceivedCollectionOption,
  XtdhReceivedCollectionSummary,
  XtdhReceivedCollectionsResponse,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";

import {
  COLLECTIONS_PAGE_SIZE,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_NFT_SORT,
  NFTS_PAGE_SIZE,
  type XtdhCollectionOwnershipFilter,
  type XtdhCollectionsDiscoveryFilter,
  type XtdhCollectionsSortField,
  type XtdhNftSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import {
  mergeXtdhCollectionOptions,
  xtdhIsCollectionNewlyAllocated,
} from "../utils";
import type {
  XtdhReceivedCollectionsViewState,
  XtdhReceivedNftsViewState,
} from "../subcomponents";
import {
  DEFAULT_CLEAR_FILTERS_LABEL as COLLECTIONS_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY as COLLECTIONS_EMPTY_STATE_COPY,
} from "../subcomponents/XtdhReceivedCollectionsView.constants";
import {
  DEFAULT_CLEAR_FILTERS_LABEL as NFTS_CLEAR_FILTERS_LABEL,
  DEFAULT_EMPTY_STATE_COPY as NFTS_EMPTY_STATE_COPY,
} from "../subcomponents/XtdhReceivedNftsView.constants";
import {
  fetchXtdhReceivedCollections,
  fetchXtdhReceivedTokens,
} from "../api";

interface UseXtdhReceivedExplorerResult {
  readonly view: XtdhReceivedView;
  readonly handleViewChange: (nextView: XtdhReceivedView) => void;
  readonly collectionsState: XtdhReceivedCollectionsViewState;
  readonly nftsState: XtdhReceivedNftsViewState;
}

const COLLECTIONS_FETCH_PAGE_SIZE = 200;

interface CollectionFilters {
  readonly selectedCollections: string[];
  readonly setSelectedCollections: (nextSelected: string[]) => void;
}

function useCollectionFilters(): CollectionFilters {
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const handleSetSelectedCollections = useCallback((nextSelected: string[]) => {
    setSelectedCollections(nextSelected);
  }, []);

  return {
    selectedCollections,
    setSelectedCollections: handleSetSelectedCollections,
  };
}

function useCollectionsQuery() {
  return useQuery<XtdhReceivedCollectionsResponse, Error>({
    queryKey: [QueryKey.XTDH_RECEIVED_COLLECTIONS, "ecosystem", "exploration"],
    queryFn: async () =>
      await fetchXtdhReceivedCollections({
        sort: DEFAULT_COLLECTION_SORT,
        direction: DEFAULT_DIRECTION,
        page: 1,
        pageSize: COLLECTIONS_FETCH_PAGE_SIZE,
        collections: [],
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

interface TokensStateParams {
  readonly sort: XtdhNftSortField;
  readonly direction: SortDirection;
  readonly page: number;
  readonly selectedCollections: string[];
  readonly isEnabled: boolean;
  readonly search?: string;
  readonly ownership?: XtdhCollectionOwnershipFilter;
  readonly discovery?: XtdhCollectionsDiscoveryFilter;
}

function useTokensQuery({
  sort,
  direction,
  page,
  selectedCollections,
  isEnabled,
  search,
  ownership,
  discovery,
}: TokensStateParams) {
  return useQuery<XtdhReceivedNftsResponse, Error>({
    queryKey: [
      QueryKey.XTDH_RECEIVED_NFTS,
      "ecosystem",
      sort,
      direction,
      page,
      selectedCollections.join(","),
      search ?? "",
      ownership ?? "all",
      discovery ?? "none",
    ],
    queryFn: async () =>
      await fetchXtdhReceivedTokens({
        sort,
        direction,
        page,
        pageSize: NFTS_PAGE_SIZE,
        collections: selectedCollections,
        search,
        ownership,
        discovery,
      }),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

function useCollectionsControls() {
  const [collectionsSort, setCollectionsSort] =
    useState<XtdhCollectionsSortField>(DEFAULT_COLLECTION_SORT);
  const [collectionsDirection, setCollectionsDirection] =
    useState<SortDirection>(DEFAULT_DIRECTION);
  const [collectionsPage, setCollectionsPage] = useState<number>(1);
  const [expandedCollectionId, setExpandedCollectionId] = useState<
    string | null
  >(null);
  const [trendingActive, setTrendingActive] = useState<boolean>(false);

  const lastManualSortRef = useRef<XtdhCollectionsSortField>(DEFAULT_COLLECTION_SORT);
  const lastManualDirectionRef = useRef<SortDirection>(DEFAULT_DIRECTION);

  const setTrendingFilterActive = useCallback(
    (nextActive: boolean) => {
      if (nextActive) {
        if (!trendingActive && collectionsSort !== "rate_change_7d") {
          lastManualSortRef.current = collectionsSort;
          lastManualDirectionRef.current = collectionsDirection;
        }
        setTrendingActive(true);
        setCollectionsSort("rate_change_7d");
        setCollectionsDirection(SortDirection.DESC);
      } else if (trendingActive) {
        setTrendingActive(false);
        setCollectionsSort(lastManualSortRef.current);
        setCollectionsDirection(lastManualDirectionRef.current);
      }
      setCollectionsPage(1);
    },
    [
      collectionsDirection,
      collectionsSort,
      setCollectionsPage,
      trendingActive,
    ],
  );

  const handleCollectionsSortChange = useCallback(
    (nextSort: XtdhCollectionsSortField) => {
      if (nextSort === "rate_change_7d") {
        setTrendingFilterActive(true);
        return;
      }

      const isSameSort = nextSort === collectionsSort;
      const defaultDirection =
        nextSort === "collection_name" ? SortDirection.ASC : DEFAULT_DIRECTION;

      const newDirection = isSameSort
        ? collectionsDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC
        : defaultDirection;

      lastManualSortRef.current = nextSort;
      lastManualDirectionRef.current = newDirection;

      setTrendingFilterActive(false);
      setCollectionsSort(nextSort);
      setCollectionsDirection(newDirection);
      setCollectionsPage(1);
    },
    [
      collectionsDirection,
      collectionsSort,
      setCollectionsDirection,
      setCollectionsPage,
      setCollectionsSort,
      setTrendingFilterActive,
    ],
  );

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollectionId((prev) =>
      prev === collectionId ? null : collectionId,
    );
  }, []);

  return {
    collectionsSort,
    collectionsDirection,
    collectionsPage,
    setCollectionsPage,
    expandedCollectionId,
    toggleCollection,
    trendingActive,
    handleCollectionsSortChange,
    setTrendingFilterActive,
  };
}

function useTokensControls(
  setCollectionsTrendingFilterActive: (active: boolean) => void,
) {
  const [nftsSort, setNftsSort] = useState<XtdhNftSortField>(DEFAULT_NFT_SORT);
  const [nftsDirection, setNftsDirection] =
    useState<SortDirection>(DEFAULT_DIRECTION);
  const [nftsPage, setNftsPage] = useState<number>(1);
  const trendingActiveRef = useRef<boolean>(false);
  const lastManualSortRef = useRef<XtdhNftSortField>(DEFAULT_NFT_SORT);
  const lastManualDirectionRef = useRef<SortDirection>(DEFAULT_DIRECTION);

  const setTokensTrendingFilterActive = useCallback(
    (nextActive: boolean) => {
      if (nextActive) {
        if (!trendingActiveRef.current && nftsSort !== "rate_change_7d") {
          lastManualSortRef.current = nftsSort;
          lastManualDirectionRef.current = nftsDirection;
        }
        trendingActiveRef.current = true;
        setCollectionsTrendingFilterActive(true);
        setNftsSort("rate_change_7d");
        setNftsDirection(SortDirection.DESC);
        setNftsPage(1);
        return;
      }

      if (trendingActiveRef.current) {
        trendingActiveRef.current = false;
        setCollectionsTrendingFilterActive(false);
        setNftsSort(lastManualSortRef.current);
        setNftsDirection(lastManualDirectionRef.current);
        setNftsPage(1);
      }
    },
    [
      nftsDirection,
      nftsSort,
      setCollectionsTrendingFilterActive,
      setNftsPage,
    ],
  );

  const handleNftsSortChange = useCallback(
    (nextSort: XtdhNftSortField) => {
      if (nextSort === "rate_change_7d") {
        setTokensTrendingFilterActive(true);
        return;
      }

      const currentSort = trendingActiveRef.current
        ? lastManualSortRef.current
        : nftsSort;
      const currentDirection = trendingActiveRef.current
        ? lastManualDirectionRef.current
        : nftsDirection;
      const isSameSort = nextSort === currentSort;
      const defaultDirection =
        nextSort === "token_name" ? SortDirection.ASC : DEFAULT_DIRECTION;
      const newDirection = isSameSort
        ? currentDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC
        : defaultDirection;

      lastManualSortRef.current = nextSort;
      lastManualDirectionRef.current = newDirection;

      if (trendingActiveRef.current) {
        setTokensTrendingFilterActive(false);
        return;
      }

      setNftsSort(nextSort);
      setNftsDirection(newDirection);
      setNftsPage(1);
    },
    [
      nftsDirection,
      nftsSort,
      setNftsPage,
      setTokensTrendingFilterActive,
      trendingActiveRef,
    ],
  );

  return {
    nftsSort,
    handleNftsSortChange,
    nftsDirection,
    nftsPage,
    setNftsPage,
    setTokensTrendingFilterActive,
  };
}

function useCollectionFiltersState(
  selectedCollections: string[],
  setSelectedCollections: (nextSelected: string[]) => void,
  setCollectionsPage: (page: number) => void,
  setNftsPage: (page: number) => void,
) {
  const handleCollectionsFilterChange = useCallback(
    (nextSelected: string[]) => {
      setSelectedCollections(nextSelected);
      setCollectionsPage(1);
      setNftsPage(1);
    },
    [setCollectionsPage, setNftsPage, setSelectedCollections],
  );

  const handleClearFilters = useCallback(() => {
    setSelectedCollections([]);
    setCollectionsPage(1);
    setNftsPage(1);
  }, [setCollectionsPage, setNftsPage, setSelectedCollections]);

  return {
    handleCollectionsFilterChange,
    handleClearFilters,
  };
}

function useCollectionOptions(
  collectionsQuery: ReturnType<typeof useCollectionsQuery>,
  tokensQuery: ReturnType<typeof useTokensQuery>,
  selectedCollections: string[],
) {
  const availableCollectionOptions = useMemo(() => {
    const options: XtdhReceivedCollectionOption[] = [
      ...(collectionsQuery.data?.availableCollections ?? []),
      ...(tokensQuery.data?.availableCollections ?? []),
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
  }, [
    collectionsQuery.data?.availableCollections,
    tokensQuery.data?.availableCollections,
  ]);

  const mergedCollectionOptions = useMemo(
    () =>
      mergeXtdhCollectionOptions(availableCollectionOptions, selectedCollections),
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

  return collectionFilterOptions;
}

function sortCollectionsClient(
  collections: XtdhReceivedCollectionSummary[],
  sort: XtdhCollectionsSortField,
  direction: SortDirection,
): XtdhReceivedCollectionSummary[] {
  const multiplier = direction === SortDirection.ASC ? 1 : -1;

  return [...collections].sort((a, b) => {
    const fallback =
      (a.totalXtdhRate - b.totalXtdhRate) * multiplier ||
      a.collectionName.localeCompare(b.collectionName) * multiplier;

    switch (sort) {
      case "collection_name":
        return (
          a.collectionName.localeCompare(b.collectionName) * multiplier ||
          (a.totalXtdhRate - b.totalXtdhRate) * multiplier
        );
      case "grantor_count": {
        const aCount = a.grantorCount ?? 0;
        const bCount = b.grantorCount ?? 0;
        if (aCount === bCount) {
          return fallback;
        }
        return (aCount - bCount) * multiplier;
      }
      case "token_count": {
        const aCount = a.tokenCount ?? 0;
        const bCount = b.tokenCount ?? 0;
        if (aCount === bCount) {
          return fallback;
        }
        return (aCount - bCount) * multiplier;
      }
      case "total_received":
        if (a.totalXtdhReceived === b.totalXtdhReceived) {
          return fallback;
        }
        return (a.totalXtdhReceived - b.totalXtdhReceived) * multiplier;
      case "rate_change_7d": {
        const aRate = a.rateChange7d ?? 0;
        const bRate = b.rateChange7d ?? 0;
        if (aRate === bRate) {
          return fallback;
        }
        return (aRate - bRate) * multiplier;
      }
      case "last_allocation_at": {
        const aTime = a.lastAllocatedAt
          ? new Date(a.lastAllocatedAt).getTime()
          : 0;
        const bTime = b.lastAllocatedAt
          ? new Date(b.lastAllocatedAt).getTime()
          : 0;
        if (aTime === bTime) {
          return fallback;
        }
        return (aTime - bTime) * multiplier;
      }
      case "total_rate":
      default:
        if (a.totalXtdhRate === b.totalXtdhRate) {
          return (
            (a.lastAllocatedAt && b.lastAllocatedAt
              ? (new Date(a.lastAllocatedAt).getTime() -
                  new Date(b.lastAllocatedAt).getTime()) *
                multiplier
              : 0) ||
            a.collectionName.localeCompare(b.collectionName) * multiplier
          );
        }
        return (a.totalXtdhRate - b.totalXtdhRate) * multiplier;
    }
  });
}

export function useXtdhReceivedExplorer(): UseXtdhReceivedExplorerResult {
  const [view, setView] = useState<XtdhReceivedView>("collections");
  const [hasViewedNfts, setHasViewedNfts] = useState<boolean>(false);

  const { selectedCollections, setSelectedCollections } = useCollectionFilters();

  const {
    collectionsSort,
    collectionsDirection,
    collectionsPage,
    setCollectionsPage,
    expandedCollectionId,
    toggleCollection,
    trendingActive,
    handleCollectionsSortChange,
    setTrendingFilterActive,
  } = useCollectionsControls();

  const {
    nftsSort,
    handleNftsSortChange,
    nftsDirection,
    nftsPage,
    setNftsPage,
    setTokensTrendingFilterActive,
  } = useTokensControls(setTrendingFilterActive);

  const {
    handleCollectionsFilterChange,
    handleClearFilters: handleClearCollectionFilters,
  } = useCollectionFiltersState(
    selectedCollections,
    setSelectedCollections,
    setCollectionsPage,
    setNftsPage,
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ownershipFilter, setOwnershipFilter] =
    useState<XtdhCollectionOwnershipFilter>("all");
  const [newlyAllocatedOnly, setNewlyAllocatedOnly] =
    useState<boolean>(false);

  const collectionsQuery = useCollectionsQuery();
  const trimmedSearchQuery = searchQuery.trim();

  const shouldEnableTokensQuery = hasViewedNfts || view === "nfts";

  const tokensQuery = useTokensQuery({
    sort: nftsSort,
    direction: nftsDirection,
    page: nftsPage,
    selectedCollections,
    isEnabled: shouldEnableTokensQuery,
    search: trimmedSearchQuery ? trimmedSearchQuery : undefined,
    ownership: ownershipFilter,
    discovery: newlyAllocatedOnly ? "new" : trendingActive ? "trending" : "none",
  });

  const collectionFilterOptions = useCollectionOptions(
    collectionsQuery,
    tokensQuery,
    selectedCollections,
  );

  const derivedCollections = useMemo(() => {
    const base = collectionsQuery.data?.collections ?? [];
    const selectionSet =
      selectedCollections.length > 0 ? new Set(selectedCollections) : null;
    const normalizedSearch = trimmedSearchQuery.toLowerCase();

    let filtered = selectionSet
      ? base.filter((collection) => selectionSet.has(collection.collectionId))
      : base;

    if (normalizedSearch) {
      filtered = filtered.filter((collection) => {
        const nameMatch = collection.collectionName
          .toLowerCase()
          .includes(normalizedSearch);
        const creatorMatch = (collection.creatorName ?? "")
          .toLowerCase()
          .includes(normalizedSearch);
        return nameMatch || creatorMatch;
      });
    }

    if (ownershipFilter === "granted") {
      filtered = filtered.filter((collection) => collection.isGrantedByUser);
    } else if (ownershipFilter === "received") {
      filtered = filtered.filter((collection) => collection.isReceivedByUser);
    }

    if (newlyAllocatedOnly) {
      filtered = filtered.filter((collection) =>
        xtdhIsCollectionNewlyAllocated(collection),
      );
    }

    const activeSort = trendingActive ? "rate_change_7d" : collectionsSort;
    const activeDirection = trendingActive
      ? SortDirection.DESC
      : collectionsDirection;

    const sorted = sortCollectionsClient(filtered, activeSort, activeDirection);

    return {
      trimmedSearch: trimmedSearchQuery,
      activeSort,
      activeDirection,
      sorted,
    };
  }, [
    collectionsQuery.data?.collections,
    selectedCollections,
    trimmedSearchQuery,
    ownershipFilter,
    newlyAllocatedOnly,
    trendingActive,
    collectionsSort,
    collectionsDirection,
  ]);

  const {
    trimmedSearch,
    activeSort: resolvedCollectionSort,
    activeDirection: resolvedCollectionDirection,
    sorted: sortedCollections,
  } = derivedCollections;

  const collectionsTotalCount = sortedCollections.length;
  const collectionsTotalPages = Math.max(
    1,
    Math.ceil(collectionsTotalCount / COLLECTIONS_PAGE_SIZE),
  );

  useEffect(() => {
    if (collectionsPage > collectionsTotalPages) {
      setCollectionsPage(collectionsTotalPages);
    }
  }, [collectionsPage, collectionsTotalPages, setCollectionsPage]);

  const paginatedCollections = useMemo(() => {
    const start = (collectionsPage - 1) * COLLECTIONS_PAGE_SIZE;
    return sortedCollections.slice(start, start + COLLECTIONS_PAGE_SIZE);
  }, [sortedCollections, collectionsPage]);

  const collectionsHaveNextPage = collectionsPage < collectionsTotalPages;

  const nftsTotalCount = tokensQuery.data?.totalCount ?? 0;
  const nftsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(nftsTotalCount / NFTS_PAGE_SIZE)),
    [nftsTotalCount],
  );
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
    if (tokensQuery.isLoading) {
      return "Loading NFTs...";
    }
    if (tokensQuery.isFetching) {
      return "Updating NFTs...";
    }
    const label = nftsTotalCount === 1 ? "NFT" : "NFTs";
    return `Showing ${nftsTotalCount.toLocaleString()} ${label}`;
  }, [tokensQuery.isFetching, tokensQuery.isLoading, nftsTotalCount]);

  const collectionsErrorMessage =
    collectionsQuery.error instanceof Error
      ? collectionsQuery.error.message
      : undefined;

  const nftsErrorMessage =
    tokensQuery.error instanceof Error ? tokensQuery.error.message : undefined;

  const { refetch: refetchCollections } = collectionsQuery;
  const { refetch: refetchTokens } = tokensQuery;

  const handleCollectionsRetry = useCallback(() => {
    void refetchCollections();
  }, [refetchCollections]);

  const handleNftsRetry = useCallback(() => {
    void refetchTokens();
  }, [refetchTokens]);

  const handleCollectionsPageChange = useCallback((page: number) => {
    setCollectionsPage(page);
  }, [setCollectionsPage]);

  const handleNftsPageChange = useCallback((page: number) => {
    setNftsPage(page);
  }, [setNftsPage]);

  const handleViewChange = useCallback((nextView: XtdhReceivedView) => {
    setView(nextView);
    if (nextView === "nfts") {
      setHasViewedNfts(true);
    }
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setCollectionsPage(1);
      setNftsPage(1);
    },
    [setCollectionsPage, setNftsPage],
  );

  const handleOwnershipFilterChange = useCallback(
    (nextFilter: XtdhCollectionOwnershipFilter) => {
      setOwnershipFilter(nextFilter);
      setCollectionsPage(1);
      setNftsPage(1);
    },
    [setCollectionsPage, setNftsPage],
  );

  const discoveryFilter: XtdhCollectionsDiscoveryFilter = trendingActive
    ? "trending"
    : newlyAllocatedOnly
      ? "new"
      : "none";

  const handleDiscoveryFilterChange = useCallback(
    (next: XtdhCollectionsDiscoveryFilter) => {
      setCollectionsPage(1);
      setNftsPage(1);
      if (next === "trending") {
        if (newlyAllocatedOnly) {
          setNewlyAllocatedOnly(false);
        }
        setTokensTrendingFilterActive(true);
        return;
      }

      if (next === "new") {
        if (!newlyAllocatedOnly) {
          setNewlyAllocatedOnly(true);
        }
        if (trendingActive) {
          setTokensTrendingFilterActive(false);
        }
        return;
      }

      if (newlyAllocatedOnly) {
        setNewlyAllocatedOnly(false);
      }
      if (trendingActive) {
        setTokensTrendingFilterActive(false);
      }
    },
    [
      newlyAllocatedOnly,
      setCollectionsPage,
      setNftsPage,
      setNewlyAllocatedOnly,
      setTokensTrendingFilterActive,
      trendingActive,
    ],
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setOwnershipFilter("all");
    setNewlyAllocatedOnly(false);
    setTokensTrendingFilterActive(false);
    handleClearCollectionFilters();
    setNftsPage(1);
  }, [handleClearCollectionFilters, setNftsPage, setTokensTrendingFilterActive]);

  const sharedFiltersAreActive = useMemo(
    () =>
      Boolean(
        trimmedSearch ||
          ownershipFilter !== "all" ||
          newlyAllocatedOnly ||
          trendingActive ||
          selectedCollections.length > 0,
      ),
    [
      trimmedSearch,
      ownershipFilter,
      newlyAllocatedOnly,
      trendingActive,
      selectedCollections.length,
    ],
  );

  const nftFiltersAreActive = sharedFiltersAreActive;

  const collectionsState: XtdhReceivedCollectionsViewState = {
    missingScopeMessage: undefined,
    isLoading: collectionsQuery.isLoading,
    isFetching: collectionsQuery.isFetching,
    isError: collectionsQuery.isError,
    errorMessage: collectionsErrorMessage,
    collections: paginatedCollections,
    activeSort: resolvedCollectionSort,
    activeDirection: resolvedCollectionDirection,
    filtersAreActive: sharedFiltersAreActive,
    resultSummary: collectionsResultSummary,
    page: collectionsPage,
    totalPages: collectionsTotalPages,
    haveNextPage: collectionsHaveNextPage,
    handleSortChange: handleCollectionsSortChange,
    handlePageChange: handleCollectionsPageChange,
    handleRetry: handleCollectionsRetry,
    expandedCollectionId,
    toggleCollection,
    clearFiltersLabel: COLLECTIONS_CLEAR_FILTERS_LABEL,
    emptyStateCopy: COLLECTIONS_EMPTY_STATE_COPY,
    searchQuery,
    handleSearchChange,
    ownershipFilter,
    handleOwnershipFilterChange,
    discoveryFilter,
    handleDiscoveryFilterChange,
    handleResetFilters,
  };

  const nftsState: XtdhReceivedNftsViewState = {
    missingScopeMessage: undefined,
    isLoading: tokensQuery.isLoading,
    isFetching: tokensQuery.isFetching,
    isError: tokensQuery.isError,
    errorMessage: nftsErrorMessage,
    nfts: tokensQuery.data?.nfts ?? [],
    activeSort: nftsSort,
    activeDirection: nftsDirection,
    collectionFilterOptions,
    filtersAreActive: nftFiltersAreActive,
    selectedCollections,
    resultSummary: nftsResultSummary,
    page: nftsPage,
    totalPages: nftsTotalPages,
    haveNextPage: nftsHaveNextPage,
    handleSortChange: handleNftsSortChange,
    handleCollectionsFilterChange,
    handleClearFilters: handleResetFilters,
    handlePageChange: handleNftsPageChange,
    handleRetry: handleNftsRetry,
    clearFiltersLabel: NFTS_CLEAR_FILTERS_LABEL,
    emptyStateCopy: NFTS_EMPTY_STATE_COPY,
    searchQuery,
    handleSearchChange,
    ownershipFilter,
    handleOwnershipFilterChange,
    discoveryFilter,
    handleDiscoveryFilterChange,
  };

  return {
    view,
    handleViewChange,
    collectionsState,
    nftsState,
  };
}
