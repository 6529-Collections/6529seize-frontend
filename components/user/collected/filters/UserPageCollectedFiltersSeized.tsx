import type { RefObject } from "react";
import { CollectionSeized } from "@/entities/IProfile";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import {
  getCollectedFilterMessage,
  getCollectedSeizedLabel,
} from "./user-page-collected-filter-labels";

type SelectedType = CollectionSeized | null;

export default function UserPageCollectedFiltersSeized({
  selected,
  containerRef,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const items: CommonSelectItem<SelectedType>[] = [
    {
      label: getCollectedFilterMessage("user.collected.filters.seized.all"),
      mobileLabel: getCollectedFilterMessage(
        "user.collected.filters.seized.allCards"
      ),
      value: null,
      key: "all",
    },
    ...Object.values(CollectionSeized).map((seized) => ({
      label: getCollectedSeizedLabel(seized),
      value: seized,
      key: seized,
    })),
  ];

  return (
    <CommonDropdown
      items={items}
      activeItem={selected}
      filterLabel={getCollectedFilterMessage("user.collected.filters.seized")}
      containerRef={containerRef}
      setSelected={setSelected}
      size="sm"
    />
  );
}
