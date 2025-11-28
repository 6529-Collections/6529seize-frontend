import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SortDirection } from "@/entities/ISort";

import {
  DEFAULT_DIRECTION,
  DEFAULT_SORT_FIELD,
  GRANTED_ACTIVE_FILTERS,
  GRANTED_TABS,
  normalizeUserPageXtdhGrantedListSortDirection,
  parseUserPageXtdhGrantedListSortField,
  parseUserPageXtdhGrantedListSortDirection,
} from "../constants";
import type {
  GrantedActiveFilter,
  GrantedSortField,
  GrantedTab,
  UserPageXtdhGrantedListFilters,
} from "../types";

const TAB_PARAM = "tab";
const SUB_FILTER_PARAM = "sub";
const SORT_PARAM = "sort";
const DIRECTION_PARAM = "dir";

const DEFAULT_TAB: GrantedTab = "ACTIVE";
const DEFAULT_SUB_FILTER: GrantedActiveFilter = "ALL";

const applyTabUpdate = (params: URLSearchParams, tab?: GrantedTab) => {
  if (!tab) return;
  if (tab === DEFAULT_TAB) {
    params.delete(TAB_PARAM);
    // Reset sub filter when switching to default tab (though only Active has sub filters)
    params.delete(SUB_FILTER_PARAM);
    return;
  }
  params.set(TAB_PARAM, tab.toLowerCase());
  // Reset sub filter when switching tabs, unless we want to persist it?
  // Usually better to reset to ALL for the new tab (if it supports it)
  params.delete(SUB_FILTER_PARAM);
};

const applySubFilterUpdate = (
  params: URLSearchParams,
  filter?: GrantedActiveFilter
) => {
  if (!filter) return;
  if (filter === DEFAULT_SUB_FILTER) {
    params.delete(SUB_FILTER_PARAM);
    return;
  }
  params.set(SUB_FILTER_PARAM, filter.toLowerCase());
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
  const activeTab = useMemo<GrantedTab>(() => {
    const param = searchParams?.get(TAB_PARAM)?.toUpperCase();
    return (
      GRANTED_TABS.find((t) => t.value === param)?.value ?? DEFAULT_TAB
    );
  }, [searchParams]);

  const activeSubFilter = useMemo<GrantedActiveFilter>(() => {
    const param = searchParams?.get(SUB_FILTER_PARAM)?.toUpperCase();
    return (
      GRANTED_ACTIVE_FILTERS.find((f) => f.value === param)?.value ??
      DEFAULT_SUB_FILTER
    );
  }, [searchParams]);

  const activeSortField = useMemo(
    () =>
      parseUserPageXtdhGrantedListSortField(searchParams?.get(SORT_PARAM) ?? null),
    [searchParams]
  );
  const activeSortDirection = useMemo(
    () =>
      parseUserPageXtdhGrantedListSortDirection(
        searchParams?.get(DIRECTION_PARAM) ?? null
      ),
    [searchParams]
  );
  const apiSortDirection = useMemo(
    () => normalizeUserPageXtdhGrantedListSortDirection(activeSortDirection),
    [activeSortDirection]
  );

  return {
    activeTab,
    activeSubFilter,
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
    activeTab,
    activeSubFilter,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
  } = useGrantedListFiltersFromSearchParams(searchParams);

  const updateQueryParams = useCallback(
    (updates: {
      readonly tab?: GrantedTab;
      readonly subFilter?: GrantedActiveFilter;
      readonly sort?: GrantedSortField;
      readonly direction?: SortDirection;
    }) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (updates.tab) applyTabUpdate(params, updates.tab);
      if (updates.subFilter) applySubFilterUpdate(params, updates.subFilter);
      applySortFieldUpdate(params, updates.sort);
      applyDirectionUpdate(params, updates.direction);

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleTabChange = useCallback(
    (tab: GrantedTab) => {
      updateQueryParams({ tab });
    },
    [updateQueryParams]
  );

  const handleSubFilterChange = useCallback(
    (subFilter: GrantedActiveFilter) => {
      updateQueryParams({ subFilter });
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
    activeTab,
    activeSubFilter,
    activeSortField,
    activeSortDirection,
    apiSortDirection,
    handleTabChange,
    handleSubFilterChange,
    handleSortFieldChange,
  };
}
