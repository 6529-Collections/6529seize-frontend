import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WAVE_LABELS } from "@/helpers/waves/waves.constants";

export default function WaveTypeIcon({
  waveType,
}: {
  readonly waveType: ApiWaveType;
}) {
  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-font-medium tw-text-iron-200 tw-text-sm">
        {WAVE_LABELS[waveType]}
      </span>
    </div>
  );
}
