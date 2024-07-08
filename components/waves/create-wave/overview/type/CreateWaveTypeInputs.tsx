import { WaveType } from "../../../../../generated/models/WaveType";
import { WAVE_LABELS } from "../../../../../helpers/waves/waves.constants";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";

export default function CreateWaveTypeInputs({
  selected,
  onChange,
}: {
  readonly selected: WaveType;
  readonly onChange: (type: WaveType) => void;
}) {
  const waveTypes: WaveType[] = [
    WaveType.Chat,
    WaveType.Rank,
    WaveType.Approve,
  ];

  const DISABLED_WAVE_TYPES: WaveType[] = [WaveType.Rank, WaveType.Approve];

  return (
    <div className="tw-mt-3 tw-flex tw-flex-wrap sm:tw-flex-nowrap tw-gap-x-4 tw-gap-y-4">
      {waveTypes.map((waveType) => (
        <CommonBorderedRadioButton
          key={waveType}
          type={waveType}
          selected={selected}
          disabled={DISABLED_WAVE_TYPES.includes(waveType)}
          label={WAVE_LABELS[waveType]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
