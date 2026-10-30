"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useMemo, useRef, useState } from "react";
import FilterGridDropdownItemsWrapper from "./FilterGridDropdownItemsWrapper";

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
          className={`${
            disabled
              ? "tw-text-iron-400 tw-opacity-50"
              : "tw-text-iron-300 hover:tw-ring-iron-600"
          } tw-relative tw-block tw-w-full tw-truncate tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-3 tw-pl-3.5 tw-pr-10 tw-text-left tw-text-xs tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 lg:tw-bg-iron-900`}
        >
          {activeLabel}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 -tw-mr-1 tw-flex tw-items-center tw-pr-3.5">
            <ChevronDownIcon
              className={`tw-h-5 tw-w-5 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-180" : ""}`}
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
