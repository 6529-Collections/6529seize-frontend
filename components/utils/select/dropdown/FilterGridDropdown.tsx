"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useMemo, useRef, useState } from "react";
import FilterGridDropdownItemsWrapper from "./FilterGridDropdownItemsWrapper";
import {
  DROPDOWN_CHEVRON_CLASSES,
  DROPDOWN_TRIGGER_CLASSES,
} from "./dropdownTriggerStyles";

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
    `tw-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-justify-center tw-gap-x-1 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-2 tw-py-2 tw-text-sm tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 motion-reduce:tw-transition-none lg:tw-min-h-9 ${
      isActive
        ? "tw-bg-iron-200 tw-font-semibold tw-text-iron-950"
        : "tw-bg-iron-800 tw-font-medium tw-text-iron-300 hover:tw-bg-iron-700"
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
          className={`${DROPDOWN_TRIGGER_CLASSES} tw-relative tw-block tw-w-full tw-truncate tw-whitespace-nowrap tw-py-3 tw-pl-3 tw-pr-9 tw-text-left tw-text-xs`}
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
          <span className="tw-whitespace-nowrap">{allItemLabel}</span>
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
            <span className="tw-whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </FilterGridDropdownItemsWrapper>
    </div>
  );
}
