import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { DisplaySeason } from "../types";

interface CollectedStatsSeasonTileProps {
  readonly season: DisplaySeason;
  readonly isSelected: boolean;
  readonly showDetailText: boolean;
  readonly hasTouchScreen: boolean;
  readonly shouldAnimateProgressOnMount: boolean;
  readonly onPreview: () => void;
  readonly onSelect?: (() => void) | undefined;
}

const PROGRESS_RADIUS = 24;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
const PROGRESS_ANIMATION_DURATION = "1.2s";
const PROGRESS_ANIMATION_KEY_SPLINES = "0.22 1 0.36 1";

const PROGRESS_COLOR_TRANSITION_STYLE = {
  transition: "color 300ms ease",
};

const getBaseTrackClass = (
  season: DisplaySeason,
  isSelected: boolean
): string => {
  if (!season.isStarted) {
    return "tw-text-iron-900";
  }

  return isSelected ? "tw-text-iron-650" : "tw-text-iron-800";
};

const getProgressStrokeClass = (
  season: DisplaySeason,
  isSelected: boolean
): string => {
  if (season.progressPct >= 1) {
    return "tw-text-iron-200";
  }

  return isSelected ? "tw-text-iron-300" : "tw-text-iron-500";
};

const getLabelClassName = (
  season: DisplaySeason,
  isSelected: boolean
): string => {
  if (!season.isStarted) {
    return "tw-text-iron-600";
  }

  return isSelected ? "tw-text-iron-100" : "tw-text-iron-300";
};

const getSetsHeldClassName = (season: DisplaySeason): string => {
  if (season.setsHeld >= 2) {
    return "tw-text-iron-200";
  }

  if (season.setsHeld === 1) {
    return "tw-text-iron-300";
  }

  return season.isStarted ? "tw-text-iron-500" : "tw-text-iron-650";
};

const getDetailTextClassName = (
  showDetailText: boolean,
  isSelected: boolean
): string => {
  if (!showDetailText) {
    return "tw-text-transparent";
  }

  return isSelected ? "tw-text-iron-400" : "tw-text-iron-500";
};

const getButtonClassName = (isSelected: boolean): string =>
  isSelected
    ? "tw-border-iron-700 tw-bg-iron-950/80"
    : "tw-border-transparent tw-bg-transparent";

const getSetsHeldLabel = (setsHeld: number): string => {
  if (setsHeld <= 0) {
    return "0 sets";
  }

  return `${setsHeld} set${setsHeld > 1 ? "s" : ""}`;
};

export function CollectedStatsSeasonTile({
  season,
  isSelected,
  showDetailText,
  hasTouchScreen,
  shouldAnimateProgressOnMount,
  onPreview,
  onSelect,
}: Readonly<CollectedStatsSeasonTileProps>) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const strokeDashoffset =
    PROGRESS_CIRCUMFERENCE - season.progressPct * PROGRESS_CIRCUMFERENCE;
  const progressVisible = season.progressPct > 0;
  const [progressAnimation] = useState(() =>
    progressVisible && shouldAnimateProgressOnMount && !shouldReduceMotion
      ? {
          from: PROGRESS_CIRCUMFERENCE,
          to: strokeDashoffset,
        }
      : null
  );
  const baseTrackClass = getBaseTrackClass(season, isSelected);
  const progressStrokeClass = getProgressStrokeClass(season, isSelected);
  const labelClassName = getLabelClassName(season, isSelected);
  const setsHeldClassName = getSetsHeldClassName(season);
  const detailTextClassName = getDetailTextClassName(
    showDetailText,
    isSelected
  );

  return (
    <button
      type="button"
      data-season-tile
      aria-pressed={isSelected}
      onMouseEnter={hasTouchScreen ? undefined : onPreview}
      onFocus={onPreview}
      onClick={onSelect}
      className={[
        "tw-flex tw-w-[78px] tw-flex-none tw-cursor-pointer tw-flex-col tw-items-center tw-rounded-xl tw-border tw-border-solid tw-px-2 tw-py-2 tw-text-center tw-transition-all tw-duration-200 sm:tw-w-[88px]",
        getButtonClassName(isSelected),
        "hover:tw-scale-[1.01] focus-visible:tw-scale-[1.01]",
        "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500",
      ].join(" ")}
    >
      <div className="tw-relative tw-mb-1 tw-flex tw-h-[52px] tw-w-[52px] tw-items-center tw-justify-center sm:tw-h-14 sm:tw-w-14">
        <svg
          className="tw-h-full tw-w-full tw--rotate-90"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle
            cx="28"
            cy="28"
            r={PROGRESS_RADIUS}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className={baseTrackClass}
          />
          {progressVisible && (
            <circle
              cx="28"
              cy="28"
              r={PROGRESS_RADIUS}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={PROGRESS_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={PROGRESS_COLOR_TRANSITION_STYLE}
              className={progressStrokeClass}
            >
              {progressAnimation && (
                <animate
                  attributeName="stroke-dashoffset"
                  from={progressAnimation.from}
                  to={progressAnimation.to}
                  dur={PROGRESS_ANIMATION_DURATION}
                  calcMode="spline"
                  keySplines={PROGRESS_ANIMATION_KEY_SPLINES}
                  keyTimes="0;1"
                />
              )}
            </circle>
          )}
        </svg>

        <span
          className={[
            "tw-absolute tw-text-[10px] tw-font-semibold tw-tracking-tight",
            labelClassName,
          ].join(" ")}
        >
          {season.label}
        </span>
      </div>

      <span
        className={[
          "tw-mb-1 tw-text-[10px] tw-font-semibold tw-leading-none tw-tracking-tight",
          setsHeldClassName,
        ].join(" ")}
      >
        {getSetsHeldLabel(season.setsHeld)}
      </span>

      <span
        className={[
          "tw-flex tw-h-[14px] tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-px-1 tw-text-center tw-text-[9px] tw-font-medium tw-leading-none",
          detailTextClassName,
        ].join(" ")}
      >
        {showDetailText ? season.detailText : null}
      </span>
    </button>
  );
}
