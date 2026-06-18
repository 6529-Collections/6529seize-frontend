import type {
  ReviewbotUsageAnalysis,
  ReviewbotUsageGroup,
  ReviewbotUsageResult,
} from "@/services/reviewbot-usage-api";
import {
  ChartBarIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

interface ReviewbotUsageDashboardProps {
  readonly result: ReviewbotUsageResult;
}

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export default function ReviewbotUsageDashboard({
  result,
}: ReviewbotUsageDashboardProps) {
  const summary = result.status === "ok" ? result.summary : null;
  const totals = summary?.totals ?? {
    budgetSkippedRuns: 0,
    costUsd: 0,
    averageCostPerPrUsd: 0,
    averageCostPerReviewRunUsd: 0,
    reviewRuns: 0,
    totalTokens: 0,
    uniquePrs: 0,
  };
  const unavailableMessage = result.status === "ok" ? "" : result.message;

  return (
    <div className="tw-container tw-mx-auto tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-max-w-5xl">
        <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
          Open Data
        </p>
        <h1 className="tw-mb-4">6529bot Usage</h1>
        <p className="tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          Public AI review activity across configured 6529 repositories.
        </p>
      </div>

      <div className="tw-mt-8 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        <MetricCard
          icon={<ChartBarIcon className="tw-h-6 tw-w-6" />}
          label="Review Runs"
          tone="tw-text-primary-300"
          value={formatInteger(totals.reviewRuns)}
        />
        <MetricCard
          icon={<DocumentTextIcon className="tw-h-6 tw-w-6" />}
          label="Unique PRs"
          tone="tw-text-primary-300"
          value={formatInteger(totals.uniquePrs)}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="tw-h-6 tw-w-6" />}
          label="Estimated Spend"
          tone="tw-text-success"
          value={formatCurrency(totals.costUsd)}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="tw-h-6 tw-w-6" />}
          label="Avg / Run"
          tone="tw-text-success"
          value={formatCurrency(totals.averageCostPerReviewRunUsd)}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="tw-h-6 tw-w-6" />}
          label="Avg / PR"
          tone="tw-text-success"
          value={formatCurrency(totals.averageCostPerPrUsd)}
        />
        <MetricCard
          icon={<CpuChipIcon className="tw-h-6 tw-w-6" />}
          label="Tokens"
          tone="tw-text-iron-100"
          value={formatInteger(totals.totalTokens)}
        />
        <MetricCard
          icon={<ShieldCheckIcon className="tw-h-6 tw-w-6" />}
          label="Budget Skips"
          tone="tw-text-amber-300"
          value={formatInteger(totals.budgetSkippedRuns)}
        />
      </div>

      {summary ? <AnalysisHighlights analysis={summary.analysis} /> : null}

      {summary ? (
        <>
          <UsageSection
            groups={summary.byDay}
            keyHeader="Day"
            title="Daily Usage"
          />
          <UsageSection
            groups={summary.byRepo}
            keyHeader="Repository"
            title="Repositories"
          />
          <UsageSection
            groups={summary.byProviderModel}
            keyHeader="Provider and Model"
            title="Providers and Models"
          />
          <UsageSection
            groups={summary.byReviewKind}
            keyHeader="Review Type"
            title="Review Types"
          />
          <p className="tw-mt-8 tw-text-sm tw-text-iron-400">
            Window: {formatDate(summary.range.from)} to{" "}
            {formatDate(summary.range.to)}
          </p>
        </>
      ) : (
        <div className="tw-mt-10 tw-border-l-4 tw-border-primary-500 tw-bg-iron-950 tw-px-5 tw-py-4">
          <h2 className="tw-mb-2 tw-text-xl tw-font-semibold tw-text-white">
            Usage Data Unavailable
          </h2>
          <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {unavailableMessage}
          </p>
        </div>
      )}
    </div>
  );
}

function AnalysisHighlights({
  analysis,
}: {
  readonly analysis: ReviewbotUsageAnalysis;
}) {
  return (
    <section className="tw-mt-8 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5">
      <h2 className="tw-mb-4 tw-text-xl tw-font-semibold tw-text-white">
        Cost Analysis
      </h2>
      <dl className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        <MetricPair
          label="Budget Skip Rate"
          value={formatPercent(analysis.budgetSkipRate)}
        />
        <MetricPair
          label="Avg Tokens / Run"
          value={formatInteger(analysis.averageTokensPerReviewRun)}
        />
        <MetricPair
          label="Avg Tokens / PR"
          value={formatInteger(analysis.averageTokensPerPr)}
        />
        <MetricPair
          label="Top Repo"
          value={formatTopCost(analysis.topCostRepo)}
        />
        <MetricPair
          label="Top Provider"
          value={formatTopCost(analysis.topCostProviderModel)}
        />
        <MetricPair
          label="Top Review Type"
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
    <dl className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5">
      <div className={`tw-mb-4 tw-inline-flex ${tone}`}>{icon}</div>
      <dt className="tw-text-sm tw-font-medium tw-text-iron-400">{label}</dt>
      <dd className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
        {value}
      </dd>
    </dl>
  );
}

function UsageSection({
  groups,
  keyHeader,
  title,
}: {
  readonly groups: readonly ReviewbotUsageGroup[];
  readonly keyHeader: string;
  readonly title: string;
}) {
  return (
    <section className="tw-mt-10">
      <div className="tw-mb-4 tw-flex tw-items-baseline tw-justify-between tw-gap-4">
        <h2 className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-white">
          {title}
        </h2>
        <span className="tw-text-sm tw-text-iron-400">
          {groups.length} rows
        </span>
      </div>
      {groups.length > 0 ? (
        <>
          <div className="tw-space-y-3 sm:tw-hidden">
            {groups.map((group) => (
              <dl
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4"
                key={group.key}
              >
                <dt className="tw-text-sm tw-font-semibold tw-text-white">
                  {group.key}
                </dt>
                <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-4">
                  <MetricPair
                    label="Runs"
                    value={formatInteger(group.reviewRuns)}
                  />
                  <MetricPair
                    label="Spend"
                    value={formatCurrency(group.costUsd)}
                  />
                  <MetricPair
                    label="Avg"
                    value={formatCurrency(group.averageCostUsd)}
                  />
                  <MetricPair
                    label="Tokens"
                    value={formatInteger(group.totalTokens)}
                  />
                  <MetricPair
                    label="Skips"
                    value={formatInteger(group.budgetSkippedRuns)}
                  />
                </div>
              </dl>
            ))}
          </div>
          <div className="tw-hidden tw-overflow-x-auto sm:tw-block">
            <UsageTable groups={groups} keyHeader={keyHeader} />
          </div>
        </>
      ) : (
        <p className="tw-mb-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4 tw-text-sm tw-text-iron-400">
          No usage recorded.
        </p>
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
    <div>
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
        {label}
      </dt>
      <dd className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-semibold tw-text-iron-100">
        {value}
      </dd>
    </div>
  );
}

function UsageTable({
  groups,
  keyHeader,
}: {
  readonly groups: readonly ReviewbotUsageGroup[];
  readonly keyHeader: string;
}) {
  return (
    <div className="tw-overflow-x-auto">
      <table className="tw-min-w-full tw-border-collapse">
        <thead>
          <tr className="tw-border-b tw-border-solid tw-border-white/10">
            <th className="tw-py-3 tw-pr-6 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              {keyHeader}
            </th>
            <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Runs
            </th>
            <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Spend
            </th>
            <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Avg
            </th>
            <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Tokens
            </th>
            <th className="tw-py-3 tw-pl-6 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              Skips
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr
              className="tw-border-b tw-border-solid tw-border-white/5"
              key={group.key}
            >
              <td className="tw-py-4 tw-pr-6 tw-text-sm tw-font-medium tw-text-white">
                {group.key}
              </td>
              <td className="tw-px-6 tw-py-4 tw-text-right tw-text-sm tw-text-iron-200">
                {formatInteger(group.reviewRuns)}
              </td>
              <td className="tw-px-6 tw-py-4 tw-text-right tw-text-sm tw-text-iron-200">
                {formatCurrency(group.costUsd)}
              </td>
              <td className="tw-px-6 tw-py-4 tw-text-right tw-text-sm tw-text-iron-200">
                {formatCurrency(group.averageCostUsd)}
              </td>
              <td className="tw-px-6 tw-py-4 tw-text-right tw-text-sm tw-text-iron-200">
                {formatInteger(group.totalTokens)}
              </td>
              <td className="tw-py-4 tw-pl-6 tw-text-right tw-text-sm tw-text-iron-200">
                {formatInteger(group.budgetSkippedRuns)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return dateFormatter.format(date);
}

function formatInteger(value: number): string {
  return compactNumberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatTopCost(group: ReviewbotUsageAnalysis["topCostRepo"]): string {
  if (!group) {
    return "None";
  }
  return `${group.key} (${formatCurrency(group.costUsd)}, ${formatPercent(
    group.costSharePercent
  )})`;
}
