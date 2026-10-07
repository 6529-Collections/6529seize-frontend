import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { CollectedCollectionType } from "@/entities/IProfile";
import {
  getCollectedCollectionLabel,
  getCollectedFilterMessage,
} from "./user-page-collected-filter-labels";

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
      label: getCollectedFilterMessage("user.collected.filters.collection.all"),
      mobileLabel: getCollectedFilterMessage(
        "user.collected.filters.collection.allCollections"
      ),
      value: null,
      key: "all",
    },
    ...Object.values(CollectedCollectionType)
      .filter((collection) => collection !== CollectedCollectionType.NETWORK)
      .map((collection) => ({
        label: getCollectedCollectionLabel(collection),
        value: collection,
        key: collection,
      })),
  ];

  return (
    <CommonDropdown
      items={items}
      activeItem={selected}
      filterLabel={getCollectedFilterMessage(
        "user.collected.filters.collection"
      )}
      setSelected={setSelected}
      size="sm"
    />
  );
}
