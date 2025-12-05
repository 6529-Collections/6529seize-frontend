import type { XtdhMetricsProps } from "../types";

import { XtdhStatCard } from "./XtdhStatCard";

export function XtdhMetricsSection({
  multiplier,
  producedXtdhRate,
  granted,
}: Readonly<XtdhMetricsProps>) {
  return (
    <section
      aria-labelledby="base-xtdh-metrics-heading"
      className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3"
    >
      <h2 id="base-xtdh-metrics-heading" className="tw-sr-only">
        Base xTDH Metrics
      </h2>

      <XtdhStatCard
        label="Multiplier"
        tooltip="Current xTDH multiplier applied to your TDH Rate"
        value={multiplier}
        subtext="x"
      />
      <XtdhStatCard
        label="xTDH Rate"
        tooltip="Total xTDH you can generate per day (TDH Rate × Multiplier)"
        value={producedXtdhRate}
        subtext="/day"
      />
      <XtdhStatCard
        label="Granted"
        tooltip="Total xTDH granted to you per day"
        value={granted}
        subtext="/day"
      />
    </section>
  );
}
