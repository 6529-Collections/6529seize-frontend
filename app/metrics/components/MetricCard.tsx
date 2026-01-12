import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { MetricData } from "@/hooks/useCommunityMetrics";

interface MetricCardProps {
  readonly title: string;
  readonly dailyData: MetricData;
  readonly weeklyData: MetricData;
  readonly icon: React.ReactNode;
  readonly iconBgColor: string;
  readonly accentColor: string;
  readonly useValueCount?: boolean;
  readonly suffix?: string;
}

function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return formatNumberWithCommas(value);
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
  suffix,
}: {
  readonly label: string;
  readonly currentValue: number;
  readonly previousValue: number;
  readonly previousLabel: string;
  readonly changePercent: number | null;
  readonly accentColor: string;
  readonly isPrimary?: boolean;
  readonly suffix?: string;
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
      <CustomTooltip
        content={`${formatNumberWithCommas(currentValue)}${suffix ?? ""}`}
        placement="top"
      >
        <p
          className={`tw-cursor-default tw-font-bold tw-text-white ${isPrimary ? "tw-text-4xl" : "tw-text-2xl"}`}
        >
          {formatCompactNumber(currentValue)}
          {suffix}
        </p>
      </CustomTooltip>
      <p className="tw-mt-1 tw-text-xs tw-text-neutral-500">
        vs{" "}
        <CustomTooltip
          content={`${formatNumberWithCommas(previousValue)}${suffix ?? ""}`}
          placement="top"
        >
          <span className="tw-cursor-default">
            {formatCompactNumber(previousValue)}
            {suffix}
          </span>
        </CustomTooltip>{" "}
        {previousLabel}
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
  useValueCount = false,
  suffix,
}: MetricCardProps) {
  const getCount = (data: MetricData, period: "current" | "previous") =>
    useValueCount ? data[period].valueCount : data[period].eventCount;

  const getChangePercent = (data: MetricData) =>
    useValueCount ? data.valueCountChangePercent : data.eventCountChangePercent;

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
          currentValue={getCount(dailyData, "current")}
          previousValue={getCount(dailyData, "previous")}
          previousLabel="prev day"
          changePercent={getChangePercent(dailyData)}
          accentColor={accentColor}
          isPrimary
          {...(suffix !== undefined && { suffix })}
        />
        <div className="tw-w-px tw-bg-iron-700/50" />
        <StatBlock
          label="Last 7 Days"
          currentValue={getCount(weeklyData, "current")}
          previousValue={getCount(weeklyData, "previous")}
          previousLabel="prev week"
          changePercent={getChangePercent(weeklyData)}
          accentColor={accentColor}
          {...(suffix !== undefined && { suffix })}
        />
      </div>
    </div>
  );
}
