import {
  addMonths,
  displayedEonNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedSeasonNumberFromIndex,
  displayedYearNumberFromIndex,
  getSeasonIndexForDate,
  getSeasonStartDate,
  isSznOneIndex,
  SEASONS_PER_EPOCH,
  SEASONS_PER_ERA,
  SEASONS_PER_PERIOD,
  SEASONS_PER_YEAR,
  SZN1_SEASON_INDEX,
  getRangeLabel,
  toISO,
} from "../meme-calendar.helpers";
import {
  getDateRangeLabel,
  getDivisionTitle,
  getDivisionTitleWithGregorianYear,
} from "./calendarText";
import { DrilldownCard, HistoricalLaunchDrilldownCard } from "./DrilldownCards";
import { Month } from "./MonthGrid";
import type {
  EonViewProps,
  EpochViewProps,
  EraViewProps,
  PeriodViewProps,
  SeasonViewProps,
  YearViewProps,
} from "./types";

export function SeasonView({
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
export function YearView({
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
export function EpochView({
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
export function PeriodView({
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
export function EraView({
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
export function EonView({
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
