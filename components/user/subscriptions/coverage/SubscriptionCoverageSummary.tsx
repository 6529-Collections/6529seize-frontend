"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import Link from "next/link";
import {
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
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

function getDescriptionKey(status: Status, fundedDrops: number): MessageKey {
  switch (status) {
    case Status.Covered:
      return "subscriptions.coverage.covered.description";
    case Status.EarlyWarning:
      return "subscriptions.coverage.earlyWarning.description";
    case Status.RunningLow:
      return "subscriptions.coverage.runningLow.description";
    case Status.ActionRequired:
      if (fundedDrops === 1) {
        return "subscriptions.coverage.actionRequired.oneFundedDescription";
      }
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
  stackDateOnMobile = false,
}: Readonly<{
  point: { token_id: number; mint_at: Date };
  separator?: string;
  stackDateOnMobile?: boolean;
}>) {
  const locale = useBrowserLocale();
  return (
    <>
      <Link
        href={`/the-memes/${point.token_id}`}
        className="tw-whitespace-nowrap tw-text-iron-300 tw-underline tw-decoration-white/20 tw-underline-offset-[3px] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "subscriptions.coverage.memeToken", {
          token: formatInteger(locale, point.token_id),
        })}
      </Link>
      <span className={stackDateOnMobile ? "tw-hidden sm:tw-inline" : undefined}>
        {separator}
      </span>
      <span className={stackDateOnMobile ? "tw-block sm:tw-inline" : undefined}>
        {formatSubscriptionCoverageDate(locale, point.mint_at)}
      </span>
    </>
  );
}

export default function SubscriptionCoverageSummary({
  coverage,
  isError,
  isLoading,
  isOwner,
  prioritizeChooseDrops = false,
  onRefresh,
  action,
  topUpAction,
  children,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isError: boolean;
  isLoading: boolean;
  isOwner: boolean;
  prioritizeChooseDrops?: boolean;
  onRefresh: () => void;
  action?: ReactNode;
  topUpAction?: ReactNode;
  children?: ReactNode;
}>) {
  const locale = useBrowserLocale();
  const status = coverage?.status ?? Status.Unknown;
  const presentation = getSubscriptionCoveragePresentation(locale, status);
  const description = t(
    locale,
    getDescriptionKey(status, coverage?.fully_funded_drops ?? 0)
  );
  const fundedThrough = coverage?.funded_through;
  const showFundedCount = !!coverage && FUNDED_COUNT_STATUSES.includes(status);
  const headline = showFundedCount
    ? getFundedDropsLabel(locale, coverage.fully_funded_drops)
    : presentation.label;
  const showStatusBadge = showFundedCount;
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
  const showRefresh = isOwner && (isError || (!coverage && !isLoading));
  return (
    <>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-y-2">
        <div className="tw-min-w-0">
          <h2
            id="profile-subscriptions-overview-title"
            tabIndex={-1}
            className="tw-m-0 tw-flex tw-flex-col tw-items-start tw-gap-2.5 tw-text-2xl tw-font-semibold tw-leading-[30px] tw-tracking-tight tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-text-3xl md:tw-leading-9"
          >
            <span className="tw-min-w-0">
              {isLoading && !coverage
                ? t(locale, "subscriptions.coverage.loading")
                : headline}
            </span>
            {showStatusBadge && (
              <span
                className={`-tw-order-1 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5 tw-tracking-normal ${presentation.tone === "positive" ? "tw-text-emerald-400" : `tw-rounded-md tw-px-2.5 tw-py-1 ${BADGE_CLASS[presentation.tone]}`}`}
              >
                {presentation.tone === "positive" && (
                  <span aria-hidden="true" className="tw-size-[7px] tw-shrink-0 tw-rounded-full tw-bg-emerald-400" />
                )}
                {presentation.label}
              </span>
            )}
          </h2>
          <p
            aria-busy={isLoading}
            className="tw-mb-0 tw-mt-1.5 tw-max-w-[96ch] tw-text-balance tw-text-sm tw-leading-[21px] tw-text-iron-400 sm:tw-text-[15px] sm:tw-leading-[22px]"
          >
            {isLoading && !coverage ? (
              <span
                aria-hidden="true"
                className="tw-block tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none"
              />
            ) : fundedThrough ? (
              <>
                {t(locale, "subscriptions.coverage.fundedThrough")}{" "}
                <CoveragePoint point={fundedThrough} separator=" · " stackDateOnMobile />
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
        </div>
        {isOwner && !prioritizeChooseDrops && (
          <a
            href="#profile-subscriptions-upcoming"
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-justify-self-start tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100"
          >
            {t(locale, "subscriptions.coverage.action.chooseDrops")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
          </a>
        )}
        {((isError && coverage) || showRefresh) && (
          <div className="tw-col-span-full tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
            {isError && coverage && (
              <p
                role="status"
                className="tw-m-0 tw-text-sm tw-leading-5 tw-text-amber-300"
              >
                {t(locale, "subscriptions.coverage.stale")}
              </p>
            )}
            {showRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-font-medium tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100"
              >
                {t(locale, "subscriptions.coverage.refresh")}
              </button>
            )}
          </div>
        )}
      </div>
      <div
        id="subscription-overview-actions"
        className="tw-mt-4 tw-flex tw-min-w-0 tw-flex-col tw-items-stretch tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-1 sm:tw-mt-auto sm:tw-grid sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end sm:tw-gap-x-6 sm:tw-gap-y-1 sm:tw-border-t-0 sm:tw-pt-8"
      >
        {action}
        <SubscriptionCoverageForecast
          coverage={coverage}
          description={
            status === Status.Covered && fundedThrough ? description : undefined
          }
        />
        {isOwner && prioritizeChooseDrops && (
          <a
            href="#profile-subscriptions-upcoming"
            className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-400 desktop-hover:hover:tw-bg-white/5 sm:tw-col-start-2 sm:tw-row-span-2 sm:tw-row-start-1 sm:tw-mt-0 sm:tw-min-h-9 sm:tw-w-auto sm:tw-self-end"
          >
            {t(locale, "subscriptions.coverage.action.chooseDrops")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
          </a>
        )}
        {topUpAction && (
          <div className="tw-mt-3 tw-w-full tw-shrink-0 sm:tw-col-start-2 sm:tw-row-span-2 sm:tw-row-start-1 sm:tw-mt-0 sm:tw-w-auto sm:tw-self-end">
            {topUpAction}
          </div>
        )}
      </div>
      <SubscriptionCoverageDetails
        coverage={coverage}
        isOwner={isOwner}
        description={
          fundedThrough && status !== Status.Covered ? description : undefined
        }
        deadlineText={deadlineText}
        showDeadline={!deadlineInSummary}
      />
      {children}
    </>
  );
}

function SubscriptionCoverageForecast({
  coverage,
  description,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  description: string | undefined;
}>) {
  const locale = useBrowserLocale();
  const tooltipId = useId();
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/5 tw-py-2.5 sm:tw-col-start-1 sm:tw-justify-start sm:tw-gap-2 sm:tw-border-t-0 sm:tw-py-0">
      <div className="tw-flex tw-min-h-11 tw-items-center tw-gap-1 tw-text-sm tw-leading-[21px] tw-text-iron-400 sm:tw-text-[15px] sm:tw-leading-[22px] md:tw-min-h-7">
        <span className="tw-whitespace-nowrap">
          {t(locale, "subscriptions.coverage.allocated")}
        </span>
        <button
          type="button"
          aria-label={t(locale, "subscriptions.coverage.allocated")}
          aria-describedby={tooltipId}
          data-tooltip-id={tooltipId}
          className="-tw-mx-1.5 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 sm:tw-mx-0 md:tw-size-7"
        >
          <InformationCircleIcon className="tw-size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="tw-m-0 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-[21px] tw-tabular-nums tw-text-iron-100 sm:tw-text-[15px] sm:tw-leading-[22px]">
        {coverage
          ? `${formatInteger(locale, coverage.allocated_mints)} ${t(locale, "subscriptions.coverage.allocatedUnit")}`
          : t(locale, "subscriptions.details.unavailable")}
      </p>
      <BodyPortalTooltip
        id={tooltipId}
        place="top"
        offset={8}
        delayShow={250}
        opacity={1}
        openEvents={{ mouseover: true, focus: true, click: true }}
        globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
        style={TOOLTIP_STYLES}
      >
        <div className="tw-max-w-[min(18rem,calc(100vw-2rem))] tw-text-pretty tw-leading-5">
          <p className="tw-mb-1 tw-mt-0 tw-font-semibold">
            {t(locale, "subscriptions.coverage.title")}
          </p>
          {description && <p className="tw-mb-1 tw-mt-0">{description}</p>}
          {coverage && (
            <p className="tw-m-0">
              {t(locale, "subscriptions.coverage.basis")}
            </p>
          )}
          {!coverage && (
            <p className="tw-m-0">
              {t(locale, "subscriptions.coverage.unavailable")}
            </p>
          )}
        </div>
      </BodyPortalTooltip>
    </div>
  );
}

function SubscriptionCoverageDetails({
  coverage,
  isOwner,
  description,
  deadlineText,
  showDeadline,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isOwner: boolean;
  description: string | undefined;
  deadlineText: string | null;
  showDeadline: boolean;
}>) {
  const locale = useBrowserLocale();
  const presentation = getSubscriptionCoveragePresentation(
    locale,
    coverage?.status ?? Status.Unknown
  );
  const fields: [string, ReactNode][] = [];
  if (coverage?.next_unfunded) {
    fields.push([
      t(locale, "subscriptions.coverage.nextUnfunded"),
      <CoveragePoint key="unfunded" point={coverage.next_unfunded} />,
    ]);
  }
  const showAction =
    isOwner && !!coverage && presentation.action !== "choose_drops";
  const hasSupport =
    !!description ||
    fields.length > 0 ||
    !!coverage?.recommended_top_up ||
    showAction;
  return (
    <div
      id="subscription-coverage-details"
      className={hasSupport ? "tw-mt-5" : undefined}
    >
      {description && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {description}
        </p>
      )}
      {fields.length > 0 && (
        <dl className="tw-mb-5 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-x-6 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] md:tw-grid-cols-2 md:tw-gap-y-5 md:tw-divide-y-0">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-4 tw-py-3 tw-text-sm tw-leading-6 md:tw-block md:tw-py-0"
            >
              <dt className="tw-min-w-0 tw-text-iron-400">{label}</dt>
              <dd className="tw-m-0 tw-min-w-0 tw-max-w-[65%] tw-text-right tw-text-[15px] tw-tabular-nums tw-text-iron-100 md:tw-mt-1 md:tw-max-w-none md:tw-text-left">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
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
      {showAction && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1">
          <Link
            href={getSubscriptionCoverageAnchor(presentation.action)}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-100 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {getSubscriptionCoverageActionLabel(locale, presentation.action)}
          </Link>
        </div>
      )}
    </div>
  );
}
