import { CollectionSeized } from "../../../../entities/IProfile";
import CommonSelect, {
  CommonSelectItem,
} from "../../../utils/select/CommonSelect";

type SelectedType = CollectionSeized | null;

export default function UserPageCollectedFiltersSeized({
  selected,
  setSelected,
}: {
  readonly selected: SelectedType;
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
    <CommonSelect
      items={items}
      activeItem={selected}
      filterLabel="Seized"
      setSelected={setSelected}
    />
  );
}
