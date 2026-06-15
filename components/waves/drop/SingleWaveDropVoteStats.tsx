import type { FC } from "react";
import type { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  getWaveVoteScopeMaxLabel,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface SingleWaveDropVoteStatsProps {
  readonly currentRating: number;
  readonly maxRating: number;
  readonly label: string;
  readonly creditScope?: ApiWaveCreditScope | null | undefined;
  readonly showCurrentRating?: boolean | undefined;
  readonly showMaxRating?: boolean | undefined;
  readonly className?: string | undefined;
}

export const SingleWaveDropVoteStats: FC<SingleWaveDropVoteStatsProps> = ({
  currentRating,
  maxRating,
  label,
  creditScope,
  showCurrentRating = true,
  showMaxRating = true,
  className = "",
}) => {
  const maxLabel = getWaveVoteScopeMaxLabel(creditScope);

  return (
    <div
      className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-0.5 tw-text-[11px] tw-text-iron-500 ${className}`}
    >
      {showCurrentRating && (
        <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
          {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
          <span className="tw-text-iron-300">
            {formatNumberWithCommas(currentRating)}{" "}
          </span>
          <span className="tw-text-iron-500">{label}</span>
        </div>
      )}
      {showMaxRating && (
        <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
          <span>{maxLabel}: </span>
          <div className="tw-flex tw-items-center">
            <span className="tw-mr-1 tw-text-[11px] tw-font-medium tw-leading-none tw-text-iron-500">
              &plusmn;
            </span>
            <span className="tw-text-iron-200">
              {formatNumberWithCommas(maxRating)} {label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
