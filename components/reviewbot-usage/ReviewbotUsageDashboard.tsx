import {
  formatDate as formatLocalizedDate,
  formatInteger as formatLocalizedInteger,
  formatNumber,
  formatPercent as formatLocalizedPercent,
} from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  ReviewbotUsageAnalysis,
  ReviewbotUsageGroup,
  ReviewbotUsageResult,
} from "@/services/reviewbot-usage-api";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

interface ReviewbotUsageDashboardProps {
  readonly result: ReviewbotUsageResult;
}

const USAGE_DATE_FORMAT = {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

const locale = DEFAULT_LOCALE;

const LOADING_METRIC_KEYS = [
  "review-runs",
  "unique-prs",
  "estimated-spend",
  "average-run",
  "average-pr",
  "tokens",
  "budget-skips",
] as const;

const LOADING_ANALYSIS_KEYS = [
  "skip-rate",
  "tokens-run",
  "tokens-pr",
  "top-repo",
  "top-provider",
  "top-review-type",
] as const;

const TABLE_HEADER_CELL_CLASS =
  "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400";

const TABLE_BODY_CELL_CLASS =
  "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-py-4 tw-text-sm";

export default function ReviewbotUsageDashboard({
  result,
}: ReviewbotUsageDashboardProps) {
  const summary = result.status === "ok" ? result.summary : null;
  const unavailableMessage = result.status === "ok" ? "" : result.message;

  return (
    <div className="tailwind-scope tw-mx-auto tw-w-full tw-min-w-0 tw-px-3 tw-pb-12 tw-pt-8 sm:tw-px-6 lg:tw-px-8 lg:tw-pt-10">
      <DashboardHeader />

      {summary ? (
        <>
          <span className="tw-sr-only" role="status">
            {t(locale, "reviewbotUsage.status.loaded", {
              dailyRows: formatInteger(summary.byDay.length),
              reviewRuns: formatInteger(summary.totals.reviewRuns),
            })}
          </span>
          <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
            <MetricCard
              icon={<ChartBarIcon aria-hidden="true" className="tw-size-5" />}
              label={t(locale, "reviewbotUsage.metrics.reviewRuns")}
              tone="tw-text-primary-300"
              value={formatInteger(summary.totals.reviewRuns)}
            />
            <MetricCard
              icon={
                <DocumentTextIcon aria-hidden="true" className="tw-size-5" />
              }
              label={t(locale, "reviewbotUsage.metrics.uniquePrs")}
              tone="tw-text-primary-300"
              value={formatInteger(summary.totals.uniquePrs)}
            />
            <MetricCard
              icon={
                <CurrencyDollarIcon aria-hidden="true" className="tw-size-5" />
              }
              label={t(locale, "reviewbotUsage.metrics.estimatedSpend")}
              tone="tw-text-success"
              value={formatCurrency(summary.totals.costUsd)}
            />
            <MetricCard
              icon={
                <CurrencyDollarIcon aria-hidden="true" className="tw-size-5" />
              }
              label={t(locale, "reviewbotUsage.metrics.averageRun")}
              tone="tw-text-success"
              value={formatCurrency(
                summary.totals.averageCostPerReviewRunUsd
              )}
            />
            <MetricCard
              icon={
                <CurrencyDollarIcon aria-hidden="true" className="tw-size-5" />
              }
              label={t(locale, "reviewbotUsage.metrics.averagePr")}
              tone="tw-text-success"
              value={formatCurrency(summary.totals.averageCostPerPrUsd)}
            />
            <MetricCard
              icon={<CpuChipIcon aria-hidden="true" className="tw-size-5" />}
              label={t(locale, "reviewbotUsage.metrics.tokens")}
              tone="tw-text-iron-100"
              value={formatInteger(summary.totals.totalTokens)}
            />
            <MetricCard
              icon={
                <ShieldCheckIcon aria-hidden="true" className="tw-size-5" />
              }
              label={t(locale, "reviewbotUsage.metrics.budgetSkips")}
              tone="tw-text-amber-300"
              value={formatInteger(summary.totals.budgetSkippedRuns)}
            />
          </div>

          <AnalysisHighlights analysis={summary.analysis} />
          <UsageSection
            groups={summary.byDay}
            id="reviewbot-daily-usage"
            keyHeader={t(locale, "reviewbotUsage.columns.day")}
            title={t(locale, "reviewbotUsage.sections.dailyUsage")}
          />
          <UsageSection
            groups={summary.byRepo}
            id="reviewbot-repositories"
            keyHeader={t(locale, "reviewbotUsage.columns.repository")}
            title={t(locale, "reviewbotUsage.sections.repositories")}
          />
          <UsageSection
            groups={summary.byProviderModel}
            id="reviewbot-providers-models"
            keyHeader={t(locale, "reviewbotUsage.columns.providerModel")}
            title={t(locale, "reviewbotUsage.sections.providersModels")}
          />
          <UsageSection
            groups={summary.byReviewKind}
            id="reviewbot-review-types"
            keyHeader={t(locale, "reviewbotUsage.columns.reviewType")}
            title={t(locale, "reviewbotUsage.sections.reviewTypes")}
          />
          <div className="tw-mt-6 tw-flex tw-w-fit tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-950 tw-px-3 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-800">
            <CalendarDaysIcon
              aria-hidden="true"
              className="tw-size-4 tw-flex-none tw-text-iron-500"
            />
            <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, "reviewbotUsage.window", {
                from: formatDate(summary.range.from),
                to: formatDate(summary.range.to),
              })}
            </p>
          </div>
        </>
      ) : (
        <UnavailableState message={unavailableMessage} />
      )}
    </div>
  );
}

export function ReviewbotUsageLoading() {
  return (
    <div
      aria-busy="true"
      className="tailwind-scope tw-mx-auto tw-w-full tw-min-w-0 tw-px-3 tw-pb-12 tw-pt-8 sm:tw-px-6 lg:tw-px-8 lg:tw-pt-10"
    >
      <span className="tw-sr-only" role="status">
        {t(locale, "reviewbotUsage.status.loading")}
      </span>
      <DashboardHeader />
      <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        {LOADING_METRIC_KEYS.map((key) => (
          <div
            className="tw-h-[8.75rem] tw-animate-pulse tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 motion-reduce:tw-animate-none"
            key={key}
          >
            <div className="tw-size-5 tw-rounded-md tw-bg-iron-800" />
            <div className="tw-mt-4 tw-h-3 tw-w-24 tw-rounded-full tw-bg-iron-800" />
            <div className="tw-mt-3 tw-h-7 tw-w-32 tw-rounded-lg tw-bg-iron-800" />
          </div>
        ))}
      </div>
      <div className="tw-mt-6 tw-animate-pulse tw-rounded-xl tw-bg-iron-950 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-iron-800 motion-reduce:tw-animate-none">
        <div className="tw-h-6 tw-w-40 tw-rounded-lg tw-bg-iron-800" />
        <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-5 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
          {LOADING_ANALYSIS_KEYS.map((key) => (
            <div key={key}>
              <div className="tw-h-3 tw-w-28 tw-rounded-full tw-bg-iron-800" />
              <div className="tw-mt-2 tw-h-5 tw-w-36 tw-rounded-md tw-bg-iron-800" />
            </div>
          ))}
        </div>
      </div>
      <div className="tw-mt-8 tw-h-64 tw-animate-pulse tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 motion-reduce:tw-animate-none" />
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-pb-8">
      <div className="tw-max-w-3xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
          {t(locale, "reviewbotUsage.header.eyebrow")}
        </p>
        <h1 className="tw-mb-0 tw-mt-[8px] tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          {t(locale, "reviewbotUsage.header.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-[13px] tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-text-base sm:tw-leading-7">
          {t(locale, "reviewbotUsage.header.description")}
        </p>
      </div>
    </header>
  );
}

function AnalysisHighlights({
  analysis,
}: {
  readonly analysis: ReviewbotUsageAnalysis;
}) {
  return (
    <section className="tw-mt-6 tw-rounded-xl tw-bg-iron-950 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-6">
      <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-xl">
        {t(locale, "reviewbotUsage.analysis.title")}
      </h2>
      <dl className="tw-mb-0 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-x-6 tw-gap-y-5 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        <MetricPair
          label={t(locale, "reviewbotUsage.analysis.budgetSkipRate")}
          value={formatPercent(analysis.budgetSkipRate)}
        />
        <MetricPair
          label={t(locale, "reviewbotUsage.analysis.averageTokensRun")}
          value={formatInteger(analysis.averageTokensPerReviewRun)}
        />
        <MetricPair
          label={t(locale, "reviewbotUsage.analysis.averageTokensPr")}
          value={formatInteger(analysis.averageTokensPerPr)}
        />
        <MetricPair
          label={t(locale, "reviewbotUsage.analysis.topRepo")}
          value={formatTopCost(analysis.topCostRepo)}
        />
        <MetricPair
          label={t(locale, "reviewbotUsage.analysis.topProvider")}
          value={formatTopCost(analysis.topCostProviderModel)}
        />
        <MetricPair
          label={t(locale, "reviewbotUsage.analysis.topReviewType")}
          value={formatTopCost(analysis.topCostReviewKind)}
        />
      </dl>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  tone,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly tone: string;
  readonly value: string;
}) {
  return (
    <div className="tw-min-w-0 tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-text-left tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5">
      <div className={`tw-inline-flex ${tone}`}>
        {icon}
      </div>
      <dl className="tw-mb-0 tw-mt-3 tw-text-left">
        <dt className="tw-text-left tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-500">
          {label}
        </dt>
        <dd className="tw-mb-0 tw-ml-0 tw-mt-2 tw-break-words tw-text-left tw-text-2xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-iron-50 tw-tabular-nums">
          {value}
        </dd>
      </dl>
    </div>
  );
}

function UsageSection({
  groups,
  id,
  keyHeader,
  title,
}: {
  readonly groups: readonly ReviewbotUsageGroup[];
  readonly id: string;
  readonly keyHeader: string;
  readonly title: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="tw-mt-8 tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800"
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-4 sm:tw-px-5">
        <h2
          className="tw-m-0 tw-min-w-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-xl"
          id={id}
        >
          {title}
        </h2>
        <span className="tw-whitespace-nowrap tw-rounded-full tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-800">
          {t(locale, "reviewbotUsage.table.rows", {
            count: groups.length,
          })}
        </span>
      </div>
      {groups.length > 0 ? (
        <>
          <div className="tw-space-y-2 tw-bg-iron-900/40 tw-p-3 sm:tw-hidden">
            {groups.map((group) => (
              <article
                className="tw-rounded-lg tw-bg-iron-900/70 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800"
                key={group.key}
              >
                <h3 className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
                  {group.key}
                </h3>
                <dl className="tw-mb-0 tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-4">
                  <MetricPair
                    label={t(locale, "reviewbotUsage.columns.runs")}
                    value={formatInteger(group.reviewRuns)}
                  />
                  <MetricPair
                    label={t(locale, "reviewbotUsage.columns.spend")}
                    value={formatCurrency(group.costUsd)}
                  />
                  <MetricPair
                    label={t(locale, "reviewbotUsage.columns.average")}
                    value={formatCurrency(group.averageCostUsd)}
                  />
                  <MetricPair
                    label={t(locale, "reviewbotUsage.columns.tokens")}
                    value={formatInteger(group.totalTokens)}
                  />
                  <MetricPair
                    label={t(locale, "reviewbotUsage.columns.skips")}
                    value={formatInteger(group.budgetSkippedRuns)}
                  />
                </dl>
              </article>
            ))}
          </div>
          <div
            aria-label={t(locale, "reviewbotUsage.table.scrollableLabel", {
              title,
            })}
            className="tw-hidden tw-overflow-x-auto focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-iron-400 sm:tw-block"
            role="region"
            tabIndex={0}
          >
            <UsageTable
              groups={groups}
              keyHeader={keyHeader}
              title={title}
            />
          </div>
        </>
      ) : (
        <div className="tw-bg-iron-900/40 tw-px-4 tw-py-8 sm:tw-px-5">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "reviewbotUsage.table.empty")}
          </p>
        </div>
      )}
    </section>
  );
}

function MetricPair({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-left tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-mb-0 tw-ml-0 tw-mt-1 tw-break-words tw-text-left tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200 tw-tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function UsageTable({
  groups,
  keyHeader,
  title,
}: {
  readonly groups: readonly ReviewbotUsageGroup[];
  readonly keyHeader: string;
  readonly title: string;
}) {
  return (
    <table className="tw-min-w-[44rem] tw-w-full tw-border-collapse">
      <caption className="tw-sr-only">{title}</caption>
      <thead>
        <tr className="tw-bg-iron-900/70">
          <th
            className={`${TABLE_HEADER_CELL_CLASS} tw-px-5 tw-text-left`}
            scope="col"
          >
            {keyHeader}
          </th>
          <th
            className={`${TABLE_HEADER_CELL_CLASS} tw-px-4 tw-text-right`}
            scope="col"
          >
            {t(locale, "reviewbotUsage.columns.runs")}
          </th>
          <th
            className={`${TABLE_HEADER_CELL_CLASS} tw-px-4 tw-text-right`}
            scope="col"
          >
            {t(locale, "reviewbotUsage.columns.spend")}
          </th>
          <th
            className={`${TABLE_HEADER_CELL_CLASS} tw-px-4 tw-text-right`}
            scope="col"
          >
            {t(locale, "reviewbotUsage.columns.average")}
          </th>
          <th
            className={`${TABLE_HEADER_CELL_CLASS} tw-px-4 tw-text-right`}
            scope="col"
          >
            {t(locale, "reviewbotUsage.columns.tokens")}
          </th>
          <th
            className={`${TABLE_HEADER_CELL_CLASS} tw-px-5 tw-text-right`}
            scope="col"
          >
            {t(locale, "reviewbotUsage.columns.skips")}
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <tr
            className="tw-transition-colors desktop-hover:hover:tw-bg-iron-900/50"
            key={group.key}
          >
            <td
              className={`${TABLE_BODY_CELL_CLASS} tw-break-words tw-px-5 tw-font-medium tw-leading-5 tw-text-iron-100`}
            >
              {group.key}
            </td>
            <td
              className={`${TABLE_BODY_CELL_CLASS} tw-px-4 tw-text-right tw-text-iron-300 tw-tabular-nums`}
            >
              {formatInteger(group.reviewRuns)}
            </td>
            <td
              className={`${TABLE_BODY_CELL_CLASS} tw-px-4 tw-text-right tw-text-iron-300 tw-tabular-nums`}
            >
              {formatCurrency(group.costUsd)}
            </td>
            <td
              className={`${TABLE_BODY_CELL_CLASS} tw-px-4 tw-text-right tw-text-iron-300 tw-tabular-nums`}
            >
              {formatCurrency(group.averageCostUsd)}
            </td>
            <td
              className={`${TABLE_BODY_CELL_CLASS} tw-px-4 tw-text-right tw-text-iron-300 tw-tabular-nums`}
            >
              {formatInteger(group.totalTokens)}
            </td>
            <td
              className={`${TABLE_BODY_CELL_CLASS} tw-px-5 tw-text-right tw-text-iron-300 tw-tabular-nums`}
            >
              {formatInteger(group.budgetSkippedRuns)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UnavailableState({ message }: { readonly message: string }) {
  return (
    <section
      aria-labelledby="reviewbot-usage-unavailable"
      className="tw-mt-6 tw-flex tw-items-start tw-gap-4 tw-rounded-xl tw-bg-iron-950 tw-p-5 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-6"
      role="alert"
    >
      <span className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-text-iron-300">
        <ExclamationTriangleIcon
          aria-hidden="true"
          className="tw-size-5"
        />
      </span>
      <div className="tw-min-w-0">
        <h2
          className="tw-m-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-xl"
          id="reviewbot-usage-unavailable"
        >
          {t(locale, "reviewbotUsage.unavailable.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-300">
          {message}
        </p>
      </div>
    </section>
  );
}

function formatCurrency(value: number): string {
  return formatNumber(locale, value, {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  });
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return t(locale, "reviewbotUsage.values.unknown");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t(locale, "reviewbotUsage.values.unknown");
  }
  return formatLocalizedDate(locale, date, USAGE_DATE_FORMAT);
}

function formatInteger(value: number): string {
  return formatLocalizedInteger(locale, value);
}

function formatPercent(value: number): string {
  return formatLocalizedPercent(locale, value / 100);
}

function formatTopCost(group: ReviewbotUsageAnalysis["topCostRepo"]): string {
  if (!group) {
    return t(locale, "reviewbotUsage.values.none");
  }
  return t(locale, "reviewbotUsage.values.topCost", {
    cost: formatCurrency(group.costUsd),
    name: group.key,
    percent: formatPercent(group.costSharePercent),
  });
}
