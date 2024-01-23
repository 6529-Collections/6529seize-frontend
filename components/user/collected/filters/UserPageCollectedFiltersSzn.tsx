import { MEMES_SEASON } from "../../../../enums";
import CommonRadioButton from "../../../utils/radio/CommonRadioButton";
import CommonRadioButtonWrapper from "../../../utils/radio/CommonRadioButtonWrapper";

export default function UserPageCollectedFiltersSzn({
  selected,
  setSelected,
}: {
  readonly selected: MEMES_SEASON | null;
  readonly setSelected: (selected: MEMES_SEASON | null) => void;
}) {
  const labels: { [key in MEMES_SEASON]: string } = {
    [MEMES_SEASON.SZN1]: "Szn 1",
    [MEMES_SEASON.SZN2]: "Szn 2",
    [MEMES_SEASON.SZN3]: "Szn 3",
    [MEMES_SEASON.SZN4]: "Szn 4",
    [MEMES_SEASON.SZN5]: "Szn 5",
    [MEMES_SEASON.SZN6]: "Szn 6",
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
        {Object.values(MEMES_SEASON).map((value) => (
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
