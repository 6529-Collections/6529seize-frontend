"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SortDirection } from "@/entities/ISort";
import type { XtdhTokensOrder, XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";

import {
  DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY,
  DEFAULT_TOKEN_CONTRIBUTORS_SORT_DIRECTION,
  DEFAULT_TOKEN_CONTRIBUTORS_SORT_FIELD,
  parseTokenContributorsGroupBy,
  parseTokensSortDirection,
  parseTokensSortField,
  type XtdhTokenContributorsGroupBy,
} from "@/components/xtdh/received/constants";

const SORT_PARAM = "xtdh_token_contrib_sort";
const DIRECTION_PARAM = "xtdh_token_contrib_dir";
const GROUP_PARAM = "xtdh_token_contrib_group";

export interface XtdhTokenContributorsFiltersResult {
  readonly activeSortField: XtdhTokensSortField;
  readonly activeSortDirection: SortDirection;
  readonly activeGroupBy: XtdhTokenContributorsGroupBy;
  readonly apiOrder: XtdhTokensOrder;
  readonly handleSortChange: (sort: XtdhTokensSortField) => void;
  readonly handleGroupByChange: (group: XtdhTokenContributorsGroupBy) => void;
}

export function useXtdhTokenContributorsFilters(): XtdhTokenContributorsFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSortField = useMemo(
    () => parseTokensSortField(searchParams?.get(SORT_PARAM) ?? null),
    [searchParams]
  );
  const activeSortDirection = useMemo(
    () => parseTokensSortDirection(searchParams?.get(DIRECTION_PARAM) ?? null),
    [searchParams]
  );
  const activeGroupBy = useMemo(
    () => parseTokenContributorsGroupBy(searchParams?.get(GROUP_PARAM) ?? null),
    [searchParams]
  );
  const apiOrder: XtdhTokensOrder =
    activeSortDirection === SortDirection.ASC ? "ASC" : "DESC";

  const updateSortParams = useCallback(
    (sort: XtdhTokensSortField, direction: SortDirection) => {
      if (!pathname) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (sort === DEFAULT_TOKEN_CONTRIBUTORS_SORT_FIELD) {
        params.delete(SORT_PARAM);
      } else {
        params.set(SORT_PARAM, sort);
      }

      if (direction === DEFAULT_TOKEN_CONTRIBUTORS_SORT_DIRECTION) {
        params.delete(DIRECTION_PARAM);
      } else {
        params.set(DIRECTION_PARAM, direction.toLowerCase());
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const updateGroupByParam = useCallback(
    (group: XtdhTokenContributorsGroupBy) => {
      if (!pathname) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (group === DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY) {
        params.delete(GROUP_PARAM);
      } else {
        params.set(GROUP_PARAM, group);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleSortChange = useCallback(
    (sort: XtdhTokensSortField) => {
      const toggledDirection =
        activeSortDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC;
      const nextDirection =
        sort === activeSortField
          ? toggledDirection
          : DEFAULT_TOKEN_CONTRIBUTORS_SORT_DIRECTION;

      updateSortParams(sort, nextDirection);
    },
    [activeSortDirection, activeSortField, updateSortParams]
  );

  const handleGroupByChange = useCallback(
    (group: XtdhTokenContributorsGroupBy) => {
      updateGroupByParam(group);
    },
    [updateGroupByParam]
  );

  return {
    activeSortField,
    activeSortDirection,
    activeGroupBy,
    apiOrder,
    handleSortChange,
    handleGroupByChange,
  };
}
