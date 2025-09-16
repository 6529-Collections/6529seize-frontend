"use client";

import XTDHCard from "../ui/XTDHCard";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import { useXtdhSummary } from "@/hooks/useXtdh";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function CapacityCard({
  profile,
  helper,
}: {
  readonly profile: ApiIdentity;
  readonly helper?: string;
}) {
  const { data: summary } = useXtdhSummary(
    typeof profile?.tdh_rate === "number" ? profile.tdh_rate : null,
  );
  const base = typeof summary?.baseRatePerDay === "number" ? summary.baseRatePerDay : 0;
  const multiplier = typeof summary?.multiplier === "number" ? summary.multiplier : 0;
  const capacityPerDay = base * multiplier;
  const allocatedPerDay = typeof summary?.allocatedRatePerDay === "number" ? summary.allocatedRatePerDay : 0;
  const remainingPerDay = Math.max(0, capacityPerDay - allocatedPerDay);

  const cap = toNum(capacityPerDay);
  const alloc = toNum(allocatedPerDay);
  const remain = toNum(remainingPerDay);
  const pct = cap > 0 ? Math.max(0, Math.min(100, (alloc / cap) * 100)) : 0;

  const asValue = (v: number | null, suffix = "") =>
    v == null ? "—" : `${formatNumberWithCommasOrDash(Math.floor(v))}${suffix}`;

  return (
    <XTDHCard title="xTDH Capacity">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-grid tw-grid-cols-3 tw-gap-2 tw-text-sm">
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-iron-300">Capacity</span>
            <span className="tw-text-iron-100">{asValue(cap, " / day")}</span>
          </div>
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-iron-300">Allocated</span>
            <span className="tw-text-iron-100">{asValue(alloc, " / day")}</span>
          </div>
          <div className="tw-flex tw-justify-between">
            <span className="tw-text-iron-300">Remaining</span>
            <span className="tw-text-iron-100">{asValue(remain, " / day")}</span>
          </div>
        </div>
        <div className="tw-h-2 tw-rounded tw-bg-iron-800" aria-label="Capacity progress">
          <div className="tw-h-2 tw-rounded tw-bg-primary-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="tw-text-iron-400 tw-text-xs">
          {helper ?? "xTDH capacity is multiplier × Base TDH. Allocation reduces your self‑kept accordingly."}
        </div>
      </div>
    </XTDHCard>
  );
}

function toNum(n: number | null | undefined): number | null {
  if (typeof n === "number" && !Number.isNaN(n)) return n;
  return n == null ? null : 0;
}
