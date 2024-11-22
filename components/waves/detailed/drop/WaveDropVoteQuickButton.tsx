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
  const getColours = (rank: number): { base: string; hover: string } => {
    if (rank === 1) {
      return {
        base: "tw-ring-[#E8D48A] tw-text-[#E8D48A]",
        hover: "hover:tw-bg-[#E8D48A]/10 hover:tw-ring-[#E8D48A]"
      };
    }
    if (rank === 2) {
      return {
        base: "tw-ring-[#DDDDDD] tw-text-[#DDDDDD]",
        hover: "hover:tw-bg-[#DDDDDD]/10 hover:tw-ring-[#DDDDDD]"
      };
    }
    if (rank === 3) {
      return {
        base: "tw-ring-[#D9A962] tw-text-[#D9A962]",
        hover: "hover:tw-bg-[#D9A962]/10 hover:tw-ring-[#D9A962]"
      };
    }
    return {
      base: "tw-ring-iron-700/50 tw-text-iron-300",
      hover: "hover:tw-bg-iron-800 hover:tw-ring-iron-600"
    };
  };

  const { base: baseColors, hover: hoverColors } = getColours(rank);
  const isDisabled = value > availableCredit;

  return (
    <Tippy disabled={!isDisabled} content="You don't have enough credit">
      <div>
        <button
          key={`${rank}-${value}`}
          disabled={isDisabled}
          onClick={() => setValue(value)}
          className={`tw-border-0 tw-group tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-rounded-lg tw-ring-1 tw-transition-all tw-bg-iron-950/50 ${baseColors} ${
            isDisabled
              ? "tw-opacity-50 tw-cursor-not-allowed"
              : hoverColors
          }`}
        >
          <span className="tw-text-xs tw-font-medium">
            {value} TDH to #{rank}
          </span>
          <svg
            className="tw-w-3.5 tw-h-3.5 tw-opacity-0 tw-transition-all group-hover:tw-opacity-100"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </Tippy>
  );
};