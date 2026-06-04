"use client";

import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  formatApprovalCountdownTime,
  type ApprovalDropStatus,
} from "@/helpers/waves/approve-wave.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { useApprovalDropStatus } from "@/hooks/waves/useApprovalDropStatus";
import ParticipationDropVoteDetailsTrigger from "./participation/ratings/ParticipationDropVoteDetailsTrigger";

export type ApprovalDropVoteSummaryVariant =
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
  readonly subtle?: boolean | undefined;
}

const getApprovalStatusLabel = (status: ApprovalDropStatus): string => {
  if (status.kind === "approved") {
    return "Approved";
  }

  if (status.kind === "approving") {
    return `Approving in ${formatApprovalCountdownTime(
      status.countdownMs ?? 0
    )}`;
  }

  if (status.kind === "reached_threshold") {
    return "Reached threshold";
  }

  if (status.kind === "closed") {
    return "Closed";
  }

  return `Needs ${formatNumberWithCommas(status.remaining ?? 0)}`;
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
  if (subtle) {
    return "tw-text-iron-200";
  }

  return current < 0 ? "tw-text-rose-500" : "tw-text-emerald-500";
};

export default function ApprovalDropVoteSummary({
  drop,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  variant,
  showVoters = variant !== "compact",
  showUserVote = variant !== "compact",
  subtle = false,
}: ApprovalDropVoteSummaryProps) {
  const approvalStatus = useApprovalDropStatus({
    drop,
    isClosed: isVotingClosed,
    winningThreshold,
    winningThresholdMinDurationMs,
  });
  const current = approvalStatus.current;
  const statusLabel = getApprovalStatusLabel(approvalStatus);
  const statusClass = getApprovalStatusClass({
    kind: approvalStatus.kind,
    subtle,
  });
  const userVote = drop.context_profile_context?.rating ?? 0;
  const hasUserVoted = userVote !== 0;
  const userVoteClass = userVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  if (variant === "compact") {
    return (
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
        <span
          className={`tw-font-mono tw-text-sm tw-font-bold ${getCurrentValueClass(
            {
              current,
              subtle,
            }
          )}`}
        >
          {formatNumberWithCommas(current)}
        </span>
        <span className="tw-font-mono tw-text-sm tw-font-bold tw-text-iron-500">
          /
        </span>
        <span className="tw-font-mono tw-text-sm tw-font-bold tw-text-iron-200">
          {formatNumberWithCommas(winningThreshold)}
        </span>
        <DropVoteProgressing
          current={current}
          projected={drop.realtime_rating}
          tooltipLabel="Realtime votes given"
          subtle={subtle}
        />
        <span
          className={`tw-whitespace-nowrap tw-text-xs tw-font-medium ${statusClass}`}
        >
          {statusLabel}
        </span>
        {showVoters && (
          <ParticipationDropVoteDetailsTrigger drop={drop} density="compact" />
        )}
      </div>
    );
  }

  const wrapperClassName =
    variant === "leaderboard"
      ? "tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 sm:tw-justify-end"
      : variant === "final"
        ? "tw-mt-1 tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-text-sm tw-leading-5"
        : "tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2";

  const totalVoteClass = current < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  return (
    <div className={wrapperClassName}>
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className={`tw-font-medium ${totalVoteClass}`}>
            {current < 0 && "-"}
            {formatNumberWithCommas(Math.abs(current))}
          </span>
          <span className="tw-font-medium tw-text-iron-500">/</span>
          <span className="tw-font-medium tw-text-iron-50">
            {formatNumberWithCommas(winningThreshold)}
          </span>
          <DropVoteProgressing
            current={current}
            projected={drop.realtime_rating}
            tooltipLabel="Realtime votes given"
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
            <span className={`tw-font-medium ${userVoteClass}`}>
              {userVote < 0 && "-"}
              {formatNumberWithCommas(Math.abs(userVote))}{" "}
              {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
