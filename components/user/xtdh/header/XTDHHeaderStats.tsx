"use client";

import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import type { Summary } from "../types";

export default function XTDHHeaderStats({ summary }: { readonly summary: Summary }) {
  const asValue = (v: number | null) =>
    v == null ? "" : formatNumberWithCommasOrDash(Math.floor(v));
  return (
    <div className="tw-mt-6 lg:tw-mt-8 tw-mb-4">
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6 tw-gap-y-1">
          <HeaderStat label="Total TDH / day" value={asValue(summary.totalRatePerDay)} />
          <HeaderStat label="Base / day" value={asValue(summary.baseRatePerDay)} />
          <HeaderStat
            label="xTDH / day"
            value={asValue(summary.xtdhRatePerDay)}
            extra={summary.multiplier != null ? `× ${summary.multiplier}` : undefined}
          />
          <HeaderStat label="Allocated / day" value={asValue(summary.allocatedRatePerDay)} />
          <HeaderStat label="Incoming / day" value={asValue(summary.incomingRatePerDay)} />
        </div>
      </div>
    </div>
  );
}

function HeaderStat({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="tw-flex tw-items-center tw-text-base tw-font-medium tw-text-iron-300 tw-gap-1">
      <span>{label}:</span>
      <span className="tw-text-iron-50 tw-font-semibold">{value}</span>
      {extra ? <span className="tw-text-iron-500 tw-text-sm">{extra}</span> : null}
    </div>
  );
}
