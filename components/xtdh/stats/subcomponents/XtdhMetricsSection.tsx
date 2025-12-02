import type { XtdhMetricsProps } from "../types";

import { XtdhStatCard } from "./XtdhStatCard";

export function XtdhMetricsSection({
  multiplier,
  producedXtdhRate,
}: Readonly<XtdhMetricsProps>) {
  return (
    <section
      aria-labelledby="base-xtdh-metrics-heading"
      className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2"
    >
      <h2 id="base-xtdh-metrics-heading" className="tw-sr-only">
        Base xTDH Metrics
      </h2>

      <XtdhStatCard
        label="Multiplier"
        tooltip="Current xTDH multiplier applied to your TDH Rate"
        value={multiplier}
        suffix="x"
      />
      <XtdhStatCard
        label="xTDH Rate"
        tooltip="Total xTDH you can generate per day (TDH Rate × Multiplier)"
        value={producedXtdhRate}
        suffix="/day"
      />
    </section>
  );
}
