import Tippy from "@tippyjs/react";
import React from "react";

interface WaveDropVoteQuickButtonProps {
  readonly value: number;
  readonly rank: number;
  readonly availableCredit: number;
  readonly setValue: (value: number) => void;
}

export const WaveDropVoteQuickButton: React.FC<
  WaveDropVoteQuickButtonProps
> = ({ value, rank, availableCredit, setValue }) => {
  const getColours = (rank: number): string => {
    if (rank === 1) {
      return "tw-ring-[#E8D48A] tw-text-[#E8D48A]";
    }
    if (rank === 2) {
      return "tw-ring-[#DDDDDD] tw-text-[#DDDDDD]";
    }
    if (rank === 3) {
      return "tw-ring-[#D9A962] tw-text-[#D9A962]";
    }
    return "tw-ring-iron-700/50 tw-text-iron-300";
  };

  const colours = getColours(rank);
  const isDisabled = value > availableCredit;

  return (
    <Tippy disabled={!isDisabled} content="You don't have enough credit">
      <div>
        <button
          key={`${rank}-${value}`}
          disabled={isDisabled}
          onClick={() => setValue(value)}
          className={`tw-border-0 tw-group tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-lg tw-ring-1 tw-transition-all ${colours} ${
            isDisabled
              ? "tw-bg-iron-950/50 tw-opacity-50 tw-cursor-not-allowed"
              : "tw-bg-iron-950/50 hover:tw-bg-iron-950/80 hover:tw-ring-emerald-500/50"
          }`}
        >
          <span
            className={`tw-text-xs tw-font-medium ${
              isDisabled ? "" : "group-hover:tw-text-emerald-400"
            }`}
          >
            {value} TDH to #{rank}
          </span>
          <svg
            className={`tw-w-3.5 tw-h-3.5 tw-opacity-0 tw-text-emerald-500 tw-transition-all ${
              isDisabled ? "" : "group-hover:tw-opacity-100"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </Tippy>
  );
};
