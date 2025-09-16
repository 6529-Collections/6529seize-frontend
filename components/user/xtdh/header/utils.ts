import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import type { Summary } from "../types";

export type HeaderMetrics = {
  base: number;
  multiplier: number;
  capacity: number;
  givenOut: number;
  selfKept: number;
  external: number;
  total: number;
  givenPct: number;
  keptPct: number;
};

export function computeHeaderMetrics(summary: Summary): HeaderMetrics {
  const base = numberOrZero(summary.baseRatePerDay);
  const multiplier = summary.multiplier ?? 0;
  const capacity = base * multiplier;
  const givenOut = clamp0(numberOrZero(summary.allocatedRatePerDay));
  const selfKept = clamp0(capacity - givenOut);
  const external = clamp0(numberOrZero(summary.incomingRatePerDay));
  const total = base + selfKept + external;
  const givenPct = pctOf(givenOut, capacity);
  const keptPct = pctOf(selfKept, capacity);
  return { base, multiplier, capacity, givenOut, selfKept, external, total, givenPct, keptPct };
}

export function numberOrZero(n: number | null): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

export function clamp0(n: number): number {
  return n < 0 ? 0 : n;
}

export function pctOf(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

export function roundPct(p: number): string {
  return `${Math.round(p)}%`;
}

export function fmt(n: number): string {
  return formatNumberWithCommasOrDash(Math.floor(n));
}

export function stripTrailingZeros(n: number): string {
  if (!Number.isFinite(n)) return `${n}`;
  const s = n.toFixed(4);
  return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

