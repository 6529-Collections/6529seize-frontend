import Tippy from "@tippyjs/react";
import React from "react";

interface CreateDropDropModeToggleProps {
  readonly isDropMode: boolean;
  readonly onDropModeChange: (isDropMode: boolean) => void;
  readonly disabled?: boolean;
}

export const CreateDropDropModeToggle: React.FC<
  CreateDropDropModeToggleProps
> = ({ isDropMode, onDropModeChange, disabled }) => {
  return (
    <Tippy
      content={<span className="tw-text-xs">Drop Mode</span>}
      placement="top"
    >
      <div>
        <button
          type="button"
          onClick={() => onDropModeChange(!isDropMode)}
          disabled={disabled}
          className={`tw-flex-shrink-0 tw-size-8 tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 tw-transform tw-transition tw-duration-300 tw-ease-in-out active:tw-scale-90 ${
            disabled
              ? "tw-opacity-50 tw-cursor-not-allowed"
              : isDropMode
              ? "tw-bg-indigo-600 tw-text-white desktop-hover:hover:tw-bg-indigo-500 active:tw-bg-indigo-700 focus-visible:tw-outline-indigo-500 tw-ring-2 tw-ring-indigo-400/40 tw-ring-offset-1 tw-ring-offset-iron-900"
              : "tw-bg-iron-800 tw-backdrop-blur-sm tw-text-iron-500 desktop-hover:hover:tw-bg-iron-700 active:tw-bg-iron-700/90 focus-visible:tw-outline-iron-700 tw-ring-1 tw-ring-iron-700/50"
          }`}
        >
          <svg
            className="tw-size-4 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.62826 7.89684C8.62826 7.60735 8.62826 6.72633 7.11906 4.34441C6.41025 3.22565 5.71213 2.3144 5.68274 2.27615L5.12514 1.55005L4.56755 2.27615C4.53816 2.3144 3.84008 3.2257 3.13123 4.34441C1.62207 6.72633 1.62207 7.60735 1.62207 7.89684C1.62207 9.82846 3.19352 11.3999 5.12514 11.3999C7.05676 11.3999 8.62826 9.82846 8.62826 7.89684Z"
              fill="currentColor"
            />
            <path
              d="M21.2502 2.24459C20.7301 1.42366 20.2173 0.754227 20.1956 0.726104L19.638 0L19.0805 0.726104C19.0589 0.754227 18.546 1.42366 18.0259 2.24459C17.5419 3.00847 16.8984 4.11804 16.8984 4.931C16.8984 6.44166 18.1274 7.67061 19.638 7.67061C21.1487 7.67061 22.3777 6.44161 22.3777 4.931C22.3777 4.11799 21.7342 3.00847 21.2502 2.24459Z"
              fill="currentColor"
            />
            <path
              d="M13.6806 7.0994L13.1231 6.37329L12.5655 7.0994C12.5083 7.17388 11.1491 8.94805 9.76692 11.1295C7.8616 14.1367 6.89551 16.3717 6.89551 17.7724C6.89551 21.2063 9.68921 24 13.1231 24C16.557 24 19.3506 21.2063 19.3506 17.7724C19.3506 16.3717 18.3845 14.1367 16.4792 11.1295C15.097 8.94805 13.7379 7.17388 13.6806 7.0994Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </Tippy>
  );
};