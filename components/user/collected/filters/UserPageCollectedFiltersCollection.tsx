import { CollectedCollectionType } from "../../../../entities/IProfile";
import CommonRadioButton from "../../../utils/radio/CommonRadioButton";
import CommonRadioButtonWrapper from "../../../utils/radio/CommonRadioButtonWrapper";

export default function UserPageCollectedFiltersCollection({
  selected,
  setSelected,
}: {
  readonly selected: CollectedCollectionType | null;
  readonly setSelected: (selected: CollectedCollectionType | null) => void;
}) {
  const labels: { [key in CollectedCollectionType]: string } = {
    [CollectedCollectionType.MEMES]: "Memes",
    [CollectedCollectionType.GRADIENTS]: "Gradients",
    [CollectedCollectionType.MEMELAB]: "Memelab",
    [CollectedCollectionType.NEXTGEN]: "NextGen",
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
        {Object.values(CollectedCollectionType).map((value) => (
          <CommonRadioButton
            key={value}
            value={value}
            label={labels[value]}
            selected={selected}
            setSelected={setSelected}
          />
        ))}
      </>
    </CommonRadioButtonWrapper>
  );
}
