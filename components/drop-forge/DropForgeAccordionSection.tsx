"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import { useState } from "react";

const SECTION_CARD_CLASS =
  "tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5";

export default function DropForgeAccordionSection({
  title,
  defaultOpen = false,
  disabled = false,
  headerRight,
  showHeaderRightWhenOpen = false,
  showHeaderRightWhenClosed = false,
  children,
  className = "",
}: Readonly<{
  title: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  headerRight?: ReactNode;
  showHeaderRightWhenOpen?: boolean;
  showHeaderRightWhenClosed?: boolean;
  children: ReactNode;
  className?: string;
}>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  let showHeaderRight = false;
  if (headerRight) {
    if (showHeaderRightWhenOpen) {
      showHeaderRight = isOpen;
    } else if (showHeaderRightWhenClosed) {
      showHeaderRight = !isOpen;
    } else {
      showHeaderRight = true;
    }
  }

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`${SECTION_CARD_CLASS} ${className}`}>
      <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          onClick={toggleOpen}
          className={`tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left ${
            disabled ? "" : "tw-cursor-pointer"
          }`}
        >
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
        </button>

        {showHeaderRight ? (
          <span className="tw-inline-flex tw-items-center">{headerRight}</span>
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
