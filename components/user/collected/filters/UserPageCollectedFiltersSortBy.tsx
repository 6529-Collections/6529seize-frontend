import { useEffect, useState } from "react";
import { CollectionSort } from "../../../../entities/IProfile";
import { SortDirection } from "../../../../entities/ISort";
import UserPageCollectedFiltersTabs, {
  UserPageCollectedFiltersTabsItem,
} from "./UserPageCollectedFiltersTabs";

export default function UserPageCollectedFiltersSortBy({
  selected,
  direction,
  setSelected,
}: {
  readonly selected: CollectionSort;
  readonly direction: SortDirection;
  readonly setSelected: (sort: CollectionSort) => void;
}) {
  const labels: { [key in CollectionSort]: string } = {
    [CollectionSort.TOKEN_ID]: "Token ID",
    [CollectionSort.TDH]: "TDH",
    [CollectionSort.RANK]: "Rank",
  };

  const tabs: UserPageCollectedFiltersTabsItem<CollectionSort>[] =
    Object.values(CollectionSort).map((sort) => ({
      label: labels[sort],
      value: sort,
      key: sort,
    }));

  return (
    <UserPageCollectedFiltersTabs
      tabs={tabs}
      activeTab={selected}
      setSelected={setSelected}
      sortDirection={direction}
    />
  );
}
