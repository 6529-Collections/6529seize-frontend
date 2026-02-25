import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { MetricData } from "@/hooks/useCommunityMetrics";


import {
  formatChange,
  formatCompactNumber,
  formatNumberWithCommas,
  formatPercent,
} from "../utils/formatNumbers";

import MetricSparkline from "./MetricSparkline";

import type { ReactNode } from "react";

interface CumulativeMetricCardProps {
  readonly title: string;
  readonly dailyData: MetricData;
  readonly weeklyData: MetricData;
  readonly icon: ReactNode;
  readonly iconBgColor: string;
  readonly accentColor: string;
  readonly unit?: string;
  readonly href?: string;
  readonly sparklineData?: number[] | undefined;
  readonly sparklineColor?: string | undefined;
  readonly sparklineDates?: number[] | undefined;
}

function ChangeRow({
  label,
  change,
  changePercent,
  unit,
}: {
  readonly label: string;
  readonly change: number;
  readonly changePercent: number | null;
  readonly unit: string;
}) {
  const isPositive = change >= 0;
  const colorClasses = isPositive ? "tw-text-green" : "tw-text-red";
  const badgeClasses = isPositive
    ? "tw-bg-green/20 tw-text-green"
    : "tw-bg-red/20 tw-text-red";

  return (
    <div className="tw-grid tw-grid-cols-[36px_1fr_auto] tw-items-center tw-gap-2">
      <span className="tw-text-xs tw-font-medium tw-uppercase tw-leading-none tw-tracking-wider tw-text-neutral-500">
        {label}
      </span>
      <div className="tw-flex tw-min-w-0 tw-justify-end">
        <CustomTooltip
          content={`${change >= 0 ? "+" : ""}${formatNumberWithCommas(change)} ${unit}`}
          placement="top"
        >
          <span
            className={`tw-whitespace-nowrap tw-text-right tw-text-sm tw-font-semibold tw-leading-none ${colorClasses}`}
          >
            {formatChange(change)}
          </span>
        </CustomTooltip>
      </div>
      <span
        className={`tw-inline-flex tw-min-w-[52px] tw-justify-center tw-rounded tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-leading-none ${badgeClasses}`}
      >
        {formatPercent(changePercent)}
      </span>
    </div>
  );
}

export default function CumulativeMetricCard({
  title,
  dailyData,
  weeklyData,
  icon,
  iconBgColor,
  accentColor,
  unit = "",
  href,
  sparklineData,
  sparklineColor,
  sparklineDates,
}: CumulativeMetricCardProps) {
  const total = dailyData.current.valueCount;
  const daily24hChange =
    dailyData.current.valueCount - dailyData.previous.valueCount;
  const weekly7dChange =
    weeklyData.current.valueCount - weeklyData.previous.valueCount;

  const content = (
    <div
      className={`tw-group tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5 tw-transition-all tw-duration-300 ${sparklineData && sparklineColor ? "tw-pb-0" : ""} ${href ? "hover:-tw-translate-y-1 hover:tw-border-neutral-700 hover:tw-shadow-xl hover:tw-shadow-neutral-900/50" : ""}`}
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

      <div className="tw-grid tw-min-h-[160px] tw-grid-cols-1 tw-items-start tw-gap-4 xl:tw-grid-cols-[1fr_auto_1fr] xl:tw-gap-6">
        {/* Total */}
        <div className="tw-flex tw-min-w-[120px] tw-flex-col tw-gap-1">
          <p
            className={`tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider ${accentColor}`}
          >
            Total
          </p>
          <CustomTooltip
            content={
              unit
                ? `${formatNumberWithCommas(total)} ${unit}`
                : formatNumberWithCommas(total)
            }
            placement="top"
          >
            <p className="tw-cursor-default tw-text-3xl tw-font-bold tw-leading-none tw-text-white">
              {formatCompactNumber(total)}
            </p>
          </CustomTooltip>
          {unit && <p className="tw-text-xs tw-text-neutral-500">{unit}</p>}
        </div>

        {/* Divider */}
        <div className="tw-hidden tw-h-full tw-w-px tw-bg-iron-700/50 xl:tw-block" />

        {/* Changes */}
        <div className="tw-flex tw-min-w-[130px] tw-flex-col tw-gap-2">
          <p
            className={`tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider ${accentColor}`}
          >
            Changes
          </p>
          <ChangeRow
            label="24h"
            change={daily24hChange}
            changePercent={dailyData.valueCountChangePercent}
            unit={unit}
          />
          <ChangeRow
            label="7d"
            change={weekly7dChange}
            changePercent={weeklyData.valueCountChangePercent}
            unit={unit}
          />
        </div>
      </div>
      {sparklineData && sparklineColor && (
        <MetricSparkline
          data={sparklineData}
          color={sparklineColor}
          dates={sparklineDates}
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="tw-group tw-block tw-no-underline hover:tw-no-underline"
      >
        {content}
      </Link>
    );
  }

  return content;
}
