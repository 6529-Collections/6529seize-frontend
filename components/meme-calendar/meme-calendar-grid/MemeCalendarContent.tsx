"use client";

import { useRef, useState, type FormEvent } from "react";

import Button from "@/components/utils/button/Button";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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

const MAX_MINT_NUMBER = 100_000;
const CONTROL_GROUP_CLASS =
  "tw-flex tw-h-9 tw-w-full tw-min-w-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.07] tw-pl-3 tw-text-xs tw-font-semibold tw-text-iron-200 tw-shadow-sm tw-shadow-black/20 tw-transition-colors focus-within:tw-border-primary-400 focus-within:tw-ring-1 focus-within:tw-ring-primary-400";
const CONTROL_INPUT_CLASS =
  "tw-h-8 tw-min-w-0 tw-flex-1 tw-rounded-r-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-text-iron-50 tw-outline-none placeholder:tw-text-iron-600";

export default function MemeCalendar({
  displayTz,
  locale = DEFAULT_LOCALE,
}: MemeCalendarProps) {
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
  const [jumpMintError, setJumpMintError] = useState<string>("");
  const [autoOpenYmd, setAutoOpenYmd] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
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
    const n = Number.parseInt(jumpMint, 10);
    if (!Number.isSafeInteger(n) || n < 1 || n > MAX_MINT_NUMBER) {
      setJumpMintError(
        t(locale, "memeCalendar.validation.memeNumber", {
          max: formatInteger(locale, MAX_MINT_NUMBER),
        })
      );
      return;
    }
    setJumpMintError("");
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
    const d = new Date(Date.UTC(y, m - 1, 1));
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

  const openMonthPicker = () => {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }

    const pickerInput = input as HTMLInputElement & {
      readonly showPicker?: () => void;
    };

    if (typeof pickerInput.showPicker === "function") {
      try {
        pickerInput.showPicker();
      } catch {
        input.focus();
      }
      return;
    }

    input.focus();
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
    <section className="tw-min-w-0">
      {/* Division (zoom) selector buttons */}
      <div className="tw-mb-6">
        <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
            {t(locale, "memeCalendar.grid.zoomGroup")}
          </p>
          <button
            type="button"
            aria-controls="meme-calendar-info"
            aria-expanded={showInfo}
            aria-label={infoButtonLabel}
            data-tooltip-id="meme-calendar-guide-tooltip"
            data-tooltip-content={infoButtonLabel}
            data-tooltip-place="top"
            className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-100"
            onClick={() => setShowInfo((v) => !v)}
          >
            {showInfo ? (
              <XMarkIcon aria-hidden="true" className="tw-size-4" />
            ) : (
              <InformationCircleIcon aria-hidden="true" className="tw-size-4" />
            )}
          </button>
        </div>
        <fieldset className="tw-m-0 tw-grid tw-grid-cols-3 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-1 tw-text-xs sm:tw-h-8 sm:tw-grid-cols-6">
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
                  "tw-inline-flex tw-h-6 tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-px-2.5 tw-text-xs tw-font-medium tw-leading-none tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 " +
                  (zoomLevel === level
                    ? "tw-bg-iron-800 tw-text-iron-50"
                    : "tw-bg-iron-950 tw-text-iron-400 desktop-hover:hover:tw-text-iron-300")
                }
                onClick={() => setZoomLevel(level)}
              >
                {label}
              </button>
            );
          })}
        </fieldset>
      </div>

      <section
        id="meme-calendar-info"
        aria-label={t(locale, "memeCalendar.grid.info.panelLabel")}
        className={
          "tw-rounded-2xl tw-bg-iron-950 tw-text-sm tw-leading-6 tw-text-iron-300 tw-shadow-lg tw-ring-1 tw-ring-white/[0.04] " +
          (showInfo ? "tw-mb-6 tw-p-5 sm:tw-p-6" : "tw-hidden")
        }
        aria-hidden={!showInfo}
      >
        <div className="tw-grid tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          {GRID_INFO_ITEMS.map(({ label, text, note }) => (
            <div key={label} className="tw-min-w-0">
              <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
                {t(locale, label)}
              </div>
              <div className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, text)}{" "}
                {note && (
                  <span className="tw-text-iron-500">{t(locale, note)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="tw-mb-5 tw-rounded-xl tw-bg-iron-950 tw-p-3 tw-shadow-lg tw-ring-1 tw-ring-white/[0.04] sm:tw-p-4">
        <div className="tw-grid tw-w-full tw-min-w-0 tw-grid-cols-2 tw-items-center tw-gap-2 sm:tw-grid-cols-[auto_minmax(0,1fr)_auto] sm:tw-gap-3">
          <Button
            type="button"
            aria-label={previousDivisionLabel}
            variant="tertiary"
            size="sm"
            className="tw-order-2 tw-w-full sm:tw-order-1 sm:tw-w-auto"
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
            <ChevronLeftIcon aria-hidden="true" className="tw-size-4" />
            <span>{previousDivisionLabel}</span>
          </Button>

          <div className="tw-order-1 tw-col-span-2 tw-min-w-0 tw-text-center sm:tw-order-2 sm:tw-col-span-1">
            <div className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
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
                ? t(locale, "memeCalendar.grid.memeRange", {
                    start: formatInteger(locale, 1),
                    end: formatInteger(locale, 47),
                  })
                : getRangeLabel(start, end, locale);
              return (
                <div className="tw-mt-0.5 tw-whitespace-normal tw-break-words tw-text-xs tw-leading-5 tw-text-iron-400">
                  {range} / {mintRange}
                </div>
              );
            })()}
          </div>

          <Button
            type="button"
            aria-label={nextDivisionLabel}
            variant="tertiary"
            size="sm"
            className="tw-order-3 tw-w-full sm:tw-w-auto"
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
            <span>{nextDivisionLabel}</span>
            <ChevronRightIcon aria-hidden="true" className="tw-size-4" />
          </Button>
        </div>
        <fieldset className="tw-m-0 tw-mt-3 tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-transparent tw-p-0 tw-pt-3 sm:tw-grid-cols-[auto_minmax(0,1fr)_minmax(0,1.2fr)]">
          <legend className="tw-sr-only">
            {t(locale, "memeCalendar.grid.jumpControls")}
          </legend>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="tw-w-full"
            onClick={handleJumpToToday}
          >
            {t(locale, "memeCalendar.grid.jumpToday")}
          </Button>
          <form
            className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-2"
            noValidate
            onSubmit={handleMintJumpSubmit}
          >
            <label
              htmlFor="meme-calendar-mint-input"
              className={`${CONTROL_GROUP_CLASS} ${
                jumpMintError ? "tw-border-error" : ""
              }`}
            >
              <span className="tw-shrink-0 tw-select-none tw-pr-2">
                {t(locale, "memeCalendar.grid.memeNumber")}
              </span>
              <input
                id="meme-calendar-mint-input"
                type="number"
                min={1}
                max={MAX_MINT_NUMBER}
                name="meme-calendar-mint-input"
                placeholder="123"
                value={jumpMint}
                aria-describedby={
                  jumpMintError ? "meme-calendar-mint-input-error" : undefined
                }
                aria-invalid={jumpMintError ? true : undefined}
                onChange={(event) => {
                  const v = event.target.value.replaceAll(/\D/g, "");
                  setJumpMint(v);
                  setJumpMintError("");
                }}
                className={`${CONTROL_INPUT_CLASS} [appearance:textfield] [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none`}
              />
            </label>
            <Button type="submit" variant="tertiary" size="sm">
              {t(locale, "memeCalendar.grid.go")}
            </Button>
            {jumpMintError && (
              <p
                id="meme-calendar-mint-input-error"
                className="tw-col-span-2 tw-mb-0 tw-text-xs tw-leading-4 tw-text-error"
                role="alert"
              >
                {jumpMintError}
              </p>
            )}
          </form>
          <form className="tw-min-w-0" onSubmit={handleDateJumpSubmit}>
            <label
              htmlFor="meme-calendar-date-input"
              className={`${CONTROL_GROUP_CLASS} tw-group/date tw-relative tw-cursor-pointer tw-pr-2`}
            >
              <span className="tw-shrink-0 tw-select-none tw-pr-2">
                {t(locale, "memeCalendar.grid.date")}
              </span>
              <input
                id="meme-calendar-date-input"
                ref={dateInputRef}
                type="month"
                value={jumpValue}
                onClick={openMonthPicker}
                onChange={(event) => {
                  const value = event.target.value;
                  setJumpValue(value);
                  jumpToMonthValue(value);
                }}
                className={`${CONTROL_INPUT_CLASS} tw-[color-scheme:dark] tw-cursor-pointer tw-pr-7 [&::-webkit-calendar-picker-indicator]:tw-opacity-0`}
              />
              <CalendarDaysIcon
                aria-hidden="true"
                className="tw-pointer-events-none tw-absolute tw-right-2.5 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-300 tw-transition-colors group-hover/date:tw-text-iron-50"
              />
            </label>
          </form>
        </fieldset>
      </div>

      {/* Calendar view */}
      <div className="tw-min-w-0">{renderView()}</div>

      {/* Global tooltip for mints */}
      <Tooltip
        id="meme-calendar-guide-tooltip"
        className="!tw-z-[1000] !tw-rounded-md !tw-border !tw-border-solid !tw-border-iron-700 !tw-bg-iron-800 !tw-px-2.5 !tw-py-1.5 !tw-text-xs !tw-text-iron-100 !tw-opacity-100 !tw-shadow-xl"
      />
      <Tooltip
        id="meme-tooltip"
        clickable
        openOnClick
        className="!tw-z-[1000] !tw-max-w-[min(22rem,calc(100vw-2rem))] !tw-whitespace-normal !tw-rounded-lg !tw-border !tw-border-solid !tw-border-iron-700 !tw-bg-iron-800 !tw-text-iron-100 !tw-opacity-100 !tw-shadow-xl"
      />
    </section>
  );
}
