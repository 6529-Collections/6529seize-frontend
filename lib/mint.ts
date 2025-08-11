import { RRule } from 'rrule';
import { DateTime } from 'luxon';

export interface MintItem {
  number: number;
  utc: string;
  title?: string;
  edition?: string;
}

export interface TimeCoordinate {
  eon: number;
  era: number;
  period: number;
  epoch: number;
  year: number;
  season: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export const MINT_TIME_UTC = '18:00';

export const FIRST_PROTOCOL_MINT = DateTime.fromISO(
  `2026-01-02T${MINT_TIME_UTC}Z`,
  { zone: 'utc' },
);

export const PROLOGUE_LAST = 438;

export const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO, RRule.WE, RRule.FR],
  dtstart: FIRST_PROTOCOL_MINT.toJSDate(),
});

export function dateForMintNumber(n: number, prologue: MintItem[]): DateTime {
  if (n <= PROLOGUE_LAST) {
    const rec = prologue.find((x) => x.number === n);
    if (!rec) throw new Error(`Mint ${n} not found in prologue`);
    return DateTime.fromISO(rec.utc, { zone: 'utc' });
  }
  const idx = n - (PROLOGUE_LAST + 1);
  const offsets = [0, 3, 5];
  const weeks = Math.floor(idx / 3);
  const r = idx % 3;
  return FIRST_PROTOCOL_MINT.plus({ days: weeks * 7 + offsets[r] });
}

export function mintNumberForDate(
  dtUtc: DateTime,
  prologue: MintItem[],
): number | null {
  const p = prologue.find((x) => x.utc.startsWith(dtUtc.toISODate()!));
  if (p) return p.number;
  if (dtUtc < FIRST_PROTOCOL_MINT) return null;
  const wd = dtUtc.weekday;
  if (![1, 3, 5].includes(wd)) return null;
  const diffDays = dtUtc.startOf('day').diff(
    FIRST_PROTOCOL_MINT.startOf('day'),
    'days',
  ).days;
  const r = wd === 5 ? 0 : wd === 1 ? 1 : 2;
  const weeks = Math.floor((diffDays - [0, 3, 5][r]) / 7);
  const idx = weeks * 3 + r;
  return PROLOGUE_LAST + 1 + idx;
}

export function timeCoordinate(dtUtc: DateTime): TimeCoordinate {
  const y = dtUtc.year;
  const yearsSince2026 = y - 2026;
  const eon = Math.floor(yearsSince2026 / 1000) + 1;
  const era = Math.floor((yearsSince2026 % 1000) / 100) + 1;
  const period = Math.floor((yearsSince2026 % 100) / 20) + 1;
  const epoch = Math.floor((yearsSince2026 % 20) / 4);
  const season = (() => {
    const m = dtUtc.month;
    if (m <= 3) return 'Q1';
    if (m <= 6) return 'Q2';
    if (m <= 9) return 'Q3';
    return 'Q4';
  })();
  return { eon, era, period, epoch, year: y, season };
}

export function nextOccurrences(n = 6): DateTime[] {
  const now = DateTime.utc().toJSDate();
  const jsDates = rule.all((d, i) => i < n && d >= now);
  return jsDates.map((d) => DateTime.fromJSDate(d, { zone: 'utc' }));
}

export function googleCalendarLink(
  startUtc: DateTime,
  durationMin = 30,
): string {
  const fmt = "yyyyLLdd'T'HHmmss'Z'";
  const start = startUtc.toUTC().toFormat(fmt);
  const end = startUtc
    .plus({ minutes: durationMin })
    .toUTC()
    .toFormat(fmt);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Protocol+Mint&dates=${start}/${end}`;
}

