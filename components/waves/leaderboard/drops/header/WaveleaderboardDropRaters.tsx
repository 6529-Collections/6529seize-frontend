import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";
import { formatApprovalCountdownTime } from "@/helpers/waves/approve-wave.helpers";
import { useApprovalDropStatus } from "@/hooks/waves/useApprovalDropStatus";

interface WaveLeaderboardDropRatersProps {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
}

export const WaveLeaderboardDropRaters: React.FC<
  WaveLeaderboardDropRatersProps
> = ({
  drop,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
}) => {
  const votersCountLabel = drop.raters_count === 1 ? "voter" : "voters";
  const totalVote = drop.rating;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalVoteClass = totalVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const userVoteClass = userVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
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
  let approvalStatusClass: string | undefined;
  if (
    approvalStatus.kind === "approved" ||
    approvalStatus.kind === "approving" ||
    approvalStatus.kind === "reached_threshold"
  ) {
    approvalStatusClass = "tw-text-emerald-400";
  } else if (approvalStatus.kind === "closed") {
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

  const hasUserVoted = userVote !== 0;

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 sm:tw-justify-end">
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className={`tw-font-medium ${totalVoteClass}`}>
            {formatNumberWithCommas(totalVote)}
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
            current={drop.rating}
            projected={drop.rating_prediction}
            compact
          />
        </div>
        <span className="tw-whitespace-nowrap tw-font-normal tw-text-iron-400">
          {hasWinningThreshold && approvalStatusLabel !== null ? (
            <span className={approvalStatusClass}>{approvalStatusLabel}</span>
          ) : (
            <>
              {votingLabel} {WAVE_VOTE_STATS_LABELS.TOTAL}
            </>
          )}
        </span>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-leading-5">
        <span className="tw-text-iron-400">
          {formatNumberWithCommas(drop.raters_count)} {votersCountLabel}
        </span>
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-leading-5">
          <span className="tw-whitespace-nowrap">
            <span className="tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
            </span>
            <span className={`tw-font-medium ${userVoteClass}`}>
              {formatNumberWithCommas(userVote)} {votingLabel}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
