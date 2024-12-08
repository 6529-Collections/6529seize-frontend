import { formatNumberWithCommas } from "../../../../helpers/Helpers";

interface WaveDropVoteStatsProps {
  readonly currentRating: number;
  readonly maxRating: number;
}

export const WaveDropVoteStats: React.FC<WaveDropVoteStatsProps> = ({
  currentRating,
  maxRating,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-iron-400">
      <div className="tw-flex tw-items-center tw-gap-1">
        <span>
          Your votes:{" "}
          <span className="tw-text-iron-200">
            {formatNumberWithCommas(currentRating)} TDH
          </span>
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-1">
        <span>Range: </span>
        <div className="tw-flex tw-items-center">
          <div className="tw-flex tw-flex-col tw-items-center tw-mr-0.5 tw-leading-[0.15rem] -tw-space-y-2.5">
            <span className="tw-text-xs tw-font-medium tw-text-emerald-400">+</span>
            <span className="tw-text-xs tw-font-medium tw-text-rose-400">−</span>
          </div>
          <span className="tw-text-iron-200">
            {formatNumberWithCommas(maxRating)} TDH
          </span>
        </div>
      </div>
    </div>
  );
}; 
