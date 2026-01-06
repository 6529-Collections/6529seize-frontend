"use client";

import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import type { SortDirection } from "@/entities/ISort";
import { useAnimate } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CommonSelectProps } from "../CommonSelect";
import CommonDropdownItem from "./CommonDropdownItem";
import CommonDropdownItemsWrapper from "./CommonDropdownItemsWrapper";

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
    renderItemChildren,
    closeOnSelect = true,
    showFilterLabel = false,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();

  useEffect(() => {
    if (!iconScope.current) return;
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [animateIcon, iconScope, isOpen]);

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

  return (
    <div className="tailwind-scope tw-w-full tw-h-full">
      <div className="tw-relative tw-w-full">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-label={`${filterLabel}: ${computedLabel}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${
            disabled
              ? "tw-opacity-50 tw-text-iron-400"
              : "hover:tw-ring-iron-600 tw-text-iron-300"
          } ${
            theme === "dark"
              ? "tw-bg-iron-800 lg:tw-bg-iron-900"
              : "tw-bg-iron-800"
          } ${
            size === "md"
              ? "tw-py-3"
              : size === "tabs"
              ? "tw-py-[11px]"
              : "tw-py-2.5"
          } tw-w-full tw-truncate tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-pl-3.5 tw-pr-10 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 
          focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between`}
        >
          {showFilterLabel && (
            <span className="tw-font-semibold">{filterLabel}: </span>
          )}
          {computedLabel}
          {sortDirection && (
            <span className="-tw-mt-0.5 tw-ml-2">
              <CommonTableSortIcon direction={sortDirection} isActive={true} />
            </span>
          )}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
            <svg
              ref={iconScope}
              className="tw-h-5 tw-w-5"
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
          </div>
        </button>
      </div>
      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        filterLabel={filterLabel}
        dynamicPosition={dynamicPosition}
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
