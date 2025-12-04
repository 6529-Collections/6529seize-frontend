import CommonSelect, {
  CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import { CollectedCollectionType } from "@/entities/IProfile";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";

export default function UserPageCollectedFiltersNetwork({
  selected,
  setSelected,
}: {
  readonly selected: CollectedCollectionType | null;
  readonly setSelected: (selected: CollectedCollectionType | null) => void;
}) {
  const items: CommonSelectItem<CollectedCollectionType>[] = [
    {
      label: COLLECTED_COLLECTIONS_META[CollectedCollectionType.NETWORK].label,
      value: CollectedCollectionType.NETWORK,
      key: CollectedCollectionType.NETWORK,
    },
  ];

  const handleSelect = (value: CollectedCollectionType) => {
    if (selected === value) {
      setSelected(null);
    } else {
      setSelected(value);
    }
  };

  return (
    <CommonSelect
      items={items}
      activeItem={selected as CollectedCollectionType}
      filterLabel="Network"
      setSelected={handleSelect}
    />
  );
}
