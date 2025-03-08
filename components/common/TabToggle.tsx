import React from "react";

interface TabOption {
  readonly key: string;
  readonly label: string;
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
    <div className={`tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-primary-400/50 tw-rounded-lg tw-gap-x-0.5 ${
      fullWidth ? "tw-flex tw-w-full" : "tw-inline-flex tw-w-auto"
    }`}>
      {options.map((option) => (
        <div
          key={option.key}
          className={`${
            activeKey === option.key
              ? "tw-p-[1px] tw-flex tw-rounded-md tw-bg-primary-500/20"
              : "tw-p-[1px] tw-flex tw-rounded-md"
          } ${
            fullWidth ? "tw-flex-1" : ""
          }`}
        >
          <button
            onClick={() => onSelect(option.key)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-md tw-transition-all tw-duration-300 tw-ease-out ${
              fullWidth ? "tw-text-center tw-justify-center tw-flex" : ""
            } ${
              activeKey === option.key
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            {option.label}
          </button>
        </div>
      ))}
    </div>
  );
}; 
