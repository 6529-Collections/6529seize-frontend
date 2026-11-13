import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  nextMintDateOnOrAfter,
  prevMintDateOnOrBefore,
  getMintNumberForMintDate,
  getSeasonIndexForDate,
  displayedEonNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedYearNumberFromIndex,
  displayedSeasonNumberFromIndex,
  getRangeDatesByZoom,
} from "../../shared/memes-calendar/calendar";
export * from "../../shared/memes-calendar/calendar";

// Build a matrix of weeks for a given month (numbers or nulls). Align by UTC weekday.
export function getMonthWeeks(
  year: number,
  month: number
): (number | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];

  // Monday-first: convert Sunday(0) to 7, then pad (dow - 1) nulls.
  const dow = firstDay.getUTCDay();
  const monFirstIndex = dow === 0 ? 7 : dow; // 1..7 (Mon..Sun)
  for (let i = 1; i < monFirstIndex; i++) week.push(null);

  for (let day = 1; day <= totalDays; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// Format helpers
export function toISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${da}`;
}

// Display timezone toggle type
export type DisplayTz = "local" | "utc";

export function formatMint(n: number, locale = "en-US"): string {
  return `#${n.toLocaleString(locale)}`;
}

export function formatUtcMonth(
  d: Date,
  style: "short" | "long" = "short",
  locale = "en-US"
): string {
  return d.toLocaleString(locale, {
    month: style,
    timeZone: "UTC",
  });
}

export function formatUtcMonthYear(
  d: Date,
  style: "short" | "long" = "short",
  locale = "en-US"
): string {
  return `${formatUtcMonth(d, style, locale)} ${d.getUTCFullYear()}`;
}

export function formatFullDate(
  d: Date,
  mode: DisplayTz = "local",
  locale = "en-US"
): string {
  return d.toLocaleDateString(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(mode === "utc" ? { timeZone: "UTC" } : {}),
  });
}
export const formatFullDateTime = (
  d: Date,
  mode: DisplayTz = "local",
  locale = "en-US",
  options: Readonly<{ hour12?: boolean }> = {}
): string => {
  const hour12 = options.hour12 ?? (mode === "utc" ? false : undefined);
  const s = d.toLocaleString(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(mode === "utc" ? { timeZone: "UTC" } : {}),
    ...(hour12 === undefined ? {} : { hour12 }),
  });
  return mode === "utc" ? `${s} UTC` : s;
};

// ---- Calendar links: create timed events with UTC Z timestamps ----
// Helper: get label for a date range using mint numbers (locale formatted)
export function getRangeLabel(
  start: Date,
  end: Date,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const startMintDate = nextMintDateOnOrAfter(start);
  const endMintDate = prevMintDateOnOrBefore(end);
  if (startMintDate.getTime() > endMintDate.getTime()) return "—";
  const startMint = getMintNumberForMintDate(startMintDate);
  const endMint = getMintNumberForMintDate(endMintDate);
  return t(locale, "memeCalendar.grid.memeRange", {
    start: formatInteger(locale, startMint),
    end: formatInteger(locale, endMint),
  });
}

export function formatToFullDivision(
  d: Date,
  locale: SupportedLocale = DEFAULT_LOCALE
): React.ReactNode {
  const idx = getSeasonIndexForDate(d);
  const eon = displayedEonNumberFromIndex(idx);
  const era = displayedEraNumberFromIndex(idx);
  const period = displayedPeriodNumberFromIndex(idx);
  const epoch = displayedEpochNumberFromIndex(idx);
  const year = displayedYearNumberFromIndex(idx);
  const szn = displayedSeasonNumberFromIndex(idx);

  const fmt = (date: Date) =>
    date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const range = (start: Date, end: Date) => `${fmt(start)} - ${fmt(end)}`;

  const seasonDates = getRangeDatesByZoom("szn", idx);
  const yearDates = getRangeDatesByZoom("year", idx);
  const epochDates = getRangeDatesByZoom("epoch", idx);
  const periodDates = getRangeDatesByZoom("period", idx);
  const eraDates = getRangeDatesByZoom("era", idx);
  const eonDates = getRangeDatesByZoom("eon", idx);

  return (
    <table className="tw-w-full tw-border-collapse">
      <tbody>
        {printDivision(
          "SZN",
          szn,
          range(seasonDates.start, seasonDates.end),
          locale
        )}
        {printDivision(
          "Year",
          year,
          range(yearDates.start, yearDates.end),
          locale
        )}
        {printDivision(
          "Epoch",
          epoch,
          range(epochDates.start, epochDates.end),
          locale
        )}
        {printDivision(
          "Period",
          period,
          range(periodDates.start, periodDates.end),
          locale
        )}
        {printDivision("Era", era, range(eraDates.start, eraDates.end), locale)}
        {printDivision("Eon", eon, range(eonDates.start, eonDates.end), locale)}
      </tbody>
    </table>
  );
}

function printDivision(
  label: string,
  number: number,
  range: string,
  locale: SupportedLocale
) {
  return (
    <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800/80 last:tw-border-b-0">
      <td className="tw-w-24 tw-whitespace-nowrap tw-py-2 tw-pr-4 tw-align-top tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
        {label} {formatInteger(locale, number)}
      </td>
      <td className="tw-min-w-0 tw-py-2 tw-text-right tw-align-top">
        <span className="tw-break-words tw-text-sm tw-leading-5 tw-text-iron-300">
          {range}
        </span>
      </td>
    </tr>
  );
}

export { wallTimeToUtcInstantInZone } from "./meme-calendar.zone";
export { printCalendarInvites } from "./meme-calendar.invites";
export {
  getCanonicalNextMintNumber,
  getUpcomingMintsAcrossSeasons,
  getUpcomingMintsForCurrentOrNextSeason,
  getUpcomingMintsForSeasonIndex,
  type SeasonMintRow,
  type SeasonMintScanResult,
} from "./meme-calendar.upcoming";

// ---- Reusable season scan helper ----
