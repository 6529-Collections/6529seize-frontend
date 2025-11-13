import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SortDirection } from "@/entities/ISort";

import {
  DEFAULT_DIRECTION,
  DEFAULT_FILTER_STATUSES,
  DEFAULT_SORT_FIELD,
  normalizeGrantedStatuses,
  normalizeUserPageXtdhGrantedListSortDirection,
  areDefaultFilterStatuses,
  parseUserPageXtdhGrantedListSortDirection,
  parseUserPageXtdhGrantedListSortField,
  parseUserPageXtdhGrantedListStatuses,
  serializeUserPageXtdhGrantedListStatuses,
} from "../constants";
import type {
  GrantedFilterStatuses,
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

  const activeStatuses = useMemo(
    () =>
      parseUserPageXtdhGrantedListStatuses(searchParams?.get("status") ?? null),
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
      readonly statuses?: GrantedFilterStatuses;
      readonly sort?: GrantedSortField;
      readonly direction?: SortDirection;
    }) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (updates.statuses !== undefined) {
        const normalizedStatuses = normalizeGrantedStatuses(updates.statuses);
        if (areDefaultFilterStatuses(normalizedStatuses)) {
          params.delete("status");
        } else {
          const serialized = serializeUserPageXtdhGrantedListStatuses(
            normalizedStatuses
          );
          if (serialized) {
            params.set("status", serialized);
          }
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
    (statuses: GrantedFilterStatuses) => {
      updateQueryParams({ statuses });
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
    activeStatuses: activeStatuses.length ? activeStatuses : DEFAULT_FILTER_STATUSES,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
    handleStatusChange,
    handleSortFieldChange,
  };
}
