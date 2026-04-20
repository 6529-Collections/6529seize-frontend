import React from "react";

interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly leadingIcon?: React.ReactNode | undefined;
  readonly hasIndicator?: boolean | undefined;
  readonly panelId: string;
  readonly action?: React.ReactNode | undefined;
}

interface TabToggleProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly fullWidth?: boolean | undefined; // New prop to control width
}

export const TabToggle: React.FC<TabToggleProps> = ({
  options,
  activeKey,
  onSelect,
  fullWidth = false, // Default to false for backwards compatibility
}) => {
  const hasActions = options.some(
    (option) => option.action !== undefined && option.action !== null
  );

  if (!hasActions) {
    return (
      <div
        className={`tw-flex tw-gap-x-1 ${fullWidth ? "tw-w-full" : "tw-w-auto"}`}
        role="tablist"
      >
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelect(option.key)}
            role="tab"
            aria-selected={activeKey === option.key}
            aria-controls={option.panelId}
            className={`tw-relative tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-py-3 tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
              fullWidth
                ? "tw-flex tw-flex-1 tw-justify-center tw-text-center"
                : ""
            } ${
              activeKey === option.key
                ? "tw-border-primary-300 tw-text-white"
                : "tw-border-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200"
            }`}
          >
            <span className="tw-inline-flex tw-h-5 tw-items-center tw-gap-1 tw-align-middle tw-leading-5">
              {option.leadingIcon}
              <span className="tw-leading-5">{option.label}</span>
            </span>
            {option.hasIndicator && (
              <div className="tw-absolute -tw-right-1 tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red"></div>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`tw-flex tw-gap-x-1 ${fullWidth ? "tw-w-full" : "tw-w-auto"}`}
      role="tablist"
    >
      {options.map((option) => (
        <div
          key={option.key}
          className={`tw-flex tw-items-center ${fullWidth ? "tw-flex-1" : ""}`}
        >
          <button
            onClick={() => onSelect(option.key)}
            role="tab"
            aria-selected={activeKey === option.key}
            aria-controls={option.panelId}
            className={`tw-relative tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-py-3 tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
              fullWidth
                ? "tw-flex tw-flex-1 tw-justify-center tw-text-center"
                : ""
            } ${
              activeKey === option.key
                ? "tw-border-primary-300 tw-text-white"
                : "tw-border-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200"
            }`}
          >
            <span className="tw-inline-flex tw-h-5 tw-items-center tw-gap-1 tw-align-middle tw-leading-5">
              {option.leadingIcon}
              <span className="tw-leading-5">{option.label}</span>
            </span>
            {option.hasIndicator && (
              <div className="tw-absolute -tw-right-1 tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red"></div>
            )}
          </button>
          {option.action !== undefined && option.action !== null && (
            <div className="tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-border-transparent">
              {option.action}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
