import { CollectionSort } from "../../../../entities/IProfile";
import { SortDirection } from "../../../../entities/ISort";
import CommonSelect, {
  CommonSelectItem,
} from "../../../utils/select/CommonSelect";

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

  const items: CommonSelectItem<CollectionSort>[] = Object.values(
    CollectionSort
  ).map((sort) => ({
    label: labels[sort],
    value: sort,
    key: sort,
  }));

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
