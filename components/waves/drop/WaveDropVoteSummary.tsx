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

type VoteSummaryVariant = "default" | "memes";

interface WaveDropVoteSummaryProps {
  readonly drop: ExtendedDrop;
  readonly isWinner: boolean;
  readonly isVotingEnded: boolean;
  readonly canShowVote: boolean;
  readonly onVoteClick: () => void;
  readonly variant?: VoteSummaryVariant | undefined;
}

const VOTE_SUMMARY_STYLES: Record<
  VoteSummaryVariant,
  {
    container: string;
    header: string;
    ratingText: string;
    predictedText: string;
    totalText: string;
    button: string;
  }
> = {
  default: {
    container:
      "tw-inline-flex tw-items-center tw-gap-3 tw-p-1.5 tw-bg-iron-950 tw-border tw-border-solid tw-border-white/10 tw-rounded-lg tw-shadow-2xl",
    header:
      "tw-px-4 tw-flex tw-items-baseline tw-gap-1.5 tw-cursor-default",
    ratingText: "tw-text-base tw-font-bold tw-text-white tw-tabular-nums",
    predictedText:
      "tw-text-base tw-font-bold tw-tabular-nums tw-cursor-help",
    totalText: "tw-text-sm tw-text-iron-500 tw-font-normal",
    button:
      "tw-px-6 tw-py-2.5 tw-text-sm tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white tw-flex tw-items-center tw-cursor-pointer tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out",
  },
  memes: {
    container:
      "tw-flex tw-items-center tw-gap-2 sm:tw-gap-3 tw-p-1.5 tw-bg-iron-950 tw-border tw-border-solid tw-border-white/10 tw-rounded-lg tw-shadow-2xl tw-transition-transform hover:tw-scale-[1.01]",
    header:
      "tw-px-2 sm:tw-px-4 tw-flex tw-flex-wrap tw-items-baseline tw-gap-1.5 tw-cursor-default",
    ratingText:
      "tw-text-sm sm:tw-text-base tw-font-semibold tw-text-white tw-tabular-nums",
    predictedText:
      "tw-text-sm sm:tw-text-base tw-font-semibold tw-tabular-nums tw-cursor-help",
    totalText:
      "tw-text-sm tw-text-iron-500 tw-font-normal tw-whitespace-nowrap",
    button:
      "tw-px-4 tw-py-2.5 tw-text-sm tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white tw-flex tw-items-center tw-cursor-pointer tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out",
  },
};

export const WaveDropVoteSummary = ({
  drop,
  isWinner,
  isVotingEnded,
  canShowVote,
  onVoteClick,
  variant = "default",
}: WaveDropVoteSummaryProps) => {
  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;
  const shouldShowUserVote = (isVotingEnded || isWinner) && hasUserVoted;
  const styles = VOTE_SUMMARY_STYLES[variant];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.ratingText}>
          {formatNumberWithCommas(drop.rating)}
        </span>
        {drop.rating !== drop.rating_prediction && (
          <>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="tw-flex-shrink-0 tw-size-2.5 tw-text-iron-600"
            />
            <span
              className={`${styles.predictedText} ${
                drop.rating < drop.rating_prediction
                  ? "tw-text-emerald-400"
                  : "tw-text-rose-400"
              }`}
              data-tooltip-id={`drop-vote-progress-${drop.id}`}
            >
              {formatNumberWithCommas(drop.rating_prediction)}
            </span>
            <Tooltip
              id={`drop-vote-progress-${drop.id}`}
              place="top"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}
            >
              Projected vote count at decision time
            </Tooltip>
          </>
        )}
        <span className={styles.totalText}>
          {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]} Total
        </span>
      </div>

      {shouldShowUserVote && (
        <div className="tw-px-4 tw-flex tw-items-baseline tw-gap-1 tw-border-l tw-border-solid tw-border-white/5 tw-border-y-0 tw-border-r-0">
          <span className="tw-text-sm tw-font-normal tw-text-iron-500">
            {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
          </span>
          <span
            className={`tw-text-sm tw-font-semibold ${
              isUserVoteNegative ? "tw-text-rose-500" : "tw-text-emerald-500"
            }`}
          >
            {isUserVoteNegative && "-"}
            {formatNumberWithCommas(Math.abs(userVote))}
          </span>
          <span className="tw-text-iron-500 tw-text-sm tw-font-normal">
            {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
          </span>
        </div>
      )}

      {canShowVote && (
        <button
          type="button"
          onClick={onVoteClick}
          className={styles.button}
        >
          Vote
        </button>
      )}
    </div>
  );
};
