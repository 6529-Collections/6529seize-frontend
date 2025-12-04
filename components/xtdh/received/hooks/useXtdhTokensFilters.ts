"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SortDirection } from "@/entities/ISort";
import type { XtdhTokensOrder, XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";

import {
  DEFAULT_TOKENS_SORT_DIRECTION,
  DEFAULT_TOKENS_SORT_FIELD,
  parseTokensSortDirection,
  parseTokensSortField,
} from "../constants";

const SORT_PARAM = "xtdh_received_tokens_sort";
const DIRECTION_PARAM = "xtdh_received_tokens_dir";

export interface XtdhTokensFiltersResult {
  readonly activeSortField: XtdhTokensSortField;
  readonly activeSortDirection: SortDirection;
  readonly apiOrder: XtdhTokensOrder;
  readonly handleSortChange: (sort: XtdhTokensSortField) => void;
}

export function useXtdhTokensFilters(): XtdhTokensFiltersResult {
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
  const apiOrder: XtdhTokensOrder =
    activeSortDirection === SortDirection.ASC ? "ASC" : "DESC";

  const updateQueryParams = useCallback(
    (sort: XtdhTokensSortField, direction: SortDirection) => {
      if (!pathname) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (sort === DEFAULT_TOKENS_SORT_FIELD) {
        params.delete(SORT_PARAM);
      } else {
        params.set(SORT_PARAM, sort);
      }

      if (direction === DEFAULT_TOKENS_SORT_DIRECTION) {
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

  const handleSortChange = useCallback(
    (sort: XtdhTokensSortField) => {
      const toggledDirection =
        activeSortDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC;
      const nextDirection =
        sort === activeSortField
          ? toggledDirection
          : DEFAULT_TOKENS_SORT_DIRECTION;

      updateQueryParams(sort, nextDirection);
    },
    [activeSortDirection, activeSortField, updateQueryParams]
  );

  return {
    activeSortField,
    activeSortDirection,
    apiOrder,
    handleSortChange,
  };
}
