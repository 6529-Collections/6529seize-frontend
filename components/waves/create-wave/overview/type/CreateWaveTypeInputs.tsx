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
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-3 [&>div]:tw-px-3 [&>div]:tw-py-3 [&>div]:tw-rounded-lg [&>div]:tw-shadow-none [&_input]:tw-h-4 [&_input]:tw-w-4 [&_div>div]:tw-text-sm">
      {waveTypes.map((waveType) => (
        <CommonBorderedRadioButton
          key={waveType}
          type={waveType}
          selected={selected}
          disabled={waveType === ApiWaveType.Approve}
          label={WAVE_LABELS[waveType]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
