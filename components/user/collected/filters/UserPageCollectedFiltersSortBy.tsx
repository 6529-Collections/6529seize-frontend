"use client";

import { useEffect, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSort,
} from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import CommonSelect, {
  CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
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
  const labels: { [key in CollectionSort]: string } = {
    [CollectionSort.TOKEN_ID]: "Token ID",
    [CollectionSort.TDH]: "TDH",
    [CollectionSort.RANK]: "Rank",
    [CollectionSort.XTDH]: "xTDH",
    [CollectionSort.XTDH_DAY]: "xTDH/day",
  };

  const getItems = () => {
    const items: CommonSelectItem<CollectionSort>[] = Object.values(
      CollectionSort
    ).map((sort) => ({
      label: labels[sort],
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
  };
  const [items, setItems] = useState<CommonSelectItem<CollectionSort>[]>(
    getItems()
  );

  useEffect(() => {
    setItems(getItems());
  }, [collection]);

  return (
    <CommonSelect
      items={items}
      activeItem={selected}
      filterLabel="Sort By"
      setSelected={setSelected}
      sortDirection={direction}
    />
  );
}
