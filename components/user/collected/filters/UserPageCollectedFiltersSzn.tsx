import { MEMES_SEASON } from "../../../../enums";
import CommonDropdown, {
  CommonDropdownItemType,
} from "../../../utils/dropdown/CommonDropdown";

type SelectedType = MEMES_SEASON | null;

export default function UserPageCollectedFiltersSzn({
  selected,
  setSelected,
}: {
  readonly selected: SelectedType;
  readonly setSelected: (selected: SelectedType) => void;
}) {
  const labels: { [key in MEMES_SEASON]: string } = {
    [MEMES_SEASON.SZN1]: "Szn 1",
    [MEMES_SEASON.SZN2]: "Szn 2",
    [MEMES_SEASON.SZN3]: "Szn 3",
    [MEMES_SEASON.SZN4]: "Szn 4",
    [MEMES_SEASON.SZN5]: "Szn 5",
    [MEMES_SEASON.SZN6]: "Szn 6",
  };

  const items: CommonDropdownItemType<SelectedType>[] = [
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
      activeItem={selected}
      setActiveItem={setSelected}
    />
  );
}
