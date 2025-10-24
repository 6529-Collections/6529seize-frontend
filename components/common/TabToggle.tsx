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
  readonly fullWidth?: boolean;
  readonly orientation?: "horizontal" | "vertical";
}

export const TabToggle: React.FC<TabToggleProps> = ({
  options,
  activeKey,
  onSelect,
  fullWidth = false,
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
          className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-transition-all tw-duration-150 tw-relative focus:tw-outline-none tw-border-none tw-rounded-sm ${
            isVertical
              ? "tw-flex tw-items-center tw-justify-start tw-w-full tw-py-2 tw-pl-3"
              : "tw-flex-1 tw-text-center tw-py-2"
          } ${
            activeKey === option.key
              ? "tw-bg-white tw-text-iron-950"
              : "tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-100"
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
