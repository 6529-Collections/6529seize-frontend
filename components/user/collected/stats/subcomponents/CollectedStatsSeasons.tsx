import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import { useId } from "react";
import type { DisplaySeason } from "../types";

interface CollectedStatsSeasonsProps {
  readonly allSeasonCount: number;
  readonly startedSeasons: DisplaySeason[];
  readonly visibleStartedSeasons: DisplaySeason[];
  readonly hiddenStartedSeasonCount: number;
  readonly notStartedSeasons: DisplaySeason[];
  readonly activeSeasonNumber: number | null;
  readonly locale?: SupportedLocale | undefined;
  readonly isSeasonListExpanded: boolean;
  readonly onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
  readonly onToggleExpanded: () => void;
}

/** Renders one season with its set count and progress toward the next set. */
function SeasonProgressRow({
  season,
  activeSeasonNumber,
  locale,
  onSeasonShortcut,
}: Readonly<{
  season: DisplaySeason;
  activeSeasonNumber: number | null;
  locale: SupportedLocale;
  onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
}>) {
  const isSelected = season.seasonNumber === activeSeasonNumber;
  const progressPercent = Math.round(season.progressPct * 100);
  const progressWidth = `${progressPercent}%`;
  const progressValue = formatPercent(locale, progressPercent / 100, 0);
  const progressLabel = translate(
    locale,
    "user.collected.stats.seasonRow.progressAriaLabel",
    { season: season.label }
  );

  return (
    <tr
      className={[
        "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/80 before:tw-hidden after:tw-hidden first:tw-border-t-0",
        isSelected ? "tw-bg-iron-900/60" : "tw-bg-iron-950/30",
      ].join(" ")}
    >
      <th scope="row" className="tw-p-0 tw-text-left">
        {onSeasonShortcut ? (
          <button
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSeasonShortcut(season.seasonNumber)}
            className={[
              "tw-min-h-11 tw-w-full tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-xs tw-font-semibold tw-transition-colors tw-duration-200 hover:tw-text-white focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 sm:tw-px-4",
              isSelected ? "tw-text-white" : "tw-text-iron-300",
            ].join(" ")}
          >
            {season.label}
          </button>
        ) : (
          <span className="tw-block tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-iron-300 sm:tw-px-4">
            {season.label}
          </span>
        )}
      </th>
      <td className="tw-px-2 tw-py-2.5 tw-text-right tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-100 sm:tw-px-4">
        {formatInteger(locale, season.setsHeld)}
      </td>
      <td className="tw-px-2 tw-py-2.5 sm:tw-px-4">
        <div className="tw-flex tw-flex-col tw-items-end tw-justify-end tw-text-right sm:tw-flex-row sm:tw-items-start sm:tw-gap-2">
          <span className="tw-min-w-0 tw-break-words tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-300 sm:tw-flex-1">
            {season.detailText}
          </span>
          <span className="tw-shrink-0 tw-text-[10px] tw-font-medium tw-tabular-nums tw-leading-4 tw-text-iron-400">
            {progressValue}
          </span>
        </div>
        <progress
          className="tw-sr-only"
          aria-label={progressLabel}
          aria-valuetext={progressValue}
          max={100}
          value={progressPercent}
        >
          {progressValue}
        </progress>
        <div
          aria-hidden="true"
          className="tw-ml-auto tw-mt-1.5 tw-h-1 tw-w-full tw-max-w-56 tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
        >
          <div
            className="tw-h-full tw-rounded-full tw-bg-iron-400"
            style={{ width: progressWidth }}
          />
        </div>
      </td>
    </tr>
  );
}

/** Renders the collapsible started-season table and unseized season list. */
export function CollectedStatsSeasons({
  allSeasonCount,
  startedSeasons,
  visibleStartedSeasons,
  hiddenStartedSeasonCount,
  notStartedSeasons,
  activeSeasonNumber,
  locale = DEFAULT_LOCALE,
  isSeasonListExpanded,
  onSeasonShortcut,
  onToggleExpanded,
}: Readonly<CollectedStatsSeasonsProps>) {
  const tableBodyId = useId();

  if (startedSeasons.length === 0) {
    return null;
  }

  const title = translate(locale, "user.collected.stats.seasons.title");
  const startedCountValue = formatInteger(locale, startedSeasons.length);
  const allSeasonCountValue = formatInteger(locale, allSeasonCount);
  const hiddenStartedSeasonCountValue = formatInteger(
    locale,
    hiddenStartedSeasonCount
  );
  const startedCount = translate(
    locale,
    "user.collected.stats.seasons.startedCount",
    {
      started: startedCountValue,
      total: allSeasonCountValue,
    }
  );
  const showLess = translate(locale, "user.collected.stats.seasons.showLess");
  const showMore = translate(locale, "user.collected.stats.seasons.showMore", {
    count: hiddenStartedSeasonCountValue,
  });
  const showMoreAriaLabel = translate(
    locale,
    "user.collected.stats.seasons.showMoreAriaLabel",
    { count: hiddenStartedSeasonCountValue }
  );
  const unseizedLabel = translate(
    locale,
    "user.collected.stats.seasons.unseized"
  );

  return (
    <section className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/30">
      <div className="tw-flex tw-items-baseline tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-3 sm:tw-px-4">
        <h2 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
          {title}
        </h2>
        <span className="tw-ml-auto tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-400">
          {startedCount}
        </span>
      </div>

      <table className="tw-w-full tw-table-fixed tw-border-collapse">
        <caption className="tw-sr-only">
          {translate(locale, "user.collected.stats.seasons.tableCaption")}
        </caption>
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "60%" }} />
        </colgroup>
        <thead className="tw-bg-black">
          <tr className="before:tw-hidden after:tw-hidden">
            <th
              scope="col"
              className="tw-px-2 tw-py-2 tw-text-left tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400 sm:tw-px-4"
            >
              {translate(locale, "user.collected.stats.seasons.column.season")}
            </th>
            <th
              scope="col"
              className="tw-px-1 tw-py-2 tw-text-right tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400 sm:tw-px-4"
            >
              {translate(locale, "user.collected.stats.seasons.column.sets")}
            </th>
            <th
              scope="col"
              className="tw-px-2 tw-py-2 tw-text-right tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400 sm:tw-px-4"
            >
              {translate(
                locale,
                "user.collected.stats.seasons.column.progress"
              )}
            </th>
          </tr>
        </thead>
        <tbody id={tableBodyId}>
          {visibleStartedSeasons.map((season) => (
            <SeasonProgressRow
              key={season.id}
              season={season}
              activeSeasonNumber={activeSeasonNumber}
              locale={locale}
              onSeasonShortcut={onSeasonShortcut}
            />
          ))}
        </tbody>
      </table>

      {hiddenStartedSeasonCount > 0 && (
        <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-black/40 tw-p-2">
          <button
            type="button"
            aria-expanded={isSeasonListExpanded}
            aria-controls={tableBodyId}
            aria-label={isSeasonListExpanded ? showLess : showMoreAriaLabel}
            onClick={onToggleExpanded}
            className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 hover:tw-bg-iron-900/70 hover:tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {isSeasonListExpanded ? showLess : showMore}
          </button>
        </div>
      )}

      {notStartedSeasons.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-3 tw-py-3 sm:tw-px-4">
          <span className="tw-mr-0.5 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
            {unseizedLabel}
          </span>
          {notStartedSeasons.map((season) => (
            <span
              key={season.id}
              className="tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-black/40 tw-px-2 tw-py-1 tw-text-[10px] tw-font-medium tw-text-iron-400"
            >
              {season.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
