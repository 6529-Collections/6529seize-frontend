"use client";

import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { SortDirection } from "@/entities/ISort";
import { useAnimate } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CommonSelectProps } from "../CommonSelect";
import CommonDropdownItem from "./CommonDropdownItem";
import CommonDropdownItemsWrapper from "./CommonDropdownItemsWrapper";
import {
  DROPDOWN_CHEVRON_CLASSES,
  DROPDOWN_TRIGGER_CLASSES,
} from "./dropdownTriggerStyles";

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

function getDefaultSizeClass(size: string) {
  if (size === "md") {
    return "tw-py-3 tw-text-sm";
  }

  if (size === "tabs") {
    return "tw-py-[11px] tw-text-sm";
  }

  return "tw-py-2.5 tw-text-xs";
}

function getContentClasses(
  isEditorial: boolean,
  isToolbar: boolean,
  usesInlineContent: boolean
) {
  let labelClassName = usesInlineContent
    ? "tw-font-medium tw-text-iron-500"
    : "tw-mr-1.5 tw-font-medium tw-text-iron-500";
  if (isEditorial) {
    labelClassName =
      "tw-shrink-0 tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-500";
  } else if (isToolbar) {
    labelClassName = "tw-shrink-0 tw-font-medium tw-text-iron-500";
  }
  let valueClassName = "tw-min-w-0 tw-truncate";
  if (isEditorial) {
    valueClassName = "tw-truncate tw-text-iron-200 group-hover:tw-text-white";
  } else if (isToolbar) {
    valueClassName = "tw-min-w-0 tw-truncate tw-font-medium tw-text-inherit";
  }
  return { labelClassName, valueClassName };
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
    size = "md",
    variant = "default",
    renderItemChildren,
    closeOnSelect = true,
    showFilterLabel = false,
    menuMinWidth,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate<SVGSVGElement>();
  const isEditorial = variant === "editorial";
  const isToolbar = variant === "toolbar";
  const isFilter = variant === "filter";
  const usesInlineContent = isEditorial || isToolbar || isFilter;

  useEffect(() => {
    if (isFilter) return;
    animateIcon(iconScope.current, { rotate: isOpen ? 180 : 0 });
  }, [animateIcon, iconScope, isEditorial, isFilter, isOpen]);

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
  const rootClassName =
    isEditorial || isFilter
      ? "tailwind-scope tw-inline-flex tw-h-full tw-max-w-full"
      : "tailwind-scope tw-h-full tw-w-full";
  const triggerWrapperClassName =
    isEditorial || isFilter
      ? "tw-relative tw-inline-flex tw-max-w-full"
      : "tw-relative tw-w-full";
  const editorialUnderlineClass = getEditorialUnderlineClass(isOpen, disabled);
  let buttonClasses = `${DROPDOWN_TRIGGER_CLASSES} ${getDefaultSizeClass(size)} tw-group tw-relative tw-block tw-w-full tw-justify-between tw-truncate tw-whitespace-nowrap tw-pl-3 tw-pr-9 tw-text-left tw-leading-5`;
  if (isEditorial) {
    buttonClasses = `${getEditorialButtonStateClass(disabled)} ${editorialUnderlineClass} tw-group tw-relative tw-inline-flex tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-left tw-text-sm tw-font-semibold tw-leading-5 tw-caret-primary-400 tw-shadow-none tw-transition tw-duration-200 tw-ease-out after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus:tw-outline-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-text-iron-100`;
  }
  if (isFilter) {
    buttonClasses = `${DROPDOWN_TRIGGER_CLASSES} ${size === "sm" ? "tw-h-8" : "tw-h-9"} tw-relative tw-inline-flex tw-w-auto tw-flex-shrink-0 tw-items-center tw-whitespace-nowrap tw-pl-2.5 tw-pr-9 tw-text-left tw-text-xs`;
  }
  const { labelClassName, valueClassName } = getContentClasses(
    isEditorial,
    isToolbar,
    usesInlineContent
  );
  const chevronClassName = isEditorial
    ? "tw-pointer-events-none tw-inline-flex tw-shrink-0 tw-items-center tw-text-iron-500 group-hover:tw-text-iron-300"
    : "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center";

  return (
    <div className={rootClassName}>
      <div className={triggerWrapperClassName}>
        <button
          ref={buttonRef}
          {...props.buttonDataAttributes}
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
              usesInlineContent
                ? "tw-flex tw-min-w-0 tw-items-center tw-gap-1.5"
                : "tw-inline-flex tw-max-w-full tw-items-center"
            }
          >
            {showFilterLabel && (
              <span className={labelClassName}>
                {filterLabel}:{usesInlineContent ? "" : " "}
              </span>
            )}
            <span className={valueClassName}>{computedLabel}</span>
            {sortDirection !== undefined && (
              <span className="tw-ml-2 tw-flex tw-shrink-0 tw-items-center">
                <CommonTableSortIcon
                  direction={sortDirection}
                  isActive={true}
                  activeClassName={isFilter ? "tw-text-current" : undefined}
                />
              </span>
            )}
          </span>
          <span className={chevronClassName}>
            <svg
              ref={isFilter ? undefined : iconScope}
              className={`${DROPDOWN_CHEVRON_CLASSES} tw-transition-transform tw-duration-150 motion-reduce:tw-transition-none ${isFilter && isOpen ? "tw-rotate-180" : ""}`}
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
            onItemSelection={props.onItemSelection}
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
