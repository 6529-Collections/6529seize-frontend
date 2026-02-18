import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { formatCompactNumber } from "../utils/formatNumbers";

interface MetricSparklineProps {
  readonly data: number[];
  readonly color: string;
  readonly dates?: number[] | undefined;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function MetricSparkline({
  data,
  color,
  dates,
}: MetricSparklineProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data);

  return (
    <div className="tw-mt-auto tw-flex tw-h-12 tw-items-end tw-gap-px tw-pt-4">
      {data.map((value, index) => {
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const date = dates?.[index];
        const tooltipContent =
          typeof date === "number"
            ? `${formatDate(date)}: ${formatCompactNumber(value)}`
            : formatCompactNumber(value);

        return (
          <CustomTooltip key={index} content={tooltipContent} placement="top">
            <div
              className={`tw-max-w-1.5 tw-flex-1 tw-rounded-t tw-grayscale tw-transition-all tw-duration-300 group-hover:tw-grayscale-0 hover:tw-opacity-80 ${color}`}
              style={{ height: `${Math.max(height, 3)}%` }}
            />
          </CustomTooltip>
        );
      })}
    </div>
  );
}
