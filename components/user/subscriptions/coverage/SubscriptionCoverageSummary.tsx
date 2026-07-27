"use client";

import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  formatSubscriptionCoverageDate,
  formatSubscriptionCoverageDeadline,
  formatSubscriptionEth,
  getFundedDropsLabel,
  getSubscriptionCoverageActionLabel,
  getSubscriptionCoverageAnchor,
  getSubscriptionCoveragePresentation,
  getSubscriptionModeLabel,
  type SubscriptionCoverageTone,
} from "./subscriptionCoverage.helpers";

type StatusIcon = ComponentType<SVGProps<SVGSVGElement>>;

const TONE_CLASSES: Record<
  SubscriptionCoverageTone,
  {
    readonly icon: StatusIcon;
    readonly panel: string;
    readonly pill: string;
    readonly text: string;
  }
> = {
  neutral: {
    icon: InformationCircleIcon,
    panel: "tw-border-iron-700 tw-bg-iron-950",
    pill: "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-700",
    text: "tw-text-iron-300",
  },
  positive: {
    icon: CheckCircleIcon,
    panel: "tw-border-emerald-500/25 tw-bg-emerald-500/[0.06]",
    pill:
      "tw-bg-emerald-400/10 tw-text-emerald-300 tw-ring-emerald-400/25",
    text: "tw-text-emerald-300",
  },
  caution: {
    icon: ClockIcon,
    panel: "tw-border-amber-400/25 tw-bg-amber-400/[0.06]",
    pill: "tw-bg-amber-300/10 tw-text-amber-200 tw-ring-amber-300/25",
    text: "tw-text-amber-200",
  },
  danger: {
    icon: XCircleIcon,
    panel: "tw-border-red-400/30 tw-bg-red-400/[0.07]",
    pill: "tw-bg-red-300/10 tw-text-red-200 tw-ring-red-300/30",
    text: "tw-text-red-200",
  },
};

function getDescriptionKey(
  status: ApiSubscriptionCoverageStatus
): MessageKey {
  switch (status) {
    case ApiSubscriptionCoverageStatus.Covered:
      return "subscriptions.coverage.covered.description";
    case ApiSubscriptionCoverageStatus.EarlyWarning:
      return "subscriptions.coverage.earlyWarning.description";
    case ApiSubscriptionCoverageStatus.RunningLow:
      return "subscriptions.coverage.runningLow.description";
    case ApiSubscriptionCoverageStatus.ActionRequired:
      return "subscriptions.coverage.actionRequired.description";
    case ApiSubscriptionCoverageStatus.NotSetUp:
      return "subscriptions.coverage.notSetUp.description";
    case ApiSubscriptionCoverageStatus.NoCurrentEligibility:
      return "subscriptions.coverage.noEligibility.description";
    case ApiSubscriptionCoverageStatus.NoUpcomingSelections:
      return "subscriptions.coverage.noSelections.description";
    case ApiSubscriptionCoverageStatus.Unknown:
      return "subscriptions.coverage.unknown.description";
  }
}

function CoveragePoint({
  date,
  label,
  tokenId,
}: Readonly<{
  date: Date | string;
  label: string;
  tokenId: number;
}>) {
  const locale = useBrowserLocale();

  return (
    <div className="tw-min-w-0">
      <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
        {label}
      </div>
      <div className="tw-mt-1 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-gap-y-0.5">
        <Link
          href={`/the-memes/${tokenId}`}
          className="tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-300"
        >
          {t(locale, "subscriptions.coverage.memeToken", {
            token: formatInteger(locale, tokenId),
          })}
        </Link>
        <span className="tw-text-sm tw-text-iron-500">
          · {formatSubscriptionCoverageDate(locale, date)}
        </span>
      </div>
    </div>
  );
}

function CoverageLoading() {
  const locale = useBrowserLocale();

  return (
    <div
      aria-busy="true"
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 sm:tw-p-6"
    >
      <output className="tw-sr-only">
        {t(locale, "subscriptions.coverage.loading")}
      </output>
      <div className="tw-animate-pulse tw-space-y-4">
        <div className="tw-h-5 tw-w-40 tw-rounded tw-bg-iron-800" />
        <div className="tw-h-8 tw-w-64 tw-max-w-full tw-rounded tw-bg-iron-800" />
        <div className="tw-h-4 tw-w-full tw-max-w-2xl tw-rounded tw-bg-iron-900" />
        <div className="tw-h-14 tw-w-full tw-rounded-xl tw-bg-iron-900" />
      </div>
    </div>
  );
}

function CoverageUnavailable({
  isOwner,
  onRefresh,
}: Readonly<{
  isOwner: boolean;
  onRefresh: () => void;
}>) {
  const locale = useBrowserLocale();

  return (
    <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-5 sm:tw-p-6">
      <div className="tw-flex tw-items-start tw-gap-3">
        <InformationCircleIcon
          className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
          aria-hidden="true"
        />
        <div className="tw-min-w-0 tw-flex-1">
          <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
            {t(locale, "subscriptions.coverage.status.unknown")}
          </h3>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "subscriptions.coverage.unavailable")}
          </p>
        </div>
        {isOwner ? (
          <button
            type="button"
            onClick={onRefresh}
            className="tw-inline-flex tw-min-h-10 tw-flex-none tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-border-iron-500"
          >
            <ArrowPathIcon className="tw-size-4" aria-hidden="true" />
            {t(locale, "subscriptions.coverage.refresh")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function SubscriptionCoverageSummary({
  coverage,
  isError,
  isLoading,
  isOwner,
  onRefresh,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isError: boolean;
  isLoading: boolean;
  isOwner: boolean;
  onRefresh: () => void;
}>) {
  const locale = useBrowserLocale();

  if (isLoading && !coverage) {
    return <CoverageLoading />;
  }

  if (!coverage) {
    return <CoverageUnavailable isOwner={isOwner} onRefresh={onRefresh} />;
  }

  const presentation = getSubscriptionCoveragePresentation(
    locale,
    coverage.status
  );
  const tone = TONE_CLASSES[presentation.tone];
  const StatusIcon = tone.icon;
  const runwayStatuses: readonly ApiSubscriptionCoverageStatus[] = [
    ApiSubscriptionCoverageStatus.Covered,
    ApiSubscriptionCoverageStatus.EarlyWarning,
    ApiSubscriptionCoverageStatus.RunningLow,
    ApiSubscriptionCoverageStatus.ActionRequired,
  ];
  const showFundedCount = runwayStatuses.includes(coverage.status);
  const headline = showFundedCount
    ? getFundedDropsLabel(locale, coverage.fully_funded_drops)
    : presentation.label;
  const actionLabel = getSubscriptionCoverageActionLabel(
    locale,
    presentation.action
  );
  const actionHref = getSubscriptionCoverageAnchor(presentation.action);
  const isUrgentTopUp =
    coverage.status === ApiSubscriptionCoverageStatus.RunningLow ||
    coverage.status === ApiSubscriptionCoverageStatus.ActionRequired;
  const editionsLabel = coverage.subscribe_all_editions
    ? t(locale, "subscriptions.coverage.editions.all")
    : t(locale, "subscriptions.coverage.editions.one");

  return (
    <div
      className={clsx(
        "tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-p-5 tw-shadow-xl tw-shadow-black/20 sm:tw-p-6",
        tone.panel
      )}
    >
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/20 tw-to-transparent"
      />
      <div className="tw-relative tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_minmax(250px,0.42fr)]">
        <div className="tw-min-w-0">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
              {t(locale, "subscriptions.coverage.title")}
            </span>
            <span
              className={clsx(
                "tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-ring-1 tw-ring-inset",
                tone.pill
              )}
            >
              <StatusIcon className="tw-size-4" aria-hidden="true" />
              {presentation.label}
            </span>
          </div>

          <h3
            className={clsx(
              "tw-mb-0 tw-mt-4 tw-text-2xl tw-font-semibold tw-tracking-tight sm:tw-text-3xl",
              showFundedCount ? tone.text : "tw-text-iron-100"
            )}
          >
            {headline}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400 sm:tw-text-base">
            {t(locale, getDescriptionKey(coverage.status))}
          </p>
          {isError ? (
            <div
              role="status"
              className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-text-amber-200"
            >
              <span>{t(locale, "subscriptions.coverage.stale")}</span>
              {isOwner ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-font-semibold tw-text-amber-100 tw-underline tw-underline-offset-2 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {t(locale, "subscriptions.coverage.refresh")}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-100">
              {getSubscriptionModeLabel(locale, coverage.mode)}
            </span>
            <span aria-hidden="true" className="tw-text-iron-700">
              ·
            </span>
            <span className="tw-font-semibold tw-text-iron-100">
              {formatSubscriptionEth(locale, coverage.balance_eth)} ETH
            </span>
            <span aria-hidden="true" className="tw-text-iron-700">
              ·
            </span>
            <span className="tw-text-iron-400">
              {coverage.eligibility_count === null
                ? t(locale, "subscriptions.coverage.eligibilityUnknown")
                : t(locale, "subscriptions.coverage.eligibility", {
                    count: formatInteger(locale, coverage.eligibility_count),
                  })}
            </span>
            <span aria-hidden="true" className="tw-text-iron-700">
              ·
            </span>
            <span className="tw-text-iron-400">{editionsLabel}</span>
          </div>

          {coverage.next_unfunded?.top_up_deadline ? (
            <div className="tw-mt-4 tw-flex tw-items-start tw-gap-2 tw-rounded-xl tw-bg-black/20 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-text-iron-300 tw-ring-1 tw-ring-white/[0.06]">
              <ExclamationTriangleIcon
                className={clsx("tw-mt-0.5 tw-size-4 tw-flex-none", tone.text)}
                aria-hidden="true"
              />
              <span>
                {t(locale, "subscriptions.coverage.topUpBy", {
                  deadline: formatSubscriptionCoverageDeadline(
                    locale,
                    coverage.next_unfunded.top_up_deadline
                  ),
                  token: formatInteger(
                    locale,
                    coverage.next_unfunded.token_id
                  ),
                })}
              </span>
            </div>
          ) : coverage.next_unfunded ? (
            <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-500">
              {t(locale, "subscriptions.coverage.noDeadline")}
            </p>
          ) : null}

          {coverage.recommended_top_up ? (
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-5 tw-text-iron-300">
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
          ) : null}

          {isOwner ? (
            <div className="tw-mt-5">
              <Link
                href={actionHref}
                className={clsx(
                  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-no-underline tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black",
                  isUrgentTopUp
                    ? "tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-400"
                    : "tw-bg-iron-100 tw-text-iron-950 desktop-hover:hover:tw-bg-white"
                )}
              >
                {actionLabel}
                <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="tw-grid tw-content-start tw-gap-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-5 lg:tw-border-l lg:tw-border-t-0 lg:tw-pl-6 lg:tw-pt-0">
          {coverage.funded_through ? (
            <CoveragePoint
              label={t(locale, "subscriptions.coverage.fundedThrough")}
              tokenId={coverage.funded_through.token_id}
              date={coverage.funded_through.mint_at}
            />
          ) : null}
          {coverage.next_unfunded ? (
            <CoveragePoint
              label={t(locale, "subscriptions.coverage.nextUnfunded")}
              tokenId={coverage.next_unfunded.token_id}
              date={coverage.next_unfunded.mint_at}
            />
          ) : null}
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <div className="tw-rounded-xl tw-bg-black/20 tw-p-3 tw-ring-1 tw-ring-white/[0.05]">
              <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-600">
                {t(locale, "subscriptions.coverage.capacity")}
              </div>
              <div className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-iron-200">
                {coverage.mint_capacity === null
                  ? "—"
                  : formatInteger(locale, coverage.mint_capacity)}
              </div>
              <div className="tw-text-xs tw-text-iron-500">
                {t(locale, "subscriptions.coverage.capacityUnit")}
              </div>
            </div>
            <div className="tw-rounded-xl tw-bg-black/20 tw-p-3 tw-ring-1 tw-ring-white/[0.05]">
              <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-600">
                {t(locale, "subscriptions.coverage.allocated")}
              </div>
              <div className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-iron-200">
                {formatInteger(locale, coverage.allocated_mints)}
              </div>
              <div className="tw-text-xs tw-text-iron-500">
                {t(locale, "subscriptions.coverage.allocatedUnit")}
              </div>
            </div>
          </div>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-600">
            {t(locale, "subscriptions.coverage.basis")}
          </p>
        </div>
      </div>
    </div>
  );
}
