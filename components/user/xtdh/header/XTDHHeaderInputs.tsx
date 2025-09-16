"use client";

import XTDHHeaderKV from "./XTDHHeaderKV";
import XTDHHeaderMultiplierTooltip from "./XTDHHeaderMultiplierTooltip";
import { fmt, stripTrailingZeros } from "./utils";

export default function XTDHHeaderInputs({
  base,
  multiplier,
  capacity,
}: {
  readonly base: number;
  readonly multiplier: number;
  readonly capacity: number;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <XTDHHeaderKV label="Base / day" value={fmt(base)} />
      <XTDHHeaderKV label="Multiplier" value={`× ${stripTrailingZeros(multiplier)}`} after={<XTDHHeaderMultiplierTooltip />} />
      <XTDHHeaderKV label="Capacity / day" value={fmt(capacity)} hint="Base × Multiplier" />
    </div>
  );
}

