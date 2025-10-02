import React from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import WaveAuthor from "./WaveAuthor";
import WaveTypeIcon from "./WaveTypeIcon";
import WaveRating from "./WaveRating";

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
        className={`tw-h-full tw-bg-iron-950 tw-relative tw-overflow-auto ${ringClasses}`}
      >
        <div className="tw-pb-4">
          <div className="tw-px-4 tw-pt-3 tw-flex tw-justify-between tw-items-center">
            <p className="tw-mb-0 tw-text-base tw-text-iron-200 tw-font-semibold tw-tracking-tight">
              General
            </p>
          </div>

          <div className="tw-px-4 tw-mt-2.5 tw-flex tw-flex-col tw-gap-2">
            <div className="tw-group tw-text-sm tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-1.5 tw-h-6">
              <span className="tw-font-medium tw-text-iron-400">Type</span>
              <div className="tw-flex tw-items-center tw-gap-x-1">
                <WaveTypeIcon waveType={wave.wave.type} />
              </div>
            </div>

            <div className="tw-group tw-text-sm tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-1.5 tw-h-6">
              <span className="tw-font-medium tw-text-iron-400">Rating</span>
              <div className="tw-flex tw-items-center tw-gap-x-1">
                <WaveRating wave={wave} />
              </div>
            </div>

            <div className="tw-group tw-text-sm tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-1.5 tw-h-6">
              <span className="tw-font-medium tw-text-iron-400">Creator</span>
              <div className="tw-flex tw-items-center tw-gap-x-1">
                <WaveAuthor wave={wave} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
