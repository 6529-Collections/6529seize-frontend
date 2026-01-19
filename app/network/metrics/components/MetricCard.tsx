import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { MetricData } from "@/hooks/useCommunityMetrics";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatCompactNumber,
  formatNumberWithCommas,
  formatPercent,
} from "../utils/formatNumbers";

interface MetricCardProps {
  readonly title: string;
  readonly dailyData: MetricData;
  readonly weeklyData: MetricData;
  readonly icon: ReactNode;
  readonly iconBgColor: string;
  readonly accentColor: string;
  readonly useValueCount?: boolean;
  readonly suffix?: string | undefined;
  readonly href?: string;
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
  readonly suffix?: string | undefined;
}) {
  const isPositive = changePercent !== null && changePercent >= 0;
  const colorClasses = isPositive
    ? "tw-bg-green/20 tw-text-green"
    : "tw-bg-red/20 tw-text-red";
  const badgeClasses =
    changePercent === null ? "tw-bg-iron-800 tw-text-iron-400" : colorClasses;

  return (
    <div className="tw-flex tw-min-h-[150px] tw-flex-col tw-gap-1">
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
          className={`tw-cursor-default tw-font-bold tw-leading-none tw-text-white ${isPrimary ? "tw-text-4xl" : "tw-text-3xl"}`}
        >
          {formatCompactNumber(currentValue)}
          {suffix}
        </p>
      </CustomTooltip>
      <p className="tw-text-xs tw-leading-snug tw-text-neutral-500">
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
        className={`tw-mt-auto tw-inline-flex tw-min-w-[72px] tw-justify-center tw-rounded tw-px-2 tw-py-0.5 tw-text-sm tw-font-semibold ${badgeClasses}`}
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
  href,
}: MetricCardProps) {
  const getCount = (data: MetricData, period: "current" | "previous") =>
    useValueCount ? data[period].valueCount : data[period].eventCount;

  const getChangePercent = (data: MetricData) =>
    useValueCount ? data.valueCountChangePercent : data.eventCountChangePercent;

  const content = (
    <div
      className={`tw-block tw-h-full tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5 tw-transition-all tw-duration-300 ${href ? "hover:-tw-translate-y-1 hover:tw-border-neutral-700 hover:tw-shadow-xl hover:tw-shadow-neutral-900/50" : ""}`}
    >
      <div className="tw-mb-5 tw-flex tw-items-start tw-justify-between">
        <h3 className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-white">
          {title}
          {href && (
            <ArrowTopRightOnSquareIcon className="tw-size-4 tw-text-neutral-500" />
          )}
        </h3>
        <div
          className={`tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg ${iconBgColor}`}
        >
          {icon}
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-[1fr_auto_1fr] tw-items-start tw-gap-6">
        <StatBlock
          label="Last 24h"
          currentValue={getCount(dailyData, "current")}
          previousValue={getCount(dailyData, "previous")}
          previousLabel="prev day"
          changePercent={getChangePercent(dailyData)}
          accentColor={accentColor}
          isPrimary
          suffix={suffix}
        />
        <div className="tw-h-full tw-w-px tw-bg-iron-700/50" />
        <StatBlock
          label="Last 7 Days"
          currentValue={getCount(weeklyData, "current")}
          previousValue={getCount(weeklyData, "previous")}
          previousLabel="prev week"
          changePercent={getChangePercent(weeklyData)}
          accentColor={accentColor}
          suffix={suffix}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="tw-block tw-no-underline hover:tw-no-underline"
      >
        {content}
      </Link>
    );
  }

  return content;
}
