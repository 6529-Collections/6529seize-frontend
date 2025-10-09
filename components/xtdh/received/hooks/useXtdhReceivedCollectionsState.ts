'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { SortDirection } from "@/entities/ISort";
import { useReceivedCollections } from "@/hooks/useXtdhReceived";
import type {
  XtdhReceivedCollectionOption,
  XtdhReceivedCollectionSummary,
  XtdhReceivedToken,
} from "@/types/xtdh";
import {
  COLLECTIONS_PAGE_SIZE,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_DIRECTION,
  type XtdhCollectionsSortField,
} from "../utils/constants";
import {
  mergeXtdhCollectionOptions,
  parseXtdhCollectionsSort,
  parseXtdhPage,
  parseXtdhSortDirection,
  xtdhToApiDirection,
} from "../utils";
import { useXtdhReceivedFilters } from "./useXtdhReceivedFilters";
import { useXtdhReceivedSearchParams } from "./useXtdhReceivedSearchParams";

export interface UseXtdhReceivedCollectionsState {
  readonly profileId: string | null;
  readonly collections: XtdhReceivedCollectionSummary[];
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly activeSort: XtdhCollectionsSortField;
  readonly activeDirection: SortDirection;
  readonly collectionFilterOptions: {
    readonly id: string;
    readonly name: string;
    readonly tokenCount: number;
  }[];
  readonly filtersAreActive: boolean;
  readonly selectedCollections: string[];
  readonly resultSummary: string;
  readonly page: number;
  readonly totalPages: number;
  readonly haveNextPage: boolean;
  readonly handleSortChange: (nextSort: XtdhCollectionsSortField) => void;
  readonly handleCollectionsFilterChange: (nextSelected: string[]) => void;
  readonly handleClearFilters: () => void;
  readonly handlePageChange: (page: number) => void;
  readonly handleRetry: () => void;
  readonly expandedCollectionId: string | null;
  readonly toggleCollection: (collectionId: string) => void;
}

/**
 * Encapsulates the collections view behaviour, spanning query params, data
 * fetching and interactive expansion state.
 */
export function useXtdhReceivedCollectionsState(
  profileId: string | null
): UseXtdhReceivedCollectionsState {
  const { searchParams, handleUpdateParams } = useXtdhReceivedSearchParams();

  const {
    selectedCollections,
    filters,
    filtersAreActive,
    handleCollectionsFilterChange,
    handleClearFilters,
  } = useXtdhReceivedFilters(searchParams, handleUpdateParams);

  const activeSort = useMemo(
    () => parseXtdhCollectionsSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );

  const activeDirection = useMemo(
    () => parseXtdhSortDirection(searchParams?.get("dir") ?? null),
    [searchParams]
  );

  const apiDirection = useMemo(
    () => xtdhToApiDirection(activeDirection),
    [activeDirection]
  );

  const page = useMemo(
    () => parseXtdhPage(searchParams?.get("page") ?? null),
    [searchParams]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useReceivedCollections({
    profile: profileId,
    sort: activeSort,
    dir: apiDirection,
    page,
    pageSize: COLLECTIONS_PAGE_SIZE,
    filters,
    enabled: Boolean(profileId),
  });

  const collections = data?.collections ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [availableCollectionOptions, setAvailableCollectionOptions] = useState<
    XtdhReceivedCollectionOption[]
  >([]);

  useEffect(() => {
    if (data?.availableCollections !== undefined) {
      setAvailableCollectionOptions(data.availableCollections);
    }
  }, [data?.availableCollections]);

  const availableCollections = useMemo(
    () =>
      mergeXtdhCollectionOptions(availableCollectionOptions, selectedCollections),
    [availableCollectionOptions, selectedCollections]
  );

  const collectionFilterOptions = useMemo(
    () =>
      availableCollections.map((option) => ({
        id: option.collectionId,
        name: option.collectionName,
        tokenCount: option.tokenCount,
      })),
    [availableCollections]
  );

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / COLLECTIONS_PAGE_SIZE));
  }, [totalCount]);

  const haveNextPage = useMemo(
    () => page * COLLECTIONS_PAGE_SIZE < totalCount,
    [page, totalCount]
  );

  const handleSortChange = useCallback(
    (nextSort: XtdhCollectionsSortField) => {
      handleUpdateParams((params) => {
        const currentSort = parseXtdhCollectionsSort(params.get("sort"));
        const currentDirection = parseXtdhSortDirection(params.get("dir"));

        const nextDirection =
          nextSort === currentSort
            ? currentDirection === SortDirection.ASC
              ? SortDirection.DESC
              : SortDirection.ASC
            : DEFAULT_DIRECTION;

        if (nextSort === DEFAULT_COLLECTION_SORT) {
          params.delete("sort");
        } else {
          params.set("sort", nextSort);
        }

        if (nextDirection === DEFAULT_DIRECTION) {
          params.delete("dir");
        } else {
          params.set("dir", nextDirection.toLowerCase());
        }

        params.set("page", "1");
      });
    },
    [handleUpdateParams]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      handleUpdateParams((params) => {
        params.set("page", nextPage.toString());
      });
    },
    [handleUpdateParams]
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(
    null
  );

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollectionId((prev) => (prev === collectionId ? null : collectionId));
  }, []);

  const resultSummary = useMemo(() => {
    if (!profileId) {
      return "Connect or select a profile to view received xTDH.";
    }
    if (isLoading) {
      return "Loading collections…";
    }
    if (isFetching) {
      return "Updating collections…";
    }
    const label = totalCount === 1 ? "collection" : "collections";
    return `Showing ${totalCount.toLocaleString()} ${label}`;
  }, [isFetching, isLoading, profileId, totalCount]);

  return {
    profileId,
    collections,
    isLoading,
    isFetching,
    isError,
    error,
    activeSort,
    activeDirection,
    collectionFilterOptions,
    filtersAreActive,
    selectedCollections,
    resultSummary,
    page,
    totalPages,
    haveNextPage,
    handleSortChange,
    handleCollectionsFilterChange,
    handleClearFilters,
    handlePageChange,
    handleRetry,
    expandedCollectionId,
    toggleCollection,
  };
}

export type XtdhCollectionSummary = XtdhReceivedCollectionSummary;
export type XtdhCollectionToken = XtdhReceivedToken;
