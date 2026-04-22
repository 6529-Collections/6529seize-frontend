import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WAVE_LABELS } from "@/helpers/waves/waves.constants";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";

export default function CreateWaveTypeInputs({
  selected,
  onChange,
}: {
  readonly selected: ApiWaveType;
  readonly onChange: (type: ApiWaveType) => void;
}) {
  const waveTypes: ApiWaveType[] = [
    ApiWaveType.Chat,
    ApiWaveType.Rank,
    ApiWaveType.Approve,
  ];

  return (
    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-4 sm:tw-flex-nowrap">
      {waveTypes.map((waveType) => (
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
