"use client";

import { useMemo } from "react";
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
  };

  const items = useMemo<CommonSelectItem<CollectionSort>[]>(() => {
    const selectItems = Object.values(CollectionSort).map((sort) => ({
      label: labels[sort],
      value: sort,
      key: sort,
    }));

    return selectItems.filter((item) =>
      collection
        ? COLLECTED_COLLECTIONS_META[collection].filters.sort.includes(
            item.value
          )
        : true
    );
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
