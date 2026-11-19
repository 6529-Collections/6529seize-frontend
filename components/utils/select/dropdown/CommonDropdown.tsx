"use client";

import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { SortDirection } from "@/entities/ISort";
import { useMemo, useRef, useState } from "react";
import type { CommonSelectProps } from "../CommonSelect";
import { useDropdownToolbarMetrics } from "./DropdownToolbar";
import CommonDropdownItem from "./CommonDropdownItem";
import CommonDropdownItemsWrapper from "./CommonDropdownItemsWrapper";
import {
  DROPDOWN_CHEVRON_CLASSES,
  getDropdownTriggerClasses,
  getDropdownMenuMetrics,
  getEditorialDropdownClasses,
  type DropdownMetrics,
  type DropdownVariant,
} from "./dropdownTriggerStyles";

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
  props: Omit<CommonSelectProps<T, U>, "variant"> & {
    readonly variant?: DropdownVariant | undefined;
    readonly presentation?: "editorial" | "toolbar" | "filter" | undefined;
    readonly metrics?: DropdownMetrics | undefined;
    readonly sortDirection?: SortDirection | undefined;
  }
) {
  const {
    items,
    activeItem,
    noneLabel,
    filterLabel,
    setSelected,
    dynamicPosition = true,
    disabled = false,
    size,
    variant = "regular",
    presentation,
    metrics,
    renderItemChildren,
    closeOnSelect = true,
    showFilterLabel = false,
    menuMinWidth,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const toolbarMetrics = useDropdownToolbarMetrics();
  const isEditorial = presentation === "editorial";
  const isToolbar = presentation === "toolbar";
  const isFilter = presentation === "filter";
  const usesInlineContent = isEditorial || isToolbar || isFilter;

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
  const triggerMetrics = metrics ?? getDropdownMenuMetrics(variant, size);
  let buttonClasses = `${getDropdownTriggerClasses({ variant, metrics: { ...triggerMetrics, ...toolbarMetrics } })} tw-group tw-relative tw-block tw-w-full tw-justify-between tw-truncate tw-whitespace-nowrap tw-text-left`;
  if (isEditorial) {
    buttonClasses = getEditorialDropdownClasses(isOpen, disabled);
  }
  if (isFilter) {
    buttonClasses = `${getDropdownTriggerClasses({ variant, metrics: { height: size === "sm" ? 32 : 36, left: 10, right: 36, text: "xs", ...metrics, ...toolbarMetrics } })} tw-relative tw-inline-flex tw-w-auto tw-flex-shrink-0 tw-items-center tw-whitespace-nowrap tw-text-left`;
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
              className={`${DROPDOWN_CHEVRON_CLASSES} tw-transition-transform tw-duration-150 motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-180" : "tw-rotate-0"}`}
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
