import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WAVE_LABELS } from "@/helpers/waves/waves.constants";

export default function WaveTypeIcon({
  waveType,
  label,
}: {
  readonly waveType: ApiWaveType;
  readonly label?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-text-sm tw-font-medium tw-text-iron-50">
        {label ?? WAVE_LABELS[waveType]}
      </span>
    </div>
  );
}
