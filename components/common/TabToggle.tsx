import React from "react";

interface TabOption {
  readonly key: string;
  readonly label: string;
}

interface TabToggleProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
}

export const TabToggle: React.FC<TabToggleProps> = ({
  options,
  activeKey,
  onSelect,
}) => {
  return (
    <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-primary-400/50 tw-inline-flex tw-rounded-lg tw-w-auto tw-gap-x-0.5">
      {options.map((option) => (
        <div
          key={option.key}
          className={
            activeKey === option.key
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-primary-500/20"
              : "tw-p-[1px] tw-flex tw-rounded-lg"
          }
        >
          <button
            onClick={() => onSelect(option.key)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
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
