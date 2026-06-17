"use client";

import { useMemo } from "react";
import type { CollectedCollectionType } from "@/entities/IProfile";
import { CollectionSort } from "@/entities/IProfile";
import type { SortDirection } from "@/entities/ISort";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonSelect from "@/components/utils/select/CommonSelect";
import {
  getCollectedFilterMessage,
  getCollectedSortLabel,
} from "./user-page-collected-filter-labels";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";

export default function UserPageCollectedFiltersSortBy({
  selected,
  direction,
  collection,
  setSelected,
}: {
  readonly selected: CollectionSort;
  readonly direction: SortDirection;
  readonly collection: CollectedCollectionType | null;
  readonly setSelected: (sort: CollectionSort) => void;
}) {
  const items = useMemo(() => {
    const items: CommonSelectItem<CollectionSort>[] = Object.values(
      CollectionSort
    ).map((sort) => ({
      label: getCollectedSortLabel(sort),
      value: sort,
      key: sort,
    }));

    return items.filter((item) => {
      if (collection) {
        return COLLECTED_COLLECTIONS_META[collection].filters.sort.includes(
          item.value
        );
      }
      // If no collection is selected (All), exclude XTDH options
      return (
        item.value !== CollectionSort.XTDH &&
        item.value !== CollectionSort.XTDH_DAY
      );
    });
  }, [collection]);

  return (
    <CommonSelect
      items={items}
      activeItem={selected}
      filterLabel={getCollectedFilterMessage("user.collected.filters.sortBy")}
      setSelected={setSelected}
      sortDirection={direction}
      size="sm"
    />
  );
}
