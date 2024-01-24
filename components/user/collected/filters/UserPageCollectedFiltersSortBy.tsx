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
  showRank,
}: {
  readonly selected: CollectionSort;
  readonly direction: SortDirection;
  readonly setSelected: (sort: CollectionSort) => void;
  readonly showRank: boolean;
}) {
  const labels: { [key in CollectionSort]: string } = {
    [CollectionSort.TOKEN_ID]: "Token ID",
    [CollectionSort.TDH]: "TDH",
    [CollectionSort.RANK]: "Rank",
  };

  const getTabs = (): UserPageCollectedFiltersTabsItem<CollectionSort>[] => {
    const targets = [CollectionSort.TOKEN_ID, CollectionSort.TDH];
    if (showRank) {
      targets.push(CollectionSort.RANK);
    }
    return targets.map((sort) => ({
      label: labels[sort],
      value: sort,
      key: sort,
    }));
  };

  const [tabs, setTabs] = useState<
    UserPageCollectedFiltersTabsItem<CollectionSort>[]
  >(getTabs());

  useEffect(() => {
    setTabs(getTabs());
  }, [showRank]);
  return (
    <UserPageCollectedFiltersTabs
      tabs={tabs}
      activeTab={selected}
      setSelected={setSelected}
      sortDirection={direction}
    />
  );
}
