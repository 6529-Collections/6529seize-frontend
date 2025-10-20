"use client";

import React from "react";
import { CompactMenu } from "./CompactMenu";
import clsx from "clsx";

interface TabOption {
  readonly key: string;
  readonly label: string;
}

interface TabToggleWithOverflowProps {
  readonly options: readonly TabOption[];
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly maxVisibleTabs?: number;
  readonly fullWidth?: boolean;
}

export const TabToggleWithOverflow: React.FC<TabToggleWithOverflowProps> = ({
  options,
  activeKey,
  onSelect,
  maxVisibleTabs = 3, // Default to showing 3 tabs before overflow
  fullWidth = false,
}) => {
  // Determine which tabs to show directly and which to put in overflow
  const visibleTabs = options.slice(0, maxVisibleTabs);
  const overflowTabs =
    options.length > maxVisibleTabs ? options.slice(maxVisibleTabs) : [];

  // Check if active tab is in overflow
  const isActiveInOverflow = overflowTabs.some((tab) => tab.key === activeKey);

  // Handle tab selection
  const handleSelect = (key: string) => {
    onSelect(key);
  };

  return (
    <div
      className={`tw-flex tw-gap-x-1 ${fullWidth ? "tw-w-full" : "tw-w-auto"}`}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={`tw-flex tw-gap-x-1 ${fullWidth ? "tw-flex-1" : ""}`}>
        {/* Show visible tabs */}
        {visibleTabs.map((option) => (
          <button
            key={option.key}
            role="tab"
            aria-selected={activeKey === option.key}
            onClick={() => handleSelect(option.key)}
            className={`tw-flex-1 tw-py-3 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-border-b-2 tw-border-t-0 tw-border-x-0 tw-border-solid tw-bg-transparent tw-transition-all tw-duration-200 ${
              fullWidth ? "tw-text-center tw-justify-center tw-flex" : ""
            } ${
              activeKey === option.key
                ? "tw-text-white tw-border-primary-300"
                : "tw-text-iron-400 hover:tw-text-iron-200 tw-border-transparent"
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      {/* Only show overflow dropdown if there are overflow tabs */}
      {overflowTabs.length > 0 && (
        <CompactMenu
          className="tw-relative"
          unstyledTrigger
          unstyledMenu
          unstyledItems
          triggerClassName={clsx(
            "tw-flex tw-items-center tw-gap-0.5 tw-border-0 tw-bg-transparent tw-text-sm tw-font-medium tw-transition-all tw-duration-200 tw-whitespace-nowrap",
            isActiveInOverflow
              ? "tw-text-primary-300 tw-border-b-2 tw-border-primary-400"
              : "tw-text-iron-400 hover:tw-text-iron-200",
          )}
          trigger={({ isOpen }) => (
            <>
              {isActiveInOverflow
                ? options.find((opt) => opt.key === activeKey)?.label
                : "More"}
              <span
                className={clsx(
                  "tw-ml-0.5 tw-inline-flex tw-transition-transform tw-duration-200",
                  isOpen ? "tw-rotate-180" : "",
                )}
              >
                <svg
                  aria-hidden="true"
                  width="10"
                  height="6"
                  viewBox="0 0 8 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="tw-opacity-70"
                >
                  <path d="M4 4L0 0H8L4 4Z" fill="currentColor" />
                </svg>
              </span>
            </>
          )}
          items={overflowTabs.map((option) => ({
            id: option.key,
            label: option.label,
            onSelect: () => handleSelect(option.key),
            active: activeKey === option.key,
            role: "tab",
            ariaSelected: activeKey === option.key,
          }))}
          itemClassName="tw-block tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-transition-colors"
          inactiveItemClassName="tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-iron-200"
          activeItemClassName="tw-text-primary-300"
          focusItemClassName="tw-bg-iron-800 tw-text-iron-100"
          menuWidthClassName="tw-w-36"
          menuClassName="tw-z-50 tw-mt-2 tw-rounded-md tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-primary-400/20 focus:tw-outline-none"
          itemsWrapperClassName="tw-py-1"
          anchor="bottom end"
          aria-label="More tabs"
        />
      )}
    </div>
  );
};
