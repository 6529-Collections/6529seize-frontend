"use client";

import clsx from "clsx";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { SortDirection } from "@/entities/ISort";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { CommonSelectItemProps, CommonSelectProps } from "../CommonSelect";

export type CommonTabsActiveTone = "neutral" | "primary";

function getTabButtonClasses({
  isActive,
  activeTone,
  variant,
  disabled,
  fill,
  size,
}: {
  readonly isActive: boolean;
  readonly activeTone: CommonTabsActiveTone;
  readonly variant: CommonSelectProps<unknown, unknown>["variant"];
  readonly disabled: boolean;
  readonly fill: boolean;
  readonly size: "sm" | "md" | "tabs";
}) {
  if (variant === "filter") {
    return getButtonClasses({
      variant: isActive ? "filterSelected" : "filter",
      size: "xs",
      className:
        "focus-visible:tw-outline-offset-[-2px] motion-reduce:tw-transition-none",
    });
  }
  if (variant === "sub-view") {
    return clsx(
      "tw-flex tw-h-8 tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-px-3 tw-text-xs tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none",
      isActive
        ? "tw-bg-white/[0.08] tw-font-semibold tw-text-iron-50"
        : "tw-bg-transparent tw-font-medium tw-text-iron-500 active:tw-bg-white/[0.06] desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-200"
    );
  }
  let dynamicClasses =
    "tw-bg-iron-950 tw-text-iron-500 hover:tw-bg-iron-900 hover:tw-text-iron-100";
  if (isActive) {
    dynamicClasses =
      activeTone === "primary"
        ? "tw-bg-primary-500 tw-text-white"
        : "tw-bg-iron-800 tw-text-iron-100";
  }
  return `${dynamicClasses} ${
    disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""
  } ${fill ? "tw-flex-1" : ""} ${
    size === "sm"
      ? "tw-px-3 tw-py-1.5 tw-text-xs"
      : "tw-px-3 tw-py-1.5 tw-text-sm"
  } tw-flex tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-font-medium tw-leading-5 tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`;
}

export default function CommonTabsTab<T, U = unknown>(
  props: Readonly<
    CommonSelectItemProps<T, U> & {
      readonly onKeyDown?: (
        event: ReactKeyboardEvent<HTMLButtonElement>
      ) => void | undefined;
      readonly buttonRef?:
        | ((element: HTMLButtonElement | null) => void)
        | undefined;
      readonly disabled?: boolean | undefined;
      readonly fill?: boolean | undefined;
      readonly size?: "sm" | "md" | "tabs" | undefined;
      readonly activeTone?: CommonTabsActiveTone | undefined;
      readonly variant?: CommonSelectProps<T, U>["variant"];
    }
  >
) {
  const {
    item,
    activeItem,
    setSelected,
    sortDirection,
    onKeyDown,
    buttonRef,
    disabled = false,
    fill = true,
    size = "md",
    activeTone = "neutral",
    variant = "default",
  } = props;

  const isActive = item.value === activeItem;

  const [shouldRotate, setShouldRotate] = useState<boolean>(false);

  const onSelected = () => {
    if (disabled) {
      return;
    }
    setSelected(item.value);
    setShouldRotate(false);
  };

  const tooltip =
    "tooltip" in item && typeof item.tooltip === "string"
      ? item.tooltip
      : undefined;

  const buttonClasses = getTabButtonClasses({
    isActive,
    activeTone,
    variant,
    disabled,
    fill,
    size,
  });

  return (
    <div
      className={clsx(
        "tw-flex",
        variant === "filter" || variant === "sub-view"
          ? "tw-flex-none"
          : clsx("tw-rounded-lg tw-p-[1px]", fill && "tw-flex-1")
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={item.panelId}
        tabIndex={isActive ? 0 : -1}
        ref={buttonRef}
        title={tooltip}
        disabled={disabled}
        onClick={onSelected}
        onKeyDown={onKeyDown}
        onMouseEnter={() => !disabled && setShouldRotate(true)}
        onMouseLeave={() => !disabled && setShouldRotate(false)}
        className={buttonClasses}
      >
        {item.icon}
        {item.label}
        {item.badge !== undefined && item.badge > 0 && (
          <span className="tw-flex tw-h-[18px] tw-min-w-[18px] tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-bold tw-text-white">
            {item.badge}
          </span>
        )}
        {sortDirection !== undefined && (
          <span className="tw-flex tw-items-center">
            <CommonTableSortIcon
              direction={isActive ? sortDirection : SortDirection.DESC}
              isActive={isActive}
              shouldRotate={isActive && shouldRotate}
              activeClassName={
                variant === "filter" ? "tw-text-current" : undefined
              }
            />
          </span>
        )}
      </button>
    </div>
  );
}
