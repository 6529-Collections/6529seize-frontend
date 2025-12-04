import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { CollectedCollectionType } from "@/entities/IProfile";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";

type SelectedType = CollectedCollectionType | null;

export default function UserPageCollectedFiltersNativeDropdown({
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
    ...Object.values(CollectedCollectionType)
      .filter((collection) => collection !== CollectedCollectionType.NETWORK)
      .map((collection) => ({
        label: COLLECTED_COLLECTIONS_META[collection].label,
        value: collection,
        key: collection,
      })),
  ];

  return (
    <CommonDropdown
      items={items}
      activeItem={selected}
      filterLabel="Collection"
      setSelected={setSelected}
    />
  );
}
