// Constants for division sizes
export const SEASONS_PER_YEAR = 4;
export const SEASONS_PER_EPOCH = SEASONS_PER_YEAR * 4; // 16 seasons per epoch (4 years)
export const SEASONS_PER_PERIOD = SEASONS_PER_EPOCH * 5; // 80 seasons per period (20 years)
export const SEASONS_PER_ERA = SEASONS_PER_PERIOD * 5; // 400 seasons per era (100 years)
export const SEASONS_PER_EON = SEASONS_PER_ERA * 10; // 4000 seasons per eon (1000 years)

const MINT_UTC_HOUR = 14;
const MINT_UTC_MINUTE = 40;

// Starting date for Season 1 (SZN 1)
export const START_DATE = new Date(
  Date.UTC(2026, 0, 1, MINT_UTC_HOUR, MINT_UTC_MINUTE, 0)
);

// ---- Mint schedule helpers (Mon/Wed/Fri only) ----
export const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
export function isMintDow(dow: number): boolean {
  return dow === 1 || dow === 3 || dow === 5; // Mon/Wed/Fri
}
export function isMintDayDate(d: Date): boolean {
  return isMintDow(d.getDay());
}
export function immediatelyNextMintDate(d: Date): Date {
  if (d < START_DATE) {
    d = new Date(START_DATE);
  }
  d.setUTCHours(MINT_UTC_HOUR, MINT_UTC_MINUTE, 0, 0);
  for (let i = 0; i < 7; i++) {
    if (isMintDayDate(d)) return d;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}
export function nextMintDateOnOrAfter(d: Date): Date {
  if (d < START_DATE) return START_DATE;
  const x = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  for (let i = 0; i < 7; i++) {
    if (isMintDayDate(x)) return x;
    x.setUTCDate(x.getUTCDate() + 1);
  }
  return x;
}
export function prevMintDateOnOrBefore(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  for (let i = 0; i < 7; i++) {
    if (isMintDayDate(x)) return x;
    x.setDate(x.getDate() - 1);
  }
  return x;
}
export const FIRST_MINT_DATE = nextMintDateOnOrAfter(START_DATE);
/**
 * Count only Mon/Wed/Fri since FIRST_MINT_DATE. Assumes the input
 * date is itself a mint day.
 */
export function getMintNumberForMintDate(date: Date): number {
  if (date < FIRST_MINT_DATE) return 1;
  // Use UTC math so DST shifts don’t create off-by-one day errors
  const ay = FIRST_MINT_DATE.getFullYear();
  const am = FIRST_MINT_DATE.getMonth();
  const ad = FIRST_MINT_DATE.getDate();
  const by = date.getFullYear();
  const bm = date.getMonth();
  const bd = date.getDate();
  const utcA = Date.UTC(ay, am, ad);
  const utcB = Date.UTC(by, bm, bd);
  const diffDays = Math.round((utcB - utcA) / MILLIS_PER_DAY);
  const fullWeeks = Math.floor(diffDays / 7);
  const remainder = diffDays % 7; // 0..6
  let partial = 0;
  const baseDow = new Date(utcA).getUTCDay();
  for (let i = 0; i <= remainder; i++) {
    if (isMintDow((baseDow + i) % 7)) partial++;
  }
  return fullWeeks * 3 + partial; // 1 when diffDays = 0
}

// Helper: get the number of whole months between two dates
export function monthsBetween(a: Date, b: Date): number {
  const ay = a.getFullYear();
  const am = a.getMonth();
  const by = b.getFullYear();
  const bm = b.getMonth();
  return (by - ay) * 12 + (bm - am);
}

// Compute the season index (0-based) for any given date
export function getSeasonIndexForDate(d: Date): number {
  if (d <= START_DATE) return 0;
  const months = monthsBetween(START_DATE, d);
  return Math.floor(months / 3);
}

// Type definitions for zoom levels
export type ZoomLevel = "season" | "year" | "epoch" | "period" | "era" | "eon";

// Compute the start date of a season
export function getSeasonStartDate(seasonIndex: number): Date {
  const date = new Date(START_DATE);
  date.setMonth(date.getMonth() + seasonIndex * 3);
  return date;
}

// Helper: add N months to a date and return the last day of the resulting month
export function addMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  // last day of (m + months) month
  return new Date(y, m + months + 1, 0);
}

/**
 * Compute the ordinal mint number for a *mint day*.
 * The first actual mint is the first Mon/Wed/Fri on or after 1 Jan 2026.
 * If a non‑mint day is passed, we snap forward to the next mint day.
 */
export function getMintNumber(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mintDate = isMintDayDate(d) ? d : nextMintDateOnOrAfter(d);
  return getMintNumberForMintDate(mintDate);
}

// Inverse of getMintNumber: get date from a (1-based) meme number
export function dateFromMintNumber(n: number): Date {
  if (n <= 1) return new Date(FIRST_MINT_DATE);
  const n1 = n - 1; // steps after the first mint
  const weeks = Math.floor(n1 / 3);
  const rem = n1 % 3; // 0..2
  const base = new Date(
    FIRST_MINT_DATE.getFullYear(),
    FIRST_MINT_DATE.getMonth(),
    FIRST_MINT_DATE.getDate()
  );
  base.setDate(base.getDate() + weeks * 7);
  const mintDows = [1, 3, 5];
  const baseDowUtc = new Date(
    Date.UTC(base.getFullYear(), base.getMonth(), base.getDate())
  ).getUTCDay();
  const i = mintDows.indexOf(baseDowUtc);
  const targetDow = mintDows[(i + rem) % 3];
  const delta = (targetDow - baseDowUtc + 7) % 7;
  base.setDate(base.getDate() + delta);
  return base;
}

// Build a matrix of weeks for a given month (numbers or nulls)
export function getMonthWeeks(
  year: number,
  month: number
): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];

  // Pad to first weekday
  for (let i = 0; i < firstDay.getDay(); i++) {
    week.push(null);
  }
  // Fill days
  for (let day = 1; day <= totalDays; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }
  return weeks;
}

// Format a date as ISO for keys
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---- Mint / calendar helpers ----
export function formatMint(n: number): string {
  return `#${n.toLocaleString()}`;
}
export function formatFullDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
export const formatFullDateTime = (d: Date): string => {
  return d.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${da}`;
}
export function createGoogleCalendarUrl(
  date: Date,
  title: string,
  details: string
): string {
  const start = ymd(date);
  const end = ymd(date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${title} Minting`,
    dates: `${start}/${end}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
export function createIcsDataUrl(
  date: Date,
  title: string,
  description: string
): string {
  const dtStart = ymd(date);
  const dtEndDate = new Date(date);
  dtEndDate.setDate(dtEndDate.getDate() + 1);
  const dtEnd = ymd(dtEndDate);
  const uid = `meme-${dtStart}@6529.io`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//6529.io//Meme Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${ymd(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

// Helper: get label for a date range using mint numbers (locale formatted)
export function getRangeLabel(start: Date, end: Date): string {
  const startMintDate = nextMintDateOnOrAfter(start);
  const endMintDate = prevMintDateOnOrBefore(end);
  if (startMintDate.getTime() > endMintDate.getTime()) return "—";
  const startMint = getMintNumberForMintDate(startMintDate).toLocaleString();
  const endMint = getMintNumberForMintDate(endMintDate).toLocaleString();
  return `Memes #${startMint} - #${endMint}`;
}
export function formatToFullDivision(d: Date): string {
  const eonIndex = Math.floor(getSeasonIndexForDate(d) / SEASONS_PER_EON) + 1;
  const eraIndex = Math.floor(getSeasonIndexForDate(d) / SEASONS_PER_ERA) + 1;
  const periodIndex =
    Math.floor(getSeasonIndexForDate(d) / SEASONS_PER_PERIOD) + 1;
  const epochIndex =
    Math.floor(getSeasonIndexForDate(d) / SEASONS_PER_EPOCH) + 1;
  const yearIndex = Math.floor(getSeasonIndexForDate(d) / SEASONS_PER_YEAR) + 1;
  const seasonIndex = getSeasonIndexForDate(d) + 1;
  return `Eon ${eonIndex} / Era ${eraIndex} / Period ${periodIndex} / Epoch ${epochIndex} / Year ${yearIndex} / SZN ${seasonIndex}`;
}

export function printCalendarInvites(
  date: Date,
  mintNumber: number,
  fontColor: string = "#fff",
  size: number = 22
): string {
  const title = `Meme ${formatMint(mintNumber)}`;
  const full = formatFullDate(date);
  const details = `${title} — ${full}\n\nhttps://6529.io/the-memes/mint`;
  const gUrl = createGoogleCalendarUrl(date, title, details);
  const icsUrl = createIcsDataUrl(date, title, details);

  return `
    <div style="display:flex; gap:15px; align-items:center;">
      <a href="${icsUrl}" download="meme-${mintNumber}-minting.ics" title="Add to Calendar" style="display:flex; align-items:center; gap:5px; text-decoration:none; color:${fontColor};">
        <img src="/calendar-ics.png" style="width:${size}px;height:${size}px" />
      </a>
      <a href="${gUrl}" target="_blank" rel="noopener noreferrer" title="Add to Google Calendar" style="display:flex; align-items:center; gap:5px; text-decoration:none; color:${fontColor};">
        <img src="/calendar-google.png" style="width:${size}px;height:${size}px" />
      </a>
    </div>`;
}
