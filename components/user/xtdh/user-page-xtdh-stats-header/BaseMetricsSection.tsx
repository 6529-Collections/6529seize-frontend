import { StatCard } from "./StatCard";
import type { BaseMetricsSectionProps } from "./types";

export function BaseMetricsSection({
  cards,
}: Readonly<BaseMetricsSectionProps>) {
  return (
    <section
      aria-labelledby="base-xtdh-metrics-heading"
      className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3"
    >
      <h2 id="base-xtdh-metrics-heading" className="tw-sr-only">
        Base xTDH Metrics
      </h2>
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </section>
  );
}
