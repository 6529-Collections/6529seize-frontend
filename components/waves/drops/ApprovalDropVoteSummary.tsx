"use client";

import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatLargeNumber, formatNumberWithCommas } from "@/helpers/Helpers";
import {
  formatApprovalCountdownTime,
  type ApprovalDropStatus,
} from "@/helpers/waves/approve-wave.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useApprovalDropStatus } from "@/hooks/waves/useApprovalDropStatus";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import ParticipationDropVoteDetailsTrigger from "./participation/ratings/ParticipationDropVoteDetailsTrigger";

type ApprovalDropVoteSummaryVariant =
  | "chat"
  | "leaderboard"
  | "compact"
  | "final";

interface ApprovalDropVoteSummaryProps {
  readonly drop: ApiDrop;
  readonly winningThreshold: number;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly variant: ApprovalDropVoteSummaryVariant;
  readonly showVoters?: boolean | undefined;
  readonly showUserVote?: boolean | undefined;
  readonly emphasizeCurrent?: boolean | undefined;
  readonly subtle?: boolean | undefined;
}

const getApprovalStatusLabel = (
  locale: SupportedLocale,
  status: ApprovalDropStatus
): string => {
  if (status.kind === "approved") {
    return t(locale, "waves.leaderboard.grid.status.approved");
  }

  if (status.kind === "approving") {
    return t(locale, "waves.leaderboard.grid.status.approvingIn", {
      time: formatApprovalCountdownTime(status.countdownMs ?? 0),
    });
  }

  if (status.kind === "reached_threshold") {
    return t(locale, "waves.leaderboard.grid.status.reachedThreshold");
  }

  if (status.kind === "closed") {
    return t(locale, "waves.leaderboard.grid.status.closed");
  }

  return t(locale, "waves.leaderboard.grid.status.needs", {
    amount: formatInteger(locale, status.remaining ?? 0),
  });
};

const getApprovalStatusClass = ({
  kind,
  subtle,
}: {
  readonly kind: ApprovalDropStatus["kind"];
  readonly subtle: boolean;
}): string => {
  if (
    kind === "approved" ||
    kind === "approving" ||
    kind === "reached_threshold"
  ) {
    return "tw-text-emerald-400";
  }

  if (kind === "closed") {
    return "tw-text-amber-300";
  }

  return subtle ? "tw-text-iron-400" : "tw-text-iron-300";
};

const getCurrentValueClass = ({
  current,
  subtle,
}: {
  readonly current: number;
  readonly subtle: boolean;
}): string => {
  if (current < 0) {
    return "tw-text-rose-400";
  }

  if (subtle) {
    return "tw-text-iron-200";
  }

  return "tw-text-emerald-500";
};

const formatSignedVote = (vote: number): string => {
  if (vote === 0) {
    return "0";
  }

  const sign = vote > 0 ? "+" : "-";
  return `${sign}${formatNumberWithCommas(Math.abs(vote))}`;
};

export default function ApprovalDropVoteSummary({
  drop,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  variant,
  showVoters = variant !== "compact",
  showUserVote = variant !== "compact",
  emphasizeCurrent = false,
  subtle = false,
}: ApprovalDropVoteSummaryProps) {
  const locale = useBrowserLocale();
  const approvalStatus = useApprovalDropStatus({
    drop,
    isClosed: isVotingClosed,
    winningThreshold,
    winningThresholdMinDurationMs,
  });
  const current = approvalStatus.current;
  const statusLabel = getApprovalStatusLabel(locale, approvalStatus);
  const statusClass = getApprovalStatusClass({
    kind: approvalStatus.kind,
    subtle,
  });
  const userVote = drop.context_profile_context?.rating ?? 0;
  const hasUserVoted = userVote !== 0;
  const userVoteClass = userVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalVoteClass = current < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  if (variant === "compact") {
    const realtimeRating =
      typeof drop.realtime_rating === "number" ? drop.realtime_rating : null;
    const hasRealtimeRating =
      realtimeRating !== null && realtimeRating !== current;
    const voteSummaryLabel = t(
      locale,
      hasRealtimeRating
        ? "waves.leaderboard.grid.voteSummary.approvalWithRealtime"
        : "waves.leaderboard.grid.voteSummary.approval",
      {
        reached: formatInteger(locale, current),
        required: formatInteger(locale, winningThreshold),
        votesNow:
          realtimeRating === null ? "" : formatInteger(locale, realtimeRating),
        unit: votingLabel,
        status: statusLabel,
      }
    );

    return (
      <div
        role="group"
        aria-label={voteSummaryLabel}
        className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2"
      >
        <div
          aria-hidden="true"
          className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-2"
        >
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-0.5">
            <span
              className={`tw-font-mono tw-text-sm tw-font-bold ${getCurrentValueClass(
                {
                  current,
                  subtle,
                }
              )}`}
            >
              {formatInteger(locale, current)}
            </span>
            <span className="tw-font-mono tw-text-sm tw-font-bold tw-text-iron-500">
              /
            </span>
            <span
              className={`tw-font-mono tw-text-sm tw-font-bold ${
                emphasizeCurrent ? "tw-text-iron-400" : "tw-text-iron-200"
              }`}
            >
              {formatInteger(locale, winningThreshold)}
            </span>
            {hasRealtimeRating && (
              <DropVoteProgressing
                current={current}
                projected={realtimeRating}
                projectedLabel={formatInteger(locale, realtimeRating)}
                tooltipLabel={t(locale, "waves.leaderboard.grid.votesNow")}
                subtle={subtle}
              />
            )}
          </div>
          <span
            className={`tw-whitespace-nowrap tw-text-xs tw-font-normal ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
        {showVoters && (
          <ParticipationDropVoteDetailsTrigger drop={drop} density="compact" />
        )}
      </div>
    );
  }

  if (variant === "chat" || variant === "leaderboard") {
    const scoreLabel = `${formatNumberWithCommas(
      current
    )} / ${formatNumberWithCommas(winningThreshold)} ${votingLabel}`;
    const leaderboardGapClass = emphasizeCurrent ? "tw-gap-x-6" : "tw-gap-x-4";
    const wrapperClassName =
      variant === "chat"
        ? "tw-flex tw-min-w-0 tw-w-full tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-text-sm tw-leading-5"
        : `tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-y-2 tw-text-sm tw-leading-5 sm:tw-justify-end ${leaderboardGapClass}`;
    const summaryStatusClass =
      emphasizeCurrent && approvalStatus.kind === "needs"
        ? "tw-text-iron-400"
        : statusClass;

    return (
      <div className={wrapperClassName}>
        <div
          className={`tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-y-1 ${
            emphasizeCurrent ? "tw-gap-x-5" : "tw-gap-x-2"
          }`}
          title={scoreLabel}
        >
          <span className="tw-sr-only">{scoreLabel}</span>
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <span
              aria-hidden="true"
              className={`tw-font-mono tw-font-medium ${totalVoteClass}`}
            >
              {formatLargeNumber(current)}
            </span>
            <span
              aria-hidden="true"
              className="tw-font-mono tw-font-medium tw-text-iron-500"
            >
              /
            </span>
            <span
              aria-hidden="true"
              className={`tw-font-mono ${
                emphasizeCurrent ? "tw-font-semibold" : "tw-font-medium"
              } ${emphasizeCurrent ? "tw-text-iron-400" : "tw-text-iron-50"}`}
            >
              {formatLargeNumber(winningThreshold)}
            </span>
            <span
              aria-hidden="true"
              className="tw-font-normal tw-text-iron-400"
            >
              {votingLabel}
            </span>
            <DropVoteProgressing
              current={current}
              projected={drop.realtime_rating}
              projectedLabel={
                typeof drop.realtime_rating === "number"
                  ? formatLargeNumber(drop.realtime_rating)
                  : undefined
              }
              tooltipLabel={t(locale, "waves.leaderboard.grid.votesNow")}
              compact
              numberWeight={emphasizeCurrent ? "semibold" : undefined}
            />
          </div>
          <span className={`tw-text-sm tw-font-normal ${summaryStatusClass}`}>
            {statusLabel}
          </span>
        </div>

        {showVoters && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap">
            <ParticipationDropVoteDetailsTrigger
              drop={drop}
              density={emphasizeCurrent ? "tight" : undefined}
            />
          </div>
        )}

        {showUserVote && hasUserVoted && (
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
            <span className="tw-min-w-0">
              <span className="tw-font-normal tw-text-iron-400">
                {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
              </span>
              <span
                className={`tw-whitespace-nowrap tw-font-mono tw-font-medium ${userVoteClass}`}
              >
                {formatSignedVote(userVote)}
              </span>{" "}
              <span className={userVoteClass}>{votingLabel}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const wrapperClassName =
    "tw-mt-1 tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-text-sm tw-leading-5";

  return (
    <div className={wrapperClassName}>
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className={`tw-font-mono tw-font-medium ${totalVoteClass}`}>
            {current < 0 && "-"}
            {formatNumberWithCommas(Math.abs(current))}
          </span>
          <span className="tw-font-mono tw-font-medium tw-text-iron-500">/</span>
          <span className="tw-font-mono tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(winningThreshold)}
          </span>
          <DropVoteProgressing
            current={current}
            projected={drop.realtime_rating}
            tooltipLabel="Votes given now"
            compact
          />
        </div>
        <span className="tw-whitespace-nowrap tw-font-normal tw-text-iron-400">
          <span className={statusClass}>{statusLabel}</span>
        </span>
      </div>

      {showVoters && (
        <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-leading-5">
          <ParticipationDropVoteDetailsTrigger drop={drop} />
        </div>
      )}

      {showUserVote && hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-leading-5">
          <span className="tw-whitespace-nowrap">
            <span className="tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
            </span>
            <span className={`tw-font-mono tw-font-medium ${userVoteClass}`}>
              {formatSignedVote(userVote)}
            </span>{" "}
            <span className={userVoteClass}>{votingLabel}</span>
          </span>
        </div>
      )}
    </div>
  );
}
