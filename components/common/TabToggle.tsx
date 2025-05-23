import React from "react";

interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly hasIndicator?: boolean;
}

interface TabToggleProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly fullWidth?: boolean; // New prop to control width
}

export const TabToggle: React.FC<TabToggleProps> = ({
  options,
  activeKey,
  onSelect,
  fullWidth = false, // Default to false for backwards compatibility
}) => {
  return (
    <div
      className={`tw-flex tw-gap-x-1 ${fullWidth ? "tw-w-full" : "tw-w-auto"}`}
    >
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onSelect(option.key)}
          className={`tw-whitespace-nowrap tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-border-b-2 tw-border-t-0 tw-border-x-0 tw-border-solid tw-bg-transparent tw-transition-all tw-duration-200 tw-relative ${
            fullWidth
              ? "tw-flex-1 tw-text-center tw-justify-center tw-flex"
              : ""
          } ${
            activeKey === option.key
              ? "tw-text-primary-300  tw-border-primary-400"
              : "tw-text-iron-400 hover:tw-text-iron-200 tw-border-transparent"
          }`}
        >
          {option.label}
          {option.hasIndicator && (
            <div className="tw-absolute tw-rounded-full -tw-right-1 tw-top-1 tw-bg-red tw-h-2 tw-w-2"></div>
          )}
        </button>
      ))}
    </div>
  );
};
