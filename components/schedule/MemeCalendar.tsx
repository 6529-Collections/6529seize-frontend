"use client";

import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import {
  SEASONS_PER_EON,
  SEASONS_PER_EPOCH,
  SEASONS_PER_ERA,
  SEASONS_PER_PERIOD,
  SEASONS_PER_YEAR,
  ZoomLevel,
  addMonths,
  dateFromMintNumber,
  formatFullDate,
  formatMint,
  getMintNumberForMintDate,
  getMonthWeeks,
  getRangeLabel,
  getSeasonIndexForDate,
  getSeasonStartDate,
  isMintDayDate,
  printCalendarInvites,
  toISO,
  ymd,
} from "./meme-calendar.helpers";

/*
 * MemeCalendar (TypeScript version)
 *
 * This component implements a custom calendar for Next.js projects that
 * follows the “Meme” time system.  All divisions (SZN, Year,
 * Epoch, Period, Era, Eon) accumulate from a fixed starting date
 * of 1 January 2026. Users can zoom between divisions and
 * navigate forwards/backwards. Tailwind classes are prefixed with
 * `tw-` – configure your Tailwind setup accordingly.
 */

function getRangeDatesByZoom(
  zoom: ZoomLevel,
  seasonIndex: number
): { start: Date; end: Date } {
  switch (zoom) {
    case "season": {
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
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_EPOCH) * SEASONS_PER_EPOCH
      );
      const end = addMonths(start, 12 * 4 - 1);
      return { start, end };
    }
    case "period": {
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_PERIOD) * SEASONS_PER_PERIOD
      );
      const end = addMonths(start, 12 * 20 - 1);
      return { start, end };
    }
    case "era": {
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_ERA) * SEASONS_PER_ERA
      );
      const end = addMonths(start, 12 * 100 - 1);
      return { start, end };
    }
    case "eon": {
      const start = getSeasonStartDate(
        Math.floor(seasonIndex / SEASONS_PER_EON) * SEASONS_PER_EON
      );
      const end = addMonths(start, 12 * 1000 - 1);
      return { start, end };
    }
  }
}

function formatMonthYearShort(d: Date): string {
  return `${d.toLocaleString("default", {
    month: "short",
  })} ${d.getFullYear()}`;
}

function getZoomTitle(zoom: ZoomLevel, seasonIndex: number): string {
  const seasonNumber = seasonIndex + 1;
  const yearNumber = Math.floor(seasonIndex / SEASONS_PER_YEAR) + 1;
  const epochNumber = Math.floor(seasonIndex / SEASONS_PER_EPOCH) + 1;
  const periodNumber = Math.floor(seasonIndex / SEASONS_PER_PERIOD) + 1;
  const eraNumber = Math.floor(seasonIndex / SEASONS_PER_ERA) + 1;
  const eonNumber = Math.floor(seasonIndex / SEASONS_PER_EON) + 1;

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
  date: Date;
  onSelectDay?: (date: Date) => void;
  autoOpenYmd?: string;
}
interface SeasonViewProps {
  seasonIndex: number;
  onSelectDay?: (date: Date) => void;
  autoOpenYmd?: string;
}
interface YearViewProps {
  seasonIndex: number;
  onSelectSeason: (seasonIndex: number) => void;
  onZoomToSeason: () => void;
}
interface EpochViewProps {
  seasonIndex: number;
  onSelectSeason: (seasonIndex: number) => void;
  onSelectYear: (yearNumber: number) => void;
  onZoomToYear: () => void;
}
interface PeriodViewProps {
  seasonIndex: number;
  onSelectSeason: (seasonIndex: number) => void;
  onSelectYear: (yearNumber: number) => void;
  onSelectEpoch: (epochNumber: number) => void;
  onZoomToEpoch: () => void;
}
interface EraViewProps {
  seasonIndex: number;
  onSelectSeason: (seasonIndex: number) => void;
  onSelectYear: (yearNumber: number) => void;
  onSelectEpoch: (epochNumber: number) => void;
  onSelectPeriod: (periodNumber: number) => void;
  onZoomToPeriod: () => void;
}
interface EonViewProps {
  seasonIndex: number;
  onSelectSeason: (seasonIndex: number) => void;
  onSelectYear: (yearNumber: number) => void;
  onSelectEpoch: (epochNumber: number) => void;
  onSelectPeriod: (periodNumber: number) => void;
  onSelectEra: (eraNumber: number) => void;
  onZoomToEra: () => void;
}

/**
 * Month component – renders a month grid with weekday headers.
 */
function Month({ date, onSelectDay, autoOpenYmd }: MonthProps) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthName = date.toLocaleString("default", { month: "long" });
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
    <div className="tw-p-2 tw-flex tw-flex-col tw-space-y-1 tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#181818]">
      {/* Month title */}
      <div className="tw-text-center tw-font-semibold tw-text-sm">
        {monthName} {year}
      </div>
      {/* Weekday header */}
      <div className="tw-grid tw-grid-cols-7 tw-text-xs tw-text-center tw-font-medium tw-mt-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
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
                key={idx}
                className="tw-invisible tw-pointer-events-none"></div>
            );
          }
          const cellDate = new Date(year, month, day);
          const isMintDay = isMintDayDate(cellDate);
          const mintNumber = isMintDay
            ? getMintNumberForMintDate(cellDate)
            : undefined;
          const mintLabel =
            mintNumber !== undefined ? formatMint(mintNumber) : undefined;

          const isToday = ymd(cellDate) === ymd(new Date());

          if (!isMintDay) {
            return (
              <div
                key={idx}
                className="tw-py-2 tw-min-h-[2.5rem] tw-flex tw-flex-col tw-items-center tw-justify-start tw-border-b-2 tw-text-gray-400"
                style={{
                  borderColor: "#222222",
                  borderBottomStyle: "solid",
                }}>
                <span
                  className={`tw-text-xs tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center ${
                    isToday
                      ? "tw-bg-[#eb534e] tw-text-black"
                      : "tw-text-gray-400"
                  }`}>
                  {day}
                </span>
              </div>
            );
          }

          const fullDate = formatFullDate(cellDate);
          const tooltipHtml = `
            <div style="min-width:200px">
              <div style="font-weight:600; margin-bottom:3px; font-size:larger">Meme ${mintLabel}</div>
              <div style="margin-bottom:12px">${fullDate}</div>
              ${printCalendarInvites(cellDate, mintNumber!, "#000")}
            </div>`;

          return (
            <div
              id={`meme-cell-${ymd(cellDate)}`}
              key={idx}
              className="tw-py-2 tw-min-h-[2.5rem] tw-flex tw-flex-col tw-items-center tw-justify-start tw-border-b-2 tw-cursor-pointer hover:tw-bg-[#eee] hover:tw-text-black"
              style={{
                borderColor: "#222222",
                borderBottomStyle: "solid",
              }}
              data-tooltip-id="meme-tooltip"
              data-tooltip-html={tooltipHtml}
              onClick={() => onSelectDay && onSelectDay(cellDate)}>
              <span
                className={`tw-text-xs tw-rounded-full tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center ${
                  isToday ? "tw-bg-[#eb534e] tw-text-black" : ""
                }`}>
                {day}
              </span>
              {mintNumber !== undefined && (
                <span className="tw-text-xs tw-font-medium tw-text-blue-600 tw-mt-0.5">
                  {mintLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SeasonView – displays three consecutive months (a quarter).
 */
function SeasonView({
  seasonIndex,
  onSelectDay,
  autoOpenYmd,
}: SeasonViewProps) {
  const seasonStart = getSeasonStartDate(seasonIndex);
  const months: Date[] = [0, 1, 2].map((offset) => {
    const d = new Date(seasonStart);
    d.setMonth(seasonStart.getMonth() + offset);
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
        />
      ))}
    </div>
  );
}

/**
 * YearView – displays only seasons with range labels and drills down to SZN view.
 */
function YearView({
  seasonIndex,
  onSelectSeason,
  onZoomToSeason,
}: YearViewProps) {
  const yearIndex = Math.floor(seasonIndex / SEASONS_PER_YEAR);
  const firstSeasonIndexOfYear = yearIndex * SEASONS_PER_YEAR;

  const seasons = Array.from({ length: 4 }, (_, s) => {
    const sIdx = firstSeasonIndexOfYear + s;
    const start = getSeasonStartDate(sIdx);
    const end = addMonths(start, 2);
    return { sIdx, start, end, label: getRangeLabel(start, end) };
  });

  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {seasons.map((s) => (
        <div
          key={s.sIdx}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#181818] hover:tw-bg-[#eee] hover:tw-text-black"
          onClick={() => {
            onSelectSeason(s.sIdx);
            onZoomToSeason();
          }}>
          <div className="tw-font-semibold">SZN #{s.sIdx + 1}</div>
          <div className="tw-text-xs tw-text-gray-500">
            {s.start.toLocaleString("default", { month: "short" })}{" "}
            {s.start.getFullYear()} –{" "}
            {s.end.toLocaleString("default", { month: "short" })}{" "}
            {s.end.getFullYear()}
          </div>
          <div className="tw-text-sm tw-mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * EpochView – years only, one per row, with mint ranges. Click drills into Year view.
 */
function EpochView({
  seasonIndex,
  onSelectYear,
  onSelectSeason,
  onZoomToYear,
}: EpochViewProps) {
  const epochIndex = Math.floor(seasonIndex / SEASONS_PER_EPOCH);
  const firstSeasonIndexOfEpoch = epochIndex * SEASONS_PER_EPOCH;

  const years = Array.from({ length: 4 }, (_, yearOffset) => {
    const yearSeasonIndex =
      firstSeasonIndexOfEpoch + yearOffset * SEASONS_PER_YEAR;
    const start = getSeasonStartDate(yearSeasonIndex);
    const end = addMonths(start, 11);
    const yearNumber = yearSeasonIndex / SEASONS_PER_YEAR + 1;
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
      {years.map((y) => (
        <div
          key={toISO(y.start)}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#181818] hover:tw-bg-[#eee] hover:tw-text-black"
          onClick={() => {
            onSelectYear(y.yearNumber);
            onZoomToYear();
          }}>
          <div className="tw-font-semibold">
            Year #{y.yearNumber} ({y.start.getFullYear()})
          </div>
          <div className="tw-text-xs tw-text-gray-500">
            {y.start.toLocaleString("default", { month: "short" })}{" "}
            {y.start.getFullYear()} –{" "}
            {y.end.toLocaleString("default", { month: "short" })}{" "}
            {y.end.getFullYear()}
          </div>
          <div className="tw-text-sm tw-mt-1">{y.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * PeriodView – epochs only, one per row, with ranges; drill into Epoch view.
 */
function PeriodView({
  seasonIndex,
  onSelectEpoch,
  onZoomToEpoch,
}: PeriodViewProps) {
  const periodIndex = Math.floor(seasonIndex / SEASONS_PER_PERIOD);
  const firstSeasonIndexOfPeriod = periodIndex * SEASONS_PER_PERIOD;
  const epochs = Array.from({ length: 5 }, (_, epochOffset) => {
    const epochSeasonIndex =
      firstSeasonIndexOfPeriod + epochOffset * SEASONS_PER_EPOCH;
    const start = getSeasonStartDate(epochSeasonIndex);
    const end = addMonths(start, 12 * 4 - 1);
    const epochNumber = epochSeasonIndex / SEASONS_PER_EPOCH + 1;
    return {
      epochNumber,
      start,
      end,
      seasonIndex: epochSeasonIndex,
      label: getRangeLabel(start, end),
    };
  });
  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {epochs.map((ep) => (
        <div
          key={toISO(ep.start)}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#181818] hover:tw-bg-[#eee] hover:tw-text-black"
          onClick={() => {
            onSelectEpoch(ep.epochNumber);
            onZoomToEpoch();
          }}>
          <div className="tw-font-semibold">
            Epoch #{ep.epochNumber} ({ep.start.getFullYear()})
          </div>
          <div className="tw-text-xs tw-text-gray-500">
            {ep.start.toLocaleString("default", { month: "short" })}{" "}
            {ep.start.getFullYear()} –{" "}
            {ep.end.toLocaleString("default", { month: "short" })}{" "}
            {ep.end.getFullYear()}
          </div>
          <div className="tw-text-sm tw-mt-1">{ep.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * EraView – periods only, one per row, with ranges; drill into Period view.
 */
function EraView({
  seasonIndex,
  onSelectPeriod,
  onZoomToPeriod,
}: EraViewProps) {
  const eraIndex = Math.floor(seasonIndex / SEASONS_PER_ERA);
  const firstSeasonIndexOfEra = eraIndex * SEASONS_PER_ERA;
  const periods = Array.from({ length: 5 }, (_, periodOffset) => {
    const periodSeasonIndex =
      firstSeasonIndexOfEra + periodOffset * SEASONS_PER_PERIOD;
    const start = getSeasonStartDate(periodSeasonIndex);
    const end = addMonths(start, 12 * 20 - 1);
    const periodNumber = periodSeasonIndex / SEASONS_PER_PERIOD + 1;
    return {
      periodNumber,
      start,
      end,
      seasonIndex: periodSeasonIndex,
      label: getRangeLabel(start, end),
    };
  });
  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {periods.map((p) => (
        <div
          key={toISO(p.start)}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#181818] hover:tw-bg-[#eee] hover:tw-text-black"
          onClick={() => {
            onSelectPeriod(p.periodNumber);
            onZoomToPeriod();
          }}>
          <div className="tw-font-semibold">
            Period #{p.periodNumber} ({p.start.getFullYear()})
          </div>
          <div className="tw-text-xs tw-text-gray-500">
            {p.start.toLocaleString("default", { month: "short" })}{" "}
            {p.start.getFullYear()} –{" "}
            {p.end.toLocaleString("default", { month: "short" })}{" "}
            {p.end.getFullYear()}
          </div>
          <div className="tw-text-sm tw-mt-1">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * EonView – eras only, one per row, with ranges; drill into Era view.
 */
function EonView({ seasonIndex, onSelectEra, onZoomToEra }: EonViewProps) {
  const eonIndex = Math.floor(seasonIndex / SEASONS_PER_EON);
  const firstSeasonIndexOfEon = eonIndex * SEASONS_PER_EON;
  const eras = Array.from({ length: 10 }, (_, eraOffset) => {
    const eraSeasonIndex = firstSeasonIndexOfEon + eraOffset * SEASONS_PER_ERA;
    const start = getSeasonStartDate(eraSeasonIndex);
    const end = addMonths(start, 12 * 100 - 1);
    const eraNumber = eraSeasonIndex / SEASONS_PER_ERA + 1;
    return {
      eraNumber,
      start,
      end,
      seasonIndex: eraSeasonIndex,
      label: getRangeLabel(start, end),
    };
  });
  return (
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mt-4">
      {eras.map((er) => (
        <div
          key={toISO(er.start)}
          className="tw-p-3 tw-cursor-pointer tw-bg-black tw-rounded-md tw-border tw-border-solid tw-border-[#181818] hover:tw-bg-[#eee] hover:tw-text-black"
          onClick={() => {
            onSelectEra(er.eraNumber);
            onZoomToEra();
          }}>
          <div className="tw-font-semibold">
            Era #{er.eraNumber} ({er.start.getFullYear()})
          </div>
          <div className="tw-text-xs tw-text-gray-500">
            {er.start.toLocaleString("default", { month: "short" })}{" "}
            {er.start.getFullYear()} –{" "}
            {er.end.toLocaleString("default", { month: "short" })}{" "}
            {er.end.getFullYear()}
          </div>
          <div className="tw-text-sm tw-mt-1">{er.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Main MemeCalendar component (TypeScript). Manages state and renders
 * appropriate views based on zoom level.
 */
export default function MemeCalendar() {
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
  const seasonNumber = seasonIndex + 1;
  const yearNumber = Math.floor(seasonIndex / SEASONS_PER_YEAR) + 1;
  const epochNumber = Math.floor(seasonIndex / SEASONS_PER_EPOCH) + 1;
  const periodNumber = Math.floor(seasonIndex / SEASONS_PER_PERIOD) + 1;
  const eraNumber = Math.floor(seasonIndex / SEASONS_PER_ERA) + 1;
  const eonNumber = Math.floor(seasonIndex / SEASONS_PER_EON) + 1;

  // Jump to specific numbers (1‑based)
  const selectYear = (n: number) => setSeasonIndex((n - 1) * SEASONS_PER_YEAR);
  const selectEpoch = (n: number) =>
    setSeasonIndex((n - 1) * SEASONS_PER_EPOCH);
  const selectPeriod = (n: number) =>
    setSeasonIndex((n - 1) * SEASONS_PER_PERIOD);
  const selectEra = (n: number) => setSeasonIndex((n - 1) * SEASONS_PER_ERA);
  const selectEon = (n: number) => setSeasonIndex((n - 1) * SEASONS_PER_EON);

  const renderView = () => {
    switch (zoomLevel) {
      case "season":
        return (
          <SeasonView
            seasonIndex={seasonIndex}
            onSelectDay={() => {}}
            autoOpenYmd={autoOpenYmd ?? undefined}
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
            onSelectSeason={setSeasonIndex}
            onSelectYear={selectYear}
            onSelectEpoch={selectEpoch}
            onZoomToEpoch={() => setZoomLevel("epoch")}
          />
        );
      case "era":
        return (
          <EraView
            seasonIndex={seasonIndex}
            onSelectSeason={setSeasonIndex}
            onSelectYear={selectYear}
            onSelectEpoch={selectEpoch}
            onSelectPeriod={selectPeriod}
            onZoomToPeriod={() => setZoomLevel("period")}
          />
        );
      case "eon":
        return (
          <EonView
            seasonIndex={seasonIndex}
            onSelectSeason={setSeasonIndex}
            onSelectYear={selectYear}
            onSelectEpoch={selectEpoch}
            onSelectPeriod={selectPeriod}
            onSelectEra={selectEra}
            onZoomToEra={() => setZoomLevel("era")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tw-p-4 tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#181818]">
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
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-min-w-0 md:tw-basis-1/2 md:tw-max-w-[50%]">
          <button
            className="tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-gray-600 tw-bg-gray-800 tw-text-white hover:tw-bg-gray-700"
            onClick={() => {
              let delta = 0;
              switch (zoomLevel) {
                case "season":
                  delta = -1;
                  break;
                case "year":
                  delta = -SEASONS_PER_YEAR;
                  break;
                case "epoch":
                  delta = -SEASONS_PER_EPOCH;
                  break;
                case "period":
                  delta = -SEASONS_PER_PERIOD;
                  break;
                case "era":
                  delta = -SEASONS_PER_ERA;
                  break;
                case "eon":
                  delta = -SEASONS_PER_EON;
                  break;
              }
              setSeasonIndex((s) => Math.max(0, s + delta));
            }}>
            Prev
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
              )} – ${formatMonthYearShort(end)}`;
              return (
                <div className="tw-text-xs tw-text-gray-400 tw-whitespace-normal tw-break-words">
                  {range}
                </div>
              );
            })()}
          </div>

          <button
            className="tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-gray-600 tw-bg-gray-800 tw-text-white hover:tw-bg-gray-700"
            onClick={() => {
              let delta = 0;
              switch (zoomLevel) {
                case "season":
                  delta = 1;
                  break;
                case "year":
                  delta = SEASONS_PER_YEAR;
                  break;
                case "epoch":
                  delta = SEASONS_PER_EPOCH;
                  break;
                case "period":
                  delta = SEASONS_PER_PERIOD;
                  break;
                case "era":
                  delta = SEASONS_PER_ERA;
                  break;
                case "eon":
                  delta = SEASONS_PER_EON;
                  break;
              }
              setSeasonIndex((s) => s + delta);
            }}>
            Next
          </button>
        </div>

        {/* Right half: action icons */}
        <div className="tw-flex tw-items-center tw-gap-2">
          {/* Today */}
          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
            aria-label="Jump to today"
            title="Jump to today"
            onClick={() => {
              const now = new Date();
              const idx = getSeasonIndexForDate(now);
              setSeasonIndex(Math.max(0, idx));
              setZoomLevel("season");
            }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              className="tw-w-4 tw-h-4"
              fill="currentColor"
              aria-hidden="true">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10m0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12" />
              <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
              <path d="M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
            </svg>
          </button>

          {/* More */}
          <button
            className="tw-inline-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-md tw-border tw-border-gray-300 hover:tw-bg-gray-100 dark:tw-border-gray-700 dark:hover:tw-bg-gray-700 tw-text-gray-900 dark:tw-text-gray-100"
            aria-label="More features"
            title="More features"
            onClick={() => setShowAdvanced((v) => !v)}>
            <FontAwesomeIcon
              icon={showAdvanced ? faChevronUp : faChevronDown}
            />
          </button>
        </div>
      </div>

      <div
        className={
          "tw-rounded-md tw-bg-black tw-border tw-border-solid tw-border-[#181818] " +
          "tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-out tw-origin-top " +
          (showAdvanced
            ? "tw-opacity-100 tw-max-h-[320px] tw-scale-y-100 tw-py-5 tw-px-3"
            : "tw-opacity-0 tw-max-h-0 tw-scale-y-95 tw-pointer-events-none")
        }
        aria-hidden={!showAdvanced}>
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-8 tw-items-start md:tw-items-end">
          {/* Jump to month */}
          <div className="tw-flex tw-flex-col tw-gap-1 tw-w-full md:tw-w-auto">
            <label className="tw-text-xs tw-font-medium">Jump to Date</label>
            <div className="tw-flex tw-items-center tw-gap-2">
              <input
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
                  setSeasonIndex(Math.max(0, idx));
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
                    setSeasonIndex(Math.max(0, idx));
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
                  setSeasonIndex(Math.max(0, idx));
                  setZoomLevel("season");
                }}>
                Jump
              </button>
            </div>
          </div>

          {/* Jump to meme number */}
          <div className="tw-flex tw-flex-col tw-gap-1 tw-w-full md:tw-w-auto">
            <label className="tw-text-xs tw-font-medium">Jump to Meme #</label>
            <div className="tw-flex tw-items-center tw-gap-2">
              <input
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
                    setSeasonIndex(Math.max(0, idx));
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
                  setSeasonIndex(Math.max(0, idx));
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

      {/* Calendar view */}
      <div>{renderView()}</div>

      {/* Global tooltip for mint days */}
      <Tooltip
        id="meme-tooltip"
        clickable
        openOnClick
        className="tw-max-w-sm !tw-opacity-[0.975] !tw-bg-[#eee] !tw-text-black !tw-rounded-md !tw-border !tw-border-solid !tw-border-[#181818]"
      />
    </div>
  );
}
