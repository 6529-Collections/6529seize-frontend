import React from "react";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

interface StormButtonProps {
  readonly isStormMode: boolean;
  readonly canAddPart: boolean;
  readonly submitting: boolean;
  readonly breakIntoStorm: () => void;
}

const StormButton: React.FC<StormButtonProps> = ({
  isStormMode,
  canAddPart,
  submitting,
  breakIntoStorm,
}) => {
  const label = isStormMode ? "Add a part" : "Break into storm";

  return (
    <div>
      <button
        onClick={breakIntoStorm}
        disabled={!canAddPart || submitting}
        type="button"
        aria-label={label}
        className={`tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-transition tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 lg:tw-size-7 ${
          canAddPart && !submitting
            ? "tw-cursor-pointer tw-bg-iron-700 tw-text-iron-300 desktop-hover:hover:tw-bg-primary-300/20 desktop-hover:hover:tw-text-primary-400"
            : "tw-cursor-default tw-bg-iron-900 tw-text-iron-600 desktop-hover:hover:tw-text-iron-600"
        }`}
        data-tooltip-id="storm-button-tooltip"
      >
        <svg
          className={`tw-h-[1.1rem] tw-w-[1.1rem] tw-flex-shrink-0 lg:tw-size-4 ${
            !canAddPart || submitting ? "tw-opacity-50" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <Tooltip
        id="storm-button-tooltip"
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        <span className="tw-text-xs">{label}</span>
      </Tooltip>
    </div>
  );
};

export default StormButton;
