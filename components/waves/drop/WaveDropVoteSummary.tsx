import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveDropVoteSummaryProps {
  readonly drop: ExtendedDrop;
  readonly isWinner: boolean;
  readonly isVotingEnded: boolean;
  readonly canShowVote: boolean;
  readonly onVoteClick: () => void;
  readonly winningThreshold?: number | null | undefined;
}

const PRIMARY_BUTTON_CLASSES =
  "tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-flex tw-items-center tw-rounded-lg tw-bg-iron-200 tw-text-iron-950 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-white hover:tw-bg-iron-300 hover:tw-ring-iron-300 tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer";

export const WaveDropVoteSummary = ({
  drop,
  isWinner,
  isVotingEnded,
  canShowVote,
  onVoteClick,
  winningThreshold,
}: WaveDropVoteSummaryProps) => {
  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;
  const shouldShowUserVote = (isVotingEnded || isWinner) && hasUserVoted;
  const isApproveVoteSummary =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0;
  const progressVote = isApproveVoteSummary
    ? drop.realtime_rating
    : drop.rating_prediction;
  const progressTooltipLabel = isApproveVoteSummary
    ? "Votes given now"
    : "Projected vote count at decision time";

  return (
    <div className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1.5 tw-shadow-2xl tw-transition-transform hover:tw-scale-[1.01] sm:tw-gap-3">
      <div className="tw-flex tw-cursor-default tw-flex-wrap tw-items-baseline tw-gap-1.5 tw-px-4">
        <span className="tw-text-sm tw-font-semibold tw-tabular-nums tw-text-white sm:tw-text-base">
          {formatNumberWithCommas(drop.rating)}
        </span>
        {drop.rating !== progressVote && (
          <>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="tw-size-2.5 tw-flex-shrink-0 tw-text-iron-600"
            />
            <span
              className={`tw-cursor-help tw-text-sm tw-font-semibold tw-tabular-nums sm:tw-text-base ${
                drop.rating < progressVote
                  ? "tw-text-emerald-400"
                  : "tw-text-rose-400"
              }`}
              data-tooltip-id={`drop-vote-progress-${drop.id}`}
            >
              {formatNumberWithCommas(progressVote)}
            </span>
            <Tooltip
              id={`drop-vote-progress-${drop.id}`}
              place="top"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}
            >
              {progressTooltipLabel}: {formatNumberWithCommas(progressVote)}
            </Tooltip>
          </>
        )}
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-text-base">
          {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]} Total
        </span>
      </div>

      {shouldShowUserVote && (
        <div className="tw-flex tw-items-baseline tw-gap-1 tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-white/5 tw-px-4">
          <span className="tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-text-base">
            {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
          </span>
          <span
            className={`tw-text-sm tw-font-semibold sm:tw-text-base ${
              isUserVoteNegative ? "tw-text-rose-500" : "tw-text-emerald-500"
            }`}
          >
            {isUserVoteNegative && "-"}
            {formatNumberWithCommas(Math.abs(userVote))}
          </span>
          <span className="tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-text-base">
            {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
          </span>
        </div>
      )}

      {canShowVote && (
        <button
          type="button"
          onClick={onVoteClick}
          className={PRIMARY_BUTTON_CLASSES}
        >
          Vote
        </button>
      )}
    </div>
  );
};
