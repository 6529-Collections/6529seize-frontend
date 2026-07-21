import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { RefObject } from "react";
import type { DisplaySeason } from "../types";
import { CollectedStatsSeasonTile } from "./CollectedStatsSeasonTile";

interface CollectedStatsSeasonsProps {
  readonly allSeasonCount: number;
  readonly startedSeasons: DisplaySeason[];
  readonly visibleStartedSeasons: DisplaySeason[];
  readonly hiddenStartedSeasonCount: number;
  readonly notStartedSeasons: DisplaySeason[];
  readonly activeSeasonId: string | null;
  readonly activeSeasonNumber: number | null;
  readonly locale?: SupportedLocale | undefined;
  readonly hasTouchScreen: boolean;
  readonly isDesktopLayout: boolean;
  readonly isDesktopSeasonListExpanded: boolean;
  readonly desktopSeasonsRef: RefObject<HTMLDivElement | null>;
  readonly onActivateSeason: (seasonId: string) => void;
  readonly onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
  readonly onToggleExpanded: () => void;
}

interface SeasonTilesProps {
  readonly seasons: DisplaySeason[];
  readonly activeSeasonId: string | null;
  readonly activeSeasonNumber: number | null;
  readonly locale: SupportedLocale;
  readonly hasTouchScreen: boolean;
  readonly shouldAnimateProgressOnMount: boolean;
  readonly onActivateSeason: (seasonId: string) => void;
  readonly onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
}

function SeasonTiles({
  seasons,
  activeSeasonId,
  activeSeasonNumber,
  locale,
  hasTouchScreen,
  shouldAnimateProgressOnMount,
  onActivateSeason,
  onSeasonShortcut,
}: Readonly<SeasonTilesProps>) {
  return (
    <>
      {seasons.map((season) => (
        <CollectedStatsSeasonTile
          key={season.id}
          season={season}
          isSelected={season.seasonNumber === activeSeasonNumber}
          showDetailText={hasTouchScreen || season.id === activeSeasonId}
          locale={locale}
          hasTouchScreen={hasTouchScreen}
          shouldAnimateProgressOnMount={shouldAnimateProgressOnMount}
          onPreview={() => onActivateSeason(season.id)}
          onSelect={
            onSeasonShortcut
              ? () => onSeasonShortcut(season.seasonNumber)
              : undefined
          }
        />
      ))}
    </>
  );
}

export function CollectedStatsSeasons({
  allSeasonCount,
  startedSeasons,
  visibleStartedSeasons,
  hiddenStartedSeasonCount,
  notStartedSeasons,
  activeSeasonId,
  activeSeasonNumber,
  locale = DEFAULT_LOCALE,
  hasTouchScreen,
  isDesktopLayout,
  isDesktopSeasonListExpanded,
  desktopSeasonsRef,
  onActivateSeason,
  onSeasonShortcut,
  onToggleExpanded,
}: Readonly<CollectedStatsSeasonsProps>) {
  const shouldAnimateProgressOnMount =
    !isDesktopLayout || !isDesktopSeasonListExpanded;
  const desktopToggleClassName =
    "tw-inline-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 hover:tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500";

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
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
      <div className="tw-flex tw-items-baseline tw-gap-2 tw-px-1">
        <span className="tw-text-xs tw-font-semibold tw-tracking-tight tw-text-iron-400">
          {title}
        </span>
        <span className="tw-ml-auto tw-text-[10px] tw-font-medium tw-text-iron-500">
          {startedCount}
        </span>
      </div>

      <div ref={desktopSeasonsRef} className="tw-w-full">
        {isDesktopLayout ? (
          <>
            <div className="tw-w-full tw-pt-3">
              <div className="tw-flex tw-w-full tw-flex-wrap tw-items-start tw-gap-x-1 tw-gap-y-2">
                <SeasonTiles
                  seasons={visibleStartedSeasons}
                  activeSeasonId={activeSeasonId}
                  activeSeasonNumber={activeSeasonNumber}
                  locale={locale}
                  hasTouchScreen={hasTouchScreen}
                  shouldAnimateProgressOnMount={shouldAnimateProgressOnMount}
                  onActivateSeason={onActivateSeason}
                  onSeasonShortcut={onSeasonShortcut}
                />
              </div>
            </div>

            {hiddenStartedSeasonCount > 0 && (
              <div className="-tw-mb-2 tw-mt-1 tw-flex tw-justify-center">
                {isDesktopSeasonListExpanded ? (
                  <button
                    type="button"
                    aria-expanded
                    aria-label={showLess}
                    onClick={onToggleExpanded}
                    className={desktopToggleClassName}
                  >
                    {showLess}
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-expanded={false}
                    aria-label={showMoreAriaLabel}
                    onClick={onToggleExpanded}
                    className={desktopToggleClassName}
                  >
                    {showMore}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-pb-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
            <div className="tw-flex tw-w-max tw-flex-nowrap tw-items-start tw-gap-x-3 tw-gap-y-0 tw-pt-3">
              <SeasonTiles
                seasons={startedSeasons}
                activeSeasonId={activeSeasonId}
                activeSeasonNumber={activeSeasonNumber}
                locale={locale}
                hasTouchScreen={hasTouchScreen}
                shouldAnimateProgressOnMount={shouldAnimateProgressOnMount}
                onActivateSeason={onActivateSeason}
                onSeasonShortcut={onSeasonShortcut}
              />
            </div>
          </div>
        )}
      </div>

      {notStartedSeasons.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-px-1 tw-pt-2">
          <span className="tw-mr-0.5 tw-text-[8px] tw-font-medium tw-text-iron-500">
            {unseizedLabel}
          </span>
          {notStartedSeasons.map((season) => (
            <span
              key={season.id}
              className="tw-rounded tw-border tw-border-solid tw-border-iron-800 tw-px-1.5 tw-py-0.5 tw-text-[8px] tw-font-medium tw-text-iron-500"
            >
              {season.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
