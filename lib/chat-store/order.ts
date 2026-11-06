/**
 * Message order. Full records sort by (time, serial, key), oldest first;
 * the wave shows them newest first. This keeps today's rule: created_at
 * first (so a pending send sits at its local send time among accepted
 * messages), then serial_no. The key makes the order total.
 *
 * Placeholders (LIGHT records from the drop-ID index) have no time. They
 * keep a serial-ordered list of their own and are placed among accepted
 * records by serial when the wave is read, which is the order today's
 * comparator gives them.
 */
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

export interface OrderEntry {
  /** created_at in epoch ms; serial_no when created_at is missing (as today). */
  readonly t: number;
  readonly s: number;
  readonly k: string;
  /** A pending send: its serial is client-side, so it never places placeholders. */
  readonly p: boolean;
}

export interface PlaceholderEntry {
  readonly s: number;
  readonly k: string;
}

const compareKeys = (a: string, b: string): number => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export function compareOrderEntries(a: OrderEntry, b: OrderEntry): number {
  return a.t - b.t || a.s - b.s || compareKeys(a.k, b.k);
}

export function comparePlaceholderEntries(
  a: PlaceholderEntry,
  b: PlaceholderEntry
): number {
  return a.s - b.s || compareKeys(a.k, b.k);
}

/** Today's `getDropCreatedAtMillis`, computed once per record version. */
export function recordTime(drop: ExtendedDrop): number {
  const createdAt: unknown = drop.created_at;
  if (createdAt === undefined || createdAt === null) {
    return drop.serial_no;
  }
  const timestamp =
    typeof createdAt === "number"
      ? createdAt
      : new Date(createdAt as string).getTime();
  return Number.isFinite(timestamp) ? timestamp : drop.serial_no;
}

export function orderEntryFor(
  drop: ExtendedDrop,
  key: string,
  pending: boolean
): OrderEntry {
  return { t: recordTime(drop), s: drop.serial_no, k: key, p: pending };
}
