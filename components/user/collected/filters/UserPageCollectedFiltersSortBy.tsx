import { useEffect, useState } from "react";
import { CollectionSort } from "../../../../entities/IProfile";
import { SortDirection } from "../../../../entities/ISort";
import CommonSelect, {
  CommonSelectItem,
} from "../../../utils/select/CommonSelect";

export default function UserPageCollectedFiltersSortBy({
  selected,
  direction,
  showOnlyTokenIdSort,
  setSelected,
}: {
  readonly selected: CollectionSort;
  readonly direction: SortDirection;
  readonly showOnlyTokenIdSort: boolean;
  readonly setSelected: (sort: CollectionSort) => void;
}) {
  const labels: { [key in CollectionSort]: string } = {
    [CollectionSort.TOKEN_ID]: "Token ID",
    [CollectionSort.TDH]: "TDH",
    [CollectionSort.RANK]: "Rank",
  };

  const getItems = () => {
    const items: CommonSelectItem<CollectionSort>[] = Object.values(
      CollectionSort
    ).map((sort) => ({
      label: labels[sort],
      value: sort,
      key: sort,
    }));

    if (showOnlyTokenIdSort) {
      return items.filter((item) => item.value === CollectionSort.TOKEN_ID);
    }

    return items;
  };

  const [items, setItems] = useState<CommonSelectItem<CollectionSort>[]>(
    getItems()
  );

  useEffect(() => {
    setItems(getItems());
  }, [showOnlyTokenIdSort]);

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
