import { Tooltip } from "react-tooltip";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { RatingsSectionProps, RatingsData } from "./types";
import VoteBreakdownTooltip from "./tooltips/VoteBreakdownTooltip";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import ApprovalDropVoteSummary from "@/components/waves/drops/ApprovalDropVoteSummary";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";

interface ParticipationDropRatingsTotalSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
}

export default function ParticipationDropRatingsTotalSection({
  drop,
  ratingsData,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
}: ParticipationDropRatingsTotalSectionProps) {
  const { currentRating } = ratingsData;
  const displayWinningThreshold =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0
      ? winningThreshold
      : null;
  const hasWinningThreshold = displayWinningThreshold !== null;

  if (hasWinningThreshold) {
    return (
      <ApprovalDropVoteSummary
        drop={drop}
        winningThreshold={displayWinningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        variant="chat"
        showVoters={false}
        showUserVote={false}
      />
    );
  }

  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalValueClass =
    currentRating < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
      <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span className={`tw-font-medium ${totalValueClass}`}>
          {currentRating < 0 && "-"}
          {formatNumberWithCommas(Math.abs(currentRating))}
        </span>
        <DropVoteProgressing
          current={currentRating}
          projected={drop.rating_prediction}
          compact
        />
      </div>
      <span
        className="tw-cursor-help tw-whitespace-nowrap tw-font-normal tw-text-iron-400"
        data-tooltip-id={`total-rating-${drop.id}`}
      >
        {votingLabel} {WAVE_VOTE_STATS_LABELS.TOTAL}
      </span>
      <Tooltip
        id={`total-rating-${drop.id}`}
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        <VoteBreakdownTooltip drop={drop} ratingsData={ratingsData} />
      </Tooltip>
    </div>
  );
}
