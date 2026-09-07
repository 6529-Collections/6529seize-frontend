"use client";

import type { ApiDropVoteDistribution } from "@/generated/models/ApiDropVoteDistribution";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isLocalVotePreviewEnabled } from "@/services/api/drop-vote-preview-api";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useId } from "react";

interface VoteSide {
  readonly positive: boolean;
  readonly total: number;
  readonly remainder: number;
  readonly voters: readonly ApiDropVoter[];
}

const POSITIVE_PIECES = [
  "tw-bg-emerald-400",
  "tw-bg-emerald-500",
  "tw-bg-emerald-600",
];
const NEGATIVE_PIECES = [
  "tw-bg-rose-400",
  "tw-bg-rose-500",
  "tw-bg-rose-600",
];
const STRIPED_PIECE =
  "tw-bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,currentColor_3px,currentColor_4px)]";

function getVoteSide(
  total: number,
  voters: readonly ApiDropVoter[],
  positive: boolean
): VoteSide | null {
  const direction = positive ? 1 : -1;
  if (
    !Number.isSafeInteger(total) ||
    total * direction < 0 ||
    !Array.isArray(voters) ||
    voters.length > 3 ||
    (total !== 0 && voters.length === 0)
  ) {
    return null;
  }
  if (
    voters.some(
      (entry) =>
        !Number.isSafeInteger(entry?.vote) ||
        entry.vote * direction <= 0 ||
        typeof entry.voter?.id !== "string" ||
        entry.voter.id.trim().length === 0
    )
  ) {
    return null;
  }
  const listedTotal = voters.reduce((sum, entry) => sum + entry.vote, 0);
  if (
    !Number.isSafeInteger(listedTotal) ||
    Math.abs(listedTotal) > Math.abs(total)
  ) {
    return null;
  }
  return {
    positive,
    total,
    remainder: total - listedTotal,
    voters: [...voters].sort(
      (left, right) => Math.abs(right.vote) - Math.abs(left.vote)
    ),
  };
}

function getVoteSides(distribution: ApiDropVoteDistribution | undefined) {
  if (!distribution) {
    return null;
  }
  const positive = getVoteSide(
    distribution.positive_total,
    distribution.positive_votes,
    true
  );
  const negative = getVoteSide(
    distribution.negative_total,
    distribution.negative_votes,
    false
  );
  if (!positive || !negative) {
    return null;
  }
  const grossTotal = positive.total - negative.total;
  const voterIds = [...negative.voters, ...positive.voters].map(
    (entry) => entry.voter.id
  );
  if (
    !Number.isSafeInteger(grossTotal) ||
    grossTotal <= 0 ||
    new Set(voterIds).size !== voterIds.length
  ) {
    return null;
  }
  return [negative, positive];
}

function getVoterName({ voter }: ApiDropVoter): string {
  const address =
    typeof voter.primary_address === "string" &&
    voter.primary_address.trim() !== "UNKNOWN"
      ? voter.primary_address
      : undefined;
  return (
    [voter.handle, address, voter.id].find(
      (value) => typeof value === "string" && value.trim().length > 0
    )?.trim() ?? voter.id
  );
}

function formatVote(locale: SupportedLocale, vote: number, compact = false) {
  return formatNumber(locale, vote, {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
    signDisplay: "always",
  });
}

function VoteRibbonSide({
  side,
  locale,
}: {
  readonly side: VoteSide;
  readonly locale: SupportedLocale;
}) {
  if (side.total === 0) {
    return null;
  }
  const colors = side.positive ? POSITIVE_PIECES : NEGATIVE_PIECES;
  return (
    <span
      className="tw-flex tw-h-4 tw-min-w-0"
      style={{ flex: `${Math.abs(side.total)} 1 0%` }}
    >
      {side.voters.map((entry, index) => (
        <span
          key={entry.voter.id}
          className="tw-min-w-0 tw-shrink-0 tw-pr-0.5 last:tw-pr-0"
          style={{ width: `${Math.abs(entry.vote / side.total) * 100}%` }}
        >
          <span
            className={`tw-block tw-h-full tw-rounded-md ${colors[index]}`}
          />
        </span>
      ))}
      {side.remainder !== 0 && (
        <span
          className={`tw-min-w-0 tw-overflow-hidden tw-rounded-md ${STRIPED_PIECE} ${side.positive ? "tw-bg-emerald-500 tw-text-emerald-300" : "tw-bg-rose-400 tw-text-rose-300"}`}
          style={{ width: `${Math.abs(side.remainder / side.total) * 100}%` }}
        >
          <span className="tw-block tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-px-1 tw-text-center tw-text-[10px] tw-font-medium tw-leading-4 tw-text-iron-950">
            {t(locale, "waves.voteInsights.others")}
          </span>
        </span>
      )}
    </span>
  );
}

function LargestSideVote({
  side,
  locale,
}: {
  readonly side: VoteSide;
  readonly locale: SupportedLocale;
}) {
  const largest = side.voters[0];
  if (!largest) {
    return null;
  }
  return (
    <span className="tw-flex tw-min-w-0 tw-flex-1 tw-basis-48 tw-flex-col tw-gap-0.5">
      <span className="tw-text-xs tw-text-iron-400">
        {t(
          locale,
          side.positive
            ? "waves.voteInsights.largestPositive"
            : "waves.voteInsights.largestNegative"
        )}
      </span>
      <span className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2 tw-text-sm">
        <span className="tw-truncate tw-text-iron-200">
          {getVoterName(largest)}
        </span>
        <span
          className={`tw-shrink-0 tw-whitespace-nowrap tw-font-medium tw-tabular-nums ${side.positive ? "tw-text-emerald-400" : "tw-text-rose-400"}`}
        >
          {formatVote(locale, largest.vote, true)}
        </span>
      </span>
    </span>
  );
}

function VoteSideBreakdown({
  side,
  locale,
  unit,
}: {
  readonly side: VoteSide;
  readonly locale: SupportedLocale;
  readonly unit: string;
}) {
  if (side.total === 0) {
    return null;
  }
  const color = side.positive ? "tw-text-emerald-400" : "tw-text-rose-400";
  return (
    <div className="tw-min-w-0 tw-flex-1 tw-basis-64">
      <h2 className="tw-m-0 tw-flex tw-flex-wrap tw-justify-between tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300">
        <span>
          {t(
            locale,
            side.positive
              ? "waves.voteInsights.positiveTotal"
              : "waves.voteInsights.negativeTotal"
          )}
        </span>
        <span className={`tw-whitespace-nowrap tw-tabular-nums ${color}`}>
          {formatVote(locale, side.total)} {unit}
        </span>
      </h2>
      <ul className="tw-m-0 tw-mt-1 tw-list-none tw-p-0">
        {side.voters.map((entry) => {
          const name = getVoterName(entry);
          const exactVote = formatVote(locale, entry.vote);
          return (
            <li
              key={entry.voter.id}
              className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-py-1 tw-text-xs tw-leading-5"
            >
              <Link
                href={`/${encodeURIComponent(name)}`}
                prefetch={false}
                aria-label={t(locale, "waves.voteInsights.voteByName", {
                  name,
                  vote: exactVote,
                  unit,
                })}
                className="tw-inline-flex tw-min-h-6 tw-min-w-6 tw-max-w-full tw-items-center tw-break-all tw-rounded-md tw-text-iron-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100 desktop-hover:hover:tw-underline"
              >
                {name}
              </Link>
              <span
                aria-hidden="true"
                className={`tw-whitespace-nowrap tw-tabular-nums ${color}`}
              >
                {exactVote} {unit}
              </span>
            </li>
          );
        })}
        {side.remainder !== 0 && (
          <li className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-3 tw-py-1 tw-text-xs tw-leading-5 tw-text-iron-400">
            <span>{t(locale, "waves.voteInsights.others")}</span>
            <span className={`tw-whitespace-nowrap tw-tabular-nums ${color}`}>
              {formatVote(locale, side.remainder)} {unit}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function DropVoteDistribution({
  drop,
  voteDistribution,
}: {
  readonly drop: ExtendedDrop;
  readonly voteDistribution?: ApiDropVoteDistribution | undefined;
}) {
  const locale = useBrowserLocale();
  const explanationId = useId();
  const sides = getVoteSides(voteDistribution);
  const unit = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  if (drop.drop_type !== ApiDropType.Participatory || !sides || !unit) {
    return null;
  }
  return (
    <details className="tw-group tw-mb-6 tw-w-full">
      <summary
        aria-describedby={explanationId}
        className="tw-block tw-min-h-11 tw-cursor-pointer tw-list-none tw-rounded-lg tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.025] [&::-webkit-details-marker]:tw-hidden"
      >
        {isLocalVotePreviewEnabled() && (
          <span className="tw-mb-2 tw-block tw-text-xs tw-text-iron-400">
            {t(locale, "waves.voteInsights.localPreview")}
          </span>
        )}
        <span className="tw-sr-only">
          {t(locale, "waves.voteInsights.currentVotes")}
        </span>
        <span
          aria-hidden="true"
          dir="ltr"
          className="tw-flex tw-items-center tw-gap-2"
        >
          <span className="tw-text-base tw-leading-4 tw-text-rose-400">−</span>
          <span className="tw-flex tw-h-4 tw-min-w-0 tw-flex-1 tw-gap-1">
            {sides.map((side) => (
              <VoteRibbonSide
                key={String(side.positive)}
                side={side}
                locale={locale}
              />
            ))}
          </span>
          <span className="tw-text-base tw-leading-4 tw-text-emerald-400">+</span>
          <ChevronDownIcon className="tw-size-4 tw-shrink-0 tw-text-iron-400 group-open:tw-rotate-180" />
        </span>
        <span className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2">
          {sides.map((side) => (
            <LargestSideVote
              key={String(side.positive)}
              side={side}
              locale={locale}
            />
          ))}
        </span>
      </summary>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-3">
        <p
          id={explanationId}
          className="tw-m-0 tw-mb-3 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {t(locale, "waves.voteInsights.allocationExplanation")}
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-4">
          {sides.map((side) => (
            <VoteSideBreakdown
              key={String(side.positive)}
              side={side}
              locale={locale}
              unit={unit}
            />
          ))}
        </div>
      </div>
    </details>
  );
}
