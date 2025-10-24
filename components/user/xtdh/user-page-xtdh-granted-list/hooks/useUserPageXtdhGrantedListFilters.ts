import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SortDirection } from "@/entities/ISort";

import {
  DEFAULT_DIRECTION,
  DEFAULT_SORT_FIELD,
  DEFAULT_STATUS,
  normalizeUserPageXtdhGrantedListSortDirection,
  parseUserPageXtdhGrantedListSortDirection,
  parseUserPageXtdhGrantedListSortField,
  parseUserPageXtdhGrantedListStatus,
} from "../constants";
import type {
  GrantedFilterStatus,
  GrantedSortField,
  UserPageXtdhGrantedListFilters,
} from "../types";

/**
 * Synchronises the granted list filter state with the URL search params.
 */
export function useUserPageXtdhGrantedListFilters(): UserPageXtdhGrantedListFilters {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeStatus = useMemo(
    () =>
      parseUserPageXtdhGrantedListStatus(searchParams?.get("status") ?? null),
    [searchParams]
  );
  const activeSortField = useMemo(
    () =>
      parseUserPageXtdhGrantedListSortField(searchParams?.get("sort") ?? null),
    [searchParams]
  );
  const activeSortDirection = useMemo(
    () =>
      parseUserPageXtdhGrantedListSortDirection(
        searchParams?.get("dir") ?? null
      ),
    [searchParams]
  );
  const apiSortDirection = useMemo(
    () => normalizeUserPageXtdhGrantedListSortDirection(activeSortDirection),
    [activeSortDirection]
  );

  const updateQueryParams = useCallback(
    (updates: {
      readonly status?: GrantedFilterStatus;
      readonly sort?: GrantedSortField;
      readonly direction?: SortDirection;
    }) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (updates.status !== undefined) {
        if (updates.status === DEFAULT_STATUS) {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
      }

      if (updates.sort !== undefined) {
        if (updates.sort === DEFAULT_SORT_FIELD) {
          params.delete("sort");
        } else {
          params.set("sort", updates.sort);
        }
      }

      if (updates.direction !== undefined) {
        if (updates.direction === DEFAULT_DIRECTION) {
          params.delete("dir");
        } else {
          params.set("dir", updates.direction.toLowerCase());
        }
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleStatusChange = useCallback(
    (status: GrantedFilterStatus) => {
      updateQueryParams({ status });
    },
    [updateQueryParams]
  );

  const handleSortFieldChange = useCallback(
    (sort: GrantedSortField) => {
      const nextDirection =
        sort === activeSortField
          ? apiSortDirection === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC
          : DEFAULT_DIRECTION;

      updateQueryParams({ sort, direction: nextDirection });
    },
    [activeSortField, apiSortDirection, updateQueryParams]
  );

  return {
    activeStatus,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
    handleStatusChange,
    handleSortFieldChange,
  };
}

