'use client';

import { useCallback, useMemo } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { UseReceivedCollectionsFilters } from "@/hooks/useXtdhReceived";
import {
  COLLECTION_QUERY_PARAM,
  MIN_GRANTORS_QUERY_PARAM,
  MIN_RATE_QUERY_PARAM,
} from "../constants";
import {
  hasActiveFilters,
  parseCollectionsFilterParam,
  parseNumberParam,
} from "../utils";

export type UpdateParamsHandler = (updater: (params: URLSearchParams) => void) => void;

export interface UserPageXtdhReceivedFiltersState {
  readonly selectedCollections: string[];
  readonly minRate: number | undefined;
  readonly minGrantors: number | undefined;
  readonly filters: UseReceivedCollectionsFilters;
  readonly filtersAreActive: boolean;
  readonly handleCollectionsFilterChange: (nextSelected: string[]) => void;
  readonly handleClearFilters: () => void;
}

/**
 * Provides shared filter state derived from URL search params along with
 * handlers for mutating the query string in a consistent way across views.
 */
export function useUserPageXtdhReceivedFilters(
  searchParams: ReadonlyURLSearchParams | null,
  handleUpdateParams: UpdateParamsHandler
): UserPageXtdhReceivedFiltersState {
  const selectedCollections = useMemo(
    () => parseCollectionsFilterParam(searchParams?.get(COLLECTION_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const minRate = useMemo(
    () => parseNumberParam(searchParams?.get(MIN_RATE_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const minGrantors = useMemo(
    () => parseNumberParam(searchParams?.get(MIN_GRANTORS_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const filters = useMemo<UseReceivedCollectionsFilters>(
    () => ({
      collections: selectedCollections,
      minRate,
      minGrantors,
    }),
    [minGrantors, minRate, selectedCollections]
  );

  const filtersAreActive = hasActiveFilters(filters);

  const handleCollectionsFilterChange = useCallback(
    (nextSelected: string[]) => {
      handleUpdateParams((params) => {
        if (nextSelected.length) {
          params.set(COLLECTION_QUERY_PARAM, nextSelected.join(","));
        } else {
          params.delete(COLLECTION_QUERY_PARAM);
        }
        params.set("page", "1");
      });
    },
    [handleUpdateParams]
  );

  const handleClearFilters = useCallback(() => {
    handleUpdateParams((params) => {
      params.delete(COLLECTION_QUERY_PARAM);
      params.delete(MIN_RATE_QUERY_PARAM);
      params.delete(MIN_GRANTORS_QUERY_PARAM);
      params.set("page", "1");
    });
  }, [handleUpdateParams]);

  return {
    selectedCollections,
    minRate,
    minGrantors,
    filters,
    filtersAreActive,
    handleCollectionsFilterChange,
    handleClearFilters,
  };
}
