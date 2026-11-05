"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import ButtonLink from "@/components/utils/button/ButtonLink";
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
  getFundedDropsLabel,
  getSubscriptionCoveragePresentation,
} from "./subscriptionCoverage.helpers";

const FUNDED_COUNT_STATUSES: readonly Status[] = [
  Status.Covered,
  Status.EarlyWarning,
  Status.RunningLow,
  Status.ActionRequired,
];
const STATUS_TEXT_CLASS = {
  neutral: "tw-text-iron-300",
  positive: "tw-text-emerald-400",
  caution: "tw-text-amber-200",
  danger: "tw-text-error",
};

function navigateToUpcomingDrops(event: { preventDefault(): void }) {
  event.preventDefault();
  // Keep native hash navigation so the existing section hook restores focus.
  globalThis.location.hash = "profile-subscriptions-upcoming";
}

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
        className="tw-whitespace-nowrap tw-text-iron-300 tw-no-underline tw-decoration-white/20 tw-underline-offset-[3px] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
      >
        {t(locale, "subscriptions.coverage.memeToken", {
          token: formatInteger(locale, point.token_id),
        })}
      </Link>
      <span
        className={stackDateOnMobile ? "tw-hidden sm:tw-inline" : undefined}
      >
        {separator}
      </span>
      <span
        className={`tw-whitespace-nowrap ${stackDateOnMobile ? "tw-block sm:tw-inline" : ""}`}
      >
        {formatSubscriptionCoverageDate(locale, point.mint_at)}
      </span>
    </>
  );
}

export default function SubscriptionCoverageSummary({
  coverage,
  isLoading,
  isOwner,
  upcomingTokenIds,
  action,
  topUpAction,
  children,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isLoading: boolean;
  isOwner: boolean;
  upcomingTokenIds?: readonly number[] | undefined;
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
  const showNextUnfunded =
    !!coverage?.next_unfunded &&
    !upcomingTokenIds?.includes(coverage.next_unfunded.token_id);
  const showFundedCount = !!coverage && FUNDED_COUNT_STATUSES.includes(status);
  const showDescription =
    !!fundedThrough ||
    (isOwner && (!showFundedCount || status === Status.Covered)) ||
    (isLoading && !coverage);
  const headline = showFundedCount
    ? getFundedDropsLabel(locale, coverage.fully_funded_drops)
    : presentation.label;
  const showStatusBadge = showFundedCount;
  const showChooseDrops = isOwner && presentation.action === "choose_drops";
  const pairActions = showChooseDrops && !!topUpAction;
  return (
    <>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-y-2">
        <div className="tw-min-w-0">
          <h2
            id="profile-subscriptions-overview-title"
            tabIndex={-1}
            className="tw-m-0 tw-flex tw-flex-col tw-items-start tw-gap-2.5 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-text-3xl"
          >
            <span className="tw-min-w-0">
              {isLoading && !coverage
                ? t(locale, "subscriptions.coverage.loading")
                : headline}
            </span>
            {showStatusBadge && (
              <span
                className={`-tw-order-1 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5 tw-tracking-normal ${STATUS_TEXT_CLASS[presentation.tone]}`}
              >
                <span
                  aria-hidden="true"
                  className="tw-size-[7px] tw-shrink-0 tw-rounded-full tw-bg-current"
                />
                {presentation.label}
              </span>
            )}
          </h2>
          {showDescription && (
            <p
              aria-busy={isLoading}
              className="tw-mb-0 tw-mt-1.5 tw-max-w-[96ch] tw-text-balance tw-text-sm tw-text-iron-500 md:tw-text-[15px]"
            >
              {isLoading && !coverage ? (
                <span
                  aria-hidden="true"
                  className="tw-block tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none"
                />
              ) : fundedThrough ? (
                <>
                  {t(locale, "subscriptions.coverage.fundedThrough")}{" "}
                  <CoveragePoint
                    point={fundedThrough}
                    separator=" · "
                    stackDateOnMobile
                  />
                </>
              ) : coverage ? (
                description
              ) : (
                t(locale, "subscriptions.coverage.unavailable")
              )}
            </p>
          )}
        </div>
        {showChooseDrops && !pairActions && (
          <ButtonLink
            href="#profile-subscriptions-upcoming"
            onNavigate={navigateToUpcomingDrops}
            variant="secondary"
            size={null}
            className="tw-min-h-11 tw-justify-self-start tw-px-4 tw-py-1.5 tw-text-[15px] sm:tw-min-h-9 md:tw-text-sm"
          >
            {t(locale, "subscriptions.coverage.action.chooseDrops")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
          </ButtonLink>
        )}
      </div>
      <div
        id="subscription-overview-actions"
        className="tw-mt-4 tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_max-content] tw-items-start tw-gap-x-4 tw-gap-y-0.5 max-[383px]:tw-grid-cols-1 sm:tw-mt-auto sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end sm:tw-gap-x-6 sm:tw-gap-y-2 sm:tw-pt-6"
      >
        {action}
        {showNextUnfunded && coverage?.next_unfunded && (
          <dl className="tw-col-span-full tw-m-0 tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-py-2.5 tw-text-sm tw-font-normal sm:tw-col-span-1 sm:tw-col-start-1 sm:tw-justify-start sm:tw-gap-2 sm:tw-py-0 md:tw-text-[15px]">
            <dt className="tw-shrink-0 tw-text-iron-500">
              {t(locale, "subscriptions.coverage.nextUnfunded")}
            </dt>
            <dd className="tw-m-0 tw-min-w-0 tw-text-right tw-font-medium tw-text-iron-100 sm:tw-text-left">
              <CoveragePoint point={coverage.next_unfunded} />
            </dd>
          </dl>
        )}
        <SubscriptionCoverageForecast
          coverage={coverage}
          description={
            isOwner && status === Status.Covered && fundedThrough
              ? description
              : undefined
          }
        />
        {topUpAction && (
          <div
            className={`tw-col-span-full tw-mt-3 tw-grid tw-w-full tw-shrink-0 tw-gap-2 sm:tw-w-auto sm:tw-self-end ${pairActions ? "tw-grid-cols-2 sm:tw-col-span-full sm:tw-flex sm:tw-justify-self-end" : `tw-grid-cols-1 sm:tw-col-span-1 sm:tw-col-start-2 ${showNextUnfunded ? "sm:tw-row-span-3" : "sm:tw-row-span-2"} sm:tw-row-start-1 sm:tw-mt-0`}`}
          >
            {topUpAction}
            {pairActions && (
              <ButtonLink
                href="#profile-subscriptions-upcoming"
                onNavigate={navigateToUpcomingDrops}
                variant="secondary"
                size={null}
                className="tw-min-h-11 tw-min-w-0 !tw-whitespace-normal tw-px-3 tw-py-1.5 tw-text-center tw-text-[15px] sm:tw-min-h-9 md:tw-text-sm"
              >
                {t(locale, "subscriptions.coverage.action.chooseDrops")}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="tw-hidden tw-size-4 sm:tw-block"
                />
              </ButtonLink>
            )}
          </div>
        )}
      </div>
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
    <div className="tw-col-start-2 tw-row-span-3 tw-row-start-1 tw-grid tw-min-w-0 tw-grid-rows-subgrid tw-items-start tw-gap-y-0.5 max-[383px]:tw-col-start-1 max-[383px]:tw-row-start-auto sm:tw-col-start-1 sm:tw-row-span-1 sm:tw-row-start-auto sm:tw-flex sm:tw-items-center sm:tw-gap-2">
      <div className="tw-flex tw-min-h-6 tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-min-h-11 md:tw-min-h-7 md:tw-text-[15px]">
        <span>
          {t(locale, "subscriptions.coverage.allocated")}
        </span>
        <button
          type="button"
          aria-label={t(locale, "subscriptions.coverage.allocated")}
          aria-describedby={tooltipId}
          data-tooltip-id={tooltipId}
          className="-tw-mx-3.5 -tw-my-2.5 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 sm:tw-my-0 md:-tw-mx-1.5 md:tw-size-7"
        >
          <InformationCircleIcon className="tw-size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="tw-m-0 tw-flex tw-min-h-7 tw-items-center tw-whitespace-nowrap tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-100 sm:tw-text-sm sm:tw-font-medium md:tw-text-[15px]">
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
        <div className="tw-max-w-[min(18rem,calc(100vw-2rem))] tw-text-pretty tw-text-meta tw-font-normal">
          <p className="tw-mb-1 tw-mt-0 tw-font-normal">
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
