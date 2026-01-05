import React from "react";

interface HeaderSearchTabOption {
  readonly key: string;
  readonly label: string;
  readonly hasIndicator?: boolean | undefined;
  readonly panelId: string;
}

interface HeaderSearchTabToggleProps {
  readonly options: readonly HeaderSearchTabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly fullWidth?: boolean | undefined;
  readonly orientation?: "horizontal" | "vertical" | undefined;
}

export const HeaderSearchTabToggle: React.FC<HeaderSearchTabToggleProps> = ({
  options,
  activeKey,
  onSelect,
  fullWidth = false,
  orientation = "horizontal",
}) => {
  const isVertical = orientation === "vertical";
  const baseClasses = "tw-flex";
  const directionClasses = isVertical ? "tw-flex-col tw-gap-y-1.5" : "tw-gap-1";
  let widthClasses;
  if (isVertical) {
    widthClasses = "";
  } else if (fullWidth) {
    widthClasses = "tw-w-full";
  } else {
    widthClasses = "tw-w-auto";
  }
  const containerClasses =
    `${baseClasses} ${directionClasses} ${widthClasses}`.trim();

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
              ? "tw-bg-white tw-text-black"
              : "tw-text-white tw-bg-transparent hover:tw-bg-iron-800"
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
