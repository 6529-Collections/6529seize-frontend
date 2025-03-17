import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import WaveAuthor from "./WaveAuthor";
import WaveTypeIcon from "./WaveTypeIcon";
import WaveRating from "./WaveRating";
import WaveNotificationSettings from "./WaveNotificationSettings";

interface WaveSpecsProps {
  readonly wave: ApiWave;
  readonly useRing?: boolean;
}

export default function WaveSpecs({ wave, useRing = true }: WaveSpecsProps) {
  const ringClasses = useRing
    ? "tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl"
    : "";

  return (
    <div>
      <div
        className={`tw-h-full tw-bg-iron-950 tw-relative tw-overflow-auto ${ringClasses}`}>
        <div>
          <div className="tw-px-5 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
            <p className="tw-mb-0 tw-text-lg tw-text-iron-200 tw-font-semibold tw-tracking-tight">
              General
            </p>
          </div>
          <div className="tw-px-5 tw-py-5 tw-flex tw-flex-col tw-gap-y-4">
            <WaveNotificationSettings wave={wave} />
            <WaveTypeIcon waveType={wave.wave.type} />
            <WaveRating wave={wave} />
            <WaveAuthor wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
}
