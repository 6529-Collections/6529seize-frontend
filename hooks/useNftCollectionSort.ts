"use client";

import { useState } from "react";
import { useNftPurchasingVisibility } from "./useNftPurchasingVisibility";

export function useNftCollectionSort<Sort extends string>(
  initialSort: Sort,
  fallbackSort: Sort,
  isMarketQuoteSort: (sort: Sort) => boolean
) {
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const sort =
    hideNftPurchasing && isMarketQuoteSort(selectedSort)
      ? fallbackSort
      : selectedSort;

  return { sort, setSort: setSelectedSort, hideNftPurchasing };
}
