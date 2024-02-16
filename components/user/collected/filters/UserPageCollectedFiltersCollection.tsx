import { CollectedCollectionType } from "../../../../entities/IProfile";
import CommonSelect, {
  CommonSelectItem,
} from "../../../utils/select/CommonSelect";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";

type SelectedType = CollectedCollectionType | null;

export default function UserPageCollectedFiltersCollection({
  selected,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const items: CommonSelectItem<SelectedType>[] = [
    {
      label: "All",
      mobileLabel: "All Collections",
      value: null,
      key: "all",
    },
    ...Object.values(CollectedCollectionType).map((collection) => ({
      label: COLLECTED_COLLECTIONS_META[collection].label,
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
