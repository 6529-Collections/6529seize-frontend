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
  readonly subtle?: boolean | undefined;
  readonly className?: string | undefined;
}

export const SingleWaveDropVoteStats: FC<SingleWaveDropVoteStatsProps> = ({
  currentRating,
  maxRating,
  label,
  creditScope,
  showCurrentRating = true,
  showMaxRating = true,
  subtle = false,
  className = "",
}) => {
  const maxLabel = getWaveVoteScopeMaxLabel(creditScope);
  const labelClassName = subtle ? "tw-text-iron-600" : "tw-text-iron-500";
  const currentRatingClassName = subtle
    ? "tw-text-iron-400"
    : "tw-text-iron-300";
  const currentRatingLabelClassName = subtle
    ? currentRatingClassName
    : "tw-text-iron-500";
  const maxSymbolClassName = subtle ? "tw-text-iron-400" : "tw-text-iron-500";
  const maxRatingClassName = subtle ? "tw-text-iron-400" : "tw-text-iron-200";

  return (
    <div
      className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-0.5 tw-text-[11px] ${labelClassName} ${className}`}
    >
      {showCurrentRating && (
        <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
          {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
          <span className={currentRatingClassName}>
            {formatNumberWithCommas(currentRating)}{" "}
          </span>
          <span className={currentRatingLabelClassName}>{label}</span>
        </div>
      )}
      {showMaxRating && (
        <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
          <span>{maxLabel}: </span>
          <div className="tw-flex tw-items-center">
            <span
              className={`tw-mr-1 tw-text-[11px] tw-font-medium tw-leading-none ${maxSymbolClassName}`}
            >
              &plusmn;
            </span>
            <span className={maxRatingClassName}>
              {formatNumberWithCommas(maxRating)} {label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
