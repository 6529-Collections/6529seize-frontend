"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import { useState } from "react";

const SECTION_CARD_CLASS =
  "tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5";

export default function DropControlAccordionSection({
  title,
  defaultOpen = false,
  disabled = false,
  headerRight,
  children,
  className = "",
}: {
  title: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`${SECTION_CARD_CLASS} ${className}`}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleOpen();
          }
        }}
        className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-bg-transparent tw-p-0 tw-text-left ${
          disabled ? "" : "tw-cursor-pointer"
        }`}
      >
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span className="tw-relative tw-h-5 tw-w-5 tw-flex-shrink-0">
            <ChevronRightIcon
              className={`tw-absolute tw-inset-0 tw-h-5 tw-w-5 tw-transition-all tw-duration-200 ${
                isOpen
                  ? "tw-rotate-90 tw-opacity-0"
                  : "tw-rotate-0 tw-opacity-100"
              } ${disabled ? "tw-text-iron-400" : "tw-text-white"}`}
            />
            <ChevronDownIcon
              className={`tw-absolute tw-inset-0 tw-h-5 tw-w-5 tw-transition-all tw-duration-200 ${
                isOpen
                  ? "tw-rotate-0 tw-opacity-100"
                  : "-tw-rotate-90 tw-opacity-0"
              } ${disabled ? "tw-text-iron-400" : "tw-text-white"}`}
            />
          </span>
          <span
            className={`tw-text-base tw-font-semibold ${
              disabled ? "tw-text-iron-400" : "tw-text-iron-50"
            }`}
          >
            {title}
          </span>
        </span>

        {headerRight ? (
          <span
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {headerRight}
          </span>
        ) : null}
      </div>

      <div
        className={`tw-grid tw-transition-all tw-duration-200 tw-ease-out ${
          isOpen
            ? "tw-mt-5 tw-grid-rows-[1fr] tw-opacity-100"
            : "tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
        }`}
      >
        <div
          className={`tw-space-y-3 ${
            isOpen ? "tw-overflow-visible" : "tw-overflow-hidden"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
