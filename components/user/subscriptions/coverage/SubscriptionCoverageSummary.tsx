"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import {
  formatSubscriptionCoverageDate,
  formatSubscriptionCoverageDeadline,
  formatSubscriptionEth,
  getFundedDropsLabel,
  getSubscriptionCoverageActionLabel,
  getSubscriptionCoverageAnchor,
  getSubscriptionCoveragePresentation,
} from "./subscriptionCoverage.helpers";

const FUNDED_COUNT_STATUSES: readonly Status[] = [
  Status.Covered,
  Status.EarlyWarning,
  Status.RunningLow,
  Status.ActionRequired,
];
const BADGE_CLASS = {
  neutral: "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-700",
  positive: "tw-bg-emerald-400/10 tw-text-emerald-300 tw-ring-emerald-400/25",
  caution: "tw-bg-amber-300/10 tw-text-amber-200 tw-ring-amber-300/25",
  danger: "tw-bg-red-300/10 tw-text-red-200 tw-ring-red-300/30",
};

function getDescriptionKey(status: Status): MessageKey {
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
  separator = ", ",
}: Readonly<{
  point: { token_id: number; mint_at: Date };
  separator?: string;
}>) {
  const locale = useBrowserLocale();
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
      {separator}
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
  children,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isError: boolean;
  isLoading: boolean;
  isOwner: boolean;
  onRefresh: () => void;
  details?: SubscriptionDetails | undefined;
  children?: ReactNode;
}>) {
  const locale = useBrowserLocale();
  const [expanded, setExpanded] = useState(false);
  const status = coverage?.status ?? Status.Unknown;
  const presentation = getSubscriptionCoveragePresentation(locale, status);
  const description = t(locale, getDescriptionKey(status));
  const fundedThrough = coverage?.funded_through;
  const showFundedCount = !!coverage && FUNDED_COUNT_STATUSES.includes(status);
  const headline = showFundedCount
    ? getFundedDropsLabel(locale, coverage.fully_funded_drops)
    : presentation.label;
  const showStatusBadge = showFundedCount;
  const StatusIcon =
    status === Status.Covered ? CheckCircleIcon : InformationCircleIcon;
  const deadline = coverage?.next_unfunded?.top_up_deadline;
  const deadlineText =
    deadline && coverage?.next_unfunded
      ? t(locale, "subscriptions.coverage.topUpBy", {
          deadline: formatSubscriptionCoverageDeadline(locale, deadline),
          token: formatInteger(locale, coverage.next_unfunded.token_id),
        })
      : null;
  const deadlineInSummary =
    isOwner &&
    status === Status.ActionRequired &&
    !fundedThrough &&
    !!deadlineText;
  return (
    <>
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
        <span
          aria-hidden="true"
          className={`tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full max-sm:tw-hidden ${status === Status.Covered ? "tw-bg-emerald-400/10 tw-text-emerald-300" : "tw-bg-iron-900 tw-text-iron-400"}`}
        >
          <StatusIcon className="tw-size-5" />
        </span>
        <div className="tw-min-w-0 tw-flex-1 tw-basis-64">
          <h2
            id="profile-subscriptions-overview-title"
            tabIndex={-1}
            className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {isLoading && !coverage
              ? t(locale, "subscriptions.coverage.loading")
              : headline}
            {showStatusBadge && (
              <span
                className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-leading-4 tw-tracking-normal tw-ring-1 tw-ring-inset ${BADGE_CLASS[presentation.tone]}`}
              >
                {presentation.label}
              </span>
            )}
          </h2>
          <p
            aria-busy={isLoading}
            className="tw-mb-0 tw-mt-2 tw-max-w-[96ch] tw-text-balance tw-text-sm tw-leading-6 tw-text-iron-400"
          >
            {isLoading && !coverage ? (
              <span
                aria-hidden="true"
                className="tw-block tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none"
              />
            ) : fundedThrough ? (
              <>
                {t(locale, "subscriptions.coverage.fundedThrough")}{" "}
                <CoveragePoint point={fundedThrough} separator=" · " />
              </>
            ) : coverage ? (
              description
            ) : (
              t(locale, "subscriptions.coverage.unavailable")
            )}
          </p>
          {deadlineInSummary && (
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
              {deadlineText}
            </p>
          )}
          {isOwner && (
            <a
              href="#profile-subscriptions-upcoming"
              className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100"
            >
              {t(locale, "subscriptions.coverage.action.chooseDrops")}
              <ArrowDownIcon aria-hidden="true" className="tw-size-4" />
            </a>
          )}
        </div>

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="subscription-coverage-details"
          onClick={() => setExpanded(!expanded)}
          className="tw-ml-auto tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 max-md:tw-mt-2 max-md:tw-w-full max-md:tw-justify-between max-md:tw-rounded-none max-md:tw-border-t max-md:tw-border-solid max-md:tw-border-white/[0.06] max-md:tw-pt-4 max-md:tw-text-left"
        >
          {t(locale, "subscriptions.details.title")}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-3 max-md:tw-size-4 ${expanded ? "tw-rotate-180" : ""}`}
          />
        </button>
      </div>
      {isError && coverage && (
        <p
          role="status"
          className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-5 tw-text-amber-300"
        >
          {t(locale, "subscriptions.coverage.stale")}
        </p>
      )}

      <div
        id="subscription-coverage-details"
        hidden={!expanded}
        className="-tw-mx-4 tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-pt-5 md:-tw-mx-5 md:tw-px-5"
      >
        <SubscriptionCoverageDetails
          coverage={coverage}
          details={details}
          isOwner={isOwner}
          onRefresh={onRefresh}
          description={fundedThrough ? description : undefined}
          deadlineText={deadlineText}
          showDeadline={!deadlineInSummary}
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
  showDeadline,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  details: SubscriptionDetails | undefined;
  isOwner: boolean;
  onRefresh: () => void;
  description: string | undefined;
  deadlineText: string | null;
  showDeadline: boolean;
}>) {
  const locale = useBrowserLocale();
  const presentation = getSubscriptionCoveragePresentation(
    locale,
    coverage?.status ?? Status.Unknown
  );
  const legacyBalance = details?.balance;
  const mintCapacity =
    coverage === undefined &&
    legacyBalance !== undefined &&
    Number.isFinite(legacyBalance)
      ? Math.floor(legacyBalance / MEMES_MINT_PRICE)
      : coverage?.mint_capacity;
  const fields: [string, ReactNode][] = [];
  if (coverage?.next_unfunded) {
    fields.push([
      t(locale, "subscriptions.coverage.nextUnfunded"),
      <CoveragePoint key="unfunded" point={coverage.next_unfunded} />,
    ]);
  }
  fields.push(
    [
      t(locale, "subscriptions.coverage.capacity"),
      mintCapacity == null
        ? t(locale, "subscriptions.balance.mintCapacity.unknown")
        : `${formatInteger(locale, mintCapacity)} ${t(locale, "subscriptions.coverage.capacityUnit")}`,
    ],
    [
      t(locale, "subscriptions.coverage.allocated"),
      coverage
        ? `${formatInteger(locale, coverage.allocated_mints)} ${t(locale, "subscriptions.coverage.allocatedUnit")}`
        : t(locale, "subscriptions.details.unavailable"),
    ]
  );
  return (
    <>
      <h3 className="tw-m-0 tw-text-sm tw-font-normal tw-text-iron-400">
        {t(locale, "subscriptions.coverage.title")}
      </h3>
      {description && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {description}
        </p>
      )}
      <dl className="tw-mb-5 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-x-6 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] md:tw-grid-cols-2 md:tw-gap-y-5 md:tw-divide-y-0">
        {fields.map(([label, value]) => (
          <div key={label} className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-4 tw-py-3 tw-text-sm tw-leading-6 md:tw-block md:tw-py-0">
            <dt className="tw-min-w-0 tw-text-iron-400">{label}</dt>
            <dd className="tw-m-0 tw-min-w-0 tw-max-w-[65%] tw-text-right tw-text-[15px] tw-tabular-nums tw-text-iron-100 md:tw-mt-1 md:tw-max-w-none md:tw-text-left">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {coverage?.next_unfunded && showDeadline && (
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
      {isOwner && coverage && presentation.action !== "choose_drops" && (
        <Link
          href={getSubscriptionCoverageAnchor(presentation.action)}
          className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-100 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {getSubscriptionCoverageActionLabel(locale, presentation.action)}
        </Link>
      )}
      <div className="tw-mt-1.5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-1 tw-text-[13px] tw-leading-5 tw-text-iron-500">
        {coverage && <span>{t(locale, "subscriptions.coverage.basis")}</span>}
        {isOwner && (
          <button
            type="button"
            onClick={onRefresh}
            className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-font-medium tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-min-h-6"
          >
            {t(locale, "subscriptions.coverage.refresh")}
          </button>
        )}
      </div>
    </>
  );
}
