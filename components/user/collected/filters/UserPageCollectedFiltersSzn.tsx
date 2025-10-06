import { RefObject } from "react";
import { MEMES_SEASON } from "@/enums";
import { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";

type SelectedType = MEMES_SEASON | null;

export default function UserPageCollectedFiltersSzn({
  selected,
  containerRef,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const labels: { [key in MEMES_SEASON]: string } = {
    [MEMES_SEASON.SZN1]: "SZN 1",
    [MEMES_SEASON.SZN2]: "SZN 2",
    [MEMES_SEASON.SZN3]: "SZN 3",
    [MEMES_SEASON.SZN4]: "SZN 4",
    [MEMES_SEASON.SZN5]: "SZN 5",
    [MEMES_SEASON.SZN6]: "SZN 6",
    [MEMES_SEASON.SZN7]: "SZN 7",
    [MEMES_SEASON.SZN8]: "SZN 8",
    [MEMES_SEASON.SZN9]: "SZN 9",
    [MEMES_SEASON.SZN10]: "SZN 10",
    [MEMES_SEASON.SZN11]: "SZN 11",
    [MEMES_SEASON.SZN12]: "SZN 12",
    [MEMES_SEASON.SZN13]: "SZN 13",
  };

  const items: CommonSelectItem<SelectedType>[] = [
    {
      label: "All Seasons",
      value: null,
      key: "all",
    },
    ...Object.values(MEMES_SEASON).map((value) => ({
      label: labels[value],
      value,
      key: value,
    })),
  ];

  return (
    <CommonDropdown
      items={items}
      filterLabel="Season"
      activeItem={selected}
      containerRef={containerRef}
      setSelected={setSelected}
    />
  );
}
