"use client";

import { PlusIcon } from "@heroicons/react/24/solid";
import React, { useContext, useMemo } from "react";
import { Tooltip } from "react-tooltip";

import { AuthContext } from "@/components/auth/Auth";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";
import { useWave } from "@/hooks/useWave";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";

import { getWaveDropEligibility } from "../dropEligibility";

import { useLeaderboardHeaderControlMeasurements } from "./useLeaderboardHeaderControlMeasurements";
import { WaveLeaderboardCurationGroupSelect } from "./WaveLeaderboardCurationGroupSelect";
import { resolveWaveLeaderboardHeaderControlModes } from "./waveLeaderboardHeaderControls";
import {
  WAVE_LEADERBOARD_SORT_ITEMS,
  WaveleaderboardSort,
} from "./WaveleaderboardSort";

import type { LeaderboardViewMode } from "../types";


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
}

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
  const viewModes: LeaderboardViewMode[] = isMemesWave
    ? ["list", "grid"]
    : ["list", "grid", "grid_content_only"];

  const sortLabelByValue = useMemo(
    () =>
      new Map(
        WAVE_LEADERBOARD_SORT_ITEMS.map((item) => [item.value, item.label])
      ),
    []
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

  const {
    controlsRowRef,
    viewModeTabsRef,
    sortTabsProbeRef,
    sortDropdownProbeRef,
    curationTabsProbeRef,
    curationDropdownProbeRef,
    measurements,
  } = useLeaderboardHeaderControlMeasurements({
    showCurationGroupSelect,
    remeasureKey: `${activeSortLabel}|${activeCurationLabel}|${curationProbeKey}`,
  });

  const controlModes = useMemo(
    () =>
      resolveWaveLeaderboardHeaderControlModes({
        availableWidth: measurements.availableWidth,
        viewModesWidth: measurements.viewModesWidth,
        sortTabsWidth: measurements.sortTabsWidth,
        sortDropdownWidth: measurements.sortDropdownWidth,
        hasCurationControl: showCurationGroupSelect,
        curationTabsWidth: measurements.curationTabsWidth,
        curationDropdownWidth: measurements.curationDropdownWidth,
      }),
    [measurements, showCurationGroupSelect]
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

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-gap-y-4 tw-bg-black tw-@container">
      <div className="tw-flex tw-items-start tw-gap-2">
        <div
          ref={controlsRowRef}
          data-testid="leaderboard-header-controls-row"
          className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-gap-2 ${
            controlModes.enableControlsScroll
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
              mode={controlModes.sortMode}
            />
          </div>
          {showCurationGroupSelect && onCurationGroupChange && (
            <div className="tw-flex-shrink-0">
              <WaveLeaderboardCurationGroupSelect
                groups={curationGroups}
                selectedGroupId={curatedByGroupId}
                onChange={onCurationGroupChange}
                mode={controlModes.curationMode}
              />
            </div>
          )}
        </div>
        {isLoggedIn && (
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

      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-h-0 tw-overflow-hidden tw-whitespace-nowrap tw-opacity-0"
      >
        <div
          ref={sortTabsProbeRef}
          className="tw-inline-flex tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-700"
        >
          {WAVE_LEADERBOARD_SORT_ITEMS.map((item) => (
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
      </div>
    </div>
  );
};
