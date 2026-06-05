import React from "react";
import ApprovalDropVoteSummary from "@/components/waves/drops/ApprovalDropVoteSummary";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

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
        variant="leaderboard"
      />
    );
  }

  const totalVote = drop.rating;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalVoteClass = totalVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const userVoteClass = userVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const hasUserVoted = userVote !== 0;

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 sm:tw-justify-end">
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className={`tw-font-medium ${totalVoteClass}`}>
            {formatNumberWithCommas(totalVote)}
          </span>
          <DropVoteProgressing
            current={drop.rating}
            projected={drop.rating_prediction}
            compact
          />
        </div>
        <span className="tw-whitespace-nowrap tw-font-normal tw-text-iron-400">
          {votingLabel} {WAVE_VOTE_STATS_LABELS.TOTAL}
        </span>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-leading-5">
        <ParticipationDropVoteDetailsTrigger drop={drop} />
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
