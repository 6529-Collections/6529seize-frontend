import { CollectionSeized } from "../../../../entities/IProfile";
import UserPageCollectedFiltersTabs, {
  UserPageCollectedFiltersTabsItem,
} from "./UserPageCollectedFiltersTabs";

type SelectedType = CollectionSeized | null;

export default function UserPageCollectedFiltersSeized({
  selected,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const labels: { [key in CollectionSeized]: string } = {
    [CollectionSeized.SEIZED]: "Seized",
    [CollectionSeized.NOT_SEIZED]: "Not Seized",
  };

  const tabs: UserPageCollectedFiltersTabsItem<SelectedType>[] = [
    {
      label: "All",
      value: null,
      key: "all",
    },
    ...Object.values(CollectionSeized).map((seized) => ({
      label: labels[seized],
      value: seized,
      key: seized,
    })),
  ];

  return (
    <UserPageCollectedFiltersTabs
      tabs={tabs}
      activeTab={selected}
      setSelected={setSelected}
    />
  );
}
