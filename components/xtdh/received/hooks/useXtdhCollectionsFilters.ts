"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SortDirection } from "@/entities/ISort";
import type { XtdhCollectionsOrder, XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";

import {
  DEFAULT_COLLECTION_SORT_DIRECTION,
  DEFAULT_COLLECTION_SORT_FIELD,
  parseCollectionSortDirection,
  parseCollectionSortField,
} from "../constants";

const SORT_PARAM = "xtdh_received_sort";
const DIRECTION_PARAM = "xtdh_received_dir";

export interface XtdhCollectionsFiltersResult {
  readonly activeSortField: XtdhCollectionsSortField;
  readonly activeSortDirection: SortDirection;
  readonly apiOrder: XtdhCollectionsOrder;
  readonly handleSortChange: (sort: XtdhCollectionsSortField) => void;
}

export function useXtdhCollectionsFilters(): XtdhCollectionsFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeSortField = useMemo(
    () => parseCollectionSortField(searchParams?.get(SORT_PARAM) ?? null),
    [searchParams]
  );
  const activeSortDirection = useMemo(
    () => parseCollectionSortDirection(searchParams?.get(DIRECTION_PARAM) ?? null),
    [searchParams]
  );
  const apiOrder: XtdhCollectionsOrder =
    activeSortDirection === SortDirection.ASC ? "ASC" : "DESC";

  const updateQueryParams = useCallback(
    (sort: XtdhCollectionsSortField, direction: SortDirection) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (sort === DEFAULT_COLLECTION_SORT_FIELD) {
        params.delete(SORT_PARAM);
      } else {
        params.set(SORT_PARAM, sort);
      }

      if (direction === DEFAULT_COLLECTION_SORT_DIRECTION) {
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
    (sort: XtdhCollectionsSortField) => {
      const toggledDirection =
        activeSortDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC;
      const nextDirection =
        sort === activeSortField
          ? toggledDirection
          : DEFAULT_COLLECTION_SORT_DIRECTION;

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
