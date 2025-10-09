"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { classNames } from "@/helpers/Helpers";
import type { XtdhSortDirection } from "./types";

const directionSymbols: Record<XtdhSortDirection, string> = {
  asc: "↑",
  desc: "↓",
};

interface SortDropdownProps<SortValue extends string> {
  readonly options: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly value: SortValue;
  readonly direction: XtdhSortDirection;
  readonly onSelect: (value: SortValue) => void;
  readonly onSelectWithDirection: (
    value: SortValue,
    direction: XtdhSortDirection
  ) => void;
  readonly label?: string;
  readonly disabled?: boolean;
}

export default function SortDropdown<SortValue extends string>({
  options,
  value,
  direction,
  onSelect,
  onSelectWithDirection,
  label = "Sort By",
  disabled = false,
}: Readonly<SortDropdownProps<SortValue>>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const handleDocumentClick = useCallback((event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target) return;
    if (
      triggerRef.current?.contains(target) ||
      menuRef.current?.contains(target)
    ) {
      return;
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [handleDocumentClick, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="tw-relative tw-inline-block">
      <label className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-mb-2">
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        disabled={disabled}
        className={classNames(
          "tw-flex tw-h-10 tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
          disabled ? "tw-opacity-50 tw-cursor-not-allowed" : "hover:tw-bg-iron-800"
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>
          {activeOption?.label ?? "Select"}{" "}
          <span className="tw-text-iron-300">
            {directionSymbols[direction]}
          </span>
        </span>
        <span
          className={classNames(
            "tw-transition tw-duration-200 tw-text-iron-300",
            isOpen ? "tw-rotate-180" : "tw-rotate-0"
          )}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          className="tw-absolute tw-right-0 tw-z-20 tw-mt-2 tw-w-60 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-2 tw-shadow-lg"
        >
          <ul className="tw-space-y-1">
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <li key={option.key}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-px-2 tw-py-2 hover:tw-bg-iron-900">
                    <button
                      type="button"
                      className={classNames(
                        "tw-flex-1 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline-none",
                        isActive ? "tw-text-iron-50" : ""
                      )}
                      onClick={() => {
                        onSelect(option.value);
                        setIsOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                    <div className="tw-flex tw-items-center tw-gap-1">
                      <DirectionButton
                        direction="asc"
                        isActive={isActive && direction === "asc"}
                        disabled={disabled}
                        onClick={() => {
                          onSelectWithDirection(option.value, "asc");
                          setIsOpen(false);
                        }}
                      />
                      <DirectionButton
                        direction="desc"
                        isActive={isActive && direction === "desc"}
                        disabled={disabled}
                        onClick={() => {
                          onSelectWithDirection(option.value, "desc");
                          setIsOpen(false);
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DirectionButton({
  direction,
  isActive,
  disabled,
  onClick,
}: {
  readonly direction: XtdhSortDirection;
  readonly isActive: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "tw-h-8 tw-w-8 tw-rounded-md tw-text-sm tw-font-semibold tw-transition focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0",
        disabled
          ? "tw-bg-iron-900 tw-text-iron-500 tw-cursor-not-allowed"
          : isActive
            ? "tw-bg-primary-500 tw-text-iron-950"
            : "tw-bg-iron-800 tw-text-iron-200 hover:tw-bg-iron-700"
      )}
      aria-label={direction === "asc" ? "Sort ascending" : "Sort descending"}
    >
      {directionSymbols[direction]}
    </button>
  );
}
