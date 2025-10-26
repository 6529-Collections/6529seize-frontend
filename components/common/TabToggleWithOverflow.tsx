"use client";

import React from "react";
import { CompactMenu } from "./CompactMenu";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { TAB_TOGGLE_WITH_OVERFLOW_MESSAGES } from "@/i18n/messages";

interface TabOption {
  readonly key: string;
  readonly label: string;
}

interface TabToggleWithOverflowProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly maxVisibleTabs?: number;
  readonly fullWidth?: boolean;
}

interface OverflowTriggerProps {
  readonly isOpen?: boolean;
  readonly isActiveInOverflow: boolean;
  readonly activeLabel?: string;
  readonly fallbackLabel: string;
}

const OverflowTrigger: React.FC<OverflowTriggerProps> = ({
  isOpen = false,
  isActiveInOverflow,
  activeLabel,
  fallbackLabel,
}) => (
  <>
    {isActiveInOverflow ? activeLabel ?? fallbackLabel : fallbackLabel}
    <span
      className={clsx(
        "tw-ml-0.5 tw-inline-flex tw-transition-transform tw-duration-200",
        isOpen ? "tw-rotate-180" : "",
      )}
    >
      <FontAwesomeIcon
        icon={faChevronDown}
        aria-hidden="true"
        className="tw-h-3 tw-w-3 tw-opacity-70"
      />
    </span>
  </>
);

export const TabToggleWithOverflow: React.FC<TabToggleWithOverflowProps> = ({
  options,
  activeKey,
  onSelect,
  maxVisibleTabs = 3,
  fullWidth = false,
}) => {
  const clampedMax = React.useMemo(
    () => Math.max(0, Math.floor(maxVisibleTabs)),
    [maxVisibleTabs],
  );
  const [visibleTabs, overflowTabs] = React.useMemo(() => {
    const v = options.slice(0, clampedMax);
    const o = options.length > clampedMax ? options.slice(clampedMax) : [];
    return [v, o] as const;
  }, [options, clampedMax]);
  const activeOption = React.useMemo(
    () => options.find((option) => option.key === activeKey),
    [options, activeKey],
  );

  const isActiveInOverflow = overflowTabs.some((tab) => tab.key === activeKey);

  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activeVisibleIndex = visibleTabs.findIndex(
    (tab) => tab.key === activeKey,
  );
  const [focusedTabIndex, setFocusedTabIndex] = React.useState(() =>
    Math.max(activeVisibleIndex, 0),
  );

  const handleSelect = (key: string) => {
    onSelect(key);
  };

  React.useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, visibleTabs.length);
  }, [visibleTabs.length]);

  React.useEffect(() => {
    if (activeVisibleIndex >= 0) {
      setFocusedTabIndex(activeVisibleIndex);
      tabRefs.current[activeVisibleIndex]?.focus();
      return;
    }

    setFocusedTabIndex((currentIndex) => {
      if (visibleTabs.length === 0) {
        return currentIndex;
      }

      const lastIndex = visibleTabs.length - 1;
      return Math.min(currentIndex, lastIndex);
    });
  }, [activeVisibleIndex, visibleTabs.length]);

  const handleVisibleTabKeyDown = React.useCallback(
    (
      event: React.KeyboardEvent<HTMLButtonElement>,
      currentIndex: number,
    ) => {
      if (visibleTabs.length <= 1) {
        return;
      }

      const { key } = event;
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) {
        return;
      }

      event.preventDefault();
      const lastIndex = visibleTabs.length - 1;
      let nextIndex = currentIndex;

      if (key === "ArrowRight") {
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
      } else if (key === "ArrowLeft") {
        nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
      } else if (key === "Home") {
        nextIndex = 0;
      } else if (key === "End") {
        nextIndex = lastIndex;
      }

      setFocusedTabIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    },
    [visibleTabs.length],
  );

  return (
    <div
      className={clsx("tw-flex tw-gap-x-1", fullWidth ? "tw-w-full" : "tw-w-auto")}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={clsx("tw-flex tw-gap-x-1", fullWidth && "tw-flex-1")}
      >
        {visibleTabs.map((option, index) => (
          <button
            role="tab"
            aria-selected={activeKey === option.key}
            key={option.key}
            type="button"
            tabIndex={index === focusedTabIndex ? 0 : -1}
            onClick={() => handleSelect(option.key)}
            onKeyDown={(event) => handleVisibleTabKeyDown(event, index)}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            className={`tw-flex-1 tw-py-3 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-border-b-2 tw-border-t-0 tw-border-x-0 tw-border-solid tw-bg-transparent tw-transition-all tw-duration-200 ${
              fullWidth ? "tw-text-center tw-justify-center tw-flex" : ""
            } ${
              activeKey === option.key
                ? "tw-text-white tw-border-primary-300"
                : "tw-text-iron-400 hover:tw-text-iron-200 tw-border-transparent"
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      {overflowTabs.length > 0 && (
        <CompactMenu
          className="tw-relative"
          unstyledTrigger
          unstyledMenu
          unstyledItems
          triggerClassName={clsx(
            "tw-flex tw-items-center tw-gap-0.5 tw-border-0 tw-bg-transparent tw-text-sm tw-font-medium tw-transition-all tw-duration-200 tw-whitespace-nowrap focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/50 focus-visible:tw-rounded-sm",
            isActiveInOverflow
              ? "tw-text-primary-300 tw-border-b-2 tw-border-primary-400"
              : "tw-text-iron-400 hover:tw-text-iron-200",
          )}
          trigger={
            <OverflowTrigger
              isActiveInOverflow={isActiveInOverflow}
              activeLabel={activeOption?.label}
              fallbackLabel={TAB_TOGGLE_WITH_OVERFLOW_MESSAGES.overflowFallbackLabel}
            />
          }
          items={overflowTabs.map((option) => ({
            id: option.key,
            label: option.label,
            onSelect: () => handleSelect(option.key),
            active: activeKey === option.key,
          }))}
          itemClassName="tw-block tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-transition-colors"
          inactiveItemClassName="tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-iron-200"
          activeItemClassName="tw-text-primary-300"
          focusItemClassName="tw-bg-iron-800 tw-text-iron-100"
          menuWidthClassName="tw-w-36"
          menuClassName="tw-z-50 tw-mt-2 tw-rounded-md tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-primary-400/20 focus:tw-outline-none"
          itemsWrapperClassName="tw-py-1"
          anchor="bottom end"
          activeItemId={isActiveInOverflow ? activeKey : undefined}
          closeOnSelect
          aria-label={TAB_TOGGLE_WITH_OVERFLOW_MESSAGES.overflowMenuAriaLabel}
        />
      )}
    </div>
  );
};
