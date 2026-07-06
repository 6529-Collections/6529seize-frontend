"use client";

import { useState, type FormEvent } from "react";

import useIsMobileScreen from "@/hooks/isMobileScreen";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  faCaretLeft,
  faCaretRight,
  faInfoCircle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";

import {
  dateFromMintNumber,
  displayedEonNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedSeasonNumberFromIndex,
  displayedYearNumberFromIndex,
  formatUtcMonthYear,
  getRangeDatesByZoom,
  getRangeLabel,
  getSeasonIndexForDate,
  isSznOneIndex,
  SEASONS_PER_YEAR,
  SZN1_SEASON_INDEX,
  ymd,
} from "../meme-calendar.helpers";
import {
  getDivisionName,
  getZoomLabel,
  getZoomTitle,
  GRID_INFO_ITEMS,
  ZOOM_LEVELS,
} from "./calendarText";
import {
  EonView,
  EpochView,
  EraView,
  PeriodView,
  SeasonView,
  YearView,
} from "./CalendarViews";
import type { MemeCalendarProps, ZoomLevel } from "./types";

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
