"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import {
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import {
  formatSubscriptionCoverageDate,
  formatSubscriptionCoverageDeadline,
  formatSubscriptionEth,
  getFundedDropsLabel,
  getSubscriptionCoveragePresentation,
  getSubscriptionModeLabel,
} from "./subscriptionCoverage.helpers";

const EMPTY_SUBSCRIPTIONS: NFTSubscription[] = [];
const DOT_CLASS = {
  neutral: "tw-bg-iron-400",
  positive: "tw-bg-emerald-400",
  caution: "tw-bg-amber-400",
  danger: "tw-bg-red-400",
};
const BUTTON_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 max-md:tw-flex-1";

function getDescriptionKey(status: Status, isOwner: boolean): MessageKey {
  if (!isOwner) {
    if (status === Status.NotSetUp)
      return "subscriptions.answer.notSetUpVisitor";
    if (status === Status.Unknown)
      return "subscriptions.answer.unavailableVisitor";
    if (status === Status.Covered) return "subscriptions.answer.coveredVisitor";
    if (status === Status.EarlyWarning)
      return "subscriptions.answer.planVisitor";
    if (status === Status.NoUpcomingSelections)
      return "subscriptions.answer.noSelectionsVisitor";
  }
  switch (status) {
    case Status.Covered:
      return "subscriptions.coverage.covered.description";
    case Status.EarlyWarning:
      return "subscriptions.coverage.earlyWarning.description";
    case Status.RunningLow:
      return "subscriptions.coverage.runningLow.description";
    case Status.ActionRequired:
      return "subscriptions.coverage.actionRequired.description";
    case Status.NotSetUp:
      return "subscriptions.coverage.notSetUp.description";
    case Status.NoCurrentEligibility:
      return "subscriptions.coverage.noEligibility.description";
    case Status.NoUpcomingSelections:
      return "subscriptions.coverage.noSelections.description";
    case Status.Unknown:
      return "subscriptions.coverage.unknown.description";
  }
}

function CoveragePoint({
  point,
}: Readonly<{
  point: { token_id: number; mint_at: Date } | null | undefined;
}>) {
  const locale = useBrowserLocale();
  if (point === undefined)
    return <>{t(locale, "subscriptions.details.unavailable")}</>;
  if (!point) return <>{t(locale, "subscriptions.details.none")}</>;
  return (
    <>
      <Link
        href={`/the-memes/${point.token_id}`}
        className="tw-text-iron-100 tw-underline tw-underline-offset-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "subscriptions.coverage.memeToken", {
          token: formatInteger(locale, point.token_id),
        })}
      </Link>
      {", "}
      {formatSubscriptionCoverageDate(locale, point.mint_at)}
    </>
  );
}

export default function SubscriptionCoverageSummary({
  coverage,
  isError,
  isLoading,
  isOwner,
  onRefresh,
  details,
  subscriptions = EMPTY_SUBSCRIPTIONS,
  upcomingLoading = false,
  balance,
  topUpExpanded = false,
  onToggleTopUp,
  children,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isError: boolean;
  isLoading: boolean;
  isOwner: boolean;
  onRefresh: () => void;
  details?: SubscriptionDetails | undefined;
  subscriptions?: NFTSubscription[];
  upcomingLoading?: boolean;
  balance?: ReactNode;
  topUpExpanded?: boolean;
  onToggleTopUp?: () => void;
  children?: ReactNode;
}>) {
  const locale = useBrowserLocale();
  const [expanded, setExpanded] = useState(false);
  const [today] = useState(() => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
  });
  const status = coverage?.status ?? Status.Unknown;
  const presentation = getSubscriptionCoveragePresentation(locale, status);
  const description = t(locale, getDescriptionKey(status, isOwner));
  const fundedDate = coverage?.funded_through
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(coverage.funded_through.mint_at))
    : null;
  let headline = presentation.label;
  if (
    fundedDate &&
    (status === Status.Covered ||
      status === Status.EarlyWarning ||
      status === Status.RunningLow ||
      (status === Status.ActionRequired &&
        (coverage?.fully_funded_drops ?? 0) > 0))
  ) {
    headline = t(
      locale,
      status === Status.RunningLow
        ? "subscriptions.answer.runningLow"
        : "subscriptions.answer.covered",
      { date: fundedDate }
    );
  } else if (
    status === Status.ActionRequired &&
    coverage?.fully_funded_drops === 0
  ) {
    headline = t(
      locale,
      isOwner
        ? "subscriptions.answer.actionRequired"
        : "subscriptions.answer.actionRequiredVisitor"
    );
  }
  const emptyBalance =
    Number(coverage?.balance_eth ?? details?.balance ?? 0) === 0;
  const nextIndex = subscriptions.findIndex(
    (subscription) => !!subscription.subscribed
  );
  const next = subscriptions[nextIndex];
  const nextDate =
    next && !upcomingLoading
      ? getUpcomingMintsAcrossSeasons(subscriptions.length, today)[nextIndex]
          ?.utcDay
      : undefined;
  let nextLine = "";
  if (next && nextDate)
    nextLine = t(
      locale,
      (next.subscribed_count ?? 1) === 1
        ? "subscriptions.answer.next.one"
        : "subscriptions.answer.next.many",
      {
        token: formatInteger(locale, next.token_id),
        count: formatInteger(locale, next.subscribed_count ?? 1),
        date:
          nextIndex === 0 && isMintingToday()
            ? t(locale, "subscriptions.answer.today")
            : formatSubscriptionCoverageDate(locale, nextDate),
      }
    );
  let subtitle = description;
  if (status === Status.Covered && nextLine) subtitle = nextLine;
  if (status === Status.RunningLow)
    subtitle = isOwner
      ? `${t(locale, "subscriptions.answer.keepMinting")} ${nextLine}`
      : nextLine || description;
  if (status === Status.EarlyWarning)
    subtitle = isOwner ? t(locale, "subscriptions.answer.plan") : description;
  if (status === Status.NoUpcomingSelections && isOwner)
    subtitle = t(
      locale,
      emptyBalance
        ? "subscriptions.answer.topUpAndChoose"
        : "subscriptions.answer.choose"
    );
  const deadline = coverage?.next_unfunded?.top_up_deadline;
  const deadlineText =
    deadline && coverage?.next_unfunded
      ? t(locale, "subscriptions.coverage.topUpBy", {
          deadline: formatSubscriptionCoverageDeadline(locale, deadline),
          token: formatInteger(locale, coverage.next_unfunded.token_id),
        })
      : null;
  if (status === Status.ActionRequired && isOwner && coverage?.next_unfunded)
    subtitle =
      deadlineText ??
      t(locale, "subscriptions.answer.topUpFor", {
        token: formatInteger(locale, coverage.next_unfunded.token_id),
      });
  if (!coverage)
    subtitle = t(
      locale,
      isOwner
        ? "subscriptions.coverage.unavailable"
        : "subscriptions.answer.fetchUnavailableVisitor"
    );
  const urgent =
    emptyBalance ||
    [Status.RunningLow, Status.ActionRequired, Status.EarlyWarning].includes(
      status
    );

  return (
    <>
      <h2
        id="profile-subscriptions-overview-title"
        tabIndex={-1}
        className="tw-m-0 tw-flex tw-items-center tw-gap-3 tw-text-[22px] tw-font-semibold tw-leading-[30px] tw-tracking-tight tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-text-[26px] md:tw-leading-[34px]"
      >
        <span
          aria-hidden="true"
          className={`tw-size-2 tw-shrink-0 tw-rounded-full ${DOT_CLASS[presentation.tone]}`}
        />
        {isLoading && !coverage
          ? t(locale, "subscriptions.coverage.loading")
          : headline}
      </h2>
      <p
        aria-busy={isLoading}
        className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400 md:tw-pl-5 md:tw-text-[15px]"
      >
        {isLoading && !coverage ? (
          <span
            aria-hidden="true"
            className="tw-block tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none"
          />
        ) : (
          subtitle
        )}
      </p>
      {isError && coverage && (
        <p
          role="status"
          className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-5 tw-text-amber-300"
        >
          {t(locale, "subscriptions.coverage.stale")}
        </p>
      )}
      <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4">
        <div className="tw-flex-1 max-md:tw-w-full max-md:tw-flex-auto">
          {balance}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="subscription-coverage-details"
          onClick={() => setExpanded(!expanded)}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "subscriptions.details.title")}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-3 ${expanded ? "tw-rotate-180" : ""}`}
          />
        </button>
        {isOwner && status === Status.NoUpcomingSelections && !emptyBalance && (
          <Link
            href="#profile-subscriptions-upcoming"
            className={`${BUTTON_CLASS} tw-border-white tw-bg-white tw-text-iron-950`}
          >
            {t(locale, "subscriptions.coverage.action.chooseDrops")}
          </Link>
        )}
        {isOwner && !topUpExpanded && (
          <button
            id="subscription-top-up-opener"
            type="button"
            aria-expanded={topUpExpanded}
            aria-controls="profile-subscriptions-top-up"
            onClick={onToggleTopUp}
            className={`${BUTTON_CLASS} ${urgent ? "tw-border-white tw-bg-white tw-text-iron-950" : "tw-border-white/20 tw-bg-transparent tw-text-iron-100"}`}
          >
            {t(locale, "subscriptions.page.topUpTitle")}
          </button>
        )}
      </div>
      <div id="subscription-coverage-details" hidden={!expanded}>
        <SubscriptionCoverageDetails
          coverage={coverage}
          details={details}
          isOwner={isOwner}
          onRefresh={onRefresh}
          description={description}
          deadlineText={deadlineText}
        />
      </div>
      {children}
    </>
  );
}

function SubscriptionCoverageDetails({
  coverage,
  details,
  isOwner,
  onRefresh,
  description,
  deadlineText,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  details: SubscriptionDetails | undefined;
  isOwner: boolean;
  onRefresh: () => void;
  description: string;
  deadlineText: string | null;
}>) {
  const locale = useBrowserLocale();
  const presentation = getSubscriptionCoveragePresentation(
    locale,
    coverage?.status ?? Status.Unknown
  );
  const automatic =
    details?.automatic ??
    coverage?.mode === ApiSubscriptionCoverageMode.Automatic;
  let mode = t(locale, "subscriptions.details.unavailable");
  if (details)
    mode = t(
      locale,
      details.automatic
        ? "subscriptions.coverage.mode.automatic"
        : "subscriptions.coverage.mode.manual"
    );
  else if (coverage?.mode)
    mode = getSubscriptionModeLabel(locale, coverage.mode);
  let modeDescription: MessageKey = isOwner
    ? "subscriptions.mode.manualDescription"
    : "subscriptions.mode.manualVisitorDescription";
  if (automatic) modeDescription = "subscriptions.mode.automaticDescription";
  const allEditions =
    details?.subscribe_all_editions ?? coverage?.subscribe_all_editions;
  let editionLabel = t(locale, "subscriptions.details.unavailable");
  if (allEditions != null)
    editionLabel = t(
      locale,
      allEditions
        ? "subscriptions.coverage.editions.all"
        : "subscriptions.coverage.editions.one"
    );
  const modeSince = details?.last_update
    ? t(locale, "subscriptions.mode.since", {
        mode,
        date: formatSubscriptionCoverageDeadline(
          locale,
          new Date(details.last_update)
        ),
      })
    : mode;
  const fields: [string, ReactNode][] = [
    [t(locale, "subscriptions.details.status"), presentation.label],
    [
      t(locale, "subscriptions.details.drops"),
      coverage
        ? getFundedDropsLabel(locale, coverage.fully_funded_drops)
        : t(locale, "subscriptions.details.unavailable"),
    ],
    [
      t(locale, "subscriptions.coverage.fundedThrough"),
      <CoveragePoint key="funded" point={coverage?.funded_through} />,
    ],
    [
      t(locale, "subscriptions.coverage.nextUnfunded"),
      <CoveragePoint key="unfunded" point={coverage?.next_unfunded} />,
    ],
    [
      t(locale, "subscriptions.coverage.capacity"),
      coverage?.mint_capacity == null
        ? t(locale, "subscriptions.balance.mintCapacity.unknown")
        : `${formatInteger(locale, coverage.mint_capacity)} ${t(locale, "subscriptions.coverage.capacityUnit")}`,
    ],
    [
      t(locale, "subscriptions.coverage.allocated"),
      coverage
        ? `${formatInteger(locale, coverage.allocated_mints)} ${t(locale, "subscriptions.coverage.allocatedUnit")}`
        : t(locale, "subscriptions.details.unavailable"),
    ],
    [t(locale, "subscriptions.details.mode"), modeSince],
    [
      t(locale, "subscriptions.details.eligibility"),
      coverage?.eligibility_count == null
        ? t(locale, "subscriptions.coverage.eligibilityUnknown")
        : `×${formatInteger(locale, coverage.eligibility_count)}`,
    ],
    [t(locale, "subscriptions.settings.editions"), editionLabel],
  ];
  return (
    <>
      <dl className="tw-mb-0 tw-mt-4 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06]">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="tw-flex tw-justify-between tw-gap-4 tw-py-2.5 tw-text-sm"
          >
            <dt className="tw-text-iron-400">{label}</dt>
            <dd className="tw-m-0 tw-max-w-[65%] tw-text-right tw-tabular-nums tw-text-iron-100">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {description}
      </p>
      {(details || coverage?.mode) && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, modeDescription)}
        </p>
      )}
      {coverage?.next_unfunded && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {deadlineText ?? t(locale, "subscriptions.coverage.noDeadline")}
        </p>
      )}
      {coverage?.recommended_top_up && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "subscriptions.coverage.recommendedThrough", {
            amount: formatSubscriptionEth(
              locale,
              coverage.recommended_top_up.amount_eth
            ),
            count: formatInteger(
              locale,
              coverage.recommended_top_up.target_fully_funded_drops
            ),
            token: formatInteger(
              locale,
              coverage.recommended_top_up.projected_through.token_id
            ),
          })}
        </p>
      )}
      {!coverage && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
          {t(
            locale,
            isOwner
              ? "subscriptions.coverage.unavailable"
              : "subscriptions.answer.fetchUnavailableVisitor"
          )}
        </p>
      )}
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-leading-5 tw-text-iron-400">
        <span>{t(locale, "subscriptions.coverage.basis")}</span>
        {isOwner && (
          <button
            type="button"
            onClick={onRefresh}
            className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "subscriptions.coverage.refresh")}
          </button>
        )}
      </div>
    </>
  );
}
