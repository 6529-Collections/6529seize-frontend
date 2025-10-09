'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { SortDirection } from "@/entities/ISort";
import { useReceivedNfts } from "@/hooks/useXtdhReceived";
import type {
  XtdhReceivedCollectionOption,
  XtdhReceivedNft,
} from "@/types/xtdh";
import {
  DEFAULT_DIRECTION,
  DEFAULT_NFT_SORT,
  NFTS_PAGE_SIZE,
  type XtdhNftSortField,
} from "../utils/constants";
import {
  mergeXtdhCollectionOptions,
  parseXtdhNftSort,
  parseXtdhPage,
  parseXtdhSortDirection,
  xtdhToApiDirection,
} from "../utils";
import { useXtdhReceivedFilters } from "./useXtdhReceivedFilters";
import { useXtdhReceivedSearchParams } from "./useXtdhReceivedSearchParams";

export interface UseXtdhReceivedNftsState {
  readonly profileId: string | null;
  readonly nfts: XtdhReceivedNft[];
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly activeSort: XtdhNftSortField;
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
  readonly handleSortChange: (nextSort: XtdhNftSortField) => void;
  readonly handleCollectionsFilterChange: (nextSelected: string[]) => void;
  readonly handleClearFilters: () => void;
  readonly handlePageChange: (page: number) => void;
  readonly handleRetry: () => void;
}

/**
 * Encapsulates NFTs view state, mirroring collection behaviour for parity.
 */
export function useXtdhReceivedNftsState(
  profileId: string | null
): UseXtdhReceivedNftsState {
  const { searchParams, handleUpdateParams } = useXtdhReceivedSearchParams();

  const {
    selectedCollections,
    filters,
    filtersAreActive,
    handleCollectionsFilterChange,
    handleClearFilters,
  } = useXtdhReceivedFilters(searchParams, handleUpdateParams);

  const activeSort = useMemo(
    () => parseXtdhNftSort(searchParams?.get("sort") ?? null),
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
  } = useReceivedNfts({
    profile: profileId,
    sort: activeSort,
    dir: apiDirection,
    page,
    pageSize: NFTS_PAGE_SIZE,
    filters,
    enabled: Boolean(profileId),
  });

  const nfts = data?.nfts ?? [];
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
    return Math.max(1, Math.ceil(totalCount / NFTS_PAGE_SIZE));
  }, [totalCount]);

  const haveNextPage = useMemo(
    () => page * NFTS_PAGE_SIZE < totalCount,
    [page, totalCount]
  );

  const handleSortChange = useCallback(
    (nextSort: XtdhNftSortField) => {
      handleUpdateParams((params) => {
        const currentSort = parseXtdhNftSort(params.get("sort"));
        const currentDirection = parseXtdhSortDirection(params.get("dir"));

        const nextDirection =
          nextSort === currentSort
            ? currentDirection === SortDirection.ASC
              ? SortDirection.DESC
              : SortDirection.ASC
            : DEFAULT_DIRECTION;

        if (nextSort === DEFAULT_NFT_SORT) {
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

  const resultSummary = useMemo(() => {
    if (!profileId) {
      return "Connect or select a profile to view received xTDH.";
    }
    if (isLoading) {
      return "Loading NFTs…";
    }
    if (isFetching) {
      return "Updating NFTs…";
    }
    const label = totalCount === 1 ? "NFT" : "NFTs";
    return `Showing ${totalCount.toLocaleString()} ${label}`;
  }, [isFetching, isLoading, profileId, totalCount]);

  return {
    profileId,
    nfts,
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
  };
}
