"use client";

import { useEffect } from "react";

import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import type { DisplayTz } from "../meme-calendar.helpers";
import {
  formatFullDate,
  formatFullDateTime,
  formatMint,
  formatUtcMonth,
  getMintNumberForMintDate,
  getMonthWeeks,
  isMintEligibleUtcDay,
  mintStartInstantUtcForMintDay,
  printCalendarInvites,
  ymd,
} from "../meme-calendar.helpers";
import { getMintOverrideNoteForUtcDay } from "../meme-calendar.overrides";
import { getHistoricalMintsOnUtcDay } from "../meme-calendar.szn1";
import { escapeHtml, getCalendarInviteLabels } from "./calendarText";
import type {
  HistoricalMint,
  MintCellDetails,
  MintTooltip,
  MonthDayCellProps,
  MonthProps,
  TooltipPlace,
} from "./types";

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
  const last = historical.at(-1);

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

  return `<div class="tw-min-w-[13.75rem]">
    <div class="tw-mb-1 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">
      ${escapeHtml(tooltipTitle)}
    </div>
    <div class="tw-mb-3 tw-text-sm tw-leading-5 tw-text-iron-300">${formatFullDate(
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
  if (mintInstantUtc === undefined || mintNumber === undefined) {
    return { className: "!tw-border-iron-700", html: "" };
  }

  const now = new Date();
  const isFutureMint = mintInstantUtc.getTime() > now.getTime();
  const oneLine = isFutureMint
    ? formatFullDateTime(mintInstantUtc, displayTz, locale)
    : formatFullDate(mintInstantUtc, displayTz, locale);
  const oneLineDivWithNote = noteTooltipContent
    ? `<div class="tw-mb-3 tw-text-sm tw-leading-5 tw-text-iron-300">${oneLine}<br />
      <span class="tw-text-sm tw-leading-5 tw-text-iron-400">*${noteTooltipContent}</span></div>`
    : `<div class="tw-mb-3 tw-text-sm tw-leading-5 tw-text-iron-300">${oneLine}</div>`;
  const invites = isFutureMint
    ? printCalendarInvites(
        mintInstantUtc,
        mintNumber,
        "currentColor",
        22,
        getCalendarInviteLabels(locale),
        locale
      )
    : "";
  const tooltipTitle = t(locale, "memeCalendar.grid.tooltip.meme", {
    mint: mintLabel ?? "",
  });

  return {
    className: isFutureMint
      ? "!tw-border-primary-400/50"
      : "!tw-border-iron-700",
    html: `
      <div class="tw-min-w-[13.75rem]">
        <div class="tw-mb-1 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">${escapeHtml(tooltipTitle)}</div>
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
      className: "!tw-border-iron-700",
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
      className="tw-pointer-events-none tw-invisible max-[429px]:tw-hidden"
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
  const isWeekend = cellOffset % 7 >= 5;
  const details = getMintCellDetails(cellDateUtcDay, locale);
  let dayTextClass = "tw-text-iron-300";

  if (isToday) {
    dayTextClass = "tw-font-semibold tw-text-iron-950";
  } else if (isWeekend) {
    dayTextClass = "tw-text-iron-500";
  }

  const dayLabel = (
    <>
      <span
        className={`tw-inline-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full max-[429px]:tw-hidden ${
          isToday ? "tw-bg-emerald-500" : ""
        }`}
      >
        {day}
      </span>
      <span
        className={`tw-hidden tw-max-w-full tw-truncate max-[429px]:tw-inline-flex ${
          isToday
            ? "tw-items-center tw-justify-center tw-rounded-full tw-bg-emerald-500 tw-px-2.5 tw-py-1"
            : ""
        }`}
      >
        {formatFullDate(cellDateUtcDay, "utc", locale)}
      </span>
    </>
  );

  if (!details.isMintDay) {
    return (
      <div
        className={`tw-min-h-11 tw-py-1.5 min-[430px]:tw-flex min-[430px]:tw-min-h-12 min-[430px]:tw-flex-col min-[430px]:tw-items-center min-[430px]:tw-justify-start ${
          isToday
            ? "max-[429px]:tw-flex max-[429px]:tw-items-center max-[429px]:tw-px-3"
            : "max-[429px]:tw-hidden"
        }`}
        aria-current={isToday ? "date" : undefined}
      >
        <span
          className={`tw-flex tw-items-center tw-text-xs tw-leading-4 min-[430px]:tw-justify-center ${dayTextClass}`}
        >
          {dayLabel}
        </span>
      </div>
    );
  }

  const tooltip = getMintTooltip(cellDateUtcDay, details, displayTz, locale);

  return (
    <button
      type="button"
      id={`meme-cell-${ymd(cellDateUtcDay)}`}
      className="tw-grid tw-min-h-11 tw-w-full tw-cursor-pointer tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-px-3 tw-py-1.5 tw-text-left tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 min-[430px]:tw-flex min-[430px]:tw-min-h-12 min-[430px]:tw-flex-col min-[430px]:tw-justify-start min-[430px]:tw-gap-0 min-[430px]:tw-rounded-md min-[430px]:tw-px-0"
      data-tooltip-id="meme-tooltip"
      data-tooltip-html={tooltip.html}
      data-tooltip-class-name={tooltip.className}
      data-tooltip-place={getTooltipPlace(cellOffset)}
      aria-label={t(locale, "memeCalendar.grid.dayMintAriaLabel", {
        date: formatFullDate(cellDateUtcDay, "utc", locale),
        mint: details.mintLabel ?? "",
      })}
      onClick={() => onSelectDay?.(cellDateUtcDay)}
      aria-current={isToday ? "date" : undefined}
    >
      <span
        className={`tw-flex tw-min-w-0 tw-items-center tw-text-xs tw-leading-4 min-[430px]:tw-justify-center ${
          isToday ? "tw-font-semibold tw-text-iron-950" : "tw-text-iron-200"
        }`}
      >
        {dayLabel}
      </span>
      {details.mintLabel && (
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-5 tw-text-primary-300 min-[430px]:tw-text-xs min-[430px]:tw-leading-4">
          {details.mintLabel}
        </span>
      )}
    </button>
  );
}
/**
 * Month component - renders a month grid with weekday headers.
 */
export function Month({
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
      const timeoutId = setTimeout(() => {
        el.dispatchEvent(
          new MouseEvent("click", { bubbles: true, view: window })
        );
      }, 60);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [autoOpenYmd, year, month]);

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-rounded-2xl tw-bg-iron-950 tw-p-3 tw-shadow-lg tw-ring-1 tw-ring-iron-800 sm:tw-p-4">
      {/* Month title */}
      <div className="tw-mb-2 tw-text-center tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
        {monthName} {year}
      </div>
      {/* Weekday header */}
      <div className="tw-grid tw-grid-cols-7 tw-gap-x-1 tw-gap-y-1.5 tw-text-center tw-text-xs tw-font-medium max-[429px]:tw-grid-cols-1 max-[429px]:tw-gap-1.5">
        {weekdays.map((wd) => (
          <div
            key={wd}
            className="tw-pb-1.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400 max-[429px]:tw-hidden"
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
