"use client";

import React, { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { WaveleaderboardSort } from "./WaveleaderboardSort";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import type { LeaderboardViewMode } from "../types";
import { Tooltip } from "react-tooltip";
interface WaveLeaderboardHeaderProps {
  readonly wave: ApiWave;
  readonly onCreateDrop: () => void;
  readonly viewMode: LeaderboardViewMode;
  readonly onViewModeChange: (mode: LeaderboardViewMode) => void;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
}

export const WaveLeaderboardHeader: React.FC<WaveLeaderboardHeaderProps> = ({
  wave,
  onCreateDrop,
  viewMode = "list",
  onViewModeChange,
  sort,
  onSortChange,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { isMemesWave, participation } = useWave(wave);
  const viewModes: LeaderboardViewMode[] = isMemesWave
    ? ["list", "grid"]
    : ["list", "grid", "grid_content_only"];

  const getTooltipLabel = (mode: LeaderboardViewMode) => {
    if (mode === "list") {
      return "List view";
    }
    if (mode === "grid") {
      return "Grid view";
    }
    return "Content only";
  };

  const getViewModeButtonClass = (
    mode: LeaderboardViewMode,
    activeMode: LeaderboardViewMode
  ): string => {
    const baseClassName =
      "tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-transition-colors";

    if (activeMode === mode) {
      return `${baseClassName} tw-border-primary-500/50 tw-bg-primary-600/20 tw-text-primary-400`;
    }

    return `${baseClassName} tw-border-white/10 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-bg-white/10`;
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
    <div className="tw-flex tw-flex-col tw-gap-y-4 tw-bg-black tw-pt-2 tw-@container">
      <div className="tw-flex tw-items-center tw-gap-2 tw-overflow-x-auto">
        <div className="tw-mb-2 tw-flex tw-items-center tw-gap-x-2 lg:tw-gap-x-4">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-flex tw-items-center tw-gap-2">
              {viewModes.map((mode) => (
                <React.Fragment key={mode}>
                  <button
                    aria-label={getTooltipLabel(mode)}
                    className={getViewModeButtonClass(mode, viewMode)}
                    onClick={() => onViewModeChange(mode)}
                    data-tooltip-id={`${mode}-view-${wave.id}`}
                  >
                    {getViewModeIcon(mode)}
                  </button>
                  <Tooltip
                    id={`${mode}-view-${wave.id}`}
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
                    {getTooltipLabel(mode)}
                  </Tooltip>
                </React.Fragment>
              ))}
            </div>
            <WaveleaderboardSort
              sort={sort}
              onSortChange={onSortChange}
              waveId={wave.id}
            />
          </div>
        </div>
        {connectedProfile && participation.isEligible && (
          <div
            className={`tw-mb-4 tw-w-auto ${
              isMemesWave ? "tw-ml-auto lg:tw-hidden" : "tw-ml-auto"
            }`}
          >
            <PrimaryButton
              loading={false}
              disabled={false}
              onClicked={onCreateDrop}
              padding="tw-px-3 tw-py-2"
            >
              <svg
                className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Drop</span>
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
};
