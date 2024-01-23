import { CollectionSeized } from "../../../../entities/IProfile";
import CommonRadioButton from "../../../utils/radio/CommonRadioButton";
import CommonRadioButtonWrapper from "../../../utils/radio/CommonRadioButtonWrapper";

export default function UserPageCollectedFiltersSeized({
  selected,
  setSelected,
}: {
  readonly selected: CollectionSeized | null;
  readonly setSelected: (selected: CollectionSeized | null) => void;
}) {
  const labels: { [key in CollectionSeized]: string } = {
    [CollectionSeized.SEIZED]: "Seized",
    [CollectionSeized.NOT_SEIZED]: "Not Seized",
  };

  return (
    <CommonRadioButtonWrapper>
      <>
        <CommonRadioButton
          value={null}
          label="All"
          selected={selected}
          setSelected={setSelected}
        />
        {Object.values(CollectionSeized).map((seized) => (
          <CommonRadioButton
            key={seized}
            value={seized}
            label={labels[seized]}
            selected={selected}
            setSelected={setSelected}
          />
        ))}
      </>
    </CommonRadioButtonWrapper>
  );
}
