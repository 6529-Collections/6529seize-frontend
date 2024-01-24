import { CollectionSort } from "../../../../entities/IProfile";
import { SortDirection } from "../../../../entities/ISort";
import CommonTableSortIcon from "../../utils/icons/CommonTableSortIcon";
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

  const tabs: UserPageCollectedFiltersTabsItem<CollectionSort>[] = [
    ...Object.values(CollectionSort).map((sort) => ({
      label: labels[sort],
      value: sort,
      key: sort,
    })),
  ];
  return (
    <UserPageCollectedFiltersTabs
      tabs={tabs}
      activeTab={selected}
      setSelected={setSelected}
      sortable={true}
    />
    // <div>
    //   {Object.values(CollectionSort).map((v) => (
    //     <button key={v} onClick={() => setSort(v)}>
    //       {v}

    //       <CommonTableSortIcon
    //         direction={sort === v ? direction : SortDirection.DESC}
    //         isActive={sort === v}
    //       />
    //     </button>
    //   ))}
    // </div>
  );
}
