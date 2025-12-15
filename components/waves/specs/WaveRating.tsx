import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import WaveRatingRep from "./WaveRatingRep";

const CREDIT_TYPE_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Xtdh]: "XTDH",
  [ApiWaveCreditType.TdhPlusXtdh]: "TDH + XTDH",
  [ApiWaveCreditType.Rep]: "REP",
};

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveRating({ wave }: WaveRatingProps) {
  const creditType = wave.voting.credit_type;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <div className="tw-flex tw-items-center">
        <span className="tw-font-medium tw-text-iron-200 tw-text-sm">
          {CREDIT_TYPE_LABELS[creditType]}
        </span>
        {creditType === ApiWaveCreditType.Rep && (
          <div className="tw-ml-1.5">
            <WaveRatingRep wave={wave} />
          </div>
        )}
      </div>
    </div>
  );
}
