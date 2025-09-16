"use client";

import type { Summary } from "../types";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useXtdhSummary } from "@/hooks/useXtdh";
import { computeHeaderMetrics } from "./utils";
import XTDHHeaderInputs from "./XTDHHeaderInputs";
import XTDHHeaderAllocation from "./XTDHHeaderAllocation";
import XTDHHeaderTotals from "./XTDHHeaderTotals";

export default function XTDHHeaderStats({ profile }: { readonly profile: ApiIdentity }) {
  const { data: summaryData } = useXtdhSummary(
    typeof profile?.tdh_rate === "number" ? profile.tdh_rate : null,
  );
  const summary: Summary =
    summaryData ?? {
      baseRatePerDay: null,
      multiplier: null,
      xtdhRatePerDay: null,
      totalRatePerDay: null,
      allocatedRatePerDay: null,
      incomingRatePerDay: null,
    };
  const metrics = computeHeaderMetrics(summary);

  return (
    <div className="tw-mt-6 lg:tw-mt-8 tw-mb-4">
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-4">
        <XTDHHeaderInputs base={metrics.base} multiplier={metrics.multiplier} capacity={metrics.capacity} />
        <XTDHHeaderAllocation
          givenPct={metrics.givenPct}
          keptPct={metrics.keptPct}
          givenOut={metrics.givenOut}
          selfKept={metrics.selfKept}
        />
        <XTDHHeaderTotals external={metrics.external} total={metrics.total} />
      </div>
    </div>
  );
}
