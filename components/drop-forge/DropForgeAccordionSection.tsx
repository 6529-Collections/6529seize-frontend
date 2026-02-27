"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const SECTION_CARD_CLASS =
  "tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-5";

type SectionTone = "neutral" | "success" | "warning" | "danger";

function toneClass(tone: SectionTone): string {
  if (tone === "success") {
    return "tw-bg-emerald-500/15 tw-text-emerald-300 tw-ring-emerald-400/40";
  }
  if (tone === "warning") {
    return "tw-bg-amber-500/15 tw-text-amber-300 tw-ring-amber-400/40";
  }
  if (tone === "danger") {
    return "tw-bg-rose-500/15 tw-text-rose-300 tw-ring-rose-400/40";
  }
  return "tw-bg-iron-700/30 tw-text-iron-400 tw-ring-iron-500/40";
}

function shouldShowAccordionHeaderRight({
  headerRight,
  showHeaderRightWhenOpen,
  showHeaderRightWhenClosed,
  isOpen,
}: Readonly<{
  headerRight?: ReactNode;
  showHeaderRightWhenOpen: boolean;
  showHeaderRightWhenClosed: boolean;
  isOpen: boolean;
}>): boolean {
  if (!headerRight) {
    return false;
  }
  if (showHeaderRightWhenOpen && showHeaderRightWhenClosed) {
    return true;
  }
  if (showHeaderRightWhenOpen) {
    return isOpen;
  }
  if (showHeaderRightWhenClosed) {
    return !isOpen;
  }
  return true;
}

export default function DropForgeAccordionSection({
  title,
  subtitle,
  tone = "neutral",
  defaultOpen = false,
  disabled = false,
  onOpen,
  headerRight,
  showHeaderRightWhenOpen = false,
  showHeaderRightWhenClosed = false,
  children,
  childrenClassName = "tw-space-y-3",
  className = "",
}: Readonly<{
  title: string;
  subtitle?: string;
  tone?: SectionTone;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
  headerRight?: ReactNode;
  showHeaderRightWhenOpen?: boolean;
  showHeaderRightWhenClosed?: boolean;
  children: ReactNode;
  childrenClassName?: string;
  className?: string;
}>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const showHeaderRight = shouldShowAccordionHeaderRight({
    headerRight,
    showHeaderRightWhenOpen,
    showHeaderRightWhenClosed,
    isOpen,
  });

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        onOpen?.();
      }
      return next;
    });
  };

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  return (
    <div className={`${SECTION_CARD_CLASS} ${className}`}>
      <div className="tw-flex tw-w-full tw-min-h-10 tw-items-start sm:tw-items-center tw-justify-between tw-gap-2">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-disabled={disabled}
          onClick={toggleOpen}
          className={`tw-flex tw-min-h-10 tw-min-w-0 tw-flex-1 tw-items-start sm:tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left ${
            disabled ? "tw-!cursor-default" : "tw-cursor-pointer"
          }`}
        >
          <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2">
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
              className={`tw-min-w-0 tw-whitespace-normal tw-break-words tw-text-base tw-font-semibold tw-leading-tight ${
                disabled ? "tw-text-iron-400" : "tw-text-iron-50"
              }`}
            >
              {title}
            </span>
          </span>
          {subtitle ? (
            <span
              className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-ring-1 tw-ring-inset ${toneClass(tone)}`}
            >
              {subtitle}
            </span>
          ) : null}
        </button>

        {showHeaderRight ? (
          <span className="tw-ml-auto tw-inline-flex tw-min-h-10 tw-max-w-full tw-flex-shrink-0 tw-items-center">
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
          aria-hidden={!isOpen}
          inert={!isOpen}
          tabIndex={isOpen ? undefined : -1}
          className={`${childrenClassName} ${
            isOpen ? "tw-overflow-visible" : "tw-overflow-hidden"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
