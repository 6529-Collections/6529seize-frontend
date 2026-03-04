"use client";

import { AuthContext } from "@/components/auth/Auth";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";
import { useWave } from "@/hooks/useWave";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Tooltip } from "react-tooltip";
import { useDebounce } from "react-use";
import { getWaveDropEligibility } from "../dropEligibility";
import type { LeaderboardViewMode } from "../types";
import { WaveLeaderboardCurationGroupSelect } from "./WaveLeaderboardCurationGroupSelect";
import { useLeaderboardHeaderControlMeasurements } from "./useLeaderboardHeaderControlMeasurements";
import {
  WAVE_LEADERBOARD_CURATION_SORT_ITEMS,
  WAVE_LEADERBOARD_SORT_ITEMS,
  WaveleaderboardSort,
} from "./WaveleaderboardSort";
import { resolveWaveLeaderboardHeaderLayout } from "./waveLeaderboardHeaderLayout";

interface WaveLeaderboardHeaderProps {
  readonly wave: ApiWave;
  readonly onCreateDrop?: (() => void) | undefined;
  readonly viewMode: LeaderboardViewMode;
  readonly onViewModeChange: (mode: LeaderboardViewMode) => void;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
  readonly curationGroups?: readonly ApiWaveCurationGroup[] | undefined;
  readonly curatedByGroupId?: string | null | undefined;
  readonly onCurationGroupChange?:
    | ((groupId: string | null) => void)
    | undefined;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly onPriceRangeChange?:
    | ((values: {
        readonly minPrice: number | undefined;
        readonly maxPrice: number | undefined;
      }) => void)
    | undefined;
}

interface WaveLeaderboardPriceFiltersProps {
  readonly waveId: string;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly onPriceRangeChange?:
    | ((values: {
        readonly minPrice: number | undefined;
        readonly maxPrice: number | undefined;
      }) => void)
    | undefined;
  readonly onFiltersActivated: () => void;
  readonly onFiltersCleared: () => void;
  readonly trailingActions?: React.ReactNode | undefined;
}

const toPriceInputValue = (value?: number): string =>
  typeof value === "number" ? value.toString() : "";

const parsePriceInput = (rawValue: string): number | undefined => {
  if (!rawValue.trim()) {
    return undefined;
  }
  const numericValue = Number.parseFloat(rawValue);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return undefined;
  }
  return numericValue;
};

const isZeroDraftInput = (rawValue: string): boolean => {
  const trimmedValue = rawValue.trim();
  return trimmedValue === "0" || trimmedValue === "0.";
};

const PRICE_FILTER_LONG_PLACEHOLDER_WIDTH = 576;

const WaveLeaderboardPriceFilters: React.FC<
  WaveLeaderboardPriceFiltersProps
> = ({
  waveId,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  onFiltersActivated,
  onFiltersCleared,
  trailingActions,
}) => {
  const [minPriceInput, setMinPriceInput] = useState(() =>
    toPriceInputValue(minPrice)
  );
  const [maxPriceInput, setMaxPriceInput] = useState(() =>
    toPriceInputValue(maxPrice)
  );
  const hasDraftInputEditsRef = useRef(false);
  const priceFiltersContainerRef = useRef<HTMLDivElement | null>(null);
  const subscribePlaceholderMode = useCallback((onStoreChange: () => void) => {
    const container = priceFiltersContainerRef.current;
    const notify = () => onStoreChange();

    notify();

    if (typeof ResizeObserver !== "undefined" && container) {
      const resizeObserver = new ResizeObserver(() => {
        notify();
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }

    if (typeof window === "undefined") {
      return () => undefined;
    }

    window.addEventListener("resize", notify);
    return () => window.removeEventListener("resize", notify);
  }, []);
  const getPlaceholderSnapshot = useCallback(() => {
    const container = priceFiltersContainerRef.current;
    if (!container) {
      return false;
    }
    return (
      container.getBoundingClientRect().width >=
      PRICE_FILTER_LONG_PLACEHOLDER_WIDTH
    );
  }, []);
  const useLongPlaceholders = useSyncExternalStore(
    subscribePlaceholderMode,
    getPlaceholderSnapshot,
    () => false
  );

  const commitPriceRange = () => {
    if (!onPriceRangeChange) {
      return;
    }

    const nextMinPrice = parsePriceInput(minPriceInput);
    const nextMaxPrice = parsePriceInput(maxPriceInput);
    const hasSameCommittedRange =
      nextMinPrice === minPrice && nextMaxPrice === maxPrice;

    if (hasSameCommittedRange) {
      return;
    }

    const hasActivePriceFilters =
      typeof nextMinPrice === "number" || typeof nextMaxPrice === "number";

    if (hasActivePriceFilters) {
      onFiltersActivated();
    }

    onPriceRangeChange({
      minPrice: nextMinPrice,
      maxPrice: nextMaxPrice,
    });
  };

  useDebounce(
    () => {
      if (!hasDraftInputEditsRef.current) {
        return;
      }
      if (isZeroDraftInput(minPriceInput) || isZeroDraftInput(maxPriceInput)) {
        return;
      }
      commitPriceRange();
    },
    350,
    [
      minPriceInput,
      maxPriceInput,
      minPrice,
      maxPrice,
      onPriceRangeChange,
      onFiltersActivated,
    ]
  );

  const hasAnyPriceInput =
    minPriceInput.trim().length > 0 || maxPriceInput.trim().length > 0;

  return (
    <div
      ref={priceFiltersContainerRef}
      className="tw-flex tw-flex-nowrap tw-items-center tw-gap-2 tw-overflow-x-auto tw-@container/price"
    >
      <div className="tw-min-w-[6.5rem] tw-flex-1 @[28rem]/price:tw-min-w-[8rem] @[36rem]/price:tw-min-w-[9.5rem]">
        <input
          id={`leaderboard-min-price-${waveId}`}
          data-testid="leaderboard-price-min-input"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          aria-label="Minimum ETH"
          title="Minimum ETH"
          placeholder={useLongPlaceholders ? "Minimum ETH" : "Min"}
          value={minPriceInput}
          onChange={(event) => {
            hasDraftInputEditsRef.current = true;
            setMinPriceInput(event.target.value);
          }}
          onBlur={commitPriceRange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitPriceRange();
            }
          }}
          className="tw-form-input tw-block tw-h-9 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out [appearance:textfield] placeholder:tw-text-iron-400 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
        />
      </div>
      <div className="tw-min-w-[6.5rem] tw-flex-1 @[28rem]/price:tw-min-w-[8rem] @[36rem]/price:tw-min-w-[9.5rem]">
        <input
          id={`leaderboard-max-price-${waveId}`}
          data-testid="leaderboard-price-max-input"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          aria-label="Maximum ETH"
          title="Maximum ETH"
          placeholder={useLongPlaceholders ? "Maximum ETH" : "Max"}
          value={maxPriceInput}
          onChange={(event) => {
            hasDraftInputEditsRef.current = true;
            setMaxPriceInput(event.target.value);
          }}
          onBlur={commitPriceRange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitPriceRange();
            }
          }}
          className="tw-form-input tw-block tw-h-9 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out [appearance:textfield] placeholder:tw-text-iron-400 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none"
        />
      </div>
      {hasAnyPriceInput && (
        <button
          type="button"
          data-testid="leaderboard-price-clear"
          aria-label="Clear filters"
          title="Clear filters"
          onClick={() => {
            setMinPriceInput("");
            setMaxPriceInput("");
            onFiltersCleared();
            onPriceRangeChange?.({
              minPrice: undefined,
              maxPrice: undefined,
            });
          }}
          className="tw-inline-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-100"
        >
          <XMarkIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
        </button>
      )}
      {trailingActions}
    </div>
  );
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

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  wave,
  onCreateDrop,
  viewMode = "list",
  onViewModeChange,
  sort,
  onSortChange,
  curationGroups = [],
  curatedByGroupId = null,
  onCurationGroupChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isMemesWave, isCurationWave, participation } = useWave(wave);
  const isLoggedIn = Boolean(connectedProfile?.handle);
  const { canCreateDrop } = getWaveDropEligibility({
    isLoggedIn,
    isProxy: Boolean(activeProfileProxy),
    isCurationWave,
    participation,
  });
  const showCurationGroupSelect = Boolean(
    onCurationGroupChange && curationGroups.length > 0
  );
  const showPriceControls = Boolean(isCurationWave && onPriceRangeChange);
  const sortItems = useMemo(
    () =>
      isCurationWave
        ? WAVE_LEADERBOARD_CURATION_SORT_ITEMS
        : WAVE_LEADERBOARD_SORT_ITEMS,
    [isCurationWave]
  );
  const viewModes: LeaderboardViewMode[] = isMemesWave
    ? ["list", "grid"]
    : ["list", "grid", "grid_content_only"];
  const hasActivePriceFilters =
    typeof minPrice === "number" || typeof maxPrice === "number";
  const [isManualFiltersOpen, setIsManualFiltersOpen] = useState(false);
  const [isActiveFiltersCollapsed, setIsActiveFiltersCollapsed] =
    useState(false);
  const isPriceFiltersOpen = hasActivePriceFilters
    ? !isActiveFiltersCollapsed
    : isManualFiltersOpen;

  const sortLabelByValue = useMemo(
    () => new Map(sortItems.map((item) => [item.value, item.label])),
    [sortItems]
  );
  const activeSortLabel = sortLabelByValue.get(sort) ?? "Current Vote";

  const activeCurationLabel = useMemo(() => {
    if (!showCurationGroupSelect || !curatedByGroupId) {
      return "All submissions";
    }

    return (
      curationGroups.find((group) => group.id === curatedByGroupId)?.name ??
      "All submissions"
    );
  }, [curatedByGroupId, curationGroups, showCurationGroupSelect]);

  const curationProbeKey = useMemo(
    () => curationGroups.map((group) => `${group.id}:${group.name}`).join("|"),
    [curationGroups]
  );
  const showCurationActions = showPriceControls;
  const showCreateAction = Boolean(isLoggedIn && canCreateDrop && onCreateDrop);
  let actionsRemeasureVariant = "none";

  if (showCurationActions && showCreateAction) {
    actionsRemeasureVariant = "with-drop";
  } else if (showCurationActions) {
    actionsRemeasureVariant = "filter-only";
  }

  const remeasureKey = `${activeSortLabel}|${activeCurationLabel}|${curationProbeKey}|actions:${actionsRemeasureVariant}`;

  const {
    headerRowRef,
    controlsRowRef,
    viewModeTabsRef,
    sortTabsProbeRef,
    sortDropdownProbeRef,
    curationTabsProbeRef,
    curationDropdownProbeRef,
    actionsFullProbeRef,
    actionsIconProbeRef,
    measurements,
  } = useLeaderboardHeaderControlMeasurements({
    showCurationGroupSelect,
    measureAgainstHeaderRow: showCurationActions,
    remeasureKey,
  });

  const layout = useMemo(
    () =>
      resolveWaveLeaderboardHeaderLayout({
        rowWidth: measurements.rowWidth,
        viewModesWidth: measurements.viewModesWidth,
        sortTabsWidth: measurements.sortTabsWidth,
        sortDropdownWidth: measurements.sortDropdownWidth,
        hasCurationControl: showCurationGroupSelect,
        curationTabsWidth: measurements.curationTabsWidth,
        curationDropdownWidth: measurements.curationDropdownWidth,
        hasActions: showCurationActions,
        actionsFullWidth: measurements.actionsFullWidth,
        actionsIconWidth: measurements.actionsIconWidth,
        wrapEarlyThresholdPx: 20,
      }),
    [measurements, showCurationActions, showCurationGroupSelect]
  );

  const getViewModeLabel = (mode: LeaderboardViewMode) => {
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
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      );
    }

    if (mode === "grid") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        aria-hidden="true"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="tw-size-5 tw-flex-shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6Zm3.75 3h9m-9 4.5h9m-9 4.5h5.25"
        />
      </svg>
    );
  };

  const onTogglePriceFilters = () => {
    if (hasActivePriceFilters) {
      setIsActiveFiltersCollapsed((current) => !current);
      return;
    }
    setIsManualFiltersOpen((current) => !current);
  };

  const isCompactActions = layout.actionMode === "icon";
  const shouldRenderActionsInPriceRow =
    showCurationActions && isPriceFiltersOpen && layout.wrapActions;
  let headerRowFlexClass = "tw-flex-wrap";
  if (showCurationActions) {
    if (shouldRenderActionsInPriceRow) {
      headerRowFlexClass = "tw-flex-nowrap";
    } else {
      headerRowFlexClass = layout.wrapActions
        ? "tw-flex-wrap"
        : "tw-flex-nowrap";
    }
  }
  const controlsRowBasisClass =
    layout.wrapActions && !shouldRenderActionsInPriceRow ? "tw-basis-full" : "";
  const showHeaderActions =
    showCurationActions && !shouldRenderActionsInPriceRow;
  const showDefaultCreateRow = !showCurationActions && isLoggedIn;
  const curationActionControls = (
    <>
      <button
        type="button"
        data-testid="leaderboard-price-toggle"
        aria-label="Toggle filters"
        aria-expanded={isPriceFiltersOpen}
        aria-controls={`leaderboard-price-panel-${wave.id}`}
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
              <span className="tw-sr-only">Drop Art</span>
            </>
          ) : (
            <>
              <PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
              <span>Drop Art</span>
            </>
          )}
        </PrimaryButton>
      )}
    </>
  );

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-gap-y-4 tw-bg-black tw-@container">
      <div
        ref={headerRowRef}
        data-testid="leaderboard-header-row"
        className={`tw-flex tw-items-start tw-gap-2 ${headerRowFlexClass}`}
      >
        <div
          ref={controlsRowRef}
          data-testid="leaderboard-header-controls-row"
          className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-gap-2 ${
            controlsRowBasisClass
          } ${
            layout.enableControlsScroll
              ? "horizontal-menu-hide-scrollbar tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60"
              : "tw-overflow-x-hidden"
          }`}
        >
          <div
            ref={viewModeTabsRef}
            role="tablist"
            aria-label="Leaderboard view modes"
            className="tw-flex tw-flex-shrink-0 tw-gap-0.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1"
          >
            {viewModes.map((mode) => (
              <React.Fragment key={mode}>
                <button
                  type="button"
                  role="tab"
                  aria-label={getViewModeLabel(mode)}
                  aria-selected={viewMode === mode}
                  tabIndex={viewMode === mode ? 0 : -1}
                  className={getViewModeTabClass(mode, viewMode)}
                  onClick={() => onViewModeChange(mode)}
                  data-tooltip-id={`leaderboard-view-mode-${mode}-${wave.id}`}
                >
                  {getViewModeIcon(mode)}
                  <span className="tw-sr-only">{getViewModeLabel(mode)}</span>
                </button>
                <Tooltip
                  id={`leaderboard-view-mode-${mode}-${wave.id}`}
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
                  {getViewModeLabel(mode)}
                </Tooltip>
              </React.Fragment>
            ))}
          </div>
          <div className="tw-flex-shrink-0">
            <WaveleaderboardSort
              sort={sort}
              onSortChange={onSortChange}
              mode={layout.sortMode}
              items={sortItems}
            />
          </div>
          {showCurationGroupSelect && onCurationGroupChange && (
            <div className="tw-flex-shrink-0">
              <WaveLeaderboardCurationGroupSelect
                groups={curationGroups}
                selectedGroupId={curatedByGroupId}
                onChange={onCurationGroupChange}
                mode={layout.curationMode}
              />
            </div>
          )}
        </div>
        {showHeaderActions && (
          <div
            data-testid="leaderboard-header-actions-row"
            data-action-mode={layout.actionMode}
            data-wrap={layout.wrapActions ? "yes" : "no"}
            className={`tw-ml-auto tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2 ${
              layout.wrapActions ? "tw-basis-auto" : ""
            }`}
          >
            {curationActionControls}
          </div>
        )}
        {showDefaultCreateRow && (
          <div
            className={`tw-flex tw-flex-col tw-items-end ${isMemesWave ? "lg:tw-hidden" : ""}`}
          >
            {canCreateDrop && onCreateDrop && (
              <PrimaryButton
                loading={false}
                disabled={false}
                onClicked={onCreateDrop}
                padding="tw-px-3 tw-py-2"
              >
                <PlusIcon className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0" />
                <span>Drop</span>
              </PrimaryButton>
            )}
          </div>
        )}
      </div>

      {showPriceControls && (
        <AnimatePresence initial={false}>
          {isPriceFiltersOpen && (
            <motion.div
              id={`leaderboard-price-panel-${wave.id}`}
              data-testid="leaderboard-price-panel"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="tw-overflow-hidden"
            >
              <WaveLeaderboardPriceFilters
                key={`${minPrice ?? ""}|${maxPrice ?? ""}`}
                waveId={wave.id}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceRangeChange={onPriceRangeChange}
                onFiltersActivated={() => setIsActiveFiltersCollapsed(false)}
                onFiltersCleared={() => {
                  setIsManualFiltersOpen(false);
                  setIsActiveFiltersCollapsed(false);
                }}
                trailingActions={
                  shouldRenderActionsInPriceRow ? (
                    <div
                      data-testid="leaderboard-price-actions-row"
                      className="tw-ml-auto tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2"
                    >
                      {curationActionControls}
                    </div>
                  ) : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

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

        {showCurationGroupSelect && (
          <>
            <div
              ref={curationTabsProbeRef}
              className="tw-inline-flex tw-items-center tw-gap-x-1"
            >
              <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-iron-600">
                All submissions
              </div>
              {curationGroups.map((group) => (
                <div
                  key={group.id}
                  className="tw-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-iron-600"
                >
                  {group.name}
                </div>
              ))}
            </div>

            <div
              ref={curationDropdownProbeRef}
              className="tailwind-scope tw-inline-flex tw-whitespace-nowrap tw-rounded-lg tw-py-2.5 tw-pl-3.5 tw-pr-8 tw-text-xs tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-iron-700"
            >
              <span className="tw-font-semibold tw-text-iron-500">Group: </span>
              {activeCurationLabel}
            </div>
          </>
        )}

        {showCurationActions && (
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
                  <span>Drop Art</span>
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
    </div>
  );
};
