/**
 * P26 §4: cycles, their cutoff block and whole days of age.
 *
 * A cycle is its day number `N`, the days from 1970-01-01 UTC to the date
 * whose 00:00:00 UTC closes it; its boundary is `N × 86,400`. The cutoff
 * block `B` is the finalized block `b` with `ts(b) < M <= ts(b + 1)`, and
 * `T = ts(B)` is the time every age is measured from.
 */

import { DAY, invalid, readUint, type Uint } from "./registry";

/** `days(a) = (T - a) div day_s` (P26 §4.3), for an acquisition at `a`. */
export function wholeDays(T: number, acquiredAt: number, dayS: number): number {
  return Math.floor((T - acquiredAt) / dayS);
}

function dayNumber(year: number, month: number, day: number): number | null {
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (
    year < 1970 ||
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return time / (DAY * 1000);
}

/**
 * The cycle day of an upload date, exactly eight ASCII digits `YYYYMMDD`
 * naming a calendar date on or after 1970-01-01 (P26 §4.1; P28 `cycleDay`).
 * Anything else names no cycle and throws, never read as another day:
 * 20261032, 20230229, 20261100, 2026101 and 202610111 are refused
 * (vector 74).
 */
export function cycleDayOfUploadDate(date: string): number {
  if (typeof date !== "string" || !/^[0-9]{8}$/.test(date)) {
    throw invalid(
      `${JSON.stringify(date)} is not a date of eight digits YYYYMMDD (P26 §4.1)`
    );
  }
  const n = dayNumber(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)),
    Number(date.slice(6, 8))
  );
  if (n === null) {
    throw invalid(
      `${date} is not a calendar date on or after 1970-01-01 (P26 §4.1)`
    );
  }
  return n;
}

/**
 * The cycle day of a `YYYY-MM-DD` UTC date, as the verification feed writes
 * dates, or null when it names no cycle (not a calendar date, or before
 * 1970-01-01).
 */
export function cycleDayOfDate(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) {
    return null;
  }
  return dayNumber(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** The `YYYY-MM-DD` UTC date of a cycle day. */
export function dateOfCycleDay(cycleDay: number): string {
  return new Date(cycleDay * DAY * 1000).toISOString().slice(0, 10);
}

/** `t_N = N × 86,400`: 00:00:00 UTC of the cycle date, in Unix seconds. */
export function cycleBoundary(cycleDay: number): number {
  return cycleDay * DAY;
}

const CANONICAL_DECIMAL = /^(0|[1-9][0-9]*)$/;

/**
 * A map of block numbers to header timestamps, read at its types: each key
 * the canonical decimal of a `uint64` (no sign, no leading zero) and each
 * value a `uint64` (P26 §3.2; vectors 78, 79, 82 and 88).
 */
export function headerTimestamps(
  headers: Readonly<Record<string, unknown>>
): Map<bigint, bigint> {
  const out = new Map<bigint, bigint>();
  for (const [key, value] of Object.entries(headers)) {
    if (!CANONICAL_DECIMAL.test(key)) {
      throw invalid(
        `header key ${JSON.stringify(key)} is not the canonical decimal of a block number`
      );
    }
    out.set(
      readUint(BigInt(key), 64, `header ${key}`),
      readUint(value, 64, `the timestamp of block ${key}`)
    );
  }
  return out;
}

interface Cutoff {
  readonly block: bigint;
  readonly timestamp: bigint;
}

/**
 * The cutoff of the cycle closed by an upload date (P26 §4.2): the block `b`
 * with `ts(b) < M <= ts(b + 1)`, `b + 1` finalized. `headers` is every header
 * read; ordered by block number, their timestamps must strictly increase,
 * adjacent or not. Throws when there is no cutoff: a header set out of
 * order, no straddling pair, or `b + 1` not yet finalized.
 */
export function selectCutoff(
  date: string,
  headers: Readonly<Record<string, unknown>>,
  finalized: Uint
): Cutoff {
  const boundary = BigInt(cycleBoundary(cycleDayOfUploadDate(date)));
  const stamps = headerTimestamps(headers);
  const last = readUint(finalized, 64, "the finalized block number");
  const blocks = [...stamps.keys()].sort((a, b) => (a < b ? -1 : 1));
  for (let i = 1; i < blocks.length; i++) {
    const a = blocks[i - 1] as bigint;
    const b = blocks[i] as bigint;
    if ((stamps.get(b) as bigint) <= (stamps.get(a) as bigint)) {
      throw invalid(
        `header timestamps do not increase from block ${a} to ${b} (P26 §4.2)`
      );
    }
  }
  for (const b of blocks) {
    const ts = stamps.get(b) as bigint;
    const next = stamps.get(b + 1n);
    if (next !== undefined && ts < boundary && boundary <= next) {
      if (b + 1n > last) {
        throw invalid(
          `block ${b + 1n} after the boundary is not finalized (P26 §4.2)`
        );
      }
      return { block: b, timestamp: ts };
    }
  }
  throw invalid("no header pair straddles the cycle boundary (P26 §4.2)");
}
