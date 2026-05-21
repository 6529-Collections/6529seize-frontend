"use client";

import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { SortDirection } from "@/entities/ISort";
import { useAnimate } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CommonSelectProps } from "../CommonSelect";
import CommonDropdownItem from "./CommonDropdownItem";
import CommonDropdownItemsWrapper from "./CommonDropdownItemsWrapper";

function getEditorialButtonStateClass(disabled: boolean) {
  if (disabled) {
    return "tw-cursor-not-allowed tw-text-iron-500 tw-opacity-50";
  }

  return "tw-text-iron-300 hover:tw-text-iron-100";
}

function getEditorialUnderlineClass(isOpen: boolean, disabled: boolean) {
  if (isOpen && !disabled) {
    return "after:tw-scale-x-100 after:tw-bg-primary-400";
  }

  return "after:tw-scale-x-0 after:tw-bg-iron-700 hover:after:tw-scale-x-100";
}

function getDefaultButtonStateClass(disabled: boolean) {
  if (disabled) {
    return "tw-text-iron-400 tw-opacity-50";
  }

  return "tw-text-iron-300 hover:tw-ring-iron-700";
}

function getDefaultThemeClass(theme: string) {
  if (theme === "dark") {
    return "tw-bg-iron-800 lg:tw-bg-iron-900";
  }

  return "tw-bg-iron-800";
}

function getDefaultSizeClass(size: string) {
  if (size === "md") {
    return "tw-py-3 tw-text-sm";
  }

  if (size === "tabs") {
    return "tw-py-[11px] tw-text-sm";
  }

  return "tw-py-2.5 tw-text-xs";
}

export default function CommonDropdown<T, U = unknown>(
  props: CommonSelectProps<T, U>
) {
  const {
    items,
    activeItem,
    noneLabel,
    filterLabel,
    setSelected,
    dynamicPosition = true,
    disabled = false,
    theme = "dark",
    size = "md",
    variant = "default",
    renderItemChildren,
    closeOnSelect = true,
    showFilterLabel = false,
    menuMinWidth,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const isEditorial = variant === "editorial";

  useEffect(() => {
    if (!iconScope.current) return;
    if (isEditorial) {
      animateIcon(iconScope.current, { rotate: isOpen ? 180 : 0 });
    } else if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [animateIcon, iconScope, isEditorial, isOpen]);

  const activeItemMatch = useMemo(
    () => items.find((item) => item.value === activeItem),
    [activeItem, items]
  );

  const computedLabel = useMemo(() => {
    return (
      activeItemMatch?.mobileLabel ??
      activeItemMatch?.label ??
      noneLabel ??
      "None Selected"
    );
  }, [activeItemMatch, noneLabel]);

  const getSortDirection = (): SortDirection | undefined =>
    "sortDirection" in props ? props.sortDirection : undefined;

  const sortDirection = getSortDirection();

  const onSelect = (item: T) => {
    setSelected(item);
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const rootClassName = isEditorial
    ? "tailwind-scope tw-inline-flex tw-h-full tw-max-w-full"
    : "tailwind-scope tw-h-full tw-w-full";
  const triggerWrapperClassName = isEditorial
    ? "tw-relative tw-inline-flex tw-max-w-full"
    : "tw-relative tw-w-full";
  const editorialUnderlineClass = getEditorialUnderlineClass(isOpen, disabled);
  const buttonClasses = isEditorial
    ? `${getEditorialButtonStateClass(disabled)} ${editorialUnderlineClass} tw-group tw-relative tw-inline-flex tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-left tw-text-sm tw-font-semibold tw-leading-5 tw-caret-primary-400 tw-shadow-none tw-transition tw-duration-200 tw-ease-out after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus:tw-outline-none focus-visible:tw-outline-none focus-visible:tw-text-iron-100`
    : `${getDefaultButtonStateClass(disabled)} ${getDefaultThemeClass(theme)} ${getDefaultSizeClass(size)} tw-relative tw-block tw-w-full tw-justify-between tw-truncate tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-pl-3.5 tw-pr-8 tw-text-left tw-font-semibold tw-leading-5 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400`;
  const labelClassName = isEditorial
    ? "tw-shrink-0 tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-500"
    : "tw-font-semibold tw-text-iron-500";
  const valueClassName = isEditorial
    ? "tw-truncate tw-text-iron-200 group-hover:tw-text-white"
    : "";
  const chevronClassName = isEditorial
    ? "tw-pointer-events-none tw-inline-flex tw-shrink-0 tw-items-center tw-text-iron-500 group-hover:tw-text-iron-300"
    : "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 -tw-mr-1 tw-flex tw-items-center tw-pr-3.5";

  return (
    <div className={rootClassName}>
      <div className={triggerWrapperClassName}>
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-label={`${filterLabel}: ${computedLabel}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={buttonClasses}
        >
          <span
            className={
              isEditorial ? "tw-flex tw-min-w-0 tw-items-center tw-gap-1.5" : ""
            }
          >
            {showFilterLabel && (
              <span className={labelClassName}>
                {filterLabel}:{isEditorial ? "" : " "}
              </span>
            )}
            <span className={valueClassName}>{computedLabel}</span>
          </span>
          {sortDirection && (
            <span className="-tw-mt-0.5 tw-ml-2">
              <CommonTableSortIcon direction={sortDirection} isActive={true} />
            </span>
          )}
          <span className={chevronClassName}>
            <svg
              ref={iconScope}
              className="tw-h-4 tw-w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        filterLabel={filterLabel}
        dynamicPosition={dynamicPosition}
        horizontalAlign={isEditorial ? "right" : "auto"}
        minWidth={menuMinWidth}
        onIsMobile={setIsMobile}
      >
        {items.map((item, i) => (
          <CommonDropdownItem
            key={item.key}
            item={item}
            itemIdx={i}
            totalItems={items.length}
            activeItem={activeItem}
            sortDirection={sortDirection}
            isMobile={isMobile}
            setSelected={onSelect}
          >
            {renderItemChildren?.(item)}
          </CommonDropdownItem>
        ))}
      </CommonDropdownItemsWrapper>
    </div>
  );
}
