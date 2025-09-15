"use client";

import {
  faCaretLeft,
  faCaretRight,
  faChevronDown,
  faChevronUp,
  faCrosshairs,
  faInfoCircle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import type { DisplayTz } from "./meme-calendar.helpers";
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
  getMintNumberForMintDate,
  getMonthWeeks,
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
  ZoomLevel,
} from "./meme-calendar.helpers";
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

function getRangeDatesByZoom(
  zoom: ZoomLevel,
  seasonIndex: number
): { start: Date; end: Date } {
  switch (zoom) {
    case "season": {
      if (isSznOneIndex(seasonIndex)) {
        const start = new Date(SZN1_RANGE.start);
        const end = new Date(SZN1_RANGE.end);
        return { start, end };
      }
      const start = getSeasonStartDate(seasonIndex);
      const end = addMonths(start, 2); // inclusive 3 months
      return { start, end };
    }
    case "year": {
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_YEAR) * SEASONS_PER_YEAR
      );
      const end = addMonths(start, 11); // inclusive 12 months
      return { start, end };
    }
    case "epoch": {
      const epochNumber = displayedEpochNumberFromIndex(seasonIndex);
      if (epochNumber === 0) {
        // special: SZN1 epoch
        const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
        const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
        return { start, end };
      } else if (epochNumber >= 1) {
        // start = Jan 1 of 2023 + 4*(epochNumber-1)
        const startYear = 2023 + 4 * (epochNumber - 1);
        const start = new Date(Date.UTC(startYear, 0, 1));
        const end = new Date(Date.UTC(startYear + 4, 0, 0)); // Dec 31, 4 years later
        return { start, end };
      }
      // fallback
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_EPOCH) * SEASONS_PER_EPOCH
      );
      const end = addMonths(start, 12 * 4 - 1);
      return { start, end };
    }
    case "period": {
      const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);
      if (periodNumber === 0) {
        // special: SZN1 period
        const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
        const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
        return { start, end };
      } else if (periodNumber >= 1) {
        // start = Jan 1 of 2023 + 20*(periodNumber-1)
        const startYear = 2023 + 20 * (periodNumber - 1);
        const start = new Date(Date.UTC(startYear, 0, 1));
        const end = new Date(Date.UTC(startYear + 20, 0, 0)); // Dec 31, 19 years later
        return { start, end };
      }
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_PERIOD) * SEASONS_PER_PERIOD
      );
      const end = addMonths(start, 12 * 20 - 1);
      return { start, end };
    }
    case "era": {
      // Era 0: SZN1 only (Jun–Dec 2022). Era 1 starts Jan 2023 and spans 100 years.
      const eraNumber = displayedEraNumberFromIndex(seasonIndex);
      if (eraNumber === 0) {
        const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
        const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
        return { start, end };
      }
      const startYear = 2023 + 100 * (eraNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 100, 0, 0)); // Dec 31 (startYear+99)
      return { start, end };
    }
    case "eon": {
      // Eon 0: SZN1 only (Jun–Dec 2022). Eon 1 starts Jan 2023 and spans 1000 years.
      const eonNumber = displayedEonNumberFromIndex(seasonIndex);
      if (eonNumber === 0) {
        const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
        const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
        return { start, end };
      }
      const startYear = 2023 + 1000 * (eonNumber - 1);
      const start = new Date(Date.UTC(startYear, 0, 1));
      const end = new Date(Date.UTC(startYear + 1000, 0, 0)); // Dec 31 (startYear+999)
      return { start, end };
    }
  }
}

function formatMonthYearShort(d: Date): string {
  return `${d.toLocaleString("default", {
    month: "short",
  })} ${d.getUTCFullYear()}`;
}

function getZoomTitle(zoom: ZoomLevel, seasonIndex: number): string {
  const seasonNumber = displayedSeasonNumberFromIndex(seasonIndex);
  const yearNumber = displayedYearNumberFromIndex(seasonIndex);
  const epochNumber = displayedEpochNumberFromIndex(seasonIndex);
  const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);
  const eraNumber = displayedEraNumberFromIndex(seasonIndex);
  const eonNumber = displayedEonNumberFromIndex(seasonIndex);

  switch (zoom) {
    case "season":
      return `SZN #${seasonNumber}`;
    case "year":
      return `Year #${yearNumber}`;
    case "epoch":
      return `Epoch #${epochNumber}`;
    case "period":
      return `Period #${periodNumber}`;
    case "era":
      return `Era #${eraNumber}`;
    case "eon":
      return `Eon #${eonNumber}`;
  }
}

// Props types
interface MonthProps {
  readonly date: Date;
  readonly onSelectDay?: (date: Date) => void;
  readonly autoOpenYmd?: string;
  readonly displayTz: DisplayTz;
}
interface SeasonViewProps {
  readonly seasonIndex: number;
  readonly onSelectDay?: (date: Date) => void;
  readonly autoOpenYmd?: string;
  readonly displayTz: DisplayTz;
}
interface YearViewProps {
  readonly seasonIndex: number;
  readonly onSelectSeason: (seasonIndex: number) => void;
  readonly onZoomToSeason: () => void;
}
interface EpochViewProps {
  readonly seasonIndex: number;
  readonly onSelectSeason: (seasonIndex: number) => void;
  readonly onSelectYear: (yearNumber: number) => void;
  readonly onZoomToYear: () => void;
}
interface PeriodViewProps {
  readonly seasonIndex: number;
  readonly onSelectEpoch: (epochNumber: number) => void;
  readonly onZoomToEpoch: () => void;
}
interface EraViewProps {
  readonly seasonIndex: number;
  readonly onSelectPeriod: (periodNumber: number) => void;
  readonly onZoomToPeriod: () => void;
}
interface EonViewProps {
  readonly seasonIndex: number;
  readonly onSelectEra: (eraNumber: number) => void;
  readonly onZoomToEra: () => void;
}

/**
 * Month component - renders a month grid with weekday headers.
 */
function Month({ date, onSelectDay, autoOpenYmd, displayTz }: MonthProps) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString(
    "default",
    { month: "long" }
  );
  const weeks = getMonthWeeks(year, month);
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
  }, [autoOpenYmd, year, month]);

  return (
    <div className="tw-p-2 tw-flex tw-flex-col tw-space-y-1 tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
      {/* Month title */}
      <div className="tw-text-center tw-font-semibold tw-text-sm">
        {monthName} {year}
      </div>
      {/* Weekday header */}
      <div className="tw-grid tw-grid-cols-7 tw-text-xs tw-text-center tw-font-medium tw-mt-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((wd) => (
          <div
            key={wd}
            className="tw-p-1 tw-border-b-2"
            style={{
              borderColor: "#888888",
              borderBottomStyle: "solid",
            }}>
            {wd}
          </div>
        ))}
        {/* Day cells */}
        {weeks.flat().map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${year}-${month}-${idx}`}
                className="tw-invisible tw-pointer-events-none"></div>
            );
          }

          const cellDateUtcDay = new Date(Date.UTC(year, month, day));
          const historical = getHistoricalMintsOnUtcDay(cellDateUtcDay);
          const isHistoricalMintDay = historical.length > 0;

          const isScheduledMintDay = isMintEligibleUtcDay(cellDateUtcDay);

          const isMintDay = isHistoricalMintDay || isScheduledMintDay;

          // For label: if multiple historical mints, show a range (#1-#3). Otherwise single #.
          let mintLabel: string | undefined;
          let mintInstantUtc: Date | undefined;
          let mintNumber: number | undefined;

          if (isHistoricalMintDay) {
            const first = historical[0];
            const last = historical[historical.length - 1];
            mintNumber = first.id; // anchor for invites (unused for past)
            mintInstantUtc = first.instantUtc;
            mintLabel =
              historical.length === 1
                ? `#${first.id}`
                : `#${first.id}-#${last.id}`;
          } else if (isScheduledMintDay) {
            mintNumber = getMintNumberForMintDate(cellDateUtcDay);
            mintLabel = formatMint(mintNumber);
            mintInstantUtc = mintStartInstantUtcForMintDay(cellDateUtcDay);
          }

          const isToday = ymd(cellDateUtcDay) === ymd(new Date());

          if (!isMintDay) {
            return (
              <div
                key={ymd(cellDateUtcDay)}
                className="tw-py-2 tw-min-h-[2.5rem] tw-flex tw-flex-col tw-items-center tw-justify-start tw-border-b-2 tw-text-gray-400"
                style={{ borderColor: "#222222", borderBottomStyle: "solid" }}>
                <span
                  className={`tw-text-xs tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center ${
                    isToday
                      ? "tw-bg-[#20fa59] tw-text-black tw-font-semibold"
                      : "tw-text-gray-400"
                  }`}>
                  {day}
                </span>
                <span className="tw-text-xs tw-font-medium tw-mt-0.5">
                  &nbsp;
                </span>
              </div>
            );
          }

          // Tooltip HTML:
          let tooltipHtml = "";
          let tooltipClassName = "!tw-bg-[#dcc]";

          if (isHistoricalMintDay) {
            // list each historical mint with exact timestamps
            const items = historical
              .map((h) => {
                return `#${h.id}`;
              })
              .join(", ");
            tooltipHtml = `<div style="min-width:220px">
              <div style="font-weight:600; margin-bottom:3px; font-size:larger">
                Meme${historical.length > 1 ? "s" : ""} ${items}
              </div>
              <div style="margin-bottom:12px">${formatFullDate(
                historical[0].instantUtc,
                displayTz
              )}</div>
            </div>`;
          } else if (mintInstantUtc) {
            const now = new Date();
            const oneLine =
              mintInstantUtc.getTime() > now.getTime()
                ? formatFullDateTime(mintInstantUtc, displayTz)
                : formatFullDate(mintInstantUtc, displayTz);
            const invites =
              mintInstantUtc.getTime() > now.getTime()
                ? printCalendarInvites(mintInstantUtc, mintNumber!, "#000")
                : "";
            tooltipHtml = `
              <div style="min-width:220px">
                <div style="font-weight:600; margin-bottom:3px; font-size:larger">Meme ${mintLabel}</div>
                <div style="margin-bottom:12px">${oneLine}</div>
                ${invites}
              </div>`;
            if (mintInstantUtc?.getTime() > now.getTime()) {
              tooltipClassName = "!tw-bg-[#eee]";
            }
          }

          return (
            <button
              type="button"
              id={`meme-cell-${ymd(cellDateUtcDay)}`}
              key={ymd(cellDateUtcDay)}
              className="tw-bg-transparent tw-py-2 tw-min-h-[2.5rem] tw-flex tw-flex-col tw-items-center tw-justify-start tw-border-none tw-border-b-2 tw-cursor-pointer hover:tw-bg-[#eee] hover:tw-text-black"
              style={{
                borderColor: "#222222",
                borderBottomStyle: "solid",
              }}
              data-tooltip-id="meme-tooltip"
              data-tooltip-html={tooltipHtml}
              data-tooltip-class-name={tooltipClassName}
              onClick={() => onSelectDay?.(cellDateUtcDay)}>
              <span
                className={`tw-text-xs tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center ${
                  isToday
                    ? "tw-bg-[#20fa59] tw-text-black tw-font-semibold"
                    : ""
                }`}>
                {day}
              </span>
              {mintLabel && (
                <span className="tw-text-xs tw-font-medium tw-text-blue-600 tw-mt-0.5">
                  {mintLabel}
                </span>
              )}
            </button>
          );
        })}
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
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-4 tw-mt-4">
      {months.map((m) => (
        <Month
          key={toISO(m)}
          date={m}
          onSelectDay={onSelectDay}
          autoOpenYmd={autoOpenYmd}
          displayTz={displayTz}
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
}: YearViewProps) {
  const yearIndex = Math.floor(seasonIndex / SEASONS_PER_YEAR);
  const firstSeasonIndexOfYear = yearIndex * SEASONS_PER_YEAR;
  const currentIdx = getSeasonIndexForDate(new Date());

  // ⭐ Special case: Year 0 (2022) shows a single SZN1 card (Jun–Dec 2022)
  const displayedYear = displayedYearNumberFromIndex(seasonIndex);
  if (displayedYear === 0) {
    const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
    const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
    const sIdx = SZN1_SEASON_INDEX; // our SZN1 bucket
    const isCurrent = currentIdx === sIdx;

    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-mt-4">
        <button
          type="button"
          key={sIdx}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-text-black"
          style={{
            borderColor: isCurrent ? "#20fa59" : "#222222",
            borderWidth: isCurrent ? "2px" : "1px",
          }}
          onClick={() => {
            onSelectSeason(sIdx);
            onZoomToSeason();
          }}>
          <div className="tw-font-semibold">SZN #1</div>
          <div className="tw-text-xs tw-text-gray-500">
            {start.toLocaleString("default", { month: "short" })}{" "}
            {start.getUTCFullYear()} -{" "}
            {end.toLocaleString("default", { month: "short" })}{" "}
            {end.getUTCFullYear()}
          </div>
          <div className="tw-text-sm tw-mt-1">Memes #1 - #47</div>
        </button>
      </div>
    );
  }
  // 👇 existing code for other years stays the same
  const seasons = Array.from({ length: 4 }, (_, s) => {
    const sIdx = firstSeasonIndexOfYear + s;
    const start = getSeasonStartDate(sIdx);
    const end = addMonths(start, 2);
    return { sIdx, start, end, label: getRangeLabel(start, end) };
  });

  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {seasons.map((s) => {
        const isCurrent = currentIdx === s.sIdx;
        return (
          <button
            type="button"
            key={s.sIdx}
            className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
            style={{
              borderColor: isCurrent ? "#20fa59" : "#222222",
              borderWidth: isCurrent ? "2px" : "1px",
            }}
            onClick={() => {
              onSelectSeason(s.sIdx);
              onZoomToSeason();
            }}>
            <div className="tw-font-semibold">
              SZN #{displayedSeasonNumberFromIndex(s.sIdx)}
            </div>
            <div className="tw-text-xs tw-text-gray-500">
              {s.start.toLocaleString("default", { month: "short" })}{" "}
              {s.start.getUTCFullYear()} -{" "}
              {s.end.toLocaleString("default", { month: "short" })}{" "}
              {s.end.getUTCFullYear()}
            </div>
            <div className="tw-text-sm tw-mt-1">{s.label}</div>
          </button>
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
}: EpochViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const epochNumber = displayedEpochNumberFromIndex(seasonIndex);

  if (epochNumber === 0) {
    // Special case: SZN1 epoch, single card for Year #0 (SZN1)
    const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
    const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
    const sIdx = SZN1_SEASON_INDEX; // SZN1
    // Highlight if currentIdx is within SZN1 range
    const isCurrent = currentIdx === sIdx;
    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-mt-4">
        <button
          type="button"
          key={sIdx}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
          style={{
            borderColor: isCurrent ? "#20fa59" : "#222222",
            borderWidth: isCurrent ? "2px" : "1px",
          }}
          onClick={() => {
            onSelectSeason(sIdx);
            onSelectYear(0);
            onZoomToYear();
          }}>
          <div className="tw-font-semibold">Year #0 (2022)</div>
          <div className="tw-text-xs tw-text-gray-500">Jun 2022 - Dec 2022</div>
          <div className="tw-text-sm tw-mt-1">Memes #1 - #47</div>
        </button>
      </div>
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
        label: getRangeLabel(start, end),
      };
    });
    return (
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
        {years.map((y) => {
          const isCurrent =
            currentIdx >= y.seasonIndex &&
            currentIdx < y.seasonIndex + SEASONS_PER_YEAR;
          return (
            <button
              type="button"
              key={toISO(y.start)}
              className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
              style={{
                borderColor: isCurrent ? "#20fa59" : "#222222",
                borderWidth: isCurrent ? "2px" : "1px",
              }}
              onClick={() => {
                onSelectYear(y.yearNumber);
                onZoomToYear();
              }}>
              <div className="tw-font-semibold">
                Year #{y.yearNumber} ({y.start.getUTCFullYear()})
              </div>
              <div className="tw-text-xs tw-text-gray-500">
                {y.start.toLocaleString("default", { month: "short" })}{" "}
                {y.start.getUTCFullYear()} -{" "}
                {y.end.toLocaleString("default", { month: "short" })}{" "}
                {y.end.getUTCFullYear()}
              </div>
              <div className="tw-text-sm tw-mt-1">{y.label}</div>
            </button>
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
}: PeriodViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);

  if (periodNumber === 0) {
    // Special case: SZN1 period, single card for Epoch #0
    const start = new Date(SZN1_RANGE.start); // Jun 1, 2022
    const end = new Date(SZN1_RANGE.end); // Dec 31, 2022
    const sIdx = SZN1_SEASON_INDEX; // SZN1
    const isCurrent = currentIdx === sIdx;
    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-mt-4">
        <button
          type="button"
          key={sIdx}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
          style={{
            borderColor: isCurrent ? "#20fa59" : "#222222",
            borderWidth: isCurrent ? "2px" : "1px",
          }}
          onClick={() => {
            onSelectEpoch(0);
            onZoomToEpoch();
          }}>
          <div className="tw-font-semibold">Epoch #0 (2022)</div>
          <div className="tw-text-xs tw-text-gray-500">Jun 2022 - Dec 2022</div>
          <div className="tw-text-sm tw-mt-1">Memes #1 - #47</div>
        </button>
      </div>
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
        label: getRangeLabel(start, end),
      };
    });
    return (
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
        {epochs.map((ep) => {
          const isCurrent =
            currentIdx >= ep.seasonIndex &&
            currentIdx < ep.seasonIndex + SEASONS_PER_EPOCH;
          return (
            <button
              type="button"
              key={toISO(ep.start)}
              className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
              style={{
                borderColor: isCurrent ? "#20fa59" : "#222222",
                borderWidth: isCurrent ? "2px" : "1px",
              }}
              onClick={() => {
                onSelectEpoch(ep.epochNumber);
                onZoomToEpoch();
              }}>
              <div className="tw-font-semibold">
                Epoch #{ep.epochNumber} ({ep.start.getUTCFullYear()})
              </div>
              <div className="tw-text-xs tw-text-gray-500">
                {ep.start.toLocaleString("default", { month: "short" })}{" "}
                {ep.start.getUTCFullYear()} -{" "}
                {ep.end.toLocaleString("default", { month: "short" })}{" "}
                {ep.end.getUTCFullYear()}
              </div>
              <div className="tw-text-sm tw-mt-1">{ep.label}</div>
            </button>
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
}: EraViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const eraNumber = displayedEraNumberFromIndex(seasonIndex);

  // Era #0 – special (SZN1 only)
  if (eraNumber === 0) {
    const sIdx = SZN1_SEASON_INDEX; // SZN1 bucket
    const isCurrent = currentIdx === sIdx;
    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-mt-4">
        <button
          type="button"
          key={sIdx}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
          style={{
            borderColor: isCurrent ? "#20fa59" : "#222222",
            borderWidth: isCurrent ? "2px" : "1px",
          }}
          onClick={() => {
            onSelectPeriod(0);
            onZoomToPeriod();
          }}>
          <div className="tw-font-semibold">Period #0 (2022)</div>
          <div className="tw-text-xs tw-text-gray-500">Jun 2022 - Dec 2022</div>
          <div className="tw-text-sm tw-mt-1">Memes #1 - #47</div>
        </button>
      </div>
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
      label: getRangeLabel(start, end),
    };
  });

  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {periods.map((p) => {
        const isCurrent =
          currentIdx >= p.seasonIndex &&
          currentIdx < p.seasonIndex + SEASONS_PER_PERIOD;
        return (
          <button
            type="button"
            key={toISO(p.start)}
            className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
            style={{
              borderColor: isCurrent ? "#20fa59" : "#222222",
              borderWidth: isCurrent ? "2px" : "1px",
            }}
            onClick={() => {
              onSelectPeriod(p.periodNumber);
              onZoomToPeriod();
            }}>
            <div className="tw-font-semibold">
              Period #{p.periodNumber} ({p.start.getUTCFullYear()})
            </div>
            <div className="tw-text-xs tw-text-gray-500">
              {p.start.toLocaleString("default", { month: "short" })}{" "}
              {p.start.getUTCFullYear()} -{" "}
              {p.end.toLocaleString("default", { month: "short" })}{" "}
              {p.end.getUTCFullYear()}
            </div>
            <div className="tw-text-sm tw-mt-1">{p.label}</div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * EonView - eras only, one per row, with ranges; drill into Era view.
 */
function EonView({ seasonIndex, onSelectEra, onZoomToEra }: EonViewProps) {
  const currentIdx = getSeasonIndexForDate(new Date());
  const eonNumber = displayedEonNumberFromIndex(seasonIndex);

  // Eon #0 – special (SZN1 only)
  if (eonNumber === 0) {
    const sIdx = SZN1_SEASON_INDEX;
    const isCurrent = currentIdx === sIdx;
    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-mt-4">
        <button
          type="button"
          key={sIdx}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
          style={{
            borderColor: isCurrent ? "#20fa59" : "#222222",
            borderWidth: isCurrent ? "2px" : "1px",
          }}
          onClick={() => {
            onSelectEra(0);
            onZoomToEra();
          }}>
          <div className="tw-font-semibold">Era #0 (2022)</div>
          <div className="tw-text-xs tw-text-gray-500">Jun 2022 - Dec 2022</div>
          <div className="tw-text-sm tw-mt-1">Memes #1 - #47</div>
        </button>
      </div>
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
      label: getRangeLabel(start, end),
    };
  });

  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {eras.map((er) => {
        const isCurrent =
          currentIdx >= er.seasonIndex &&
          currentIdx < er.seasonIndex + SEASONS_PER_ERA;
        return (
          <button
            type="button"
            key={toISO(er.start)}
            className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#222222] hover:tw-bg-[#eee] hover:tw-text-black"
            style={{
              borderColor: isCurrent ? "#20fa59" : "#222222",
              borderWidth: isCurrent ? "2px" : "1px",
            }}
            onClick={() => {
              onSelectEra(er.eraNumber);
              onZoomToEra();
            }}>
            <div className="tw-font-semibold">
              Era #{er.eraNumber} ({er.start.getUTCFullYear()})
            </div>
            <div className="tw-text-xs tw-text-gray-500">
              {er.start.toLocaleString("default", { month: "short" })}{" "}
              {er.start.getUTCFullYear()} -{" "}
              {er.end.toLocaleString("default", { month: "short" })}{" "}
              {er.end.getUTCFullYear()}
            </div>
            <div className="tw-text-sm tw-mt-1">{er.label}</div>
          </button>
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
}

export default function MemeCalendar({ displayTz }: MemeCalendarProps) {
  const [seasonIndex, setSeasonIndex] = useState<number>(() => {
    try {
      return getSeasonIndexForDate(new Date());
    } catch {
      return 0;
    }
  });
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("season");
  const [jumpValue, setJumpValue] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [jumpMint, setJumpMint] = useState<string>("");
  const [autoOpenYmd, setAutoOpenYmd] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const seasonNumber = displayedSeasonNumberFromIndex(seasonIndex);
  const yearNumber = displayedYearNumberFromIndex(seasonIndex);
  const epochNumber = displayedEpochNumberFromIndex(seasonIndex);
  const periodNumber = displayedPeriodNumberFromIndex(seasonIndex);
  const eraNumber = displayedEraNumberFromIndex(seasonIndex);
  const eonNumber = displayedEonNumberFromIndex(seasonIndex);

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
      case "season":
        return (
          <SeasonView
            seasonIndex={seasonIndex}
            autoOpenYmd={autoOpenYmd ?? undefined}
            displayTz={displayTz}
          />
        );
      case "year":
        return (
          <YearView
            seasonIndex={seasonIndex}
            onSelectSeason={setSeasonIndex}
            onZoomToSeason={() => setZoomLevel("season")}
          />
        );
      case "epoch":
        return (
          <EpochView
            seasonIndex={seasonIndex}
            onSelectSeason={setSeasonIndex}
            onSelectYear={selectYear}
            onZoomToYear={() => setZoomLevel("year")}
          />
        );
      case "period":
        return (
          <PeriodView
            seasonIndex={seasonIndex}
            onSelectEpoch={selectEpoch}
            onZoomToEpoch={() => setZoomLevel("epoch")}
          />
        );
      case "era":
        return (
          <EraView
            seasonIndex={seasonIndex}
            onSelectPeriod={selectPeriod}
            onZoomToPeriod={() => setZoomLevel("period")}
          />
        );
      case "eon":
        return (
          <EonView
            seasonIndex={seasonIndex}
            onSelectEra={selectEra}
            onZoomToEra={() => setZoomLevel("era")}
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

  return (
    <div className="tw-p-4 tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
      {/* Division (zoom) selector buttons */}
      <div className="tw-mb-8 tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-2">
        {(
          [
            ["season", `SZN ${seasonNumber}`],
            ["year", `Year ${yearNumber}`],
            ["epoch", `Epoch ${epochNumber}`],
            ["period", `Period ${periodNumber}`],
            ["era", `Era ${eraNumber}`],
            ["eon", `Eon ${eonNumber}`],
          ] as [ZoomLevel, string][]
        ).map(([level, label]) => (
          <button
            key={level}
            className={
              "tw-w-full tw-px-3 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-colors " +
              (zoomLevel === level
                ? "tw-bg-blue-600 tw-text-white tw-border-blue-500 tw-shadow"
                : "tw-bg-gray-100 tw-text-gray-900 tw-border-gray-300 hover:tw-bg-gray-200 dark:tw-bg-gray-800 dark:tw-text-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700")
            }
            onClick={() => setZoomLevel(level)}>
            {label}
          </button>
        ))}
      </div>

      {/* Unified navigation based on selected division */}
      <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mt-2">
        {/* Left half: Prev | Title+Range | Next */}
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-min-w-0 md:tw-basis-1/3 md:tw-max-w-[35%]">
          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-1.5 tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
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
                case "season":
                  delta = -1;
                  break;
                case "year":
                  delta = -SEASONS_PER_YEAR;
                  break;
              }
              setSeasonIndex((s) => clampIndex(s + delta));
            }}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </button>

          {/* Label block: title and date range; wraps if needed */}
          <div className="tw-flex-1 tw-min-w-0 tw-text-center">
            <div className="tw-font-semibold tw-text-sm">
              {getZoomTitle(zoomLevel, seasonIndex)}
            </div>
            {(() => {
              const { start, end } = getRangeDatesByZoom(
                zoomLevel,
                seasonIndex
              );
              const range = `${formatMonthYearShort(
                start
              )} - ${formatMonthYearShort(end)}`;
              const mintRange = isSznOneIndex(seasonIndex)
                ? "Memes #1 - #47"
                : getRangeLabel(start, end);
              return (
                <div className="tw-text-xs tw-text-gray-400 tw-whitespace-normal tw-break-words">
                  {range} / {mintRange}
                </div>
              );
            })()}
          </div>

          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-1.5 tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
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
                case "season":
                  delta = 1;
                  break;
                case "year":
                  delta = SEASONS_PER_YEAR;
                  break;
              }
              setSeasonIndex((s) => clampIndex(s + delta));
            }}>
            <FontAwesomeIcon icon={faCaretRight} />
          </button>
        </div>

        {/* Right half: action icons */}
        <div className="tw-flex tw-items-center tw-gap-2">
          {/* Today */}
          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
            aria-label="Jump to Today"
            title="Jump to Today"
            onClick={() => {
              const now = new Date();
              const idx = getSeasonIndexForDate(now);
              setSeasonIndex(clampIndex(idx));
              // TODO: should we change to season or keep current view
              // setZoomLevel("season");
            }}>
            <FontAwesomeIcon icon={faCrosshairs} />
          </button>

          {/* More */}
          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
            aria-label="More features"
            title="More features"
            onClick={() => {
              setShowAdvanced((v) => !v);
              setShowInfo(false);
            }}>
            <FontAwesomeIcon
              icon={showAdvanced ? faChevronUp : faChevronDown}
            />
          </button>

          {/* Info */}
          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
            aria-label="Info"
            title="Info"
            onClick={() => {
              setShowInfo((v) => !v);
              setShowAdvanced(false);
            }}>
            <FontAwesomeIcon icon={showInfo ? faXmarkCircle : faInfoCircle} />
          </button>
        </div>
      </div>

      <div
        className={
          "tw-rounded-md tw-bg-black tw-border tw-border-solid tw-border-[#222222] " +
          "tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-out tw-origin-top " +
          (showAdvanced
            ? "tw-opacity-100 tw-max-h-[320px] tw-scale-y-100 tw-py-5 tw-px-3"
            : "tw-opacity-0 tw-max-h-0 tw-scale-y-95 tw-pointer-events-none")
        }
        aria-hidden={!showAdvanced}>
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-8 tw-items-start md:tw-items-end">
          {/* Jump to month */}
          <div className="tw-flex tw-flex-col tw-gap-1 tw-w-full md:tw-w-auto">
            <label className="tw-text-xs tw-font-medium" htmlFor="jump-date">
              Jump to Date
            </label>
            <div className="tw-flex tw-items-center tw-gap-2">
              <input
                id="jump-date"
                type="month"
                value={jumpValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setJumpValue(v);
                  const [ys, ms] = v.split("-");
                  const y = Number(ys);
                  const m = Number(ms);
                  if (!y || !m) return;
                  const d = new Date(y, m - 1, 1);
                  const idx = getSeasonIndexForDate(d);
                  setSeasonIndex(clampIndex(idx));
                  setZoomLevel("season");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!jumpValue) return;
                    const [ys, ms] = jumpValue.split("-");
                    const y = Number(ys);
                    const m = Number(ms);
                    if (!y || !m) return;
                    const d = new Date(y, m - 1, 1);
                    const idx = getSeasonIndexForDate(d);
                    setSeasonIndex(clampIndex(idx));
                    setZoomLevel("season");
                  }
                }}
                className="tw-border tw-rounded tw-px-2 tw-py-1 tw-text-sm tw-w-full md:tw-w-56 tw-bg-[#eee] tw-text-gray-900 dark:tw-bg-gray-800 dark:tw-text-gray-100 dark:tw-border-gray-700 placeholder:tw-text-gray-500 dark:placeholder:tw-text-gray-400"
              />
              <button
                className="tw-px-3 tw-py-1 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-text-sm tw-text-gray-900 dark:tw-text-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700"
                onClick={() => {
                  if (!jumpValue) return;
                  const [ys, ms] = jumpValue.split("-");
                  const y = Number(ys);
                  const m = Number(ms);
                  if (!y || !m) return;
                  const d = new Date(y, m - 1, 1);
                  const idx = getSeasonIndexForDate(d);
                  setSeasonIndex(clampIndex(idx));
                  setZoomLevel("season");
                }}>
                Jump
              </button>
            </div>
          </div>

          {/* Jump to meme number */}
          <div className="tw-flex tw-flex-col tw-gap-1 tw-w-full md:tw-w-auto">
            <label className="tw-text-xs tw-font-medium" htmlFor="jump-meme">
              Jump to Meme #
            </label>
            <div className="tw-flex tw-items-center tw-gap-2">
              <input
                id="jump-meme"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="#"
                value={jumpMint}
                onChange={(e) => setJumpMint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(jumpMint, 10);
                    if (!n || n < 1) return;
                    const d = dateFromMintNumber(n);
                    const idx = getSeasonIndexForDate(d);
                    setSeasonIndex(clampIndex(idx));
                    setZoomLevel("season");
                    setAutoOpenYmd(ymd(d));
                    setTimeout(() => setAutoOpenYmd(null), 1200);
                  }
                }}
                className="tw-border tw-rounded tw-px-2 tw-py-1 tw-text-sm tw-w-full md:tw-w-40 tw-bg-[#eee] tw-text-gray-900 dark:tw-bg-gray-800 dark:tw-text-gray-100 dark:tw-border-gray-700 placeholder:tw-text-gray-500 dark:placeholder:tw-text-gray-400"
              />
              <button
                className="tw-px-3 tw-py-1 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-text-sm tw-text-gray-900 dark:tw-text-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700"
                onClick={() => {
                  const n = parseInt(jumpMint, 10);
                  if (!n || n < 1) return;
                  const d = dateFromMintNumber(n);
                  const idx = getSeasonIndexForDate(d);
                  setSeasonIndex(clampIndex(idx));
                  setZoomLevel("season");
                  setAutoOpenYmd(ymd(d));
                  setTimeout(() => setAutoOpenYmd(null), 1200);
                }}>
                Jump
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          "tw-rounded-md tw-bg-black tw-border tw-border-solid tw-border-[#222222] " +
          "tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-out tw-origin-top " +
          (showInfo
            ? "tw-opacity-100 tw-max-h-[320px] tw-scale-y-100 tw-py-5 tw-px-3"
            : "tw-opacity-0 tw-max-h-0 tw-scale-y-95 tw-pointer-events-none")
        }
        aria-hidden={!showInfo}>
        <div className="tw-py-2">
          <span className="tw-font-bold">Minting Days</span> - Monday /
          Wednesday / Friday
        </div>
        <div className="tw-py-2">
          <span className="tw-font-bold">SZN</span> - Traditional calendar
          quarter system / 3 months each{" "}
          <span className="tw-text-gray-500">~ 39 mints</span>
        </div>
        <div className="tw-py-2">
          <span className="tw-font-bold">YEAR</span> - 4 SZNs in 1 YEAR{" "}
          <span className="tw-text-gray-500">~ 156 mints</span>
        </div>
        <div className="tw-py-2">
          <span className="tw-font-bold">EPOCH</span> - 4 YEARs / 16 SZNs{" "}
          <span className="tw-text-gray-500">~ 626 mints</span>
        </div>
        <div className="tw-py-2">
          <span className="tw-font-bold">PERIOD</span> - 5 EPOCHs / 20 YEARs /
          80 SZNs <span className="tw-text-gray-500">~ 3,130 mints</span>
        </div>
        <div className="tw-py-2">
          <span className="tw-font-bold">ERA</span> - 5 PERIODs / 20 EPOCHs /
          100 YEARs / 400 SZNs{" "}
          <span className="tw-text-gray-500">~ 15,650 mints</span>
        </div>
        <div className="tw-py-2">
          <span className="tw-font-bold">EON</span> - 10 ERAs / 100 PERIODs /
          1,000 YEARs / 4000 SZNs{" "}
          <span className="tw-text-gray-500">~ 156,500 mints</span>
        </div>
      </div>

      {/* Calendar view */}
      <div>{renderView()}</div>

      {/* Global tooltip for mints */}
      <Tooltip
        id="meme-tooltip"
        clickable
        openOnClick
        className="tw-max-w-sm !tw-opacity-[0.975] !tw-text-black !tw-rounded-md !tw-border !tw-border-solid !tw-border-[#222222]"
      />
    </div>
  );
}
