"use client";

import XTDHCard from "../ui/XTDHCard";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";

export default function CapacityCard({
  allocatedPerDay,
  availablePerDay,
  progress,
  helper,
}: {
  readonly allocatedPerDay: number | null;
  readonly availablePerDay?: number | null;
  readonly progress?: number; // 0..100
  readonly helper?: string;
}) {
  const pct = Number.isFinite(progress as number) ? Math.max(0, Math.min(100, progress as number)) : 0;

  const asValue = (v: number | null, suffix = "") =>
    v == null ? "—" : `${formatNumberWithCommasOrDash(Math.floor(v))}${suffix}`;

  return (
    <XTDHCard title="xTDH Capacity">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-flex tw-justify-between tw-text-sm">
          <span className="tw-text-iron-300">Allocated</span>
          <span className="tw-text-iron-100">{asValue(allocatedPerDay, " / day")}</span>
        </div>
        <div className="tw-h-2 tw-rounded tw-bg-iron-800" aria-label="Capacity progress">
          <div className="tw-h-2 tw-rounded tw-bg-primary-500" style={{ width: `${pct}%` }} />
        </div>
        {availablePerDay != null && (
          <div className="tw-flex tw-justify-between tw-text-xs tw-text-iron-400">
            <span>Available</span>
            <span>{asValue(availablePerDay, " / day")}</span>
          </div>
        )}
        <div className="tw-text-iron-400 tw-text-xs">
          {helper ?? "Available xTDH capacity is multiplier × Base TDH. Allocation reduces your own accrual accordingly."}
        </div>
      </div>
    </XTDHCard>
  );
}
