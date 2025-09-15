"use client";

import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import type { Summary } from "../types";
import { Tooltip } from "react-tooltip";

export default function XTDHHeaderStats({ summary }: { readonly summary: Summary }) {
  const base = numberOrZero(summary.baseRatePerDay);
  const multiplier = summary.multiplier ?? 0;
  const capacity = base * multiplier; // xTDH capacity per day
  const givenOut = clamp0(numberOrZero(summary.allocatedRatePerDay));
  const selfKept = clamp0(capacity - givenOut);
  const external = clamp0(numberOrZero(summary.incomingRatePerDay));
  const total = base + selfKept + external;

  const givenPct = pctOf(givenOut, capacity);
  const keptPct = pctOf(selfKept, capacity);

  return (
    <div className="tw-mt-6 lg:tw-mt-8 tw-mb-4">
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-4">
        {/* Left: Inputs */}
        <div className="tw-flex tw-flex-col tw-gap-2">
          <HeaderKV label="Base / day" value={fmt(base)} />
          <HeaderKV
            label="Multiplier"
            value={`× ${stripTrailingZeros(multiplier)}`}
            after={
              <>
                <span
                  className="tw-ml-2 tw-text-xs tw-text-primary-400 hover:tw-underline tw-cursor-pointer"
                  data-tooltip-id="xtdh-multiplier-tooltip"
                >
                  schedule
                </span>
                <Tooltip
                  id="xtdh-multiplier-tooltip"
                  place="top"
                  style={{ backgroundColor: "#1F2937", color: "white", padding: "8px 10px", maxWidth: 320 }}
                >
                  <div className="tw-text-xs tw-space-y-1">
                    <div>Multiplier controls xTDH capacity: Capacity = Base × Multiplier.</div>
                    <div className="tw-text-iron-200">Example ramp (subject to change):</div>
                    <ul className="tw-list-disc tw-pl-4">
                      <li>Month 0: 0.05 – 0.10</li>
                      <li>Month 36: 0.30</li>
                      <li>Month 120: 1.00</li>
                    </ul>
                    <div>Unallocated capacity is self‑kept; allocations are reversible and pro‑rata if Base changes.</div>
                  </div>
                </Tooltip>
              </>
            }
          />
          <HeaderKV label="Capacity / day" value={fmt(capacity)} hint="Base × Multiplier" />
        </div>

        {/* Middle: Allocation split */}
        <div className="tw-flex tw-flex-col tw-gap-2">
          <div className="tw-text-iron-300 tw-text-sm tw-font-medium">Your xTDH allocation</div>
          <div className="tw-flex tw-h-2 tw-rounded tw-overflow-hidden tw-bg-iron-800" aria-label="xTDH allocation bar">
            <div className="tw-bg-primary-600" style={{ width: `${givenPct}%` }} />
            <div className="tw-bg-iron-600" style={{ width: `${keptPct}%` }} />
          </div>
          <div className="tw-flex tw-items-center tw-gap-4 tw-text-xs tw-text-iron-400">
            <span className="tw-flex tw-items-center tw-gap-1">
              <span className="tw-inline-block tw-w-3 tw-h-2 tw-rounded tw-bg-primary-600" /> Given out
            </span>
            <span className="tw-flex tw-items-center tw-gap-1">
              <span className="tw-inline-block tw-w-3 tw-h-2 tw-rounded tw-bg-iron-600" /> Self‑kept
            </span>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-sm">
            <span className="tw-text-iron-300">
              Given Out: <span className="tw-text-iron-50 tw-font-semibold">{fmt(givenOut)}</span> ({roundPct(givenPct)})
            </span>
            <span className="tw-text-iron-300">
              Self‑kept: <span className="tw-text-iron-50 tw-font-semibold">{fmt(selfKept)}</span> ({roundPct(keptPct)})
            </span>
          </div>
          <div className="tw-text-iron-500 tw-text-xs">Capacity is auto‑kept unless allocated away.</div>
        </div>

        {/* Right: Net and totals */}
        <div className="tw-flex tw-flex-col tw-gap-2">
          <HeaderKV label="External received / day" value={fmt(external)} />
          <HeaderKV label="Total TDH / day" value={fmt(total)} hint="Base + Self‑kept + External" />
        </div>
      </div>
    </div>
  );
}

function HeaderKV({ label, value, hint, after }: { label: string; value: string; hint?: string; after?: React.ReactNode }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <span className="tw-text-base tw-font-medium tw-text-iron-300">{label}:</span>
      <span className="tw-text-base tw-font-semibold tw-text-iron-50">{value}</span>
      {hint ? <span className="tw-text-xs tw-text-iron-500">{hint}</span> : null}
      {after ?? null}
    </div>
  );
}

function numberOrZero(n: number | null): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

function clamp0(n: number): number {
  return n < 0 ? 0 : n;
}

function pctOf(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

function roundPct(p: number): string {
  return `${Math.round(p)}%`;
}

function fmt(n: number): string {
  return formatNumberWithCommasOrDash(Math.floor(n));
}

function stripTrailingZeros(n: number): string {
  if (!Number.isFinite(n)) return `${n}`;
  const s = n.toFixed(4); // limit to 4 decimals then strip
  return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
