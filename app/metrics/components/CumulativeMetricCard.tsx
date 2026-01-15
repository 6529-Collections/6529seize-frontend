import type { ReactNode } from "react";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { MetricData } from "@/hooks/useCommunityMetrics";
import {
  formatChange,
  formatCompactNumber,
  formatNumberWithCommas,
  formatPercent,
} from "../utils/formatNumbers";

interface CumulativeMetricCardProps {
  readonly title: string;
  readonly dailyData: MetricData;
  readonly weeklyData: MetricData;
  readonly icon: ReactNode;
  readonly iconBgColor: string;
  readonly accentColor: string;
  readonly unit?: string;
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
    <div className="tw-flex tw-items-center tw-gap-3">
      <span className="tw-w-8 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-neutral-500">
        {label}
      </span>
      <CustomTooltip
        content={`${change >= 0 ? "+" : ""}${formatNumberWithCommas(change)} ${unit}`}
        placement="top"
      >
        <span className={`tw-cursor-default tw-font-semibold ${colorClasses}`}>
          {formatChange(change)}
        </span>
      </CustomTooltip>
      <span
        className={`tw-rounded tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold ${badgeClasses}`}
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
}: CumulativeMetricCardProps) {
  const total = dailyData.current.valueCount;
  const daily24hChange =
    dailyData.current.valueCount - dailyData.previous.valueCount;
  const weekly7dChange =
    weeklyData.current.valueCount - weeklyData.previous.valueCount;

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

      <div className="tw-flex tw-gap-4">
        {/* Total */}
        <div className="tw-flex-1">
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
            <p className="tw-cursor-default tw-text-2xl tw-font-bold tw-text-white">
              {formatCompactNumber(total)}
            </p>
          </CustomTooltip>
          {unit && (
            <p className="tw-mt-1 tw-text-xs tw-text-neutral-500">{unit}</p>
          )}
        </div>

        {/* Divider */}
        <div className="tw-w-px tw-bg-iron-700/50" />

        {/* Changes */}
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
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
    </div>
  );
}
