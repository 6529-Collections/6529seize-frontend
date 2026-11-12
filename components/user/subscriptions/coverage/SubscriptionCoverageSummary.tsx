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
import { t, tRich, type MessageKey } from "@/i18n/messages";
import {
  formatSubscriptionCoverageDate,
  formatSubscriptionCoverageDeadline,
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
  const hash = "#profile-subscriptions-upcoming";
  if (globalThis.location.hash === hash) {
    // Reuse the section's scroll/focus handler on repeated clicks too.
    globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  // Keep native hash navigation so the existing section hook restores focus.
  globalThis.location.hash = hash;
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
}: Readonly<{
  point: { token_id: number; mint_at: Date };
  separator?: string;
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
      <span>{separator}</span>
      <span className="tw-whitespace-nowrap">
        {formatSubscriptionCoverageDate(locale, point.mint_at)}
      </span>
    </>
  );
}

export default function SubscriptionCoverageSummary({
  coverage,
  isLoading,
  isOwner,
  showFundingPrompt = true,
  action,
  topUpAction,
  children,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isLoading: boolean;
  isOwner: boolean;
  showFundingPrompt?: boolean;
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
  const pending = isLoading && !coverage;
  const showFundedCount = !!coverage && FUNDED_COUNT_STATUSES.includes(status);
  const fundedThrough =
    coverage && coverage.fully_funded_drops > 0
      ? coverage.funded_through
      : null;
  const warningState =
    status === Status.EarlyWarning ||
    status === Status.RunningLow ||
    status === Status.ActionRequired;
  const deadline =
    showFundingPrompt && isOwner && warningState
      ? coverage?.next_unfunded?.top_up_deadline
      : null;
  const showNextUnfunded = !!coverage?.next_unfunded && !deadline;
  const showChooseDrops =
    isOwner && presentation.action === "choose_drops" && !pending;
  const showActions = isOwner && !pending && (showChooseDrops || !!topUpAction);
  const neutralStatus =
    status === Status.EarlyWarning || (!isOwner && status !== Status.Covered);
  const statusTone = neutralStatus ? "neutral" : presentation.tone;
  const headline = showFundedCount
    ? getFundedDropsLabel(locale, coverage.fully_funded_drops)
    : presentation.label;

  return (
    <>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-gap-x-5">
        <div
          className={`tw-min-w-0 ${showChooseDrops ? "sm:tw-col-span-full" : ""}`}
        >
          {showFundedCount && (
            <span
              id="profile-subscriptions-overview-status"
              className={`tw-mb-2 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5 ${STATUS_TEXT_CLASS[statusTone]}`}
            >
              <span
                aria-hidden="true"
                className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-current"
              />
              {presentation.label}
            </span>
          )}
          <h2
            id="profile-subscriptions-overview-title"
            tabIndex={-1}
            aria-describedby={
              showFundedCount
                ? "profile-subscriptions-overview-status"
                : undefined
            }
            className={`tw-m-0 tw-font-semibold tw-tracking-tight focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${pending ? "tw-text-sm tw-font-normal tw-text-iron-400" : "tw-text-2xl tw-text-iron-100 sm:tw-text-[28px] sm:tw-leading-9"}`}
          >
            {pending ? t(locale, "subscriptions.coverage.loading") : headline}
          </h2>
          {fundedThrough && (
            <p className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "subscriptions.coverage.fundedThrough")}{" "}
              <CoveragePoint point={fundedThrough} separator=" · " />
            </p>
          )}
          {deadline && coverage?.next_unfunded && (
            <p className="tw-mb-0 tw-mt-3 tw-text-pretty tw-rounded-lg tw-bg-white/[0.04] tw-px-3 tw-py-2.5 tw-text-sm tw-leading-6 tw-text-iron-200">
              {tRich(locale, "subscriptions.coverage.topUpBy", {
                deadline: (
                  <span
                    key="deadline"
                    className="tw-font-medium tw-text-iron-100"
                  >
                    {formatSubscriptionCoverageDeadline(locale, deadline)}
                  </span>
                ),
                token: formatInteger(locale, coverage.next_unfunded.token_id),
              })}
            </p>
          )}
          {showFundingPrompt && !showFundedCount && !pending && (
            <p className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-400">
              {coverage
                ? description
                : t(locale, "subscriptions.coverage.unavailable")}
            </p>
          )}
        </div>
        {showActions && (
          <div
            className={`tw-grid tw-w-full tw-gap-2 sm:tw-w-auto sm:tw-self-end ${showChooseDrops ? "tw-grid-cols-2 sm:tw-col-start-1 sm:tw-flex sm:tw-justify-self-start" : "tw-grid-cols-1 sm:tw-col-start-2"}`}
          >
            {showChooseDrops && (
              <ButtonLink
                href="#profile-subscriptions-upcoming"
                onNavigate={navigateToUpcomingDrops}
                variant="primary"
                size={null}
                className="tw-min-h-11 tw-min-w-0 tw-px-3 tw-py-1.5 tw-text-sm sm:tw-min-h-9"
              >
                {t(locale, "subscriptions.coverage.action.chooseDrops")}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="tw-hidden tw-size-4 sm:tw-block"
                />
              </ButtonLink>
            )}
            {topUpAction}
          </div>
        )}
      </div>
      <div
        id="subscription-overview-actions"
        className="tw-mt-6 tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_max-content] tw-gap-x-4 tw-gap-y-0.5 tw-text-sm max-[383px]:tw-grid-cols-1 sm:tw-mt-auto sm:tw-flex sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-x-5 sm:tw-gap-y-3 sm:tw-pt-6"
      >
        {action}
        <SubscriptionCoverageForecast
          coverage={coverage}
          isLoading={pending}
          description={
            isOwner && status === Status.Covered ? description : undefined
          }
        />
        {showNextUnfunded && coverage?.next_unfunded && (
          <dl className="tw-col-span-full tw-m-0 tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-text-sm sm:tw-justify-start sm:tw-gap-2">
            <dt className="tw-shrink-0 tw-text-iron-500">
              {t(locale, "subscriptions.coverage.nextUnfunded")}
            </dt>
            <dd className="tw-m-0 tw-min-w-0 tw-text-right tw-font-medium tw-text-iron-100 sm:tw-text-left">
              <CoveragePoint point={coverage.next_unfunded} />
            </dd>
          </dl>
        )}
      </div>
      {children}
    </>
  );
}

function SubscriptionCoverageForecast({
  coverage,
  isLoading,
  description,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isLoading: boolean;
  description: string | undefined;
}>) {
  const locale = useBrowserLocale();
  const tooltipId = useId();
  return (
    <div
      className="tw-col-start-2 tw-row-span-3 tw-row-start-1 tw-grid tw-min-w-0 tw-grid-rows-subgrid tw-items-start tw-gap-y-0.5 tw-text-sm max-[383px]:tw-col-start-1 max-[383px]:tw-row-start-auto sm:tw-row-span-1 sm:tw-flex sm:tw-items-center sm:tw-justify-start sm:tw-gap-2"
      aria-busy={isLoading}
    >
      <div className="tw-flex tw-min-h-6 tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-text-iron-500">
        <span>{t(locale, "subscriptions.coverage.allocated")}</span>
        {!isLoading && (
          <button
            type="button"
            aria-label={t(locale, "subscriptions.coverage.allocated")}
            aria-describedby={tooltipId}
            data-tooltip-id={tooltipId}
            className="-tw-mx-3.5 -tw-my-2.5 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 sm:-tw-mx-1.5 sm:tw-size-7"
          >
            <InformationCircleIcon className="tw-size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="tw-m-0 tw-flex tw-min-h-7 tw-items-center tw-whitespace-nowrap tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-100 sm:tw-min-h-6 sm:tw-text-sm sm:tw-font-medium">
        {isLoading && (
          <span
            aria-hidden="true"
            className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none"
          />
        )}
        {!isLoading &&
          (coverage
            ? `${formatInteger(locale, coverage.allocated_mints)} ${t(locale, "subscriptions.coverage.allocatedUnit")}`
            : t(locale, "subscriptions.details.unavailable"))}
      </p>
      {!isLoading && (
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
      )}
    </div>
  );
}
