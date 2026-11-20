"use client";

import React from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { TAB_TOGGLE_WITH_OVERFLOW_MESSAGES } from "@/i18n/messages";
import { CompactMenu } from "@/components/compact-menu";
import TabButton from "./TabButton";
import PillTab from "./PillTab";
import { getPillTabClasses } from "./pillTabStyles";
import { getUnderlineTabClasses } from "./underlineTabStyles";

interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly panelId?: string | undefined;
}

export type TabToggleWithOverflowVariant = "underline" | "compactPills";

interface TabToggleWithOverflowProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly maxVisibleTabs?: number | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly variant?: TabToggleWithOverflowVariant | undefined;
  readonly transition?: boolean | undefined;
}

interface OverflowTriggerProps {
  readonly isOpen?: boolean | undefined;
  readonly isActiveInOverflow: boolean;
  readonly activeLabel?: string | undefined;
  readonly fallbackLabel: string;
}

const getTabStateClassName = ({
  isActive,
  isCompactPills,
}: {
  readonly isActive: boolean;
  readonly isCompactPills: boolean;
}): string => {
  if (isCompactPills) {
    return getPillTabClasses({ active: isActive });
  }

  return getUnderlineTabClasses({ active: isActive, size: "sm" });
};

const OverflowTrigger: React.FC<OverflowTriggerProps> = ({
  isOpen = false,
  isActiveInOverflow,
  activeLabel,
  fallbackLabel,
}) => (
  <>
    {isActiveInOverflow ? (activeLabel ?? fallbackLabel) : fallbackLabel}
    <span
      className={clsx(
        "tw-ml-0.5 tw-inline-flex tw-transition-transform tw-duration-200",
        isOpen ? "tw-rotate-180" : ""
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
  variant = "underline",
  transition = false,
}) => {
  const Button = transition ? TabButton : "button";
  const isCompactPills = variant === "compactPills";
  const clampedMax = React.useMemo(
    () => Math.max(0, Math.floor(maxVisibleTabs)),
    [maxVisibleTabs]
  );
  const [visibleTabs, overflowTabs] = React.useMemo(() => {
    if (options.length <= clampedMax + 1) {
      return [options, []] as const;
    }

    const v = options.slice(0, clampedMax);
    const o = options.length > clampedMax ? options.slice(clampedMax) : [];
    return [v, o] as const;
  }, [options, clampedMax]);
  const activeOption = React.useMemo(
    () => options.find((option) => option.key === activeKey),
    [options, activeKey]
  );

  const isActiveInOverflow = overflowTabs.some((tab) => tab.key === activeKey);

  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activeVisibleIndex = visibleTabs.findIndex(
    (tab) => tab.key === activeKey
  );
  const [focusedTabIndex, setFocusedTabIndex] = React.useState(() =>
    Math.max(activeVisibleIndex, 0)
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
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
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
    [visibleTabs.length]
  );

  return (
    <div
      className={clsx(
        "tailwind-scope tw-flex",
        isCompactPills ? "tw-gap-x-2.5" : "tw-gap-x-0.5",
        fullWidth ? "tw-w-full" : "tw-w-auto"
      )}
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={clsx(
          "tw-flex",
          isCompactPills ? "tw-gap-x-2.5" : "tw-gap-x-0.5",
          fullWidth && "tw-flex-1"
        )}
      >
        {visibleTabs.map((option, index) => {
          const active = activeKey === option.key;
          const buttonProps: React.ComponentProps<"button"> = {
            role: "tab",
            "aria-selected": active,
            "aria-controls": option.panelId,
            type: "button",
            tabIndex: index === focusedTabIndex ? 0 : -1,
            onClick: () => handleSelect(option.key),
            onKeyDown: (event) => handleVisibleTabKeyDown(event, index),
            ref: (element) => {
              tabRefs.current[index] = element;
            },
          };

          if (isCompactPills) {
            return (
              <PillTab
                {...buttonProps}
                key={option.key}
                active={active}
                transition={transition}
                className={
                  fullWidth
                    ? "tw-flex tw-justify-center tw-text-center"
                    : undefined
                }
              >
                {option.label}
              </PillTab>
            );
          }

          return (
            <Button
              {...buttonProps}
              key={option.key}
              className={clsx(
                "-tw-mb-px tw-flex-1 tw-whitespace-nowrap tw-border-solid tw-py-3",
                fullWidth && "tw-flex tw-justify-center tw-text-center",
                getUnderlineTabClasses({ active, size: "sm" })
              )}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      {overflowTabs.length > 0 && (
        <CompactMenu
          className="tw-relative tw-flex-none"
          unstyledTrigger
          unstyledMenu
          unstyledItems
          triggerClassName={clsx(
            "tw-whitespace-nowrap tw-border-solid",
            !isCompactPills && "-tw-mb-px tw-flex-1 tw-py-3",
            getTabStateClassName({
              isActive: isActiveInOverflow,
              isCompactPills,
            })
          )}
          trigger={({ isOpen }) => (
            <OverflowTrigger
              isOpen={isOpen}
              isActiveInOverflow={isActiveInOverflow}
              activeLabel={activeOption?.label}
              fallbackLabel={
                TAB_TOGGLE_WITH_OVERFLOW_MESSAGES.overflowFallbackLabel
              }
            />
          )}
          items={overflowTabs.map((option) => ({
            id: option.key,
            label: option.label,
            onSelect: () => {
              if (transition) {
                React.startTransition(() => handleSelect(option.key));
              } else {
                handleSelect(option.key);
              }
            },
            active: activeKey === option.key,
          }))}
          itemClassName="tw-block tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-transition-colors"
          inactiveItemClassName="tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-iron-200"
          activeItemClassName={
            isCompactPills ? "tw-text-iron-50" : "tw-text-iron-100"
          }
          focusItemClassName="tw-bg-iron-800 tw-text-iron-100"
          menuWidthClassName="tw-w-36"
          menuClassName={clsx(
            "tailwind-scope tw-z-[120] tw-mt-2 tw-rounded-md tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 focus:tw-outline-none",
            isCompactPills ? "tw-ring-white/10" : "tw-ring-primary-400/20"
          )}
          anchor="bottom end"
          activeItemId={isActiveInOverflow ? activeKey : undefined}
          closeOnSelect
          aria-label={TAB_TOGGLE_WITH_OVERFLOW_MESSAGES.overflowMenuAriaLabel}
        />
      )}
    </div>
  );
};
