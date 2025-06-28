"use client";

import React, { useState, useRef, useEffect } from "react";

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
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Determine which tabs to show directly and which to put in overflow
  const visibleTabs = options.slice(0, maxVisibleTabs);
  const overflowTabs =
    options.length > maxVisibleTabs ? options.slice(maxVisibleTabs) : [];

  // Check if active tab is in overflow
  const isActiveInOverflow = overflowTabs.some((tab) => tab.key === activeKey);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(event.target as Node)
      ) {
        setIsOverflowOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle tab selection
  const handleSelect = (key: string) => {
    onSelect(key);
    setIsOverflowOpen(false);
  };

  return (
    <div
      className={`tw-flex tw-gap-x-1 ${fullWidth ? "tw-w-full" : "tw-w-auto"}`}>
      {/* Show visible tabs */}
      {visibleTabs.map((option) => (
        <button
          key={option.key}
          onClick={() => handleSelect(option.key)}
          className={`tw-flex-1 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-border-b-2 tw-border-t-0 tw-border-x-0 tw-border-solid tw-bg-transparent tw-transition-all tw-duration-200 ${
            fullWidth ? "tw-text-center tw-justify-center tw-flex" : ""
          } ${
            activeKey === option.key
              ? "tw-text-primary-300 tw-border-primary-400"
              : "tw-text-iron-400 hover:tw-text-iron-200 tw-border-transparent"
          }`}>
          {option.label}
        </button>
      ))}

      {/* Only show overflow dropdown if there are overflow tabs */}
      {overflowTabs.length > 0 && (
        <div ref={overflowRef} className="tw-relative">
          <button
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            className={`tw-whitespace-nowrap tw-flex tw-items-center tw-gap-0.5 tw-text-sm tw-font-medium tw-border-0 tw-bg-transparent tw-transition-all tw-duration-200 ${
              isActiveInOverflow
                ? "tw-text-primary-300 tw-border-b-2 tw-border-primary-400"
                : "tw-text-iron-400 hover:tw-text-iron-200"
            }`}>
            {isActiveInOverflow
              ? options.find((opt) => opt.key === activeKey)?.label
              : "More"}
            <span
              className={`tw-ml-0.5 tw-inline-flex ${
                isOverflowOpen ? "tw-rotate-180" : ""
              } tw-transition-transform tw-duration-200`}>
              <svg
                aria-hidden="true"
                width="10"
                height="6"
                viewBox="0 0 8 4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="tw-opacity-70">
                <path d="M4 4L0 0H8L4 4Z" fill="currentColor" />
              </svg>
            </span>
          </button>

          {/* Overflow dropdown */}
          {isOverflowOpen && (
            <div className="tw-absolute tw-right-0 tw-z-20 tw-mt-2 tw-w-36 tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-primary-400/20 tw-shadow-lg">
              <div className="tw-py-1">
                {overflowTabs.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSelect(option.key)}
                    className={`tw-block tw-w-full tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-bg-transparent tw-border-0 tw-font-medium tw-transition-colors ${
                      activeKey === option.key
                        ? "tw-text-primary-300"
                        : "tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-iron-200"
                    }`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
