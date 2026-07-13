import React from "react";

interface HeaderSearchTabOption {
  readonly key: string;
  readonly label: string;
  readonly hasIndicator?: boolean | undefined;
  readonly panelId: string;
  readonly count?: number | undefined;
  readonly isLoading?: boolean | undefined;
  readonly hasError?: boolean | undefined;
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
  const baseClasses = "tw-flex tw-min-w-0";
  const directionClasses = isVertical
    ? "tw-flex-col tw-gap-y-1"
    : "tw-gap-1 tw-overflow-x-auto tw-scrollbar-none";
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

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const previousKey = isVertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
    let nextIndex: number | null = null;

    if (event.key === previousKey) {
      nextIndex = index === 0 ? options.length - 1 : index - 1;
    } else if (event.key === nextKey) {
      nextIndex = index === options.length - 1 ? 0 : index + 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const tabList = event.currentTarget.parentElement;
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onSelect(nextOption.key);
    globalThis.requestAnimationFrame(() => {
      const tabButtons = tabList?.querySelectorAll<HTMLElement>('[role="tab"]');
      Array.from(tabButtons ?? [])
        .find((button) => button.dataset["tabKey"] === nextOption.key)
        ?.focus();
    });
  };

  return (
    <div
      className={containerClasses}
      role="tablist"
      aria-orientation={orientation}
    >
      {options.map((option, index) => {
        let metadata: React.ReactNode = null;
        if (option.isLoading) {
          metadata = (
            <span
              className="tw-size-3 tw-animate-spin tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-border-t-primary-300"
              aria-hidden="true"
            />
          );
        } else if (option.hasError) {
          metadata = (
            <span
              className="tw-size-1.5 tw-rounded-full tw-bg-error"
              aria-hidden="true"
            />
          );
        } else if (typeof option.count === "number") {
          metadata = (
            <span
              className={`tw-min-w-5 tw-rounded-full tw-px-1.5 tw-py-0.5 tw-text-center tw-text-[10px] tw-leading-4 ${
                activeKey === option.key
                  ? "tw-text-primary-100 tw-bg-primary-400/20"
                  : "tw-bg-iron-800 tw-text-iron-400"
              }`}
            >
              {option.count}
            </span>
          );
        }

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            role="tab"
            aria-selected={activeKey === option.key}
            aria-controls={option.panelId}
            data-tab-key={option.key}
            tabIndex={activeKey === option.key ? 0 : -1}
            className={`tw-relative tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-text-sm tw-font-medium tw-transition-all tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 ${
              isVertical
                ? "tw-w-full tw-justify-between tw-px-3 tw-py-2"
                : "tw-flex-none tw-justify-center tw-px-3 tw-py-2"
            } ${
              activeKey === option.key
                ? "tw-text-primary-200 tw-border-primary-400/40 tw-bg-primary-500/15"
                : "tw-border-transparent tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-700 hover:tw-bg-iron-900 hover:tw-text-white"
            }`}
          >
            <span>{option.label}</span>
            {metadata}
            {option.hasIndicator && (
              <span className="tw-absolute -tw-right-1 tw-top-1 tw-size-2 tw-rounded-full tw-bg-red" />
            )}
          </button>
        );
      })}
    </div>
  );
};
