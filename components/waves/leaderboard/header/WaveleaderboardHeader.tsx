"use client";

import React, { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import PrimaryButton from "../../../utils/button/PrimaryButton";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useWave } from "../../../../hooks/useWave";
import { WaveleaderboardSort } from "./WaveleaderboardSort";
import { WaveDropsLeaderboardSort } from "../../../../hooks/useWaveDropsLeaderboard";
import { Tooltip } from "react-tooltip";
import { createBreakpoint } from "react-use";
interface WaveLeaderboardHeaderProps {
  readonly wave: ApiWave;
  readonly onCreateDrop: () => void;
  readonly viewMode: "list" | "grid";
  readonly onViewModeChange: (mode: "list" | "grid") => void;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
}

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

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
  const breakpoint = useBreakpoint();

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4 tw-@container">
      <div className="tw-flex tw-items-center tw-gap-2 tw-overflow-x-auto tw-bg-black">
        <div className="tw-mb-2 tw-flex tw-items-center tw-gap-x-2 lg:tw-gap-x-4">
          {isMemesWave && (
            <div className="tw-flex tw-items-center tw-gap-x-2">
              {/* Hide view toggle buttons on mobile (S breakpoint), show only on desktop (MD breakpoint) */}
              {breakpoint === "MD" && (
                <div className="tw-flex tw-items-center tw-whitespace-nowrap tw-h-9 tw-px-1 tw-text-xs tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-hidden tw-bg-iron-950">
                    <>
                      <button
                        className={`tw-w-8 tw-h-7 ${
                          viewMode === "list"
                            ? "tw-bg-iron-800 tw-text-iron-300 tw-font-medium"
                            : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-iron-950"
                        } tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center`}
                        onClick={() => onViewModeChange("list")}
                        data-tooltip-id={`list-view-${wave.id}`}
                      >
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
                      </button>
                      <Tooltip
                        id={`list-view-${wave.id}`}
                        place="top"
                        delayShow={500}
                        style={{
                          backgroundColor: "#1F2937",
                          color: "white",
                          padding: "4px 8px",
                        }}
                      >
                        List view
                      </Tooltip>
                    </>
                    <>
                      <button
                        className={`tw-w-8 tw-h-7 ${
                          viewMode === "grid"
                            ? "tw-bg-iron-800 tw-text-iron-300 tw-font-medium"
                            : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-iron-950"
                        } tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center`}
                        onClick={() => onViewModeChange("grid")}
                        data-tooltip-id={`grid-view-${wave.id}`}
                      >
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
                      </button>
                      <Tooltip
                        id={`grid-view-${wave.id}`}
                        place="top"
                        delayShow={500}
                        style={{
                          backgroundColor: "#1F2937",
                          color: "white",
                          padding: "4px 8px",
                        }}
                      >
                        Grid view
                      </Tooltip>
                    </>
                </div>
              )}
              <WaveleaderboardSort sort={sort} onSortChange={onSortChange} waveId={wave.id} />
            </div>
          )}
        </div>
        {connectedProfile && participation.isEligible && (
          <div
            className={`tw-w-auto tw-mb-4  ${
              isMemesWave ? "tw-ml-auto lg:tw-hidden" : ""
            }`}
          >
            <PrimaryButton
              loading={false}
              disabled={false}
              onClicked={onCreateDrop}
              padding="tw-px-3 tw-py-1.5"
            >
              <svg
                className="tw-w-4 tw-h-4 tw-flex-shrink-0 -tw-ml-1"
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
