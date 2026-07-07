import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import type { ZoomLevel } from "../meme-calendar.helpers";
import {
  displayedEonNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedSeasonNumberFromIndex,
  displayedYearNumberFromIndex,
  formatUtcMonthYear,
} from "../meme-calendar.helpers";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const ZOOM_LEVELS: readonly ZoomLevel[] = [
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

export const GRID_INFO_ITEMS: ReadonlyArray<{
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

export function getZoomLabel(
  locale: SupportedLocale,
  zoom: ZoomLevel,
  value: number
): string {
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].zoom, {
    value: formatInteger(locale, value),
  });
}

export function getZoomTitle(
  locale: SupportedLocale,
  zoom: ZoomLevel,
  seasonIndex: number
): string {
  const value = formatInteger(locale, getZoomNumber(zoom, seasonIndex));
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].title, { value });
}

export function getDivisionName(
  locale: SupportedLocale,
  zoom: ZoomLevel
): string {
  return t(locale, ZOOM_MESSAGE_KEYS[zoom].division);
}

export function getDivisionTitle(
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

export function getDivisionTitleWithGregorianYear(
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

export function getDateRangeLabel(
  locale: SupportedLocale,
  start: Date,
  end: Date
): string {
  return t(locale, "memeCalendar.grid.dateRange", {
    start: formatUtcMonthYear(start, "short", locale),
    end: formatUtcMonthYear(end, "short", locale),
  });
}

export function getMemeRangeLabel(
  locale: SupportedLocale,
  start: number,
  end: number
): string {
  return t(locale, "memeCalendar.grid.memeRange", {
    start: formatInteger(locale, start),
    end: formatInteger(locale, end),
  });
}

export function getDrilldownCardAriaLabel(
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

export function getCalendarInviteLabels(locale: SupportedLocale) {
  return {
    addToCalendar: t(locale, "memeCalendar.invites.addToCalendar"),
    addToGoogleCalendar: t(locale, "memeCalendar.invites.addToGoogleCalendar"),
  };
}

export const DRILLDOWN_CARD_CLASS =
  "tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-[#222222] tw-bg-black tw-p-3 hover:tw-bg-[#eee] hover:tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
