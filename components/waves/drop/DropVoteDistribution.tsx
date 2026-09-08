"use client";

import type { ApiDropVoteDistribution } from "@/generated/models/ApiDropVoteDistribution";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import type { TooltipRefProps } from "react-tooltip";

interface VoteSide {
  readonly positive: boolean;
  readonly total: number;
  readonly remainder: number;
  readonly voters: readonly ApiDropVoter[];
}

const POSITIVE_PIECES = [
  "tw-bg-green",
  "tw-bg-green/80",
  "tw-bg-green/60",
] as const;
const NEGATIVE_PIECES = ["tw-bg-red", "tw-bg-red/80", "tw-bg-red/60"] as const;
const STRIPED_PIECE =
  "tw-bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,currentColor_5px,currentColor_6px)] tw-text-iron-950/10";

function isVoteEntry(entry: unknown): entry is ApiDropVoter {
  if (
    entry === null ||
    typeof entry !== "object" ||
    !("vote" in entry) ||
    !("voter" in entry)
  ) {
    return false;
  }
  const voter = entry.voter;
  return (
    typeof entry.vote === "number" &&
    Number.isSafeInteger(entry.vote) &&
    voter !== null &&
    typeof voter === "object" &&
    "id" in voter &&
    typeof voter.id === "string" &&
    voter.id.trim().length > 0
  );
}

function getVoteSide(
  total: number,
  voters: unknown,
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
  const entries: readonly unknown[] = voters;
  if (
    !entries.every(isVoteEntry) ||
    entries.some((entry) => entry.vote * direction <= 0)
  ) {
    return null;
  }
  const listedTotal = entries.reduce((sum, entry) => sum + entry.vote, 0);
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
    voters: [...entries].sort(
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
    [voter.handle, address, voter.id]
      .find((value) => typeof value === "string" && value.trim().length > 0)
      ?.trim() ?? voter.id
  );
}

function formatVote(locale: SupportedLocale, vote: number, compact = false) {
  return formatNumber(locale, vote, {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
    signDisplay: "always",
  });
}

function formatOtherVotes(
  side: VoteSide,
  locale: SupportedLocale,
  unit: string
) {
  return t(
    locale,
    side.positive
      ? "waves.voteInsights.otherPositiveVotes"
      : "waves.voteInsights.otherNegativeVotes",
    { vote: formatVote(locale, side.remainder), unit }
  );
}

function VoteRibbonSide({
  side,
  locale,
  tooltipId,
}: {
  readonly side: VoteSide;
  readonly locale: SupportedLocale;
  readonly tooltipId: string;
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
        <VoteRibbonPiece
          key={entry.voter.id}
          tooltipId={tooltipId}
          voteId={entry.voter.id}
          width={Math.abs(entry.vote / side.total) * 100}
          color={colors[index] ?? colors[0]}
        />
      ))}
      {side.remainder !== 0 && (
        <VoteRibbonPiece
          tooltipId={tooltipId}
          voteId={`others-${side.positive}`}
          width={Math.abs(side.remainder / side.total) * 100}
          color={`${STRIPED_PIECE} ${side.positive ? "tw-bg-green/90" : "tw-bg-red/90"}`}
          text={t(locale, "waves.voteInsights.others")}
        />
      )}
    </span>
  );
}

function VoteRibbonPiece({
  tooltipId,
  voteId,
  width,
  color,
  text,
}: {
  readonly tooltipId: string;
  readonly voteId: string;
  readonly width: number;
  readonly color: string;
  readonly text?: string;
}) {
  return (
    <span
      data-tooltip-id={tooltipId}
      data-vote-id={voteId}
      className="tw-group tw-block tw-h-4 tw-min-w-0 tw-shrink-0 tw-pr-0.5 last:tw-pr-0"
      style={{ width: `${width}%` }}
    >
      <span
        aria-hidden="true"
        className={`tw-block tw-h-4 tw-overflow-hidden tw-rounded-md tw-transition-transform tw-duration-150 desktop-hover:group-hover:-tw-translate-y-px motion-reduce:tw-transform-none motion-reduce:tw-transition-none ${color}`}
      >
        {text && (
          <span className="tw-block tw-truncate tw-px-1 tw-text-center tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-950">
            {text}
          </span>
        )}
      </span>
    </span>
  );
}

function LargestSideVote({
  side,
  locale,
  alignRight,
}: {
  readonly side: VoteSide;
  readonly locale: SupportedLocale;
  readonly alignRight: boolean;
}) {
  const largest = side.voters[0];
  if (!largest) {
    return null;
  }
  return (
    <span
      className={`tw-flex tw-min-w-0 tw-flex-1 tw-basis-0 tw-flex-col tw-gap-0.5 sm:tw-basis-48 ${alignRight ? "tw-text-right" : "tw-text-left"}`}
    >
      <span className="tw-sr-only tw-text-xs tw-text-iron-400 sm:tw-not-sr-only">
        {t(
          locale,
          side.positive
            ? "waves.voteInsights.largestPositive"
            : "waves.voteInsights.largestNegative"
        )}
      </span>
      <span
        className={`tw-flex tw-min-w-0 tw-items-baseline tw-gap-1.5 tw-text-xs sm:tw-gap-2 sm:tw-text-sm ${alignRight ? "tw-justify-end" : "tw-justify-start"}`}
      >
        <span className="tw-truncate tw-font-medium tw-text-iron-50">
          {getVoterName(largest)}
        </span>
        <span
          className={`tw-shrink-0 tw-whitespace-nowrap tw-font-medium tw-tabular-nums ${side.positive ? "tw-text-green" : "tw-text-red"}`}
        >
          {formatVote(locale, largest.vote, true)}
        </span>
      </span>
    </span>
  );
}

function VoteRibbonTooltip({
  id,
  content,
  hover = false,
  onOpenChange,
}: {
  readonly id: string;
  readonly content: string | ((anchor: HTMLElement | null) => string);
  readonly hover?: boolean;
  readonly onOpenChange?: (isOpen: boolean) => void;
}) {
  const tooltipRef = useRef<TooltipRefProps>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    // Dismiss the tooltip before an enclosing artwork modal handles Escape,
    // including when it was opened by hover while focus is elsewhere.
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        tooltipRef.current?.close();
      }
    };
    document.addEventListener("keydown", dismiss, true);
    return () => document.removeEventListener("keydown", dismiss, true);
  }, [isOpen]);

  if (typeof document === "undefined") {
    return null;
  }
  return createPortal(
    <Tooltip
      ref={tooltipRef}
      id={id}
      render={({ activeAnchor }) => (
        <span className="tw-block tw-max-h-[calc(50dvh-4rem)] tw-overflow-y-auto tw-overscroll-contain">
          {typeof content === "string" ? content : content(activeAnchor)}
        </span>
      )}
      setIsOpen={(open) => {
        setIsOpen(open);
        onOpenChange?.(open);
      }}
      place="top"
      positionStrategy="fixed"
      offset={8}
      opacity={1}
      clickable
      openEvents={hover ? { mouseenter: true } : { focus: true, click: true }}
      closeEvents={hover ? { mouseleave: true, click: true } : { blur: true }}
      globalCloseEvents={{ clickOutsideAnchor: true }}
      style={{ ...TOOLTIP_STYLES, pointerEvents: "auto" }}
      className="tailwind-scope tw-max-w-[calc(100vw-2rem)] tw-whitespace-pre-line tw-break-words tw-text-left motion-reduce:tw-transition-none"
    />,
    document.body
  );
}

function VoteRibbon({
  sides,
  locale,
  unit,
}: {
  readonly sides: readonly VoteSide[];
  readonly locale: SupportedLocale;
  readonly unit: string;
}) {
  const tooltipId = buildTooltipId("vote-ribbon", useId());
  const hoverTooltipId = buildTooltipId("vote-ribbon-segment", useId());
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const breakdown = sides
    .filter((side) => side.total !== 0)
    .flatMap((side) => [
      `${t(locale, side.positive ? "waves.voteInsights.positiveTotal" : "waves.voteInsights.negativeTotal")}: ${formatVote(locale, side.total)} ${unit}`,
      ...side.voters.map((entry) =>
        t(locale, "waves.voteInsights.voteByName", {
          name: getVoterName(entry),
          vote: formatVote(locale, entry.vote),
          unit,
        })
      ),
      ...(side.remainder === 0 ? [] : [formatOtherVotes(side, locale, unit)]),
    ])
    .join("\n");
  const getHoveredContent = (anchor: HTMLElement | null) => {
    const voteId = anchor?.dataset["voteId"];
    const voter = sides
      .flatMap((side) => side.voters)
      .find((entry) => entry.voter.id === voteId);
    if (voter) {
      return t(locale, "waves.voteInsights.voteByName", {
        name: getVoterName(voter),
        vote: formatVote(locale, voter.vote),
        unit,
      });
    }
    const remainder = sides.find(
      (side) => `others-${side.positive}` === voteId && side.remainder !== 0
    );
    return remainder ? formatOtherVotes(remainder, locale, unit) : "";
  };

  return (
    <>
      <button
        type="button"
        dir="ltr"
        aria-label={t(locale, "waves.voteInsights.viewBreakdown")}
        data-tooltip-id={tooltipId}
        className="-tw-my-2 tw-flex tw-min-h-8 tw-w-full tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {sides.some((side) => side.total < 0) && (
          <span
            aria-hidden="true"
            className="tw-text-base tw-leading-4 tw-text-red"
          >
            −
          </span>
        )}
        <span
          aria-hidden="true"
          className="tw-flex tw-h-4 tw-min-w-0 tw-flex-1 tw-gap-1"
        >
          {sides.map((side) => (
            <VoteRibbonSide
              key={String(side.positive)}
              side={side}
              locale={locale}
              tooltipId={hoverTooltipId}
            />
          ))}
        </span>
        {sides.some((side) => side.total > 0) && (
          <span
            aria-hidden="true"
            className="tw-text-base tw-leading-4 tw-text-green"
          >
            +
          </span>
        )}
      </button>
      {!isBreakdownOpen && (
        <VoteRibbonTooltip
          id={hoverTooltipId}
          content={getHoveredContent}
          hover
        />
      )}
      <VoteRibbonTooltip
        id={tooltipId}
        content={breakdown}
        onOpenChange={setIsBreakdownOpen}
      />
    </>
  );
}

function VoteSideDescription({
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
  return (
    <div>
      <p>
        {t(
          locale,
          side.positive
            ? "waves.voteInsights.positiveTotal"
            : "waves.voteInsights.negativeTotal"
        )}{" "}
        {formatVote(locale, side.total)} {unit}
      </p>
      <ul>
        {side.voters.map((entry) => (
          <li key={entry.voter.id}>
            {t(locale, "waves.voteInsights.voteByName", {
              name: getVoterName(entry),
              vote: formatVote(locale, entry.vote),
              unit,
            })}
          </li>
        ))}
        {side.remainder !== 0 && (
          <li>{formatOtherVotes(side, locale, unit)}</li>
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
  const hasBothVoteSides = sides.every((side) => side.voters.length > 0);

  return (
    <figure
      aria-labelledby={explanationId}
      className="tw-m-0 tw-w-full tw-px-4 tw-pb-4 tw-pt-2"
    >
      <VoteRibbon key={drop.id} sides={sides} locale={locale} unit={unit} />
      <span className="tw-mt-3 tw-block">
        <span className="tw-mb-1 tw-block tw-text-xs tw-text-iron-400 sm:tw-hidden">
          {t(locale, "waves.voteInsights.largestVotes")}
        </span>
        <span className="tw-flex tw-gap-x-3 tw-gap-y-2 sm:tw-flex-wrap sm:tw-gap-x-6">
          {sides.map((side) => (
            <LargestSideVote
              key={String(side.positive)}
              side={side}
              locale={locale}
              alignRight={side.positive && hasBothVoteSides}
            />
          ))}
        </span>
      </span>
      <figcaption className="tw-sr-only">
        <p id={explanationId}>{t(locale, "waves.voteInsights.currentVotes")}</p>
        <p>{t(locale, "waves.voteInsights.allocationExplanation")}</p>
        {sides.map((side) => (
          <VoteSideDescription
            key={String(side.positive)}
            side={side}
            locale={locale}
            unit={unit}
          />
        ))}
      </figcaption>
    </figure>
  );
}
