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

const STATUS_PARAM = "status";
const SORT_PARAM = "sort";
const DIRECTION_PARAM = "dir";

const applyStatusesUpdate = (
  params: URLSearchParams,
  statuses?: GrantedFilterStatuses
) => {
  if (statuses === undefined) return;

  const normalizedStatuses = normalizeGrantedStatuses(statuses);
  if (areDefaultFilterStatuses(normalizedStatuses)) {
    params.delete(STATUS_PARAM);
    return;
  }

  const serialized = serializeUserPageXtdhGrantedListStatuses(normalizedStatuses);
  if (serialized) {
    params.set(STATUS_PARAM, serialized);
  }
};

const applySortFieldUpdate = (
  params: URLSearchParams,
  sort?: GrantedSortField
) => {
  if (sort === undefined) return;

  if (sort === DEFAULT_SORT_FIELD) {
    params.delete(SORT_PARAM);
    return;
  }

  params.set(SORT_PARAM, sort);
};

const applyDirectionUpdate = (
  params: URLSearchParams,
  direction?: SortDirection
) => {
  if (direction === undefined) return;

  if (direction === DEFAULT_DIRECTION) {
    params.delete(DIRECTION_PARAM);
    return;
  }

  params.set(DIRECTION_PARAM, direction.toLowerCase());
};

type SearchParams = ReturnType<typeof useSearchParams>;

const useGrantedListFiltersFromSearchParams = (searchParams: SearchParams) => {
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

  return {
    activeStatuses,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
  } as const;
};

/**
 * Synchronises the granted list filter state with the URL search params.
 */
export function useUserPageXtdhGrantedListFilters(): UserPageXtdhGrantedListFilters {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {
    activeStatuses,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
  } = useGrantedListFiltersFromSearchParams(searchParams);

  const updateQueryParams = useCallback(
    (updates: {
      readonly statuses?: GrantedFilterStatuses;
      readonly sort?: GrantedSortField;
      readonly direction?: SortDirection;
    }) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      applyStatusesUpdate(params, updates.statuses);
      applySortFieldUpdate(params, updates.sort);
      applyDirectionUpdate(params, updates.direction);

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
      const toggledDirection =
        apiSortDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC;
      const nextDirection =
        sort === activeSortField ? toggledDirection : DEFAULT_DIRECTION;

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
