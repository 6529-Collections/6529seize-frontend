import { InfoTooltip } from "./InfoTooltip";
import type { NetworkMetric } from "./types";

interface NetworkMetricsGridProps {
  readonly metrics: ReadonlyArray<NetworkMetric>;
}

export function NetworkMetricsGrid({
  metrics,
}: Readonly<NetworkMetricsGridProps>) {
  return (
    <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
      {metrics.map((metric) => (
        <MetricTile key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

function MetricTile({ metric }: { readonly metric: NetworkMetric }) {
  return (
    <div className="tw-space-y-1 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <div className="tw-flex tw-items-center tw-gap-2">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
          {metric.label}
        </p>
        <InfoTooltip
          ariaLabel={`Learn more about ${metric.label}`}
          tooltip={<span className="tw-text-xs">{metric.tooltip}</span>}
        />
      </div>
      <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {metric.value}
      </p>
    </div>
  );
}
