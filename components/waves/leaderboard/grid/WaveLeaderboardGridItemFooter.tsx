"use client";

import Button from "@/components/utils/button/Button";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import VotingModalButton from "@/components/voting/VotingModalButton";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { WaveLeaderboardIdentity } from "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity";
import {
  formatApprovalCountdownTime,
  isOfficiallyApprovedDrop,
  type ApprovalDropStatus,
} from "@/helpers/waves/approve-wave.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useApprovalDropStatus } from "@/hooks/waves/useApprovalDropStatus";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import Link from "next/link";

interface WaveLeaderboardGridItemFooterProps {
  readonly drop: ExtendedDrop;
  readonly titleId: string;
  readonly isCompactMode: boolean;
  readonly canOpenDrop: boolean;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed: boolean;
  readonly canShowVotingAction: boolean;
  readonly onOpenDrop: () => void;
  readonly onVoteButtonClick: () => void;
}

interface VoteMetricProps {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly isNegative?: boolean | undefined;
  readonly testId: string;
}

const formatSignedInteger = (
  locale: SupportedLocale,
  value: number
): string => {
  if (value === 0) {
    return "0";
  }

  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatInteger(locale, Math.abs(value))}`;
};

const getApprovalStatusLabel = ({
  locale,
  status,
  votingLabel,
}: {
  readonly locale: SupportedLocale;
  readonly status: ApprovalDropStatus;
  readonly votingLabel: string;
}): string => {
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
    amount: `${formatInteger(locale, status.remaining)} ${votingLabel}`,
  });
};

const getApprovalStatusClassName = (
  kind: ApprovalDropStatus["kind"]
): string => {
  if (
    kind === "approved" ||
    kind === "approving" ||
    kind === "reached_threshold"
  ) {
    return "tw-text-emerald-300";
  }

  if (kind === "closed") {
    return "tw-text-amber-300";
  }

  return "tw-text-iron-300";
};

function VoteMetric({
  label,
  value,
  unit,
  isNegative = false,
  testId,
}: VoteMetricProps) {
  return (
    <div
      data-testid={`wave-leaderboard-grid-metric-${testId}`}
      className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.025] tw-px-2.5 tw-py-2"
      title={`${label}: ${value} ${unit}`}
    >
      <dt className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-mb-0 tw-mt-1 tw-flex tw-min-w-0 tw-items-baseline tw-gap-1">
        <span
          className={`tw-whitespace-nowrap tw-font-mono tw-text-xs tw-font-semibold tw-tabular-nums ${
            isNegative ? "tw-text-rose-400" : "tw-text-iron-100"
          }`}
        >
          {value}
        </span>
        <span className="tw-truncate tw-text-[10px] tw-font-medium tw-text-iron-500">
          {unit}
        </span>
      </dd>
    </div>
  );
}

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

function WaveLeaderboardGridVoteSummary({
  drop,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
}: {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed: boolean;
}) {
  const locale = useBrowserLocale();
  const approvalStatus = useApprovalDropStatus({
    drop,
    isClosed: isVotingClosed,
    winningThreshold,
    winningThresholdMinDurationMs,
  });
  const isApproveDrop =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0;
  const userVote = drop.context_profile_context?.rating;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const yourVoteMetric = {
    label: t(locale, "waves.leaderboard.grid.yourVote"),
    value: userVote === undefined ? "-" : formatSignedInteger(locale, userVote),
    numericValue: userVote ?? 0,
    testId: "your-vote",
  };
  const primaryMetric = isApproveDrop
    ? t(locale, "waves.leaderboard.grid.reached")
    : t(locale, "waves.leaderboard.grid.current");
  const comparisonMetric = isApproveDrop
    ? {
        label: t(locale, "waves.leaderboard.grid.required"),
        value: formatInteger(locale, winningThreshold),
        numericValue: winningThreshold,
        testId: "required",
      }
    : {
        label: t(locale, "waves.leaderboard.grid.projected"),
        value: formatInteger(locale, drop.rating_prediction),
        numericValue: drop.rating_prediction,
        testId: "projected",
      };
  const thirdMetric = isApproveDrop
    ? {
        label: t(locale, "waves.leaderboard.grid.votesNow"),
        value: formatInteger(locale, drop.realtime_rating),
        numericValue: drop.realtime_rating,
        testId: "votes-now",
      }
    : yourVoteMetric;

  return (
    <div
      role="group"
      aria-label={t(locale, "waves.leaderboard.grid.voteSummary")}
      className="tw-mb-3"
    >
      <dl className="tw-mb-0 tw-grid tw-grid-cols-2 tw-gap-2">
        <VoteMetric
          label={primaryMetric}
          value={formatInteger(locale, drop.rating)}
          unit={votingLabel}
          isNegative={drop.rating < 0}
          testId={isApproveDrop ? "reached" : "current"}
        />
        <VoteMetric
          label={comparisonMetric.label}
          value={comparisonMetric.value}
          unit={votingLabel}
          isNegative={comparisonMetric.numericValue < 0}
          testId={comparisonMetric.testId}
        />
        <VoteMetric
          label={thirdMetric.label}
          value={thirdMetric.value}
          unit={votingLabel}
          isNegative={thirdMetric.numericValue < 0}
          testId={thirdMetric.testId}
        />
        {isApproveDrop && (
          <VoteMetric
            label={yourVoteMetric.label}
            value={yourVoteMetric.value}
            unit={votingLabel}
            isNegative={yourVoteMetric.numericValue < 0}
            testId={yourVoteMetric.testId}
          />
        )}
      </dl>
      {isApproveDrop && (
        <div className="tw-mt-2 tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-900/50 tw-px-2.5 tw-py-2">
          <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(locale, "waves.leaderboard.grid.status")}
          </span>
          <span
            className={`tw-text-right tw-text-xs tw-font-semibold ${getApprovalStatusClassName(
              approvalStatus.kind
            )}`}
          >
            {getApprovalStatusLabel({
              locale,
              status: approvalStatus,
              votingLabel,
            })}
          </span>
        </div>
      )}
    </div>
  );
}

export function WaveLeaderboardGridItemFooter({
  drop,
  titleId,
  isCompactMode,
  canOpenDrop,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  canShowVotingAction,
  onOpenDrop,
  onVoteButtonClick,
}: WaveLeaderboardGridItemFooterProps) {
  const locale = useBrowserLocale();
  const authorHandle = drop.author.handle?.trim() ?? "";
  const trimmedTitle = drop.title?.trim();
  const displayTitle =
    trimmedTitle === undefined || trimmedTitle.length === 0
      ? t(locale, "waves.leaderboard.grid.untitled")
      : trimmedTitle;
  const openLabel = t(locale, "waves.leaderboard.grid.openNamed", {
    title: displayTitle,
  });

  return (
    <footer
      data-testid={`wave-leaderboard-grid-item-footer-${drop.id}`}
      className="tw-flex tw-flex-1 tw-flex-col tw-rounded-b-xl tw-bg-iron-950/50 tw-p-3"
    >
      <div className="tw-mb-3 tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0 tw-flex-1">
          <h3
            id={titleId}
            className="tw-mb-0 tw-line-clamp-2 tw-break-words tw-text-sm tw-font-bold tw-leading-5 tw-text-iron-100"
          >
            {displayTitle}
          </h3>
          {authorHandle && (
            <UserProfileTooltipWrapper user={authorHandle}>
              <Link
                href={`/${authorHandle}`}
                prefetch={false}
                aria-label={t(locale, "waves.leaderboard.grid.authorProfile", {
                  author: authorHandle,
                })}
                className="tw-mt-0.5 tw-inline-flex tw-min-h-11 tw-max-w-full tw-items-center tw-truncate tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-underline"
              >
                {authorHandle}
              </Link>
            </UserProfileTooltipWrapper>
          )}
        </div>
        {isCompactMode && (
          <div className="tw-flex-shrink-0">
            <GridItemRankBadge
              drop={drop}
              winningThreshold={winningThreshold}
            />
          </div>
        )}
      </div>

      <WaveLeaderboardIdentity
        drop={drop}
        variant={isCompactMode ? "condensed" : "responsive"}
        cardVariant={isCompactMode ? undefined : "chat"}
        className="tw-mb-3"
        supplementFullWidth
      />

      {isCompactMode && (
        <WaveLeaderboardGridVoteSummary
          drop={drop}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
        />
      )}

      <div className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-3">
        {isCompactMode && (
          <div className="tw-flex tw-min-h-11 tw-items-center [&>button]:tw-min-h-11">
            <ParticipationDropVoteDetailsTrigger
              drop={drop}
              density="gallery"
            />
          </div>
        )}
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
          {canOpenDrop && (
            <Button
              type="button"
              size={null}
              variant="tertiary"
              aria-label={openLabel}
              onClick={onOpenDrop}
              className="tw-min-h-11 tw-px-3 tw-text-xs"
            >
              {t(locale, "waves.leaderboard.grid.open")}
            </Button>
          )}
          {canShowVotingAction && (
            <VotingModalButton
              drop={drop}
              onClick={onVoteButtonClick}
              variant="subtle"
              className="tw-min-h-11"
            >
              {t(locale, "waves.leaderboard.grid.vote")}
            </VotingModalButton>
          )}
        </div>
      </div>
    </footer>
  );
}
