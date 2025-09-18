"use client";

import React, { forwardRef } from "react";

type TabType = "feed" | "latest";

interface HomePageTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const HomePageTabs = forwardRef<HTMLDivElement, HomePageTabsProps>(
  ({ activeTab, onTabChange }, ref) => {
    return (
      <div
        ref={ref}
        className="tailwind-scope tw-px-6 tw-sticky tw-top-0 tw-z-20 tw-overflow-hidden tw-bg-black/80 tw-backdrop-blur tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0"
      >
        <div className="tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-overflow-x-auto horizontal-menu-hide-scrollbar">
          <div className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4">
            <button
              onClick={() => onTabChange("feed")}
              className={`tw-no-underline tw-flex tw-items-center tw-justify-center tw-leading-4 tw-p-0 tw-text-base tw-font-semibold tw-bg-transparent tw-border-0 ${
                activeTab === "feed" ? "tw-pointer-events-none" : ""
              }`}
            >
              <div
                className={
                  activeTab === "feed"
                    ? "tw-text-iron-50 tw-whitespace-nowrap tw-font-semibold tw-py-5 tw-px-1"
                    : "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 tw-whitespace-nowrap tw-py-5 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
                }
              >
                My Feed
              </div>
            </button>
            <button
              onClick={() => onTabChange("latest")}
              className={`tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold tw-bg-transparent tw-border-0 ${
                activeTab === "latest" ? "tw-pointer-events-none" : ""
              }`}
            >
              <div
                className={
                  activeTab === "latest"
                    ? "tw-text-iron-50 tw-whitespace-nowrap tw-font-semibold tw-py-5 tw-px-1"
                    : "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 tw-whitespace-nowrap tw-py-5 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
                }
              >
                Latest Drop
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

HomePageTabs.displayName = "HomePageTabs";

export default HomePageTabs;