import { CUSTOM_EXTRA_MINT_DAYS } from "./meme-calendar.overrides.extra";
import { CUSTOM_RESCHEDULED_MINTS } from "./meme-calendar.overrides.rescheduled";
import { CUSTOM_SKIPPED_MINT_DAYS } from "./meme-calendar.overrides.skipped";

export interface MintDayOverride {
  readonly isoDate: string;
  readonly note?: string;
}

export interface MintRescheduleOverride {
  readonly mintNumber: number;
  readonly from: string;
  readonly to: string;
  readonly note?: string;
}

const BASE_SKIPPED_MINT_DAYS: readonly MintDayOverride[] = [
  { isoDate: "2023-05-08" },
  { isoDate: "2024-02-07" },
];

const BASE_EXTRA_MINT_DAYS: readonly MintDayOverride[] = [
  { isoDate: "2023-10-26", note: "Off-schedule Thursday mint for Meme #157" },
  { isoDate: "2023-11-28", note: "Off-schedule Tuesday mint for Meme #182" },
];

function isoToUtcDayNumber(isoDate: string): number {
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = regex.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid ISO date string for mint override: ${isoDate}`);
  }
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

const rescheduleSkipDays = CUSTOM_RESCHEDULED_MINTS.map((reschedule) => ({
  isoDate: reschedule.from,
  note: reschedule.note,
}));

const rescheduleExtraDays = CUSTOM_RESCHEDULED_MINTS.map((reschedule) => ({
  isoDate: reschedule.to,
  note: reschedule.note,
}));

const allSkippedMintDays = [
  ...BASE_SKIPPED_MINT_DAYS,
  ...CUSTOM_SKIPPED_MINT_DAYS,
  ...rescheduleSkipDays,
];

const allExtraMintDays = [
  ...BASE_EXTRA_MINT_DAYS,
  ...CUSTOM_EXTRA_MINT_DAYS,
  ...rescheduleExtraDays,
];

const noteSourceDays = [...allSkippedMintDays, ...allExtraMintDays];

const MINT_OVERRIDE_NOTES = new Map<number, string>();

for (const { isoDate, note } of noteSourceDays) {
  if (!note) continue;
  const utcDay = isoToUtcDayNumber(isoDate);
  const existing = MINT_OVERRIDE_NOTES.get(utcDay);
  MINT_OVERRIDE_NOTES.set(utcDay, existing ? `${existing}\n${note}` : note);
}

function utcDayNumberFromDate(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getMintOverrideNoteForUtcDay(utcDay: Date): string | undefined {
  return MINT_OVERRIDE_NOTES.get(utcDayNumberFromDate(utcDay));
}

export const SKIPPED_MINT_UTC_DAYS = new Set<number>(
  allSkippedMintDays.map(({ isoDate }) => isoToUtcDayNumber(isoDate))
);

export const EXTRA_MINT_UTC_DAYS = new Set<number>(
  allExtraMintDays.map(({ isoDate }) => isoToUtcDayNumber(isoDate))
);
