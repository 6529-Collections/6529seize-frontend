import { RefObject } from "react";
import { MEMES_SEASON } from "../../../../enums";
import { CommonSelectItem } from "../../../utils/select/CommonSelect";
import CommonDropdown from "../../../utils/select/dropdown/CommonDropdown";

type SelectedType = MEMES_SEASON | null;

export default function UserPageCollectedFiltersSzn({
  selected,
  containerRef,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly containerRef: RefObject<HTMLDivElement>;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const labels: { [key in MEMES_SEASON]: string } = {
    [MEMES_SEASON.SZN1]: "Szn 1",
    [MEMES_SEASON.SZN2]: "Szn 2",
    [MEMES_SEASON.SZN3]: "Szn 3",
    [MEMES_SEASON.SZN4]: "Szn 4",
    [MEMES_SEASON.SZN5]: "Szn 5",
    [MEMES_SEASON.SZN6]: "Szn 6",
    [MEMES_SEASON.SZN7]: "Szn 7",
    [MEMES_SEASON.SZN8]: "Szn 8",
    [MEMES_SEASON.SZN9]: "Szn 9",
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
