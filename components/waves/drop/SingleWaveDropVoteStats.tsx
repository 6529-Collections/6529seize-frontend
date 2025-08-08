import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";

interface SingleWaveDropVoteStatsProps {
  readonly currentRating: number;
  readonly maxRating: number;
  readonly creditType: ApiWaveCreditType;
}

export const SingleWaveDropVoteStats: React.FC<SingleWaveDropVoteStatsProps> = ({
  currentRating,
  maxRating,
  creditType,
}) => {
  return (
    <div className="tw-mt-0.5 tw-flex tw-items-center tw-flex-wrap tw-gap-x-3 tw-gap-y-0.5 tw-text-xs tw-text-iron-400">
      <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
        <span>
          Your votes:{" "}
          <span className="tw-text-iron-200">
            {formatNumberWithCommas(currentRating)} {creditType}
          </span>
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
        <span>Available: </span>
        <div className="tw-flex tw-items-center">
          <div className="tw-flex tw-flex-col tw-items-center tw-mr-1 tw-leading-[0.15rem] -tw-space-y-2.5 tw-mt-0.5">
            <span className="tw-text-xs tw-font-medium tw-text-emerald-400">+</span>
            <span className="tw-text-xs tw-font-medium tw-text-rose-400">−</span>
          </div>
          <span className="tw-text-iron-200">
            {formatNumberWithCommas(maxRating)} {creditType}
          </span>
        </div>
      </div>
    </div>
  );
}; 
