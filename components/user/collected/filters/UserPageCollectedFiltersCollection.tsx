import { CollectedCollectionType } from "../../../../entities/IProfile";
import CommonSelect, {
  CommonSelectItem,
} from "../../../utils/select/CommonSelect";

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

  const items: CommonSelectItem<SelectedType>[] = [
    {
      label: "All",
      mobileLabel: "All Collections",
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
    <CommonSelect
      items={items}
      activeItem={selected}
      filterLabel="Collection"
      setSelected={setSelected}
    />
  );
}
