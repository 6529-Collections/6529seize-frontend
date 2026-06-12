"use client";

import useIsMobileScreen from "@/hooks/isMobileScreen";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  faCaretLeft,
  faCaretRight,
  faInfoCircle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState, type FormEvent } from "react";
import { Tooltip } from "react-tooltip";
import type { DisplayTz, ZoomLevel } from "./meme-calendar.helpers";
import {
  addMonths,
  dateFromMintNumber,
  displayedEonNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedSeasonNumberFromIndex,
  displayedYearNumberFromIndex,
  formatFullDate,
  formatFullDateTime,
  formatMint,
  formatUtcMonth,
  formatUtcMonthYear,
  getMintNumberForMintDate,
  getMonthWeeks,
  getRangeDatesByZoom,
  getRangeLabel,
  getSeasonIndexForDate,
  getSeasonStartDate,
  isMintEligibleUtcDay,
  isSznOneIndex,
  mintStartInstantUtcForMintDay,
  printCalendarInvites,
  SEASONS_PER_EPOCH,
  SEASONS_PER_ERA,
  SEASONS_PER_PERIOD,
  SEASONS_PER_YEAR,
  SZN1_RANGE,
  SZN1_SEASON_INDEX,
  toISO,
  ymd,
} from "./meme-calendar.helpers";
import { getMintOverrideNoteForUtcDay } from "./meme-calendar.overrides";
import { getHistoricalMintsOnUtcDay } from "./meme-calendar.szn1";

/*
 * MemeCalendar (TypeScript version)
 *
 * This component implements a custom calendar for Next.js projects that
 * follows the “Meme” time system.  All divisions (SZN, Year,
 * Epoch, Period, Era, Eon) accumulate from a fixed starting date
 * of 1 January 2026. Users can zoom between divisions and
 * navigate forwards/backwards. Tailwind classes are prefixed with
 * `tw-` - configure your Tailwind setup accordingly.
 */

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const ZOOM_LEVELS: readonly ZoomLevel[] = [
  "szn",
  "year",
  "epoch",
  "period",
  "era",
  "eon",
];

const ZOOM_MESSAGE_KEYS: Record<
  ZoomLevel,
  {
    readonly division: MessageKey;
    readonly title: MessageKey;
    readonly zoom: MessageKey;
  }
> = {
  szn: {
    division: "memeCalendar.grid.division.szn",
    title: "memeCalendar.grid.title.szn",
    zoom: "memeCalendar.grid.zoom.szn",
  },
  year: {
    division: "memeCalendar.grid.division.year",
    title: "memeCalendar.grid.title.year",
    zoom: "memeCalendar.grid.zoom.year",
  },
  epoch: {
    division: "memeCalendar.grid.division.epoch",
    title: "memeCalendar.grid.title.epoch",
    zoom: "memeCalendar.grid.zoom.epoch",
  },
  period: {
    division: "memeCalendar.grid.division.period",
    title: "memeCalendar.grid.title.period",
    zoom: "memeCalendar.grid.zoom.period",
  },
  era: {
    division: "memeCalendar.grid.division.era",
    title: "memeCalendar.grid.title.era",
    zoom: "memeCalendar.grid.zoom.era",
  },
  eon: {
    division: "memeCalendar.grid.division.eon",
    title: "memeCalendar.grid.title.eon",
    zoom: "memeCalendar.grid.zoom.eon",
  },
};

const GRID_INFO_ITEMS: ReadonlyArray<{
  readonly label: MessageKey;
  readonly text: MessageKey;
  readonly note?: MessageKey;
}> = [
  {
    label: "memeCalendar.grid.info.mintingDays.label",
    text: "memeCalendar.grid.info.mintingDays.text",
  },
  {
    label: "memeCalendar.grid.info.szn.label",
    text: "memeCalendar.grid.info.szn.text",
    note: "memeCalendar.grid.info.szn.note",
  },
  {
    label: "memeCalendar.grid.info.year.label",
    text: "memeCalendar.grid.info.year.text",
    note: "memeCalendar.grid.info.year.note",
  },
  {
    label: "memeCalendar.grid.info.epoch.label",
    text: "memeCalendar.grid.info.epoch.text",
    note: "memeCalendar.grid.info.epoch.note",
  },
  {
    label: "memeCalendar.grid.info.period.label",
    text: "memeCalendar.grid.info.period.text",
    note: "memeCalendar.grid.info.period.note",
  },
  {
    label: "memeCalendar.grid.info.era.label",
    text: "memeCalendar.grid.info.era.text",
    note: "memeCalendar.grid.info.era.note",
  },
  {
    label: "memeCalendar.grid.info.eon.label",
    text: "memeCalendar.grid.info.eon.text",
    note: "memeCalendar.grid.info.eon.note",
  },
  {
    label: "memeCalendar.grid.info.yearZero.label",
    text: "memeCalendar.grid.info.yearZero.text",
    note: "memeCalendar.grid.info.yearZero.note",
  },
] as const;

function getZoomNumber(zoom: ZoomLevel, seasonIndex: number): number {
  switch (zoom) {
    case "szn":
      return displayedSeasonNumberFromIndex(seasonIndex);
    case "year":
      return displayedYearNumberFromIndex(seasonIndex);
    case "epoch":
      return displayedEpochNumberFromIndex(seasonIndex);
    case "period":
      return displayedPeriodNumberFromIndex(seasonIndex);
    case "era":
      return displayedEraNumberFromIndex(seasonIndex);
    case "eon":
      return displayedEonNumberFromIndex(seasonIndex);
  }
}

function getZoomLabel(
  locale: SupportedLocale,
  zoom: ZoomLevel,
  value: number
): string {
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].zoom, {
    value: formatInteger(locale, value),
  });
}

function getZoomTitle(
  locale: SupportedLocale,
  zoom: ZoomLevel,
  seasonIndex: number
): string {
  const value = formatInteger(locale, getZoomNumber(zoom, seasonIndex));
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].title, { value });
}

function getDivisionName(locale: SupportedLocale, zoom: ZoomLevel): string {
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].division);
}

function getDivisionTitle(
  locale: SupportedLocale,
  zoom: ZoomLevel,
  value: number
): string {
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].title, {
    value: formatInteger(locale, value),
  });
}

function formatCalendarYear(locale: SupportedLocale, year: number): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(year);
}

function getDivisionTitleWithGregorianYear(
  locale: SupportedLocale,
  zoom: ZoomLevel,
  value: number,
  year: number
): string {
  return t(locale, "memeCalendar.grid.titleWithGregorianYear", {
    title: getDivisionTitle(locale, zoom, value),
    year: formatCalendarYear(locale, year),
  });
}

function getDateRangeLabel(
  locale: SupportedLocale,
  start: Date,
  end: Date
): string {
  return t(locale, "memeCalendar.grid.dateRange", {
    start: formatUtcMonthYear(start, "short", locale),
    end: formatUtcMonthYear(end, "short", locale),
  });
}

function getMemeRangeLabel(
  locale: SupportedLocale,
  start: number,
  end: number
): string {
  return t(locale, "memeCalendar.grid.memeRange", {
    start: formatInteger(locale, start),
    end: formatInteger(locale, end),
  });
}

function getDrilldownCardAriaLabel(
  locale: SupportedLocale,
  title: string,
  range: string,
  mints: string
): string {
  return t(locale, "memeCalendar.grid.cardAriaLabel", {
    title,
    range,
    mints,
  });
}

function getCalendarInviteLabels(locale: SupportedLocale) {
  return {
    addToCalendar: t(locale, "memeCalendar.invites.addToCalendar"),
    addToGoogleCalendar: t(locale, "memeCalendar.invites.addToGoogleCalendar"),
  };
}

const DRILLDOWN_CARD_CLASS =
  "tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-black tw-p-3 hover:tw-bg-[#eee] hover:tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

interface DrilldownCardProps {
  readonly title: string;
  readonly range: string;
  readonly mints: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
  readonly locale: SupportedLocale;
}

function DrilldownCard({
  title,
  range,
  mints,
  isCurrent,
  onClick,
  locale,
}: DrilldownCardProps) {
  return (
    <button
      type="button"
      aria-label={getDrilldownCardAriaLabel(locale, title, range, mints)}
      className={DRILLDOWN_CARD_CLASS}
      style={{
        borderColor: isCurrent ? "#20fa59" : "#222222",
        borderWidth: isCurrent ? "2px" : "1px",
      }}
      onClick={onClick}
    >
      <div className="tw-font-semibold">{title}</div>
      <div className="tw-text-xs tw-text-gray-500">{range}</div>
      <div className="tw-mt-1 tw-text-sm">{mints}</div>
    </button>
  );
}

interface HistoricalLaunchDrilldownCardProps {
  readonly title: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
  readonly locale: SupportedLocale;
}

function HistoricalLaunchDrilldownCard({
  title,
  isCurrent,
  onClick,
  locale,
}: HistoricalLaunchDrilldownCardProps) {
  const start = new Date(SZN1_RANGE.start);
  const end = new Date(SZN1_RANGE.end);
  const range = getDateRangeLabel(locale, start, end);
  const mints = getMemeRangeLabel(locale, 1, 47);

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4">
      <DrilldownCard
        title={title}
        range={range}
        mints={mints}
        isCurrent={isCurrent}
        locale={locale}
        onClick={onClick}
      />
    </div>
  );
}

// Props types
interface MonthProps {
  readonly date: Date;
  readonly onSelectDay?: ((date: Date) => void) | undefined;
  readonly autoOpenYmd?: string | undefined;
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
}
interface SeasonViewProps {
  readonly seasonIndex: number;
  readonly onSelectDay?: ((date: Date) => void) | undefined;
  readonly autoOpenYmd?: string | undefined;
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
}
interface YearViewProps {
  readonly seasonIndex: number;
  readonly onSelectSeason: (seasonIndex: number) => void;
  readonly onZoomToSeason: () => void;
  readonly locale: SupportedLocale;
}
interface EpochViewProps {
  readonly seasonIndex: number;
  readonly onSelectSeason: (seasonIndex: number) => void;
  readonly onSelectYear: (yearNumber: number) => void;
  readonly onZoomToYear: () => void;
  readonly locale: SupportedLocale;
}
interface PeriodViewProps {
  readonly seasonIndex: number;
  readonly onSelectEpoch: (epochNumber: number) => void;
  readonly onZoomToEpoch: () => void;
  readonly locale: SupportedLocale;
}
interface EraViewProps {
  readonly seasonIndex: number;
  readonly onSelectPeriod: (periodNumber: number) => void;
  readonly onZoomToPeriod: () => void;
  readonly locale: SupportedLocale;
}
interface EonViewProps {
  readonly seasonIndex: number;
  readonly onSelectEra: (eraNumber: number) => void;
  readonly onZoomToEra: () => void;
  readonly locale: SupportedLocale;
}

type TooltipPlace = "top" | "bottom" | "right";
type HistoricalMint = ReturnType<typeof getHistoricalMintsOnUtcDay>[number];

interface MintCellDetails {
  readonly historical: HistoricalMint[];
  readonly isMintDay: boolean;
  readonly mintInstantUtc: Date | undefined;
  readonly mintLabel: string | undefined;
  readonly mintNumber: number | undefined;
}

interface MintTooltip {
  readonly className: string;
  readonly html: string;
}

interface MonthDayCellProps {
  readonly cellOffset: number;
  readonly day: number;
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
  readonly month: number;
  readonly onSelectDay?: ((date: Date) => void) | undefined;
  readonly year: number;
}

function getTooltipPlace(cellOffset: number): TooltipPlace {
  const col = cellOffset % 7;
  const row = Math.floor(cellOffset / 7);

  if (col <= 1) {
    return "right";
  }

  return row <= 1 ? "bottom" : "top";
}

function formatHistoricalMintLabel(
  historical: readonly HistoricalMint[],
  locale: SupportedLocale
): string | undefined {
  const first = historical[0];
  const last = historical[historical.length - 1];

  if (!first || !last) {
    return undefined;
  }

  if (historical.length === 1) {
    return `#${formatInteger(locale, first.id)}`;
  }

  return `#${formatInteger(locale, first.id)}-#${formatInteger(locale, last.id)}`;
}

function getMintCellDetails(
  cellDateUtcDay: Date,
  locale: SupportedLocale
): MintCellDetails {
  const historical = getHistoricalMintsOnUtcDay(cellDateUtcDay);

  if (historical.length > 0) {
    return {
      historical,
      isMintDay: true,
      mintInstantUtc: historical[0]?.instantUtc,
      mintLabel: formatHistoricalMintLabel(historical, locale),
      mintNumber: historical[0]?.id,
    };
  }

  if (isMintEligibleUtcDay(cellDateUtcDay)) {
    const mintNumber = getMintNumberForMintDate(cellDateUtcDay);

    return {
      historical,
      isMintDay: true,
      mintInstantUtc: mintStartInstantUtcForMintDay(cellDateUtcDay),
      mintLabel: formatMint(mintNumber, locale),
      mintNumber,
    };
  }

  return {
    historical,
    isMintDay: false,
    mintInstantUtc: undefined,
    mintLabel: undefined,
    mintNumber: undefined,
  };
}

function getHistoricalTooltipHtml(
  historical: readonly HistoricalMint[],
  displayTz: DisplayTz,
  locale: SupportedLocale
): string {
  const firstInstant = historical[0]?.instantUtc;

  if (!firstInstant) {
    return "";
  }

  const items = historical
    .map((h) => `#${formatInteger(locale, h.id)}`)
    .join(", ");
  const tooltipTitle = t(
    locale,
    historical.length > 1
      ? "memeCalendar.grid.tooltip.memes"
      : "memeCalendar.grid.tooltip.meme",
    historical.length > 1 ? { mints: items } : { mint: items }
  );

  return `<div style="min-width:220px">
    <div style="font-weight:600; margin-bottom:3px; font-size:larger">
      ${escapeHtml(tooltipTitle)}
    </div>
    <div style="margin-bottom:12px">${formatFullDate(
      firstInstant,
      displayTz,
      locale
    )}</div>
  </div>`;
}

function getScheduledMintTooltip({
  displayTz,
  locale,
  mintInstantUtc,
  mintLabel,
  mintNumber,
  noteTooltipContent,
}: {
  readonly displayTz: DisplayTz;
  readonly locale: SupportedLocale;
  readonly mintInstantUtc: Date | undefined;
  readonly mintLabel: string | undefined;
  readonly mintNumber: number | undefined;
  readonly noteTooltipContent: string;
}): MintTooltip {
  if (!mintInstantUtc || !mintNumber) {
    return { className: "!tw-bg-[#dcc]", html: "" };
  }

  const now = new Date();
  const isFutureMint = mintInstantUtc.getTime() > now.getTime();
  const oneLine = isFutureMint
    ? formatFullDateTime(mintInstantUtc, displayTz, locale)
    : formatFullDate(mintInstantUtc, displayTz, locale);
  const oneLineDivWithNote = noteTooltipContent
    ? `<div style="margin-bottom:12px">${oneLine}<br />
      <span style="font-size:11px; color: #666;">*${noteTooltipContent}</span></div>`
    : `<div style="margin-bottom:12px">${oneLine}</div>`;
  const invites = isFutureMint
    ? printCalendarInvites(
        mintInstantUtc,
        mintNumber,
        "#000",
        22,
        getCalendarInviteLabels(locale),
        locale
      )
    : "";
  const tooltipTitle = t(locale, "memeCalendar.grid.tooltip.meme", {
    mint: mintLabel ?? "",
  });

  return {
    className: isFutureMint ? "!tw-bg-[#eee]" : "!tw-bg-[#dcc]",
    html: `
      <div style="min-width:220px">
        <div style="font-weight:600; margin-bottom:3px; font-size:larger">${escapeHtml(tooltipTitle)}</div>
        ${oneLineDivWithNote}
        ${invites}
      </div>`,
  };
}

function getMintTooltip(
  cellDateUtcDay: Date,
  details: MintCellDetails,
  displayTz: DisplayTz,
  locale: SupportedLocale
): MintTooltip {
  if (details.historical.length > 0) {
    return {
      className: "!tw-bg-[#dcc]",
      html: getHistoricalTooltipHtml(details.historical, displayTz, locale),
    };
  }

  const overrideNote = getMintOverrideNoteForUtcDay(cellDateUtcDay);

  return getScheduledMintTooltip({
    displayTz,
    locale,
    mintInstantUtc: details.mintInstantUtc,
    mintLabel: details.mintLabel,
    mintNumber: details.mintNumber,
    noteTooltipContent: overrideNote
      ? escapeHtml(overrideNote).replaceAll("\n", "<br />")
      : "",
  });
}

function EmptyMonthCell({ keyDate }: { readonly keyDate: Date }) {
  return (
    <div
      key={`empty-${ymd(keyDate)}`}
      className="tw-pointer-events-none tw-invisible"
    ></div>
  );
}

function MonthDayCell({
  cellOffset,
  day,
  displayTz,
  locale,
  month,
  onSelectDay,
  year,
}: MonthDayCellProps) {
  const cellDateUtcDay = new Date(Date.UTC(year, month, day));
  const isToday = ymd(cellDateUtcDay) === ymd(new Date());
  const details = getMintCellDetails(cellDateUtcDay, locale);

  if (!details.isMintDay) {
    return (
      <div
        className="tw-flex tw-min-h-[2.5rem] tw-flex-col tw-items-center tw-justify-start tw-border-b-2 tw-py-2 tw-text-gray-400"
        style={{ borderColor: "#222222", borderBottomStyle: "solid" }}
      >
        <span
          className={`tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-text-xs ${
            isToday
              ? "tw-bg-[#20fa59] tw-font-semibold tw-text-black"
              : "tw-text-gray-400"
          }`}
        >
          {day}
        </span>
        <span className="tw-mt-0.5 tw-text-xs tw-font-medium">&nbsp;</span>
      </div>
    );
  }

  const tooltip = getMintTooltip(cellDateUtcDay, details, displayTz, locale);

  return (
    <button
      type="button"
      id={`meme-cell-${ymd(cellDateUtcDay)}`}
      className="tw-flex tw-min-h-[2.5rem] tw-cursor-pointer tw-flex-col tw-items-center tw-justify-start tw-border-b-2 tw-border-none tw-bg-transparent tw-py-2 hover:tw-bg-[#eee] hover:tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      style={{
        borderColor: "#222222",
        borderBottomStyle: "solid",
      }}
      data-tooltip-id="meme-tooltip"
      data-tooltip-html={tooltip.html}
      data-tooltip-class-name={tooltip.className}
      data-tooltip-place={getTooltipPlace(cellOffset)}
      aria-label={t(locale, "memeCalendar.grid.dayMintAriaLabel", {
        date: formatFullDate(cellDateUtcDay, "utc", locale),
        mint: details.mintLabel ?? "",
      })}
      onClick={() => onSelectDay?.(cellDateUtcDay)}
    >
      <span
        className={`tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-text-xs ${
          isToday ? "tw-bg-[#20fa59] tw-font-semibold tw-text-black" : ""
        }`}
      >
        {day}
      </span>
      {details.mintLabel && (
        <span className="tw-mt-0.5 tw-text-xs tw-font-medium tw-text-blue-600">
          {details.mintLabel}
        </span>
      )}
    </button>
  );
}

/**
 * Month component - renders a month grid with weekday headers.
 */
function Month({
  date,
  onSelectDay,
  autoOpenYmd,
  displayTz,
  locale,
}: MonthProps) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const monthName = formatUtcMonth(
    new Date(Date.UTC(year, month, 1)),
    "long",
    locale
  );
  const weekdays: readonly MessageKey[] = [
    "memeCalendar.grid.weekday.mon",
    "memeCalendar.grid.weekday.tue",
    "memeCalendar.grid.weekday.wed",
    "memeCalendar.grid.weekday.thu",
    "memeCalendar.grid.weekday.fri",
    "memeCalendar.grid.weekday.sat",
    "memeCalendar.grid.weekday.sun",
  ];
  const weeks = getMonthWeeks(year, month);
  const firstMonthDay = new Date(Date.UTC(year, month, 1));
  const firstMonthDow = firstMonthDay.getUTCDay();
  const gridStartOffset = firstMonthDow === 0 ? -6 : 1 - firstMonthDow;
  const cells = weeks.flat().map((day, cellOffset) => ({
    day,
    cellOffset,
    keyDate: new Date(Date.UTC(year, month, 1 + gridStartOffset + cellOffset)),
  }));
  useEffect(() => {
    if (!autoOpenYmd) return;
    const el = document.getElementById(`meme-cell-${autoOpenYmd}`);
    if (el) {
      try {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      } catch {}
      const t = setTimeout(() => {
        el.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true, view: window })
        );
        el.dispatchEvent(
          new MouseEvent("click", { bubbles: true, view: window })
        );
      }, 60);
      return () => clearTimeout(t);
    }
    return;
  }, [autoOpenYmd, year, month]);

  return (
    <div className="tw-flex tw-flex-col tw-space-y-1 tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-black tw-p-2">
      {/* Month title */}
      <div className="tw-text-center tw-text-sm tw-font-semibold">
        {monthName} {year}
      </div>
      {/* Weekday header */}
      <div className="tw-mt-1 tw-grid tw-grid-cols-7 tw-text-center tw-text-xs tw-font-medium">
        {weekdays.map((wd) => (
          <div
            key={wd}
            className="tw-border-b-2 tw-p-1"
            style={{
              borderColor: "#888888",
              borderBottomStyle: "solid",
            }}
          >
            {t(locale, wd)}
          </div>
        ))}
        {/* Day cells */}
        {cells.map(({ day, cellOffset, keyDate }) =>
          day === null ? (
            <EmptyMonthCell key={`empty-${ymd(keyDate)}`} keyDate={keyDate} />
          ) : (
            <MonthDayCell
              key={ymd(new Date(Date.UTC(year, month, day)))}
              cellOffset={cellOffset}
              day={day}
              displayTz={displayTz}
              locale={locale}
              month={month}
              onSelectDay={onSelectDay}
              year={year}
            />
          )
        )}
      </div>
    </div>
  );
}

/**
 * SeasonView - displays three consecutive months (a quarter).
 */
function SeasonView({
  seasonIndex,
  onSelectDay,
  autoOpenYmd,
  displayTz,
  locale,
}: SeasonViewProps) {
  const seasonStart = getSeasonStartDate(seasonIndex);

  const months: Date[] = isSznOneIndex(seasonIndex)
    ? (() => {
        const arr: Date[] = [];
        for (let m = 5; m <= 11; m++) {
          // Jun .. Dec 2022
          arr.push(new Date(Date.UTC(2022, m, 1)));
        }
        return arr;
      })()
    : [0, 1, 2].map((offset) => {
        const d = new Date(seasonStart);
        d.setUTCMonth(seasonStart.getUTCMonth() + offset, 1);
        d.setUTCHours(0, 0, 0, 0);
        return d;
      });

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3">
      {months.map((m) => (
        <Month
          key={toISO(m)}
          date={m}
          onSelectDay={onSelectDay}
          autoOpenYmd={autoOpenYmd}
          displayTz={displayTz}
          locale={locale}
        />
      ))}
    </div>
  );
}

/**
 * YearView - displays only seasons with range labels and drills down to SZN view.
 */
function YearView({
  seasonIndex,
  onSelectSeason,
  onZoomToSeason,
  locale,
}: YearViewProps) {
  const yearIndex = Math.floor(seasonIndex / SEASONS_PER_YEAR);
  const firstSeasonIndexOfYear = yearIndex * SEASONS_PER_YEAR;
  const currentIdx = getSeasonIndexForDate(new Date());

  // ⭐ Special case: Year 0 (2022) shows a single SZN1 card (Jun–Dec 2022)
  const displayedYear = displayedYearNumberFromIndex(seasonIndex);
  if (displayedYear === 0) {
    const title = getDivisionTitle(locale, "szn", 1);

    return (
      <HistoricalLaunchDrilldownCard
        title={title}
        isCurrent={currentIdx === SZN1_SEASON_INDEX}
        locale={locale}
        onClick={() => {
          onSelectSeason(SZN1_SEASON_INDEX);
          onZoomToSeason();
        }}
      />
    );
  }
  // 👇 existing code for other years stays the same
  const seasons = Array.from({ length: 4 }, (_, s) => {
    const sIdx = firstSeasonIndexOfYear + s;
    const start = getSeasonStartDate(sIdx);
    const end = addMonths(start, 2);
    const title = getDivisionTitle(
      locale,
      "szn",
      displayedSeasonNumberFromIndex(sIdx)
    );
    const range = getDateRangeLabel(locale, start, end);
    const mints = getRangeLabel(start, end, locale);
    return { sIdx, start, end, mints, range, title };
  });

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
      {seasons.map((s) => {
        const isCurrent = currentIdx === s.sIdx;
        return (
          <DrilldownCard
            key={s.sIdx}
            title={s.title}
            range={s.range}
            mints={s.mints}
            isCurrent={isCurrent}
            locale={locale}
            onClick={() => {
              onSelectSeason(s.sIdx);
              onZoomToSeason();
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * EpochView - years only, one per row, with mint ranges. Click drills into Year view.
 */
function EpochView({
  seasonIndex,
  onSelectYear,
  onSelectSeason,
  onZoomToYear,
  locale,
}: EpochViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const epochNumber = displayedEpochNumberFromIndex(seasonIndex);

  if (epochNumber === 0) {
    // Special case: SZN1 epoch, single card for Year #0 (SZN1)
    const title = getDivisionTitleWithGregorianYear(locale, "year", 0, 2022);

    return (
      <HistoricalLaunchDrilldownCard
        title={title}
        isCurrent={currentIdx === SZN1_SEASON_INDEX}
        locale={locale}
        onClick={() => {
          onSelectSeason(SZN1_SEASON_INDEX);
          onSelectYear(0);
          onZoomToYear();
        }}
      />
    );
  } else {
    // For epochNumber >= 1, show 4 years, starting with Jan 1 of year 2023 + 4*(epochNumber-1)
    const startYear = 2023 + 4 * (epochNumber - 1);
    const years = Array.from({ length: 4 }, (_, yearOffset) => {
      const year = startYear + yearOffset;
      const yearSeasonIndex = getSeasonIndexForDate(
        new Date(Date.UTC(year, 0, 1))
      );
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      const yearNumber = displayedYearNumberFromIndex(yearSeasonIndex);
      return {
        yearNumber,
        start,
        end,
        seasonIndex: yearSeasonIndex,
        mints: getRangeLabel(start, end, locale),
        range: getDateRangeLabel(locale, start, end),
        title: getDivisionTitleWithGregorianYear(
          locale,
          "year",
          yearNumber,
          year
        ),
      };
    });
    return (
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
        {years.map((y) => {
          const isCurrent =
            currentIdx >= y.seasonIndex &&
            currentIdx < y.seasonIndex + SEASONS_PER_YEAR;
          return (
            <DrilldownCard
              key={toISO(y.start)}
              title={y.title}
              range={y.range}
              mints={y.mints}
              isCurrent={isCurrent}
              locale={locale}
              onClick={() => {
                onSelectYear(y.yearNumber);
                onZoomToYear();
              }}
            />
          );
        })}
      </div>
    );
  }
}

/**
 * PeriodView - epochs only, one per row, with ranges; drill into Epoch view.
 */
function PeriodView({
  seasonIndex,
  onSelectEpoch,
  onZoomToEpoch,
  locale,
}: PeriodViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);

  if (periodNumber === 0) {
    const title = getDivisionTitleWithGregorianYear(locale, "epoch", 0, 2022);

    return (
      <HistoricalLaunchDrilldownCard
        title={title}
        isCurrent={currentIdx === SZN1_SEASON_INDEX}
        locale={locale}
        onClick={() => {
          onSelectEpoch(0);
          onZoomToEpoch();
        }}
      />
    );
  } else {
    // For periodNumber >= 1, show 5 epochs, starting with epochNumber = 1 + 5*(periodNumber-1)
    const firstEpochNumber = 1 + 5 * (periodNumber - 1);
    const epochs = Array.from({ length: 5 }, (_, k) => {
      const epochNumber = firstEpochNumber + k;
      const startYear = 2023 + 4 * (epochNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 4, 0, 0)); // Dec 31, 4 years later
      const seasonIndexForEpoch = getSeasonIndexForDate(
        new Date(Date.UTC(startYear, 0, 1))
      );
      return {
        epochNumber,
        start,
        end,
        seasonIndex: seasonIndexForEpoch,
        mints: getRangeLabel(start, end, locale),
        range: getDateRangeLabel(locale, start, end),
        title: getDivisionTitleWithGregorianYear(
          locale,
          "epoch",
          epochNumber,
          startYear
        ),
      };
    });
    return (
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
        {epochs.map((ep) => {
          const isCurrent =
            currentIdx >= ep.seasonIndex &&
            currentIdx < ep.seasonIndex + SEASONS_PER_EPOCH;
          return (
            <DrilldownCard
              key={toISO(ep.start)}
              title={ep.title}
              range={ep.range}
              mints={ep.mints}
              isCurrent={isCurrent}
              locale={locale}
              onClick={() => {
                onSelectEpoch(ep.epochNumber);
                onZoomToEpoch();
              }}
            />
          );
        })}
      </div>
    );
  }
}

/**
 * EraView - periods only, one per row, with ranges; drill into Period view.
 */
function EraView({
  seasonIndex,
  onSelectPeriod,
  onZoomToPeriod,
  locale,
}: EraViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const eraNumber = displayedEraNumberFromIndex(seasonIndex);

  // Era #0 – special (SZN1 only)
  if (eraNumber === 0) {
    const title = getDivisionTitleWithGregorianYear(locale, "period", 0, 2022);
    return (
      <HistoricalLaunchDrilldownCard
        title={title}
        isCurrent={currentIdx === SZN1_SEASON_INDEX}
        locale={locale}
        onClick={() => {
          onSelectPeriod(0);
          onZoomToPeriod();
        }}
      />
    );
  }

  // Era >= 1 – five 20-year periods; Era 1 starts Jan 2023
  const startYear = 2023 + 100 * (eraNumber - 1);
  const firstPeriodNumber = 1 + 5 * (eraNumber - 1);
  const periods = Array.from({ length: 5 }, (_, k) => {
    const py = startYear + 20 * k;
    const start = new Date(Date.UTC(py, 0, 1));
    const end = new Date(Date.UTC(py + 20, 0, 0));
    const seasonIndexForPeriod = getSeasonIndexForDate(start);
    return {
      periodNumber: firstPeriodNumber + k,
      start,
      end,
      seasonIndex: seasonIndexForPeriod,
      mints: getRangeLabel(start, end, locale),
      range: getDateRangeLabel(locale, start, end),
      title: getDivisionTitleWithGregorianYear(
        locale,
        "period",
        firstPeriodNumber + k,
        py
      ),
    };
  });

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
      {periods.map((p) => {
        const isCurrent =
          currentIdx >= p.seasonIndex &&
          currentIdx < p.seasonIndex + SEASONS_PER_PERIOD;
        return (
          <DrilldownCard
            key={toISO(p.start)}
            title={p.title}
            range={p.range}
            mints={p.mints}
            isCurrent={isCurrent}
            locale={locale}
            onClick={() => {
              onSelectPeriod(p.periodNumber);
              onZoomToPeriod();
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * EonView - eras only, one per row, with ranges; drill into Era view.
 */
function EonView({
  seasonIndex,
  onSelectEra,
  onZoomToEra,
  locale,
}: EonViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const eonNumber = displayedEonNumberFromIndex(seasonIndex);

  // Eon #0 – special (SZN1 only)
  if (eonNumber === 0) {
    const title = getDivisionTitleWithGregorianYear(locale, "era", 0, 2022);
    return (
      <HistoricalLaunchDrilldownCard
        title={title}
        isCurrent={currentIdx === SZN1_SEASON_INDEX}
        locale={locale}
        onClick={() => {
          onSelectEra(0);
          onZoomToEra();
        }}
      />
    );
  }

  // Eon >= 1 – ten 100-year eras; Eon 1 starts Jan 2023
  const startYear = 2023 + 1000 * (eonNumber - 1);
  const firstEraNumber = 1 + 10 * (eonNumber - 1);
  const eras = Array.from({ length: 10 }, (_, k) => {
    const ey = startYear + 100 * k;
    const start = new Date(Date.UTC(ey, 0, 1));
    const end = new Date(Date.UTC(ey + 100, 0, 0));
    const seasonIndexForEra = getSeasonIndexForDate(start);
    return {
      eraNumber: firstEraNumber + k,
      start,
      end,
      seasonIndex: seasonIndexForEra,
      mints: getRangeLabel(start, end, locale),
      range: getDateRangeLabel(locale, start, end),
      title: getDivisionTitleWithGregorianYear(
        locale,
        "era",
        firstEraNumber + k,
        ey
      ),
    };
  });

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
      {eras.map((er) => {
        const isCurrent =
          currentIdx >= er.seasonIndex &&
          currentIdx < er.seasonIndex + SEASONS_PER_ERA;
        return (
          <DrilldownCard
            key={toISO(er.start)}
            title={er.title}
            range={er.range}
            mints={er.mints}
            isCurrent={isCurrent}
            locale={locale}
            onClick={() => {
              onSelectEra(er.eraNumber);
              onZoomToEra();
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Main MemeCalendar component (TypeScript). Manages state and renders
 * appropriate views based on zoom level.
 */
interface MemeCalendarProps {
  readonly displayTz: DisplayTz;
  readonly locale?: SupportedLocale | undefined;
}

export default function MemeCalendar({
  displayTz,
  locale = DEFAULT_LOCALE,
}: MemeCalendarProps) {
  const isMobile = useIsMobileScreen();
  const [seasonIndex, setSeasonIndex] = useState<number>(() => {
    try {
      return getSeasonIndexForDate(new Date());
    } catch {
      return 0;
    }
  });
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("szn");
  const [jumpValue, setJumpValue] = useState<string>("");
  const [jumpMint, setJumpMint] = useState<string>("");
  const [autoOpenYmd, setAutoOpenYmd] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const seasonNumber = displayedSeasonNumberFromIndex(seasonIndex);
  const yearNumber = displayedYearNumberFromIndex(seasonIndex);
  const epochNumber = displayedEpochNumberFromIndex(seasonIndex);
  const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);
  const eraNumber = displayedEraNumberFromIndex(seasonIndex);
  const eonNumber = displayedEonNumberFromIndex(seasonIndex);
  const zoomNumbers: Record<ZoomLevel, number> = {
    szn: seasonNumber,
    year: yearNumber,
    epoch: epochNumber,
    period: periodNumber,
    era: eraNumber,
    eon: eonNumber,
  };

  // Jump to specific numbers (1‑based)
  const selectYear = (n: number) =>
    setSeasonIndex(clampIndex((n - 4) * SEASONS_PER_YEAR));
  const selectEpoch = (n: number) =>
    setSeasonIndex(clampIndex((4 * n - 7) * SEASONS_PER_YEAR));
  const selectPeriod = (n: number) =>
    setSeasonIndex(clampIndex(80 * (n - 1) - 12));
  const selectEra = (n: number) =>
    setSeasonIndex(clampIndex(400 * (n - 1) - 12));

  const renderView = () => {
    switch (zoomLevel) {
      case "szn":
        return (
          <SeasonView
            seasonIndex={seasonIndex}
            autoOpenYmd={autoOpenYmd ?? undefined}
            displayTz={displayTz}
            locale={locale}
          />
        );
      case "year":
        return (
          <YearView
            seasonIndex={seasonIndex}
            onSelectSeason={setSeasonIndex}
            onZoomToSeason={() => setZoomLevel("szn")}
            locale={locale}
          />
        );
      case "epoch":
        return (
          <EpochView
            seasonIndex={seasonIndex}
            onSelectSeason={setSeasonIndex}
            onSelectYear={selectYear}
            onZoomToYear={() => setZoomLevel("year")}
            locale={locale}
          />
        );
      case "period":
        return (
          <PeriodView
            seasonIndex={seasonIndex}
            onSelectEpoch={selectEpoch}
            onZoomToEpoch={() => setZoomLevel("epoch")}
            locale={locale}
          />
        );
      case "era":
        return (
          <EraView
            seasonIndex={seasonIndex}
            onSelectPeriod={selectPeriod}
            onZoomToPeriod={() => setZoomLevel("period")}
            locale={locale}
          />
        );
      case "eon":
        return (
          <EonView
            seasonIndex={seasonIndex}
            onSelectEra={selectEra}
            onZoomToEra={() => setZoomLevel("era")}
            locale={locale}
          />
        );
      default:
        return null;
    }
  };

  //  The first ever season (Year 0, SZN 1) == internal seasonIndex -16.
  const MIN_SEASON_INDEX = SZN1_SEASON_INDEX;

  // If you want to limit how far forward users can go, set this; otherwise Infinity.
  const MAX_SEASON_INDEX = Number.POSITIVE_INFINITY;

  const clampIndex = (i: number) =>
    Math.max(MIN_SEASON_INDEX, Math.min(MAX_SEASON_INDEX, i));

  // Navigation helpers for epoch/period
  const epochStartIndex = (n: number) =>
    n === 0
      ? SZN1_SEASON_INDEX
      : getSeasonIndexForDate(new Date(Date.UTC(2023 + 4 * (n - 1), 0, 1)));
  const periodStartIndex = (n: number) =>
    n === 0
      ? SZN1_SEASON_INDEX
      : getSeasonIndexForDate(new Date(Date.UTC(2023 + 20 * (n - 1), 0, 1)));
  const eraStartIndex = (n: number) =>
    n === 0
      ? SZN1_SEASON_INDEX
      : getSeasonIndexForDate(new Date(Date.UTC(2023 + 100 * (n - 1), 0, 1)));

  const eonStartIndex = (n: number) =>
    n === 0
      ? SZN1_SEASON_INDEX
      : getSeasonIndexForDate(new Date(Date.UTC(2023 + 1000 * (n - 1), 0, 1)));

  const handleJumpToToday = () => {
    const now = new Date();
    const idx = getSeasonIndexForDate(now);
    setSeasonIndex(clampIndex(idx));
    setZoomLevel("szn");
  };

  const jumpToMintNumber = () => {
    const n = parseInt(jumpMint, 10);
    if (!n || n < 1) {
      return;
    }
    const d = dateFromMintNumber(n);
    const idx = getSeasonIndexForDate(d);
    setSeasonIndex(clampIndex(idx));
    setZoomLevel("szn");
    setAutoOpenYmd(ymd(d));
    setTimeout(() => setAutoOpenYmd(null), 1200);
  };

  const jumpToMonthValue = (value: string) => {
    if (!value) {
      return;
    }
    const [ys, ms] = value.split("-");
    const y = Number(ys);
    const m = Number(ms);
    if (!y || !m) {
      return;
    }
    const d = new Date(y, m - 1, 1);
    const idx = getSeasonIndexForDate(d);
    setSeasonIndex(clampIndex(idx));
    setZoomLevel("szn");
  };

  const handleMintJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    jumpToMintNumber();
  };

  const handleDateJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    jumpToMonthValue(jumpValue);
  };

  const infoButtonLabel = t(
    locale,
    showInfo ? "memeCalendar.grid.info.hide" : "memeCalendar.grid.info.show"
  );
  const currentDivisionName = getDivisionName(locale, zoomLevel);
  const previousDivisionLabel = t(locale, "memeCalendar.grid.previous", {
    division: currentDivisionName,
  });
  const nextDivisionLabel = t(locale, "memeCalendar.grid.next", {
    division: currentDivisionName,
  });

  return (
    <div className="tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-[#0c0c0d] tw-p-4">
      {/* Division (zoom) selector buttons */}
      <div className="tw-mb-8 tw-grid tw-grid-cols-3 tw-gap-2 lg:tw-grid-cols-[repeat(6,minmax(0,1fr))_auto]">
        <fieldset className="tw-col-span-3 tw-grid tw-grid-cols-3 tw-gap-2 lg:tw-col-span-6 lg:tw-grid-cols-6">
          <legend className="tw-sr-only">
            {t(locale, "memeCalendar.grid.zoomGroup")}
          </legend>
          {ZOOM_LEVELS.map((level) => {
            const label = getZoomLabel(locale, level, zoomNumbers[level]);
            return (
              <button
                key={level}
                type="button"
                aria-pressed={zoomLevel === level}
                className={
                  "tw-w-full tw-rounded-md tw-border tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 " +
                  (zoomLevel === level
                    ? "tw-border-blue-500 tw-bg-blue-600 tw-text-white tw-shadow"
                    : "tw-border-gray-300 tw-bg-gray-100 tw-text-gray-900 hover:tw-bg-gray-200 dark:tw-border-gray-700 dark:tw-bg-gray-800 dark:tw-text-gray-100 dark:hover:tw-bg-gray-700")
                }
                onClick={() => setZoomLevel(level)}
              >
                {label}
              </button>
            );
          })}
        </fieldset>
        <div className="tw-col-span-3 tw-flex tw-items-center tw-justify-end lg:tw-col-span-1">
          <button
            type="button"
            aria-controls="meme-calendar-info"
            aria-expanded={showInfo}
            aria-label={infoButtonLabel}
            title={infoButtonLabel}
            className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-transparent tw-bg-transparent tw-text-gray-100 hover:tw-bg-gray-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            onClick={() => setShowInfo((v) => !v)}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={showInfo ? faXmarkCircle : faInfoCircle}
              className="tw-h-8 tw-w-8"
            />
          </button>
        </div>
      </div>

      <section
        id="meme-calendar-info"
        aria-label={t(locale, "memeCalendar.grid.info.panelLabel")}
        className={
          "tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-black " +
          "tw-origin-top tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-out " +
          (showInfo
            ? "tw-mb-8 tw-scale-y-100 tw-px-3 tw-py-5 tw-opacity-100"
            : "tw-pointer-events-none tw-max-h-0 tw-scale-y-95 tw-opacity-0")
        }
        aria-hidden={!showInfo}
      >
        {/* Stack on small; side-by-side from md+ */}
        <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-gap-6">
          {/* Left side grows on md+ */}
          <div className="md:tw-flex-1">
            {GRID_INFO_ITEMS.map(({ label, text, note }) => (
              <div key={label} className="tw-py-2">
                <span className="tw-font-bold">{t(locale, label)}</span> -{" "}
                {t(locale, text)}{" "}
                {note && (
                  <span className="tw-text-gray-500">{t(locale, note)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified navigation + controls in one row on large, wrap on small */}
      <div className="tw-mb-6 tw-mt-2 tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
        {/* Left half: Prev | Title+Range | Next */}
        <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 lg:tw-max-w-[40%] lg:tw-basis-2/3">
          <button
            type="button"
            aria-label={previousDivisionLabel}
            title={previousDivisionLabel}
            className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 tw-text-gray-900 hover:tw-bg-gray-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 dark:tw-border-gray-700 dark:tw-text-gray-100 dark:hover:tw-bg-gray-700"
            onClick={() => {
              let delta = 0;
              if (zoomLevel === "epoch") {
                const en = displayedEpochNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(epochStartIndex(en - 1)));
                return;
              }
              if (zoomLevel === "period") {
                const pn = displayedPeriodNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(periodStartIndex(pn - 1)));
                return;
              }
              if (zoomLevel === "era") {
                const rn = displayedEraNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(eraStartIndex(rn - 1)));
                return;
              }
              if (zoomLevel === "eon") {
                const en = displayedEonNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(eonStartIndex(en - 1)));
                return;
              }
              switch (zoomLevel) {
                case "szn":
                  delta = -1;
                  break;
                case "year":
                  delta = -SEASONS_PER_YEAR;
                  break;
              }
              setSeasonIndex((s) => clampIndex(s + delta));
            }}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faCaretLeft} />
          </button>

          {/* Label block: title and date range; wraps if needed */}
          <div className="tw-min-w-0 tw-flex-1 tw-text-center">
            <div className="tw-text-sm tw-font-semibold">
              {getZoomTitle(locale, zoomLevel, seasonIndex)}
            </div>
            {(() => {
              const { start, end } = getRangeDatesByZoom(
                zoomLevel,
                seasonIndex
              );
              const range = `${formatUtcMonthYear(
                start,
                "short",
                locale
              )} - ${formatUtcMonthYear(end, "short", locale)}`;
              const mintRange = isSznOneIndex(seasonIndex)
                ? "Memes #1 - #47"
                : getRangeLabel(start, end, locale);
              return (
                <div className="tw-whitespace-normal tw-break-words tw-text-xs tw-text-gray-400">
                  {range} / {mintRange}
                </div>
              );
            })()}
          </div>

          <button
            type="button"
            aria-label={nextDivisionLabel}
            title={nextDivisionLabel}
            className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 tw-text-gray-900 hover:tw-bg-gray-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 dark:tw-border-gray-700 dark:tw-text-gray-100 dark:hover:tw-bg-gray-700"
            onClick={() => {
              let delta = 0;
              if (zoomLevel === "epoch") {
                const en = displayedEpochNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(epochStartIndex(en + 1)));
                return;
              }
              if (zoomLevel === "period") {
                const pn = displayedPeriodNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(periodStartIndex(pn + 1)));
                return;
              }
              if (zoomLevel === "era") {
                const rn = displayedEraNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(eraStartIndex(rn + 1)));
                return;
              }
              if (zoomLevel === "eon") {
                const en = displayedEonNumberFromIndex(seasonIndex);
                setSeasonIndex(clampIndex(eonStartIndex(en + 1)));
                return;
              }
              switch (zoomLevel) {
                case "szn":
                  delta = 1;
                  break;
                case "year":
                  delta = SEASONS_PER_YEAR;
                  break;
              }
              setSeasonIndex((s) => clampIndex(s + delta));
            }}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faCaretRight} />
          </button>
        </div>
        {/* Right: controls — Jump to Today, Mint #, and Date jump (date hidden on small screens) */}
        <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-3 lg:tw-w-auto lg:tw-justify-end">
          {/* Responsive wrapper for Jump to Today and Mint # input */}
          <div className="tw-flex tw-w-full tw-gap-3 sm:tw-w-auto sm:tw-gap-3">
            <button
              type="button"
              className="tw-inline-flex tw-h-9 tw-flex-1 tw-shrink-0 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-md tw-border tw-border-[#d1d1d1] tw-bg-white tw-px-3 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-[#e9e9e9] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-w-auto sm:tw-flex-none"
              onClick={handleJumpToToday}
            >
              {t(locale, "memeCalendar.grid.jumpToday")}
            </button>
            <form
              onSubmit={handleMintJumpSubmit}
              className="tw-w-full tw-flex-1 tw-shrink-0 sm:tw-w-auto sm:tw-flex-none"
            >
              <div className="tw-flex tw-h-9 tw-w-full tw-items-center tw-rounded-md tw-border tw-border-[#d1d1d1] tw-bg-white tw-pl-3 tw-font-semibold tw-text-black">
                <label
                  htmlFor="meme-calendar-mint-input"
                  className="tw-shrink-0 tw-select-none tw-pr-2"
                >
                  {t(locale, "memeCalendar.grid.memeNumber")}
                </label>
                <input
                  id="meme-calendar-mint-input"
                  type="number"
                  min={1}
                  name="meme-calendar-mint-input"
                  placeholder="123"
                  onChange={(event) => {
                    const v = event.target.value.replaceAll(/\D/g, "");
                    setJumpMint(v);
                  }}
                  className="tw-h-9 tw-w-full tw-min-w-0 tw-rounded-r-md tw-border-none tw-px-2 tw-text-black placeholder:tw-text-gray-500 focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-0 focus-visible:tw-outline-primary-400 sm:tw-w-[8ch]"
                />
              </div>
            </form>
          </div>
          <form
            onSubmit={handleDateJumpSubmit}
            className="tw-hidden tw-min-w-0 tw-max-w-full sm:tw-block sm:tw-w-auto sm:tw-basis-auto lg:tw-flex-1"
          >
            <div className="tw-flex tw-h-9 tw-w-full tw-max-w-full tw-items-center tw-rounded-md tw-border tw-border-[#d1d1d1] tw-bg-white tw-pl-3 tw-font-semibold tw-text-black sm:tw-w-auto sm:tw-max-w-[28rem] lg:tw-w-full">
              <label
                htmlFor="meme-calendar-date-input"
                className="tw-shrink-0 tw-select-none tw-pr-2"
              >
                {t(locale, "memeCalendar.grid.date")}
              </label>
              <input
                id="meme-calendar-date-input"
                type="month"
                value={jumpValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setJumpValue(value);
                  jumpToMonthValue(value);
                }}
                className="tw-h-9 tw-w-full tw-min-w-0 tw-rounded-r-md tw-border-none tw-px-2 tw-text-black placeholder:tw-text-gray-500 focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-0 focus-visible:tw-outline-primary-400 sm:tw-w-[16rem] lg:tw-w-full lg:tw-max-w-[28rem]"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Calendar view */}
      <div>{renderView()}</div>

      {/* Global tooltip for mints */}
      <Tooltip
        id="meme-tooltip"
        clickable
        openOnClick
        className={`!tw-z-[1000] !tw-whitespace-normal !tw-rounded-md !tw-border !tw-border-solid !tw-border-[#222222] !tw-text-black !tw-opacity-[0.975] ${
          isMobile ? "tw-max-w-[15rem]" : "tw-max-w-[22rem]"
        }`}
      />
    </div>
  );
}
