import React from "react";
import Tippy from "@tippyjs/react";

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
  return (
    <div>
      <Tippy
        content={
          <div className="tw-text-center">
            <span className="tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out">
              {isStormMode ? "Add a part" : "Break into storm"}
            </span>
          </div>
        }
        placement="top"
        disabled={false}
      >
        <button
          onClick={breakIntoStorm}
          disabled={!canAddPart || submitting}
          type="button"
          className={`tw-flex tw-items-center tw-justify-center tw-flex-shrink-0  tw-rounded-full tw-transition tw-duration-300 tw-size-9 lg:tw-size-8 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-iron-500 tw-border-0 ${
            canAddPart && !submitting
              ? "tw-cursor-pointer tw-text-iron-400 hover:tw-text-primary-400 hover:tw-bg-primary-300/20 tw-bg-iron-800"
              : "tw-cursor-default tw-text-iron-600 hover:tw-text-iron-600 tw-bg-iron-900"
          }`}
        >
          <svg
            className={`tw-h-[1.15rem] tw-w-[1.15rem] tw-flex-shrink-0 ${
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
      </Tippy>
    </div>
  );
};

export default StormButton;
