import { Tooltip } from "react-tooltip";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { RatingsSectionProps, RatingsData } from "./types";
import VoteBreakdownTooltip from "./tooltips/VoteBreakdownTooltip";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";

interface ParticipationDropRatingsTotalSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
  readonly winningThreshold?: number | null | undefined;
}

export default function ParticipationDropRatingsTotalSection({
  drop,
  ratingsData,
  winningThreshold,
}: ParticipationDropRatingsTotalSectionProps) {
  const { currentRating } = ratingsData;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalValueClass =
    currentRating < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const displayWinningThreshold =
    typeof winningThreshold === "number" && winningThreshold > 0
      ? winningThreshold
      : null;
  const hasWinningThreshold = displayWinningThreshold !== null;
  const hasReachedThreshold =
    displayWinningThreshold !== null &&
    currentRating >= displayWinningThreshold;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
      <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span className={`tw-font-medium ${totalValueClass}`}>
          {currentRating < 0 && "-"}
          {formatNumberWithCommas(Math.abs(currentRating))}
        </span>
        {displayWinningThreshold !== null && (
          <>
            <span className="tw-font-medium tw-text-iron-500">/</span>
            <span className="tw-font-medium tw-text-iron-50">
              {formatNumberWithCommas(displayWinningThreshold)}
            </span>
          </>
        )}
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
        {hasWinningThreshold ? (
          <>
            {votingLabel}{" "}
            <span
              className={
                hasReachedThreshold ? "tw-text-emerald-400" : undefined
              }
            >
              {hasReachedThreshold ? "Approved" : "to approve"}
            </span>
          </>
        ) : (
          <>
            {votingLabel} {WAVE_VOTE_STATS_LABELS.TOTAL}
          </>
        )}
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
