"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { SortDirection } from "@/entities/ISort";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { CommonSelectItemProps } from "../CommonSelect";

export default function CommonTabsTab<T, U = unknown>(
  props: Readonly<
    CommonSelectItemProps<T, U> & {
      readonly onKeyDown?: (
        event: ReactKeyboardEvent<HTMLButtonElement>
      ) => void | undefined;
      readonly buttonRef?:
        | ((element: HTMLButtonElement | null) => void)
        | undefined
        | undefined;
      readonly disabled?: boolean | undefined;
      readonly fill?: boolean | undefined;
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
  } = props;

  const getIsActive = (): boolean => item.value === activeItem;
  const [isActive, setIsActive] = useState<boolean>(getIsActive());

  useEffect(() => {
    setIsActive(getIsActive());
  }, [activeItem]);

  const getDynamicClasses = (): string => {
    let response = "";
    if (isActive) {
      response += "tw-bg-iron-800 tw-text-iron-100";
    } else {
      response +=
        " tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100";
    }
    return response;
  };

  const [dynamicClasses, setDynamicClasses] = useState<string>(
    getDynamicClasses()
  );
  useEffect(() => {
    setDynamicClasses(getDynamicClasses());
  }, [isActive]);

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
        "tw-p-[1px] tw-flex tw-rounded-lg",
        fill ? "tw-flex-1" : undefined,
        isActive
          ? "tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800"
          : undefined
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
        } ${
          fill ? "tw-flex-1" : ""
        } tw-whitespace-nowrap tw-px-3 tw-py-1.5 tw-text-sm tw-leading-5 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center tw-gap-2`}
      >
        {item.label}
        {!!item.badge && item.badge > 0 && (
          <span className="tw-bg-primary-500 tw-text-white tw-text-[10px] tw-font-bold tw-px-1.5 tw-py-0.5 tw-rounded-full tw-min-w-[18px] tw-h-[18px] tw-flex tw-items-center tw-justify-center">
            {item.badge}
          </span>
        )}
        {sortDirection && (
          <span className="-tw-mt-1">
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
