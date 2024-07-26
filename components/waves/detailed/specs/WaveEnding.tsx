import { Wave } from "../../../../generated/models/Wave";
import { getTimeUntil } from "../../../../helpers/Helpers";

export default function WaveEnding({ wave }: { readonly wave: Wave }) {
  const endTime = wave.wave.period?.max
    ? getTimeUntil(wave.wave.period.max)
    : "Never";
  return (
    <div className="tw-text-sm">
      <span className="tw-font-normal tw-text-iron-400">Ending</span>
      <span className="tw-font-normal tw-text-iron-300">{endTime}</span>
    </div>
  );
}
