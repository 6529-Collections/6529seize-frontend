"use client";

import { Tooltip } from "react-tooltip";

export default function XTDHHeaderMultiplierTooltip() {
  return (
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
  );
}

