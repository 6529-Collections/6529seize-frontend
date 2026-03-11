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
  readonly hasTouchScreen: boolean;
  readonly isDesktopLayout: boolean;
  readonly isDesktopSeasonListExpanded: boolean;
  readonly desktopSeasonsRef: RefObject<HTMLDivElement | null>;
  readonly onActivateSeason: (seasonId: string) => void;
  readonly onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
  readonly onToggleExpanded: () => void;
}

export function CollectedStatsSeasons({
  allSeasonCount,
  startedSeasons,
  visibleStartedSeasons,
  hiddenStartedSeasonCount,
  notStartedSeasons,
  activeSeasonId,
  activeSeasonNumber,
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

  if (startedSeasons.length === 0) {
    return null;
  }

  const renderTiles = (seasons: DisplaySeason[]) =>
    seasons.map((season) => (
      <CollectedStatsSeasonTile
        key={season.id}
        season={season}
        isSelected={season.seasonNumber === activeSeasonNumber}
        showDetailText={hasTouchScreen || season.id === activeSeasonId}
        hasTouchScreen={hasTouchScreen}
        shouldAnimateProgressOnMount={shouldAnimateProgressOnMount}
        onPreview={() => onActivateSeason(season.id)}
        onSelect={
          onSeasonShortcut
            ? () => onSeasonShortcut(season.seasonNumber)
            : undefined
        }
      />
    ));

  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
      <div className="tw-flex tw-items-baseline tw-gap-2 tw-px-1">
        <span className="tw-text-xs tw-font-semibold tw-tracking-tight tw-text-iron-400">
          Seasons
        </span>
        <span className="tw-ml-auto tw-text-[10px] tw-font-medium tw-text-iron-500">
          {startedSeasons.length}/{allSeasonCount} started
        </span>
      </div>

      <div ref={desktopSeasonsRef} className="tw-w-full">
        {isDesktopLayout ? (
          <>
            <div className="tw-relative tw-w-full tw-pb-1 tw-pt-3">
              <div className="tw-flex tw-w-full tw-flex-wrap tw-items-start tw-gap-x-3 tw-gap-y-3">
                {renderTiles(visibleStartedSeasons)}
              </div>

              {!isDesktopSeasonListExpanded && hiddenStartedSeasonCount > 0 && (
                <button
                  type="button"
                  aria-expanded={false}
                  aria-label={`Show ${hiddenStartedSeasonCount} more started seasons`}
                  onClick={onToggleExpanded}
                  className="tw-absolute tw-right-0 tw-top-[35%] tw-inline-flex -tw-translate-y-[35%] tw-items-center tw-justify-center tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 hover:tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500"
                >
                  +{hiddenStartedSeasonCount} more
                </button>
              )}
            </div>

            {hiddenStartedSeasonCount > 0 && isDesktopSeasonListExpanded && (
              <div className="tw-flex tw-justify-center tw-pt-1">
                <button
                  type="button"
                  aria-expanded={isDesktopSeasonListExpanded}
                  aria-label="Show less"
                  onClick={onToggleExpanded}
                  className="tw-inline-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 hover:tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500"
                >
                  Show less
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-pb-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
            <div className="tw-flex tw-w-max tw-flex-nowrap tw-items-start tw-gap-x-3 tw-gap-y-0 tw-pt-3">
              {renderTiles(startedSeasons)}
            </div>
          </div>
        )}
      </div>

      {notStartedSeasons.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-px-1 tw-pt-2">
          <span className="tw-mr-0.5 tw-text-[8px] tw-font-medium tw-text-iron-500">
            Unseized
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
