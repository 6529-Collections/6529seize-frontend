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
}

export const TabToggleWithOverflow: React.FC<TabToggleWithOverflowProps> = ({
  options,
  activeKey,
  onSelect,
  maxVisibleTabs = 3, // Default to showing 3 tabs before overflow
}) => {
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  
  // Determine which tabs to show directly and which to put in overflow
  const visibleTabs = options.slice(0, maxVisibleTabs);
  const overflowTabs = options.length > maxVisibleTabs ? options.slice(maxVisibleTabs) : [];
  
  // Check if active tab is in overflow
  const isActiveInOverflow = overflowTabs.some(tab => tab.key === activeKey);
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
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
    <div className="tw-p-[2px] tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-primary-400/50 tw-inline-flex tw-rounded-lg tw-w-full tw-gap-x-[1px]">
      {/* Show visible tabs */}
      {visibleTabs.map((option) => (
        <div
          key={option.key}
          className={
            activeKey === option.key
              ? "tw-p-0 tw-flex tw-flex-1 tw-rounded-lg tw-bg-primary-500/20"
              : "tw-p-0 tw-flex tw-flex-1 tw-rounded-lg"
          }
        >
          <button
            onClick={() => handleSelect(option.key)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-1.5 tw-py-0.5 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeKey === option.key
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            {option.label}
          </button>
        </div>
      ))}
      
      {/* Only show overflow dropdown if there are overflow tabs */}
      {overflowTabs.length > 0 && (
        <div
          ref={overflowRef}
          className={
            isActiveInOverflow
              ? "tw-p-0 tw-flex tw-rounded-lg tw-bg-primary-500/20 tw-relative"
              : "tw-p-0 tw-flex tw-rounded-lg tw-relative"
          }
        >
          <button
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            className={`tw-whitespace-nowrap tw-flex tw-items-center tw-justify-center tw-gap-0.5 tw-px-1.5 tw-py-0.5 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              isActiveInOverflow
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            {isActiveInOverflow 
              ? options.find(opt => opt.key === activeKey)?.label
              : "More"}
            <span className={`tw-ml-0.5 tw-inline-flex ${isOverflowOpen ? "tw-rotate-180" : ""} tw-transition-transform tw-duration-200`}>
              <svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg" className="tw-opacity-70">
                <path d="M4 4L0 0H8L4 4Z" fill="currentColor" />
              </svg>
            </span>
          </button>
          
          {/* Overflow dropdown */}
          {isOverflowOpen && (
            <div className="tw-absolute tw-right-0 tw-z-10 tw-mt-6 tw-top-0 tw-w-32 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-primary-400/20 tw-shadow-lg">
              <div className="tw-p-1 tw-space-y-0.5">
                {overflowTabs.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSelect(option.key)}
                    className={`tw-block tw-w-full tw-px-2 tw-py-1 tw-text-left tw-text-xs tw-rounded-md tw-font-medium tw-transition-colors ${
                      activeKey === option.key
                        ? "tw-bg-primary-500/10 tw-text-primary-300"
                        : "tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
                    }`}
                  >
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