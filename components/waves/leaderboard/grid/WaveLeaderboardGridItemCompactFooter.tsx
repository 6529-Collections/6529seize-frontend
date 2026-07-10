"use client";

import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import VotingModalButton from "@/components/voting/VotingModalButton";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import Link from "next/link";
import React from "react";
import WaveLeaderboardGalleryItemVotes from "../gallery/WaveLeaderboardGalleryItemVotes";
import { WaveLeaderboardIdentity } from "../identity/WaveLeaderboardIdentity";

interface WaveLeaderboardGridItemCompactFooterProps {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed: boolean;
  readonly canShowVotingAction: boolean;
  readonly onVoteButtonClick: () => void;
}

const getVoteStyle = (userVote: number): string =>
  userVote <= 0 ? "tw-text-iron-400" : "tw-text-iron-300";

function GridItemRankBadge({
  drop,
  winningThreshold,
}: {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
}) {
  const isApproveDrop =
    typeof winningThreshold === "number" && winningThreshold > 0;

  if (isApproveDrop) {
    return isOfficiallyApprovedDrop(drop) ? (
      <ApprovalStatusBadge
        approvedAt={drop.winning_context?.decision_time ?? null}
      />
    ) : null;
  }

  if (drop.rank === null) {
    return (
      <div className="tw-flex tw-h-6 tw-min-w-6 tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-px-2 tw-text-xs tw-font-semibold tw-text-iron-400">
        -
      </div>
    );
  }

  return (
    <WinnerDropBadge
      rank={drop.rank}
      decisionTime={drop.winning_context?.decision_time ?? null}
    />
  );
}

export const WaveLeaderboardGridItemCompactFooter: React.FC<
  WaveLeaderboardGridItemCompactFooterProps
> = ({
  drop,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  canShowVotingAction,
  onVoteButtonClick,
}) => {
  const author = drop.author;
  const authorHandle = author.handle ?? null;
  const hasUserVoted = drop.context_profile_context?.rating !== undefined;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isNegativeVote = userVote < 0;
  const voteStyle = getVoteStyle(userVote);
  const votingCreditType = drop.wave.voting_credit_type;
  const votingCreditLabels = WAVE_VOTING_LABELS as Partial<
    Record<typeof votingCreditType, string>
  >;
  const votingCreditLabel =
    votingCreditLabels[votingCreditType] ?? votingCreditType;

  return (
    <div
      data-testid={`wave-leaderboard-grid-item-footer-${drop.id}`}
      className="tw-rounded-b-lg tw-bg-iron-950/50 tw-px-3 tw-pb-3 tw-pt-3"
    >
      <div className="tw-mb-1.5">
        {drop.title && (
          <h3 className="tw-mb-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-200">
            {drop.title}
          </h3>
        )}
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-mr-2 tw-min-w-0 tw-flex-1">
            {authorHandle && (
              <UserProfileTooltipWrapper user={authorHandle}>
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={`/${authorHandle}`}
                  className="tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline"
                >
                  {authorHandle}
                </Link>
              </UserProfileTooltipWrapper>
            )}
          </div>
          <GridItemRankBadge drop={drop} winningThreshold={winningThreshold} />
        </div>
      </div>
      <WaveLeaderboardIdentity
        drop={drop}
        variant="condensed"
        className="tw-mb-3"
        supplementFullWidth
      />
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-text-xs">
        <WaveLeaderboardGalleryItemVotes
          drop={drop}
          variant="subtle"
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
        />
        <div className="tw-ml-4 tw-flex tw-items-center tw-gap-1 tw-text-iron-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
            className="tw-size-3 tw-flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          </svg>
          <span className="tw-font-medium">
            {formatNumberWithCommas(drop.raters_count)}
          </span>
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-2">
        {hasUserVoted && (
          <span className="tw-font-mono tw-text-[11px] tw-text-iron-500">
            You:{" "}
            <span className={voteStyle}>
              {isNegativeVote && "-"}
              {formatNumberWithCommas(Math.abs(userVote))} {votingCreditLabel}
            </span>
          </span>
        )}
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-1.5">
          {canShowVotingAction && (
            <VotingModalButton
              drop={drop}
              onClick={onVoteButtonClick}
              variant="subtle"
            />
          )}
        </div>
      </div>
    </div>
  );
};
