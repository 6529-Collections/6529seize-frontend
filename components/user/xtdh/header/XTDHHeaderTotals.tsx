"use client";

import XTDHHeaderKV from "./XTDHHeaderKV";
import { fmt } from "./utils";

export default function XTDHHeaderTotals({
  external,
  total,
}: {
  readonly external: number;
  readonly total: number;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <XTDHHeaderKV label="External received / day" value={fmt(external)} />
      <XTDHHeaderKV label="Total TDH / day" value={fmt(total)} hint="Base + Self‑kept + External" />
    </div>
  );
}

