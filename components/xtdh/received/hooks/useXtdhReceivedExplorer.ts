'use client';

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SortDirection } from "@/entities/ISort";
import type {
  XtdhReceivedCollectionOption,
  XtdhReceivedCollectionsResponse,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";

import {
  COLLECTIONS_PAGE_SIZE,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  DEFAULT_NFT_SORT,
  NFTS_PAGE_SIZE,
  type XtdhCollectionsSortField,
  type XtdhNftSortField,
  type XtdhReceivedView,
} from "../utils/constants";
import { mergeXtdhCollectionOptions, xtdhHasActiveFilters } from "../utils";
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

interface CollectionsStateParams {
  readonly sort: XtdhCollectionsSortField;
  readonly direction: SortDirection;
  readonly page: number;
  readonly selectedCollections: string[];
}

function useCollectionsQuery({
  sort,
  direction,
  page,
  selectedCollections,
}: CollectionsStateParams) {
  return useQuery<XtdhReceivedCollectionsResponse, Error>({
    queryKey: [
      QueryKey.XTDH_RECEIVED_COLLECTIONS,
      "ecosystem",
      sort,
      direction,
      page,
      selectedCollections.join(","),
    ],
    queryFn: async () =>
      await fetchXtdhReceivedCollections({
        sort,
        direction,
        page,
        pageSize: COLLECTIONS_PAGE_SIZE,
        collections: selectedCollections,
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
}

function useTokensQuery({
  sort,
  direction,
  page,
  selectedCollections,
  isEnabled,
}: TokensStateParams) {
  return useQuery<XtdhReceivedNftsResponse, Error>({
    queryKey: [
      QueryKey.XTDH_RECEIVED_NFTS,
      "ecosystem",
      sort,
      direction,
      page,
      selectedCollections.join(","),
    ],
    queryFn: async () =>
      await fetchXtdhReceivedTokens({
        sort,
        direction,
        page,
        pageSize: NFTS_PAGE_SIZE,
        collections: selectedCollections,
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

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollectionId((prev) =>
      prev === collectionId ? null : collectionId,
    );
  }, []);

  return {
    collectionsSort,
    handleCollectionsSortChange,
    collectionsDirection,
    collectionsPage,
    setCollectionsPage,
    expandedCollectionId,
    toggleCollection,
  };
}

function useTokensControls() {
  const [nftsSort, setNftsSort] = useState<XtdhNftSortField>(DEFAULT_NFT_SORT);
  const [nftsDirection, setNftsDirection] =
    useState<SortDirection>(DEFAULT_DIRECTION);
  const [nftsPage, setNftsPage] = useState<number>(1);

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

  return {
    nftsSort,
    handleNftsSortChange,
    nftsDirection,
    nftsPage,
    setNftsPage,
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

export function useXtdhReceivedExplorer(): UseXtdhReceivedExplorerResult {
  const [view, setView] = useState<XtdhReceivedView>("collections");
  const [hasViewedNfts, setHasViewedNfts] = useState<boolean>(false);

  const { selectedCollections, setSelectedCollections } = useCollectionFilters();

  const {
    collectionsSort,
    handleCollectionsSortChange,
    collectionsDirection,
    collectionsPage,
    setCollectionsPage,
    expandedCollectionId,
    toggleCollection,
  } = useCollectionsControls();

  const {
    nftsSort,
    handleNftsSortChange,
    nftsDirection,
    nftsPage,
    setNftsPage,
  } = useTokensControls();

  const { handleCollectionsFilterChange, handleClearFilters } =
    useCollectionFiltersState(
      selectedCollections,
      setSelectedCollections,
      setCollectionsPage,
      setNftsPage,
    );

  const collectionsQuery = useCollectionsQuery({
    sort: collectionsSort,
    direction: collectionsDirection,
    page: collectionsPage,
    selectedCollections,
  });

  const shouldEnableTokensQuery = hasViewedNfts || view === "nfts";

  const tokensQuery = useTokensQuery({
    sort: nftsSort,
    direction: nftsDirection,
    page: nftsPage,
    selectedCollections,
    isEnabled: shouldEnableTokensQuery,
  });

  const filtersAreActive = useMemo(
    () =>
      xtdhHasActiveFilters({
        collections: selectedCollections,
      }),
    [selectedCollections],
  );

  const collectionFilterOptions = useCollectionOptions(
    collectionsQuery,
    tokensQuery,
    selectedCollections,
  );

  const collectionsTotalCount = collectionsQuery.data?.totalCount ?? 0;
  const nftsTotalCount = tokensQuery.data?.totalCount ?? 0;

  const collectionsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(collectionsTotalCount / COLLECTIONS_PAGE_SIZE)),
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
    isLoading: tokensQuery.isLoading,
    isFetching: tokensQuery.isFetching,
    isError: tokensQuery.isError,
    errorMessage: nftsErrorMessage,
    nfts: tokensQuery.data?.nfts ?? [],
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

  return {
    view,
    handleViewChange,
    collectionsState,
    nftsState,
  };
}
