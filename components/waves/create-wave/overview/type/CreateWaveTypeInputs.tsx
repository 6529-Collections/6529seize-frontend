import { WAVE_LABELS } from "../../../../../helpers/waves/waves.constants";
import { WaveType } from "../../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";

export default function CreateWaveTypeInputs({
  selected,
  onChange,
}: {
  readonly selected: WaveType;
  readonly onChange: (type: WaveType) => void;
}) {
  return (
    <div className="tw-mt-3 tw-grid tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
      {Object.values(WaveType).map((waveType) => (
        <CommonBorderedRadioButton
          key={waveType}
          type={waveType}
          selected={selected}
          label={WAVE_LABELS[waveType]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
