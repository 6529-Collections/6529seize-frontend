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
        <div className="tw-flex tw-items-center tw-gap-x-1">
          {TIME_WINDOW_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`tw-rounded-full tw-border-0 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-transition-all tw-duration-200 ${
                value === option
                  ? "tw-bg-amber-600/20 tw-text-amber-400 tw-ring-1 tw-ring-inset tw-ring-amber-500/40"
                  : "tw-bg-iron-800 tw-text-iron-400 hover:tw-bg-iron-700 hover:tw-text-iron-200"
              }`}
            >
              {TIME_WINDOW_LABELS[option]}
            </button>
          ))}
        </div>
      );
    }
  );

WaveLeaderboardRightSidebarTimeWindowSelect.displayName =
  "WaveLeaderboardRightSidebarTimeWindowSelect";
