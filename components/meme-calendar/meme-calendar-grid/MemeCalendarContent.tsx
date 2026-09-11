"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import MemeNumberSearch from "@/components/meme-calendar/MemeNumberSearch";
import Button from "@/components/utils/button/Button";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
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
  "tw-flex tw-h-9 tw-w-full tw-min-w-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-pl-3 tw-text-[13px] tw-font-semibold tw-leading-[18px] tw-text-iron-200 tw-shadow-sm tw-shadow-black/20 tw-transition-colors focus-within:tw-border-primary-400 focus-within:tw-ring-1 focus-within:tw-ring-primary-400";
const CONTROL_INPUT_CLASS =
  "tw-h-8 tw-min-w-0 tw-flex-1 tw-rounded-r-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-[13px] tw-font-semibold tw-leading-[18px] tw-text-iron-50 tw-outline-none placeholder:tw-text-iron-600";

export default function MemeCalendar({
  displayTz,
  locale = DEFAULT_LOCALE,
}: MemeCalendarProps) {
  const guideTooltipId = buildTooltipId(useId(), "meme-calendar-guide");
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
  const zoomItems: readonly CommonSelectItem<ZoomLevel>[] = ZOOM_LEVELS.map(
    (level) => ({
      key: level,
      label: getZoomLabel(locale, level, zoomNumbers[level]),
      value: level,
    })
  );

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
      setJumpMintError(t(locale, "memeCalendar.validation.memeNumber"));
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
      {/* Unified calendar controls */}
      <div className="tw-mb-5 tw-rounded-xl tw-bg-iron-950 tw-p-3 tw-shadow-lg tw-ring-1 tw-ring-iron-800 sm:tw-p-4">
        <div className="tw-flex tw-min-w-0 tw-flex-col">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <div className="tw-min-w-0 tw-flex-1">
              <CommonTabs<ZoomLevel>
                items={zoomItems}
                activeItem={zoomLevel}
                filterLabel={t(locale, "memeCalendar.grid.zoomGroup")}
                setSelected={setZoomLevel}
                size="sm"
                fill
                activeTone="primary"
              />
            </div>
            <button
              type="button"
              aria-controls="meme-calendar-info"
              aria-expanded={showInfo}
              aria-label={infoButtonLabel}
              data-tooltip-id={guideTooltipId}
              data-tooltip-content={infoButtonLabel}
              className={`tw-inline-flex tw-size-8 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white ${
                showInfo
                  ? "tw-border-iron-600 tw-bg-iron-800 tw-text-white"
                  : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-100"
              }`}
              onClick={() => setShowInfo((v) => !v)}
            >
              {showInfo ? (
                <XMarkIcon aria-hidden="true" className="tw-size-[18px]" />
              ) : (
                <InformationCircleIcon
                  aria-hidden="true"
                  className="tw-size-[18px]"
                />
              )}
            </button>
          </div>

          <div className="tw-mt-3 tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3">
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
                <div className="tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
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
                    <div className="tw-mt-0.5 tw-whitespace-normal tw-break-words tw-text-sm tw-leading-5 tw-text-iron-400">
                      {range} /{" "}
                      <span className="tw-text-cyan-400">{mintRange}</span>
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
          </div>
        </div>
        <fieldset className="tw-m-0 tw-mt-3 tw-min-w-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-transparent tw-p-0 tw-pt-3">
          <legend className="tw-sr-only">
            {t(locale, "memeCalendar.grid.jumpControls")}
          </legend>
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-gap-2 sm:tw-flex-row sm:tw-flex-nowrap sm:tw-items-start">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="tw-w-full !tw-border-white/10 !tw-bg-iron-800 !tw-text-iron-50 active:!tw-bg-iron-900 desktop-hover:hover:!tw-border-white/20 desktop-hover:hover:!tw-bg-iron-700 desktop-hover:hover:!tw-text-white sm:tw-w-auto"
              onClick={handleJumpToToday}
            >
              <CalendarDaysIcon aria-hidden="true" className="tw-size-4" />
              {t(locale, "memeCalendar.grid.jumpToday")}
            </Button>
            <MemeNumberSearch
              id="meme-calendar-mint-input"
              value={jumpMint}
              error={jumpMintError}
              label={t(locale, "memeCalendar.grid.memeNumber")}
              submitLabel={t(locale, "memeCalendar.numberInput.submit")}
              max={MAX_MINT_NUMBER}
              onChange={(value) => {
                setJumpMint(value);
                setJumpMintError("");
              }}
              onSubmit={handleMintJumpSubmit}
            />
            <form
              className="tw-w-full tw-min-w-0 sm:tw-w-auto sm:tw-flex-1 lg:tw-w-64 lg:tw-flex-none"
              onSubmit={handleDateJumpSubmit}
            >
              <label
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
                  className={`${CONTROL_INPUT_CLASS} tw-cursor-pointer tw-pr-7 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:tw-opacity-0`}
                />
                <CalendarDaysIcon
                  aria-hidden="true"
                  className="tw-pointer-events-none tw-absolute tw-right-2.5 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-300 tw-transition-colors group-hover/date:tw-text-iron-50"
                />
              </label>
            </form>
          </div>
        </fieldset>
      </div>

      <section
        id="meme-calendar-info"
        aria-label={t(locale, "memeCalendar.grid.info.panelLabel")}
        className="tw-mb-5 tw-rounded-2xl tw-bg-iron-950 tw-p-5 tw-text-sm tw-leading-5 tw-text-iron-300 tw-shadow-lg tw-ring-1 tw-ring-iron-800 sm:tw-p-6"
        hidden={!showInfo}
      >
        <dl className="tw-m-0 tw-flex tw-flex-col">
          {GRID_INFO_ITEMS.map(({ label, text, note }) => (
            <div
              key={label}
              className="tw-min-w-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-py-4 first:tw-pt-0 last:tw-border-b-0 last:tw-pb-0"
            >
              <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.14em] tw-text-iron-500">
                {t(locale, label)}
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-200">
                {t(locale, text)}{" "}
                {note && (
                  <span className="tw-text-iron-500">{t(locale, note)}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Calendar view */}
      <div className="tw-min-w-0">{renderView()}</div>

      {/* Global tooltip for mints */}
      <Tooltip
        id={guideTooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
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
