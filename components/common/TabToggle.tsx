import React from "react";

interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly hasIndicator?: boolean;
  readonly panelId: string;
}

interface TabToggleProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly fullWidth?: boolean; // New prop to control width
  readonly orientation?: "horizontal" | "vertical";
}

export const TabToggle: React.FC<TabToggleProps> = ({
  options,
  activeKey,
  onSelect,
  fullWidth = false, // Default to false for backwards compatibility
  orientation = "horizontal",
}) => {
  const isVertical = orientation === "vertical";
  const containerClasses = isVertical
    ? "tw-flex tw-flex-col tw-gap-y-1.5"
    : `tw-flex tw-gap-1 ${fullWidth ? "tw-w-full" : "tw-w-auto"}`;

  return (
    <div className={containerClasses} role="tablist">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onSelect(option.key)}
          role="tab"
          aria-selected={activeKey === option.key}
          aria-controls={option.panelId}
          className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-transition-all tw-duration-150 tw-relative focus:tw-outline-none ${
            isVertical
              ? `tw-flex tw-items-center tw-justify-start tw-w-full tw-rounded-lg tw-py-2 tw-px-3 tw-border tw-border-transparent`
              : `tw-px-3 tw-py-2 tw-rounded-full tw-border tw-border-transparent ${
                  fullWidth
                    ? "tw-flex-1 tw-text-center tw-justify-center tw-flex"
                    : ""
                }`
          } ${
            activeKey === option.key
              ? "tw-bg-iron-800 tw-text-white tw-border-iron-400"
              : "tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-200 hover:tw-bg-iron-900/30 hover:tw-border-iron-600"
          }`}>
          {option.label}
          {option.hasIndicator && (
            <div className="tw-absolute tw-rounded-full -tw-right-1 tw-top-1 tw-bg-red tw-h-2 tw-w-2"></div>
          )}
        </button>
      ))}
    </div>
  );
};
