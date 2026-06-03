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
import { formatApprovalCountdownTime } from "@/helpers/waves/approve-wave.helpers";
import { useApprovalDropStatus } from "@/hooks/waves/useApprovalDropStatus";

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
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalValueClass =
    currentRating < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const displayWinningThreshold =
    typeof winningThreshold === "number" && winningThreshold > 0
      ? winningThreshold
      : null;
  const hasWinningThreshold = displayWinningThreshold !== null;
  const approvalStatus = useApprovalDropStatus({
    drop,
    isClosed: isVotingClosed,
    winningThreshold: displayWinningThreshold,
    winningThresholdMinDurationMs,
  });
  const approvalStatusKind = approvalStatus.kind;
  let approvalStatusClass: string | undefined;

  if (
    approvalStatusKind === "approved" ||
    approvalStatusKind === "approving" ||
    approvalStatusKind === "reached_threshold"
  ) {
    approvalStatusClass = "tw-text-emerald-400";
  } else if (approvalStatusKind === "closed") {
    approvalStatusClass = "tw-text-amber-300";
  }
  const approvalStatusLabel = (() => {
    if (!hasWinningThreshold) {
      return null;
    }

    if (approvalStatus.kind === "approved") {
      return "Approved";
    }

    if (approvalStatus.kind === "approving") {
      return `Approving in ${formatApprovalCountdownTime(
        approvalStatus.countdownMs ?? 0
      )}`;
    }

    if (approvalStatus.kind === "reached_threshold") {
      return "Reached threshold";
    }

    if (approvalStatus.kind === "closed") {
      return "Closed";
    }

    return `Needs ${formatNumberWithCommas(approvalStatus.remaining ?? 0)}`;
  })();

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
          projected={
            hasWinningThreshold ? drop.realtime_rating : drop.rating_prediction
          }
          tooltipLabel={
            hasWinningThreshold ? "Realtime votes given" : undefined
          }
          compact
        />
      </div>
      <span
        className="tw-cursor-help tw-whitespace-nowrap tw-font-normal tw-text-iron-400"
        data-tooltip-id={`total-rating-${drop.id}`}
      >
        {hasWinningThreshold && approvalStatusLabel !== null ? (
          <span className={approvalStatusClass}>{approvalStatusLabel}</span>
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
