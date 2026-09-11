"use client";

import clsx from "clsx";
import { useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { SortDirection } from "@/entities/ISort";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { CommonSelectItemProps } from "../CommonSelect";

export type CommonTabsActiveTone = "neutral" | "primary";

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
  } = props;

  const isActive = item.value === activeItem;
  let dynamicClasses =
    "tw-bg-iron-950 tw-text-iron-500 hover:tw-bg-iron-900 hover:tw-text-iron-100";
  if (isActive) {
    dynamicClasses =
      activeTone === "primary"
        ? "tw-bg-primary-500 tw-text-white"
        : "tw-bg-iron-800 tw-text-iron-100";
  }

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

  return (
    <div
      className={clsx(
        "tw-flex tw-rounded-lg tw-p-[1px]",
        fill ? "tw-flex-1" : undefined
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        ref={buttonRef}
        title={tooltip}
        disabled={disabled}
        onClick={onSelected}
        onKeyDown={onKeyDown}
        onMouseEnter={() => !disabled && setShouldRotate(true)}
        onMouseLeave={() => !disabled && setShouldRotate(false)}
        className={`${dynamicClasses} ${
          disabled ? "tw-cursor-not-allowed tw-opacity-60" : ""
        } ${fill ? "tw-flex-1" : ""} ${
          size === "sm"
            ? "tw-px-3 tw-py-1.5 tw-text-xs"
            : "tw-px-3 tw-py-1.5 tw-text-sm"
        } tw-flex tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-font-medium tw-leading-5 tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`}
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
            />
          </span>
        )}
      </button>
    </div>
  );
}
