import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";
import WaveRatingRep from "./WaveRatingRep";

const CREDIT_TYPE_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Rep]: "REP",
};

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveRating({ wave }: WaveRatingProps) {
  const creditType = wave.voting.credit_type;

  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-font-medium tw-text-iron-500">Rating</span>
      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
        <span className="tw-font-medium tw-text-iron-200 tw-text-md">
          By {CREDIT_TYPE_LABELS[creditType]}
        </span>
        {creditType === ApiWaveCreditType.Rep && (
          <WaveRatingRep wave={wave} />
        )}
      </div>
    </div>
  );
}
