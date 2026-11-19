"use client";

import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useMemo, useRef, useState } from "react";
import FilterGridDropdownItemsWrapper from "./FilterGridDropdownItemsWrapper";
import {
  DROPDOWN_CHEVRON_CLASSES,
  DROPDOWN_CHECKMARK_CLASSES,
  DROPDOWN_OPTION_ACTIVE_CLASSES,
  DROPDOWN_SELECTED_OPTION_CLASSES,
  getDropdownTriggerClasses,
} from "./dropdownTriggerStyles";

import { useDropdownToolbarMetrics } from "./DropdownToolbar";

interface FilterGridDropdownItem<TValue extends string | number> {
  readonly value: TValue;
  readonly label: string;
}

export default function FilterGridDropdown<TValue extends string | number>({
  disabled = false,
  filterLabel,
  items,
  onSelect,
  selectedValue,
  allItemLabel,
  triggerLabel,
  triggerAriaLabel,
}: {
  readonly disabled?: boolean | undefined;
  readonly filterLabel: string;
  readonly items: readonly FilterGridDropdownItem<TValue>[];
  readonly onSelect: (value: TValue | null) => void;
  readonly selectedValue: TValue | null;
  readonly allItemLabel: string;
  readonly triggerLabel?: string | undefined;
  readonly triggerAriaLabel: string;
}) {
  const toolbarMetrics = useDropdownToolbarMetrics();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeItem = useMemo(
    () => items.find((item) => item.value === selectedValue) ?? null,
    [items, selectedValue]
  );

  const activeLabel = triggerLabel ?? activeItem?.label ?? allItemLabel;

  const handleSelect = (value: TValue | null) => {
    onSelect(value);
    setIsOpen(false);
  };

  const getMenuItemClassName = (isActive: boolean) =>
    `tw-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-justify-center tw-gap-x-1 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-2 tw-py-2 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 motion-reduce:tw-transition-none lg:tw-min-h-9 lg:tw-gap-x-0 ${DROPDOWN_OPTION_ACTIVE_CLASSES} ${
      isActive
        ? DROPDOWN_SELECTED_OPTION_CLASSES
        : "tw-bg-transparent tw-text-iron-200"
    }`;

  return (
    <div className="tailwind-scope tw-h-full tw-w-full">
      <div className="tw-relative tw-w-full">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-label={triggerAriaLabel}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${getDropdownTriggerClasses({ variant: "regular", metrics: { y: 12, left: 12, right: 36, text: "xs", ...toolbarMetrics } })} tw-relative tw-block tw-w-full tw-truncate tw-whitespace-nowrap tw-text-left`}
        >
          {activeLabel}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center">
            <ChevronDownIcon
              className={`${DROPDOWN_CHEVRON_CLASSES} tw-transition-transform tw-duration-150 motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-180" : ""}`}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>
      <FilterGridDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        filterLabel={filterLabel}
        itemCount={items.length}
      >
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`tw-col-span-full tw-w-full ${getMenuItemClassName(
            selectedValue === null
          )}`}
          aria-current={selectedValue === null ? "true" : undefined}
          role="menuitem"
        >
          <span className="tw-shrink-0 tw-whitespace-nowrap">
            {allItemLabel}
          </span>
          <CheckIcon
            aria-hidden="true"
            className={`tw-size-3 tw-shrink-0 ${DROPDOWN_CHECKMARK_CLASSES} ${selectedValue === null ? "" : "tw-invisible"}`}
          />
        </button>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleSelect(item.value)}
            className={getMenuItemClassName(selectedValue === item.value)}
            aria-current={selectedValue === item.value ? "true" : undefined}
            role="menuitem"
          >
            <span className="tw-shrink-0 tw-whitespace-nowrap">
              {item.label}
            </span>
            <CheckIcon
              aria-hidden="true"
              className={`tw-size-3 tw-shrink-0 ${DROPDOWN_CHECKMARK_CLASSES} ${selectedValue === item.value ? "" : "tw-invisible"}`}
            />
          </button>
        ))}
      </FilterGridDropdownItemsWrapper>
    </div>
  );
}
