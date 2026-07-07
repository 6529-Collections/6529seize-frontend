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
    return undefined;
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
