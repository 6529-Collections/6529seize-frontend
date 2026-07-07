"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import {
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import React from "react";
import { Tooltip } from "react-tooltip";
import type { LeaderboardViewMode } from "../types";

type ActionsRemeasureVariant = "none" | "filter-only" | "with-drop";
type LeaderboardSortItem = CommonSelectItem<WaveDropsLeaderboardSort>;

export const getLeaderboardViewModes = (
  isMemesWave: boolean
): readonly LeaderboardViewMode[] =>
  isMemesWave ? ["list", "grid"] : ["list", "grid", "grid_content_only"];

export const getActionsRemeasureVariant = ({
  showPriceActions,
  showCreateAction,
}: {
  readonly showPriceActions: boolean;
  readonly showCreateAction: boolean;
}): ActionsRemeasureVariant => {
  if (showPriceActions && showCreateAction) {
    return "with-drop";
  }
  return showPriceActions ? "filter-only" : "none";
};

export const getHeaderRowFlexClass = ({
  showPriceActions,
  shouldRenderActionsInPriceRow,
  wrapActions,
}: {
  readonly showPriceActions: boolean;
  readonly shouldRenderActionsInPriceRow: boolean;
  readonly wrapActions: boolean;
}): string => {
  if (!showPriceActions) {
    return "tw-flex-wrap";
  }
  if (shouldRenderActionsInPriceRow) {
    return "tw-flex-nowrap";
  }
  return wrapActions ? "tw-flex-wrap" : "tw-flex-nowrap";
};

const DropModeGlyphIcon: React.FC<{
  readonly className?: string | undefined;
}> = ({ className = "tw-size-4 tw-flex-shrink-0" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.62826 7.89684C8.62826 7.60735 8.62826 6.72633 7.11906 4.34441C6.41025 3.22565 5.71213 2.3144 5.68274 2.27615L5.12514 1.55005L4.56755 2.27615C4.53816 2.3144 3.84008 3.2257 3.13123 4.34441C1.62207 6.72633 1.62207 7.60735 1.62207 7.89684C1.62207 9.82846 3.19352 11.3999 5.12514 11.3999C7.05676 11.3999 8.62826 9.82846 8.62826 7.89684Z"
      fill="currentColor"
    />
    <path
      d="M21.2502 2.24459C20.7301 1.42366 20.2173 0.754227 20.1956 0.726104L19.638 0L19.0805 0.726104C19.0589 0.754227 18.546 1.42366 18.0259 2.24459C17.5419 3.00847 16.8984 4.11804 16.8984 4.931C16.8984 6.44166 18.1274 7.67061 19.638 7.67061C21.1487 7.67061 22.3777 6.44161 22.3777 4.931C22.3777 4.11799 21.7342 3.00847 21.2502 2.24459Z"
      fill="currentColor"
    />
    <path
      d="M13.6806 7.0994L13.1231 6.37329L12.5655 7.0994C12.5083 7.17388 11.1491 8.94805 9.76692 11.1295C7.8616 14.1367 6.89551 16.3717 6.89551 17.7724C6.89551 21.2063 9.68921 24 13.1231 24C16.557 24 19.3506 21.2063 19.3506 17.7724C19.3506 16.3717 18.3845 14.1367 16.4792 11.1295C15.097 8.94805 13.7379 7.17388 13.6806 7.0994Z"
      fill="currentColor"
    />
  </svg>
);

const getViewModeLabel = (mode: LeaderboardViewMode): string => {
  if (mode === "list") {
    return "List view";
  }
  if (mode === "grid") {
    return "Grid view";
  }
  return "Content only";
};

const getViewModeTabClass = (
  mode: LeaderboardViewMode,
  activeMode: LeaderboardViewMode
): string => {
  const baseClassName =
    "tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-transparent tw-transition-colors";

  if (activeMode === mode) {
    return `${baseClassName} tw-border-primary-500/50 tw-bg-primary-600/20 tw-text-primary-400`;
  }

  return `${baseClassName} tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-300`;
};

const getViewModeIcon = (mode: LeaderboardViewMode): React.ReactNode => {
  if (mode === "list") {
    return <ListBulletIcon className="tw-size-5 tw-flex-shrink-0" />;
  }
  if (mode === "grid") {
    return <Squares2X2Icon className="tw-size-5 tw-flex-shrink-0" />;
  }
  return <DocumentTextIcon className="tw-size-5 tw-flex-shrink-0" />;
};

interface HeaderViewModeTabsProps {
  readonly refObject: React.RefObject<HTMLDivElement | null>;
  readonly viewModes: readonly LeaderboardViewMode[];
  readonly viewMode: LeaderboardViewMode;
  readonly waveId: string;
  readonly onViewModeChange: (mode: LeaderboardViewMode) => void;
}

export const HeaderViewModeTabs: React.FC<HeaderViewModeTabsProps> = ({
  refObject,
  viewModes,
  viewMode,
  waveId,
  onViewModeChange,
}) => (
  <div
    ref={refObject}
    role="tablist"
    aria-label="Leaderboard view modes"
    className="tw-flex tw-flex-shrink-0 tw-gap-0.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1"
  >
    {viewModes.map((mode) => {
      const label = getViewModeLabel(mode);
      return (
        <React.Fragment key={mode}>
          <button
            type="button"
            role="tab"
            aria-label={label}
            aria-selected={viewMode === mode}
            tabIndex={viewMode === mode ? 0 : -1}
            className={getViewModeTabClass(mode, viewMode)}
            onClick={() => onViewModeChange(mode)}
            data-tooltip-id={`leaderboard-view-mode-${mode}-${waveId}`}
          >
            {getViewModeIcon(mode)}
            <span className="tw-sr-only">{label}</span>
          </button>
          <Tooltip
            id={`leaderboard-view-mode-${mode}-${waveId}`}
            place="top"
            offset={8}
            opacity={1}
            style={{
              padding: "4px 8px",
              background: "#37373E",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "6px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              zIndex: 99999,
              pointerEvents: "none",
            }}
          >
            {label}
          </Tooltip>
        </React.Fragment>
      );
    })}
  </div>
);

interface PriceActionsProps {
  readonly createLabel: string;
  readonly isCompactActions: boolean;
  readonly isPriceFiltersOpen: boolean;
  readonly hasActivePriceFilters: boolean;
  readonly showCreateAction: boolean;
  readonly waveId: string;
  readonly onCreateDrop?: (() => void) | undefined;
  readonly onTogglePriceFilters: () => void;
}

export const PriceActions: React.FC<PriceActionsProps> = ({
  createLabel,
  isCompactActions,
  isPriceFiltersOpen,
  hasActivePriceFilters,
  showCreateAction,
  waveId,
  onCreateDrop,
  onTogglePriceFilters,
}) => (
  <>
    <button
      type="button"
      data-testid="leaderboard-price-toggle"
      aria-label="Toggle filters"
      aria-expanded={isPriceFiltersOpen}
      aria-controls={`leaderboard-price-panel-${waveId}`}
      onClick={onTogglePriceFilters}
      className={`tw-inline-flex tw-h-9 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-text-xs tw-font-semibold tw-transition ${
        isCompactActions
          ? "tw-w-9 tw-justify-center tw-px-0"
          : "tw-gap-2 tw-px-3.5"
      } ${
        isPriceFiltersOpen || hasActivePriceFilters
          ? "tw-border-white/15 tw-bg-white/10 tw-text-iron-100"
          : "tw-border-white/10 tw-bg-iron-950 tw-text-iron-200 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/5"
      }`}
    >
      <AdjustmentsHorizontalIcon className="tw-size-4 tw-flex-shrink-0" />
      {isCompactActions ? (
        <span className="tw-sr-only">Filters</span>
      ) : (
        <span>Filters</span>
      )}
    </button>
    {showCreateAction && (
      <PrimaryButton
        loading={false}
        disabled={false}
        onClicked={() => onCreateDrop?.()}
        padding={isCompactActions ? "tw-px-2.5 tw-py-2" : "tw-px-3.5 tw-py-2"}
      >
        {isCompactActions ? (
          <>
            <DropModeGlyphIcon />
            <span className="tw-sr-only">{createLabel}</span>
          </>
        ) : (
          <>
            <PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            <span>{createLabel}</span>
          </>
        )}
      </PrimaryButton>
    )}
  </>
);

interface MeasurementProbesProps {
  readonly sortItems: readonly LeaderboardSortItem[];
  readonly activeSortLabel: string;
  readonly showPriceActions: boolean;
  readonly showCreateAction: boolean;
  readonly createLabel: string;
  readonly sortTabsProbeRef: React.RefObject<HTMLDivElement | null>;
  readonly sortDropdownProbeRef: React.RefObject<HTMLDivElement | null>;
  readonly actionsFullProbeRef: React.RefObject<HTMLDivElement | null>;
  readonly actionsIconProbeRef: React.RefObject<HTMLDivElement | null>;
}

export const MeasurementProbes: React.FC<MeasurementProbesProps> = ({
  sortItems,
  activeSortLabel,
  showPriceActions,
  showCreateAction,
  createLabel,
  sortTabsProbeRef,
  sortDropdownProbeRef,
  actionsFullProbeRef,
  actionsIconProbeRef,
}) => (
  <div
    aria-hidden="true"
    className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-h-0 tw-overflow-hidden tw-whitespace-nowrap tw-opacity-0"
  >
    <div
      ref={sortTabsProbeRef}
      className="tw-inline-flex tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-700"
    >
      {sortItems.map((item) => (
        <div
          key={item.key}
          className="tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold"
        >
          {item.label}
        </div>
      ))}
    </div>

    <div
      ref={sortDropdownProbeRef}
      className="tailwind-scope tw-inline-flex tw-whitespace-nowrap tw-rounded-lg tw-py-2.5 tw-pl-3.5 tw-pr-8 tw-text-xs tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-iron-700"
    >
      <span className="tw-font-semibold tw-text-iron-500">Sort: </span>
      {activeSortLabel}
    </div>

    {showPriceActions && (
      <>
        <div
          ref={actionsFullProbeRef}
          className="tw-inline-flex tw-items-center tw-gap-2"
        >
          <div className="tw-inline-flex tw-h-9 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3.5 tw-text-xs tw-font-semibold tw-text-iron-200">
            <AdjustmentsHorizontalIcon className="tw-size-4 tw-flex-shrink-0" />
            <span>Filters</span>
          </div>
          {showCreateAction && (
            <div className="tw-inline-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white">
              <PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
              <span>{createLabel}</span>
            </div>
          )}
        </div>

        <div
          ref={actionsIconProbeRef}
          className="tw-inline-flex tw-items-center tw-gap-2"
        >
          <div className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-xs tw-font-semibold tw-text-iron-200">
            <AdjustmentsHorizontalIcon className="tw-size-4 tw-flex-shrink-0" />
          </div>
          {showCreateAction && (
            <div className="tw-inline-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-2.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white">
              <DropModeGlyphIcon />
            </div>
          )}
        </div>
      </>
    )}
  </div>
);
