import { RefObject } from "react";
import { CollectionSeized } from "@/entities/IProfile";
import {
  CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";

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
  const labels: { [key in CollectionSeized]: string } = {
    [CollectionSeized.SEIZED]: "Seized",
    [CollectionSeized.NOT_SEIZED]: "Not Seized",
  };

  const items: CommonSelectItem<SelectedType>[] = [
    {
      label: "All",
      mobileLabel: "All Cards",
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
    <CommonDropdown
      items={items}
      activeItem={selected}
      filterLabel="Seized"
      containerRef={containerRef}
      setSelected={setSelected}
    />
  );
}
