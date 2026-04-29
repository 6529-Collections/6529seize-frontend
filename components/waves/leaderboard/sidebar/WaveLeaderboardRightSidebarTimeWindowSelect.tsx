"use client";

import { memo } from "react";
import { TimeWindow, TIME_WINDOW_LABELS } from "@/types/boosted-drops.types";

interface WaveLeaderboardRightSidebarTimeWindowSelectProps {
  readonly value: TimeWindow;
  readonly onChange: (value: TimeWindow) => void;
}

const TIME_WINDOW_OPTIONS = Object.values(TimeWindow);

export const WaveLeaderboardRightSidebarTimeWindowSelect =
  memo<WaveLeaderboardRightSidebarTimeWindowSelectProps>(
    ({ value, onChange }) => {
      return (
        <div
          className="tw-flex tw-items-center tw-gap-x-0.5"
          role="tablist"
          aria-label="Trending time window"
        >
          {TIME_WINDOW_OPTIONS.map((option) => {
            const isActive = value === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(option)}
                className={`tw-rounded-full tw-border-0 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-leading-4 tw-transition-colors tw-duration-150 ${
                  isActive
                    ? "tw-bg-iron-700 tw-text-iron-50"
                    : "tw-bg-transparent tw-text-iron-500 hover:tw-bg-iron-800/60 hover:tw-text-iron-200"
                }`}
              >
                {TIME_WINDOW_LABELS[option]}
              </button>
            );
          })}
        </div>
      );
    }
  );

WaveLeaderboardRightSidebarTimeWindowSelect.displayName =
  "WaveLeaderboardRightSidebarTimeWindowSelect";
