"use client";

import { AuthContext } from "@/components/auth/Auth";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { resolveWaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { useWaveSubmissionButtonLabel } from "@/hooks/waves/useWaveMetadata";
import { useWave } from "@/hooks/useWave";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useDebounce } from "react-use";
import { getWaveDropEligibility } from "../dropEligibility";
import type { LeaderboardViewMode } from "../types";
import {
  getActionsRemeasureVariant,
  getHeaderRowFlexClass,
  getLeaderboardViewModes,
  HeaderViewModeTabs,
  MeasurementProbes,
  PriceActions,
} from "./WaveLeaderboardHeaderAuxiliary";
import { useLeaderboardHeaderControlMeasurements } from "./useLeaderboardHeaderControlMeasurements";
import {
  getWaveLeaderboardSortItems,
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

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  wave,
  onCreateDrop,
  viewMode = "list",
  onViewModeChange,
  sort,
  onSortChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isMemesWave, isCurationWave, isQuorumWave, participation } =
    useWave(wave);
  const submissionExperience = useMemo(
    () =>
      resolveWaveSubmissionExperience({
        isMemesWave: Boolean(isMemesWave),
        isCurationWave: Boolean(isCurationWave),
        isQuorumWave: Boolean(isQuorumWave),
        submissionStrategy: wave.participation?.submission_strategy ?? null,
      }),
    [
      isCurationWave,
      isMemesWave,
      isQuorumWave,
      wave.participation?.submission_strategy,
    ]
  );
  const isLoggedIn = Boolean(connectedProfile?.handle);
  const { canCreateDrop } = getWaveDropEligibility({
    isLoggedIn,
    isProxy: Boolean(activeProfileProxy),
    isCurationWave,
    participation,
  });
  const showPriceControls = Boolean(isCurationWave && onPriceRangeChange);
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const sortItems = useMemo(() => {
    return getWaveLeaderboardSortItems({
      isApproveWave,
      isCurationWave,
      timeLockMs: wave.wave.time_lock_ms,
    });
  }, [isApproveWave, isCurationWave, wave.wave.time_lock_ms]);
  const viewModes = getLeaderboardViewModes(isMemesWave);
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
  const activeSortLabel =
    sortLabelByValue.get(sort) ?? sortItems[0]?.label ?? "Current Vote";

  const showPriceActions = showPriceControls;
  const showCreateAction = Boolean(isLoggedIn && canCreateDrop && onCreateDrop);
  const actionsRemeasureVariant = getActionsRemeasureVariant({
    showPriceActions,
    showCreateAction,
  });
  const showDefaultCreateRow = !showPriceActions && isLoggedIn;
  const createLabel = useWaveSubmissionButtonLabel({
    enabled: showCreateAction || showDefaultCreateRow,
    submissionExperience,
    waveId: wave.id,
  });
  const remeasureKey = `${activeSortLabel}|actions:${actionsRemeasureVariant}|create:${createLabel}`;

  const {
    headerRowRef,
    controlsRowRef,
    viewModeTabsRef,
    sortTabsProbeRef,
    sortDropdownProbeRef,
    actionsFullProbeRef,
    actionsIconProbeRef,
    measurements,
  } = useLeaderboardHeaderControlMeasurements({
    measureAgainstHeaderRow: showPriceActions,
    remeasureKey,
  });

  const layout = useMemo(
    () =>
      resolveWaveLeaderboardHeaderLayout({
        rowWidth: measurements.rowWidth,
        viewModesWidth: measurements.viewModesWidth,
        sortTabsWidth: measurements.sortTabsWidth,
        sortDropdownWidth: measurements.sortDropdownWidth,
        hasActions: showPriceActions,
        actionsFullWidth: measurements.actionsFullWidth,
        actionsIconWidth: measurements.actionsIconWidth,
        wrapEarlyThresholdPx: 20,
      }),
    [measurements, showPriceActions]
  );

  const onTogglePriceFilters = () => {
    if (hasActivePriceFilters) {
      setIsActiveFiltersCollapsed((current) => !current);
      return;
    }
    setIsManualFiltersOpen((current) => !current);
  };

  const isCompactActions = layout.actionMode === "icon";
  const shouldRenderActionsInPriceRow =
    showPriceActions && isPriceFiltersOpen && layout.wrapActions;
  const headerRowFlexClass = getHeaderRowFlexClass({
    showPriceActions,
    shouldRenderActionsInPriceRow,
    wrapActions: layout.wrapActions,
  });
  const controlsRowBasisClass =
    layout.wrapActions && !shouldRenderActionsInPriceRow ? "tw-basis-full" : "";
  const showHeaderActions = showPriceActions && !shouldRenderActionsInPriceRow;
  const priceActionControls = (
    <PriceActions
      createLabel={createLabel}
      isCompactActions={isCompactActions}
      isPriceFiltersOpen={isPriceFiltersOpen}
      hasActivePriceFilters={hasActivePriceFilters}
      showCreateAction={showCreateAction}
      waveId={wave.id}
      onCreateDrop={onCreateDrop}
      onTogglePriceFilters={onTogglePriceFilters}
    />
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
          <HeaderViewModeTabs
            refObject={viewModeTabsRef}
            viewModes={viewModes}
            viewMode={viewMode}
            waveId={wave.id}
            onViewModeChange={onViewModeChange}
          />
          <div className="tw-flex-shrink-0">
            <WaveleaderboardSort
              sort={sort}
              onSortChange={onSortChange}
              mode={layout.sortMode}
              items={sortItems}
            />
          </div>
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
            {priceActionControls}
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
                <span>{createLabel}</span>
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
                      {priceActionControls}
                    </div>
                  ) : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <MeasurementProbes
        sortItems={sortItems}
        activeSortLabel={activeSortLabel}
        showPriceActions={showPriceActions}
        showCreateAction={showCreateAction}
        createLabel={createLabel}
        sortTabsProbeRef={sortTabsProbeRef}
        sortDropdownProbeRef={sortDropdownProbeRef}
        actionsFullProbeRef={actionsFullProbeRef}
        actionsIconProbeRef={actionsIconProbeRef}
      />
    </div>
  );
};
