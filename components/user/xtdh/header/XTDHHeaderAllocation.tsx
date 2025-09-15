"use client";

import { fmt, roundPct } from "./utils";

export default function XTDHHeaderAllocation({
  givenPct,
  keptPct,
  givenOut,
  selfKept,
}: {
  readonly givenPct: number;
  readonly keptPct: number;
  readonly givenOut: number;
  readonly selfKept: number;
}) {
  return (
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
  );
}

