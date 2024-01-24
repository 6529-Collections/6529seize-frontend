import { CollectedCollectionType } from "../../../../entities/IProfile";
import UserPageCollectedFiltersTabs, {
  UserPageCollectedFiltersTabsItem,
} from "./UserPageCollectedFiltersTabs";

type SelectedType = CollectedCollectionType | null;

export default function UserPageCollectedFiltersCollection({
  selected,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const labels: { [key in CollectedCollectionType]: string } = {
    [CollectedCollectionType.MEMES]: "Memes",
    [CollectedCollectionType.GRADIENTS]: "Gradient",
    [CollectedCollectionType.MEMELAB]: "Meme Lab",
  };

  const tabs: UserPageCollectedFiltersTabsItem<SelectedType>[] = [
    {
      label: "All",
      value: null,
      key: "all",
    },
    ...Object.values(CollectedCollectionType).map((collection) => ({
      label: labels[collection],
      value: collection,
      key: collection,
    })),
  ];

  return (
    <UserPageCollectedFiltersTabs
      tabs={tabs}
      activeTab={selected}
      setSelected={setSelected}
      sortable={false}
    />
  );
}
