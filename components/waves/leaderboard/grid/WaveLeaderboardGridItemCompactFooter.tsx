"use client";

import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import VotingModalButton from "@/components/voting/VotingModalButton";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import Link from "next/link";
import React from "react";
import WaveLeaderboardGalleryItemVotes from "../gallery/WaveLeaderboardGalleryItemVotes";
import { WaveLeaderboardIdentity } from "../identity/WaveLeaderboardIdentity";

interface WaveLeaderboardGridItemCompactFooterProps {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly emphasizeCurrent?: boolean | undefined;
  readonly isVotingClosed: boolean;
  readonly canShowVotingAction: boolean;
  readonly onVoteButtonClick: () => void;
}

const getVoteStyle = (userVote: number): string => {
  if (userVote < 0) {
    return "tw-text-rose-400";
  }
  if (userVote === 0) {
    return "tw-text-iron-400";
  }
  return "tw-text-iron-300";
};

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
  emphasizeCurrent = false,
  isVotingClosed,
  canShowVotingAction,
  onVoteButtonClick,
}) => {
  const locale = useBrowserLocale();
  const author = drop.author;
  const authorHandle = author.handle ?? null;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const hasUserVoted = drop.context_profile_context?.rating !== undefined;
  const isNegativeVote = userVote < 0;
  const voteStyle = getVoteStyle(userVote);
  const votingCreditType = drop.wave.voting_credit_type;
  const votingCreditLabels = WAVE_VOTING_LABELS as Partial<
    Record<typeof votingCreditType, string>
  >;
  const votingCreditLabel =
    votingCreditLabels[votingCreditType] ?? votingCreditType;
  const voterCountLabel = t(
    locale,
    drop.raters_count === 1
      ? "waves.leaderboard.grid.voters.one"
      : "waves.leaderboard.grid.voters.other",
    { count: formatInteger(locale, drop.raters_count) }
  );

  return (
    <div
      data-testid={`wave-leaderboard-grid-item-footer-${drop.id}`}
      className="tw-rounded-b-lg tw-bg-iron-950/50 tw-px-3 tw-pb-3 tw-pt-1"
    >
      <div className="tw-mb-1 tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-2">
        <div className="tw-min-w-0 tw-flex-1">
          {authorHandle && (
            <UserProfileTooltipWrapper user={authorHandle}>
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${authorHandle}`}
                prefetch={false}
                aria-label={t(locale, "waves.leaderboard.grid.authorProfile", {
                  author: authorHandle,
                })}
                className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-items-center tw-truncate tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline"
              >
                {authorHandle}
              </Link>
            </UserProfileTooltipWrapper>
          )}
        </div>
        <div className="tw-flex-shrink-0">
          <GridItemRankBadge drop={drop} winningThreshold={winningThreshold} />
        </div>
      </div>
      <WaveLeaderboardIdentity
        drop={drop}
        variant="condensed"
        className="tw-mb-3"
        supplementFullWidth
      />
      <div className="tw-mb-3 tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-3 tw-text-xs">
        <div className="tw-min-w-0 tw-flex-1">
          <WaveLeaderboardGalleryItemVotes
            drop={drop}
            variant="subtle"
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
            isVotingClosed={isVotingClosed}
            emphasizeCurrent={emphasizeCurrent}
          />
        </div>
        <div
          aria-label={voterCountLabel}
          title={voterCountLabel}
          className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1 tw-text-xs tw-text-iron-500"
        >
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
          <span aria-hidden="true" className="tw-font-medium">
            {formatInteger(locale, drop.raters_count)}
          </span>
        </div>
      </div>
      <div className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-2">
        {hasUserVoted && (
          <span className="tw-text-[11px] tw-text-iron-500">
            {t(locale, "waves.leaderboard.grid.you")}:{" "}
            <span className={`tw-font-mono ${voteStyle}`}>
              {isNegativeVote && "-"}
              {formatInteger(locale, Math.abs(userVote))}
            </span>{" "}
            <span className={voteStyle}>
              {votingCreditLabel}
            </span>
          </span>
        )}
        {canShowVotingAction && (
          <div className="tw-ml-auto tw-flex tw-min-w-0 tw-flex-none tw-self-center tw-items-center tw-justify-end">
            <VotingModalButton
              drop={drop}
              onClick={onVoteButtonClick}
              className="tw-box-border tw-min-w-0 tw-max-w-full tw-self-center"
            />
          </div>
        )}
      </div>
    </div>
  );
};
