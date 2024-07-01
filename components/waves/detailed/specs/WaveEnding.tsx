import { Wave } from "../../../../generated/models/Wave";
import {  getTimeUntil } from "../../../../helpers/Helpers";

export default function WaveEnding({ wave }: { readonly wave: Wave }) {
  const endTime = wave.wave.period?.max
    ? getTimeUntil(wave.wave.period.max)
    : "Never";
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
      <span className="tw-font-medium tw-text-iron-400">Ending</span>
      <span className="tw-font-medium tw-text-white tw-text-base">
        {endTime}
      </span>
    </div>
  );
}
