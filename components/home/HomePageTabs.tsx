"use client";

import { forwardRef } from "react";

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
        className="tailwind-scope md:tw-px-8 tw-sticky tw-top-0 tw-z-20 tw-overflow-hidden tw-bg-black/80 tw-backdrop-blur tw-border-b tw-border-solid tw-border-iron-700/95 tw-border-l-0 tw-border-r-0 lg:tw-border-r tw-border-t-0"
      >
        <div className="tw-flex tw-overflow-x-auto horizontal-menu-hide-scrollbar tw-w-full">
          <div className="tw-flex  tw-justify-center tw-w-full md:tw-w-auto tw-gap-x-4 md:tw-gap-x-6">
            <button
              onClick={() => onTabChange("feed")}
              className={`tw-p-0 tw-group tw-text-base tw-leading-5 tw-font-semibold tw-bg-transparent tw-flex-1 tw-border-0 ${
                activeTab === "feed" ? "tw-pointer-events-none" : ""
              }`}
            >
              <span
                className={`tw-block md:tw-inline-block tw-border-b-2 tw-border-solid tw-border-x-0 tw-border-t-0 tw-py-4 ${
                  activeTab === "feed"
                    ? "tw-text-iron-50 tw-whitespace-nowrap tw-font-semibold tw-px-1 tw-border-primary-300"
                    : "tw-text-iron-500 group-hover:desktop-hover:hover:tw-text-iron-300 tw-whitespace-nowrap tw-px-1 tw-border-transparent tw-transition tw-duration-300 tw-ease-out"
                }`}
              >
                My Stream
              </span>
            </button>
            <button
              onClick={() => onTabChange("latest")}
              className={`tw-p-0 tw-group tw-text-base tw-leading-5 tw-font-semibold tw-bg-transparent tw-flex-1 tw-border-0 ${
                activeTab === "latest" ? "tw-pointer-events-none" : ""
              }`}
            >
              <span
                className={`tw-block md:tw-inline-block tw-border-b-2 tw-border-solid tw-border-x-0 tw-border-t-0 tw-py-4 ${
                  activeTab === "latest"
                    ? "tw-text-iron-50 tw-whitespace-nowrap tw-font-semibold tw-px-1 tw-border-primary-300"
                    : "tw-text-iron-500 group-hover:desktop-hover:hover:tw-text-iron-300 tw-whitespace-nowrap tw-px-1 tw-border-transparent tw-transition tw-duration-300 tw-ease-out"
                }`}
              >
                Latest Drop
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

HomePageTabs.displayName = "HomePageTabs";

export default HomePageTabs;
