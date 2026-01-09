import type { MetricData } from "@/hooks/useCommunityMetrics";

interface MetricCardProps {
  readonly title: string;
  readonly dailyData: MetricData;
  readonly weeklyData: MetricData;
  readonly icon: React.ReactNode;
  readonly iconBgColor: string;
  readonly accentColor: string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function StatBlock({
  label,
  currentValue,
  previousValue,
  previousLabel,
  changePercent,
  accentColor,
  isPrimary = false,
}: {
  readonly label: string;
  readonly currentValue: number;
  readonly previousValue: number;
  readonly previousLabel: string;
  readonly changePercent: number | null;
  readonly accentColor: string;
  readonly isPrimary?: boolean;
}) {
  const isPositive = changePercent !== null && changePercent >= 0;
  const colorClasses = isPositive
    ? "tw-bg-green/20 tw-text-green"
    : "tw-bg-red/20 tw-text-red";
  const badgeClasses =
    changePercent === null ? "tw-bg-iron-800 tw-text-iron-400" : colorClasses;

  return (
    <div className="tw-flex-1">
      <p
        className={`tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider ${accentColor}`}
      >
        {label}
      </p>
      <p
        className={`tw-font-bold tw-text-white ${isPrimary ? "tw-text-4xl" : "tw-text-2xl"}`}
      >
        {formatNumber(currentValue)}
      </p>
      <p className="tw-mt-1 tw-text-xs tw-text-neutral-500">
        vs {formatNumber(previousValue)} {previousLabel}
      </p>
      <span
        className={`tw-mt-2 tw-inline-block tw-rounded tw-px-2 tw-py-0.5 tw-text-sm tw-font-semibold ${badgeClasses}`}
      >
        {formatPercent(changePercent)}
      </span>
    </div>
  );
}

export default function MetricCard({
  title,
  dailyData,
  weeklyData,
  icon,
  iconBgColor,
  accentColor,
}: MetricCardProps) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5">
      <div className="tw-mb-5 tw-flex tw-items-start tw-justify-between">
        <h3 className="tw-text-base tw-font-semibold tw-text-white">{title}</h3>
        <div
          className={`tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg ${iconBgColor}`}
        >
          {icon}
        </div>
      </div>

      <div className="tw-flex tw-gap-6">
        <StatBlock
          label="Last 24h"
          currentValue={dailyData.current.eventCount}
          previousValue={dailyData.previous.eventCount}
          previousLabel="prev day"
          changePercent={dailyData.changePercent}
          accentColor={accentColor}
          isPrimary
        />
        <div className="tw-w-px tw-bg-iron-700/50" />
        <StatBlock
          label="Last 7 Days"
          currentValue={weeklyData.current.eventCount}
          previousValue={weeklyData.previous.eventCount}
          previousLabel="prev week"
          changePercent={weeklyData.changePercent}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}
