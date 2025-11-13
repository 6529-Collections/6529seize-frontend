import { StatCard } from "./StatCard";
import type { BaseMetricsSectionProps } from "./types";

export function BaseMetricsSection({
  cards,
}: Readonly<BaseMetricsSectionProps>) {
  return (
    <div
      role="group"
      aria-label="Base xTDH Metrics"
      className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3"
    >
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

