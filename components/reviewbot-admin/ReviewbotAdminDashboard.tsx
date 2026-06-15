import type {
  ReviewbotAdminDashboardResult,
  ReviewbotAdminEndpoint,
  ReviewbotAlertStatus,
  ReviewbotBudgetStatus,
  ReviewbotJobEvents,
  ReviewbotModelPriceStatus,
  ReviewbotRunClaims,
  ReviewbotRuntimeStatus,
  ReviewbotAdminUsageSummary,
} from "@/services/reviewbot-admin-api";
import type {
  ReviewbotUsageAnalysis,
  ReviewbotUsageGroup,
  ReviewbotUsagePrGroup,
} from "@/services/reviewbot-usage-api";
import {
  BellAlertIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

interface ReviewbotAdminDashboardProps {
  readonly result: ReviewbotAdminDashboardResult;
}

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  style: "percent",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export default function ReviewbotAdminDashboard({
  result,
}: ReviewbotAdminDashboardProps) {
  if (result.status !== "ok") {
    return <AdminGateState message={result.message} status={result.status} />;
  }

  const { dashboard } = result;
  const summaryData =
    dashboard.summary.status === "ok" ? dashboard.summary.data : null;

  return (
    <div className="tw-container tw-mx-auto tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-max-w-5xl">
        <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
          Operator Tools
        </p>
        <h1 className="tw-mb-4">6529bot Admin</h1>
        <p className="tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          Private operating view for review spend, budgets, model pricing,
          alerts, runtime posture, and worker health.
        </p>
      </div>

      <div className="tw-mt-8 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        <MetricCard
          icon={<ChartBarIcon className="tw-h-6 tw-w-6" />}
          label="Review Runs"
          tone="tw-text-primary-300"
          value={formatInteger(dashboard.totals.reviewRuns)}
        />
        <MetricCard
          icon={<DocumentTextIcon className="tw-h-6 tw-w-6" />}
          label="Unique PRs"
          tone="tw-text-primary-300"
          value={formatInteger(dashboard.totals.uniquePrs)}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="tw-h-6 tw-w-6" />}
          label="Spend"
          tone="tw-text-success"
          value={formatCurrency(dashboard.totals.costUsd)}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="tw-h-6 tw-w-6" />}
          label="Avg / Run"
          tone="tw-text-success"
          value={formatCurrency(dashboard.totals.averageCostPerReviewRunUsd)}
        />
        <MetricCard
          icon={<CurrencyDollarIcon className="tw-h-6 tw-w-6" />}
          label="Avg / PR"
          tone="tw-text-success"
          value={formatCurrency(dashboard.totals.averageCostPerPrUsd)}
        />
        <MetricCard
          icon={<CpuChipIcon className="tw-h-6 tw-w-6" />}
          label="Tokens"
          tone="tw-text-iron-100"
          value={formatInteger(dashboard.totals.totalTokens)}
        />
        <MetricCard
          icon={<ShieldCheckIcon className="tw-h-6 tw-w-6" />}
          label="Budget Skips"
          tone="tw-text-amber-300"
          value={formatInteger(dashboard.totals.budgetSkippedRuns)}
        />
      </div>

      <div className="tw-mt-10 tw-grid tw-grid-cols-1 tw-gap-6 xl:tw-grid-cols-2">
        <BudgetStatusPanel endpoint={dashboard.budgetStatus} />
        <AlertStatusPanel endpoint={dashboard.alertStatus} />
        <ModelPricePanel endpoint={dashboard.modelPriceStatus} />
        <RuntimeStatusPanel endpoint={dashboard.runtimeStatus} />
      </div>

      <AdminSummaryTables summary={summaryData} />

      <div className="tw-mt-10 tw-grid tw-grid-cols-1 tw-gap-6 xl:tw-grid-cols-2">
        <JobEventsPanel endpoint={dashboard.jobEvents} />
        <RunClaimsPanel endpoint={dashboard.runClaims} />
      </div>

      <p className="tw-mt-8 tw-text-sm tw-text-iron-500">
        Authenticated operator: {dashboard.actor}
      </p>
    </div>
  );
}

function AdminGateState({
  message,
  status,
}: {
  readonly message: string;
  readonly status: "unconfigured" | "unauthenticated" | "forbidden";
}) {
  let title = "Operator Sign-In Required";
  if (status === "unconfigured") {
    title = "Admin Not Configured";
  } else if (status === "forbidden") {
    title = "Admin Access Restricted";
  }

  return (
    <div className="tw-container tw-mx-auto tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-max-w-3xl tw-border-l-4 tw-border-primary-500 tw-bg-iron-950 tw-px-5 tw-py-4">
        <LockClosedIcon className="tw-mb-4 tw-h-8 tw-w-8 tw-text-primary-300" />
        <h1 className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-white">
          {title}
        </h1>
        <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {message}
        </p>
      </div>
    </div>
  );
}

function BudgetStatusPanel({
  endpoint,
}: {
  readonly endpoint: ReviewbotAdminEndpoint<ReviewbotBudgetStatus>;
}) {
  return (
    <StatusPanel
      endpoint={endpoint}
      icon={<CurrencyDollarIcon className="tw-h-5 tw-w-5" />}
      title="Budget Status"
    >
      {(data) => {
        const overBudget = data.policies.filter((policy) =>
          Object.values(policy.utilization).some((period) => period.overBudget)
        ).length;
        const highest = data.policies.reduce<number>(
          (max, policy) =>
            Math.max(
              max,
              policy.utilization.daily.percentUsed ?? 0,
              policy.utilization.weekly.percentUsed ?? 0,
              policy.utilization.monthly.percentUsed ?? 0
            ),
          0
        );

        return (
          <div className="tw-grid tw-grid-cols-3 tw-gap-3">
            <MetricPair
              label="Policies"
              value={formatInteger(data.policies.length)}
            />
            <MetricPair label="Over" value={formatInteger(overBudget)} />
            <MetricPair label="Peak Use" value={formatPercent(highest)} />
          </div>
        );
      }}
    </StatusPanel>
  );
}

function AlertStatusPanel({
  endpoint,
}: {
  readonly endpoint: ReviewbotAdminEndpoint<ReviewbotAlertStatus>;
}) {
  return (
    <StatusPanel
      endpoint={endpoint}
      icon={<BellAlertIcon className="tw-h-5 tw-w-5" />}
      title="Alerts"
    >
      {(data) => (
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <MetricPair
            label="Spend"
            value={formatEnabled(data.status.spend.enabled)}
          />
          <MetricPair
            label="Job Health"
            value={formatEnabled(data.status.jobHealth.enabled)}
          />
          <MetricPair
            label="Notifier"
            value={data.status.notifier.mode || "disabled"}
          />
          <MetricPair
            label="SES Recipients"
            value={formatInteger(data.status.notifier.sesRecipientCount ?? 0)}
          />
        </div>
      )}
    </StatusPanel>
  );
}

function ModelPricePanel({
  endpoint,
}: {
  readonly endpoint: ReviewbotAdminEndpoint<ReviewbotModelPriceStatus>;
}) {
  return (
    <StatusPanel
      endpoint={endpoint}
      icon={<CpuChipIcon className="tw-h-5 tw-w-5" />}
      title="Model Prices"
    >
      {(data) => (
        <div className="tw-grid tw-grid-cols-3 tw-gap-3">
          <MetricPair
            label="Active"
            value={formatInteger(data.status.summary.activeRows)}
          />
          <MetricPair
            label="Stale"
            value={formatInteger(data.status.summary.staleRows)}
          />
          <MetricPair
            label="Incomplete"
            value={formatInteger(data.status.summary.incompleteRows)}
          />
        </div>
      )}
    </StatusPanel>
  );
}

function RuntimeStatusPanel({
  endpoint,
}: {
  readonly endpoint: ReviewbotAdminEndpoint<ReviewbotRuntimeStatus>;
}) {
  return (
    <StatusPanel
      endpoint={endpoint}
      icon={<CheckCircleIcon className="tw-h-5 tw-w-5" />}
      title="Runtime"
    >
      {(data) => {
        const statusOk =
          typeof data.status["ok"] === "boolean" ? data.status["ok"] : true;
        const warnings = Array.isArray(data.status["warnings"])
          ? data.status["warnings"].length
          : 0;
        const errors = Array.isArray(data.status["errors"])
          ? data.status["errors"].length
          : 0;

        return (
          <div className="tw-grid tw-grid-cols-3 tw-gap-3">
            <MetricPair label="Ready" value={formatEnabled(statusOk)} />
            <MetricPair label="Warnings" value={formatInteger(warnings)} />
            <MetricPair label="Errors" value={formatInteger(errors)} />
          </div>
        );
      }}
    </StatusPanel>
  );
}

function AdminSummaryTables({
  summary,
}: {
  readonly summary: ReviewbotAdminUsageSummary | null;
}) {
  if (!summary) {
    return (
      <div className="tw-mt-10 tw-border-l-4 tw-border-amber-400 tw-bg-iron-950 tw-px-5 tw-py-4">
        <h2 className="tw-mb-2 tw-text-xl tw-font-semibold tw-text-white">
          Usage Summary Unavailable
        </h2>
        <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          The admin summary endpoint could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <>
      <UsageSection
        groups={summary.byRequestor}
        keyHeader="Requestor"
        title="Requestors"
      />
      <UsageAnalysisPanel analysis={summary.analysis} />
      <UsageSection
        groups={summary.byPrAuthor}
        keyHeader="PR Author"
        title="PR Authors"
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
      <PrUsageSection groups={summary.byPr} title="Pull Requests" />
    </>
  );
}

function UsageAnalysisPanel({
  analysis,
}: {
  readonly analysis: ReviewbotUsageAnalysis;
}) {
  return (
    <section className="tw-mt-10 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5">
      <h2 className="tw-mb-4 tw-text-xl tw-font-semibold tw-text-white">
        Cost Analysis
      </h2>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        <MetricPair
          label="Budget Skip Rate"
          value={formatPercentValue(analysis.budgetSkipRate)}
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
          label="Top Requestor"
          value={formatTopCost(analysis.topCostRequestor)}
        />
        <MetricPair
          label="Top PR Author"
          value={formatTopCost(analysis.topCostPrAuthor)}
        />
        <MetricPair label="Top PR" value={formatTopCost(analysis.topCostPr)} />
      </div>
    </section>
  );
}

function JobEventsPanel({
  endpoint,
}: {
  readonly endpoint: ReviewbotAdminEndpoint<ReviewbotJobEvents>;
}) {
  return (
    <StatusPanel
      endpoint={endpoint}
      icon={<ExclamationTriangleIcon className="tw-h-5 tw-w-5" />}
      title="Recent Failed Jobs"
    >
      {(data) => (
        <div className="tw-space-y-3">
          <MetricPair label="Rows" value={formatInteger(data.events.length)} />
          <CompactRows
            rows={data.events.map((event) => ({
              detail: event.reason || event.stage,
              key: `${event.eventId ?? event.jobId}-${event.createdAt}`,
              label: `${event.repoFullName || "unknown"} #${event.prNumber}`,
              value: event.status,
            }))}
          />
        </div>
      )}
    </StatusPanel>
  );
}

function RunClaimsPanel({
  endpoint,
}: {
  readonly endpoint: ReviewbotAdminEndpoint<ReviewbotRunClaims>;
}) {
  return (
    <StatusPanel
      endpoint={endpoint}
      icon={<ClockIcon className="tw-h-5 tw-w-5" />}
      title="Stale Active Claims"
    >
      {(data) => (
        <div className="tw-space-y-3">
          <MetricPair label="Rows" value={formatInteger(data.claims.length)} />
          <CompactRows
            rows={data.claims.map((claim) => ({
              detail: claim.runKey,
              key: `${claim.claimId ?? claim.jobId}-${claim.updatedAt}`,
              label: `${claim.repoFullName || "unknown"} #${claim.prNumber}`,
              value: claim.status,
            }))}
          />
        </div>
      )}
    </StatusPanel>
  );
}

function StatusPanel<T>({
  children,
  endpoint,
  icon,
  title,
}: {
  readonly children: (data: T) => ReactNode;
  readonly endpoint: ReviewbotAdminEndpoint<T>;
  readonly icon: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5">
      <div className="tw-mb-5 tw-flex tw-items-center tw-gap-3">
        <div className="tw-text-primary-300">{icon}</div>
        <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-white">
          {title}
        </h2>
      </div>
      {endpoint.status === "ok" ? (
        children(endpoint.data)
      ) : (
        <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {endpoint.message}
        </p>
      )}
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

function MetricPair({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
        {label}
      </span>
      <span className="tw-mt-1 tw-block tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
        {value}
      </span>
    </div>
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
      ) : (
        <p className="tw-mb-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4 tw-text-sm tw-text-iron-400">
          No rows found.
        </p>
      )}
    </section>
  );
}

function PrUsageSection({
  groups,
  title,
}: {
  readonly groups: readonly ReviewbotUsagePrGroup[];
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
        <div className="tw-overflow-x-auto">
          <table className="tw-min-w-full tw-border-collapse">
            <thead>
              <tr className="tw-border-b tw-border-solid tw-border-white/10">
                <th className="tw-py-3 tw-pr-6 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                  Pull Request
                </th>
                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                  Author
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
                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                  Latest Head
                </th>
                <th className="tw-py-3 tw-pl-6 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                  Last Review
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
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-iron-200">
                    {group.prAuthor || "unknown"}
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
                  <td className="tw-px-6 tw-py-4 tw-font-mono tw-text-xs tw-text-iron-300">
                    {formatSha(group.latestHeadSha)}
                  </td>
                  <td className="tw-py-4 tw-pl-6 tw-text-sm tw-text-iron-200">
                    {formatDateTime(group.lastReviewAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="tw-mb-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4 tw-text-sm tw-text-iron-400">
          No rows found.
        </p>
      )}
    </section>
  );
}

function CompactRows({
  rows,
}: {
  readonly rows: readonly {
    readonly detail: string;
    readonly key: string;
    readonly label: string;
    readonly value: string;
  }[];
}) {
  if (!rows.length) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        No rows found.
      </p>
    );
  }

  return (
    <div className="tw-space-y-2">
      {rows.slice(0, 5).map((row) => (
        <div
          className="tw-border-t tw-border-solid tw-border-white/10 tw-pt-3"
          key={row.key}
        >
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
            <span className="tw-break-words tw-text-sm tw-font-semibold tw-text-white">
              {row.label}
            </span>
            <span className="tw-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              {row.value}
            </span>
          </div>
          <p className="tw-mb-0 tw-mt-1 tw-line-clamp-2 tw-text-xs tw-leading-5 tw-text-iron-400">
            {row.detail || "No detail."}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatEnabled(value: boolean): string {
  return value ? "On" : "Off";
}

function formatInteger(value: number): string {
  return compactNumberFormatter.format(value);
}

function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

function formatPercentValue(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSha(value: string): string {
  return value ? value.slice(0, 12) : "unknown";
}

function formatDateTime(value: string): string {
  if (!value) {
    return "unknown";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "unknown"
    : dateTimeFormatter.format(date);
}

function formatTopCost(
  group:
    | ReviewbotUsageAnalysis["topCostRepo"]
    | ReviewbotUsageAnalysis["topCostRequestor"]
    | ReviewbotUsageAnalysis["topCostPr"]
    | undefined
): string {
  if (!group) {
    return "None";
  }
  return `${group.key} (${formatCurrency(group.costUsd)}, ${formatPercentValue(
    group.costSharePercent
  )})`;
}
