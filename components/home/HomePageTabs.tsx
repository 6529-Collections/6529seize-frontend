"use client";

import React, { forwardRef, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

type TabType = "feed" | "latest";

interface HomePageTabsProps {
  hasTouchScreen?: boolean;
}

const HomePageTabs = forwardRef<HTMLDivElement, HomePageTabsProps>(
  ({ hasTouchScreen = false }, ref) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Get active tab from URL, default to "latest"
    const activeTab = (searchParams?.get('tab') as TabType) || 'latest';

    // Handle tab changes by updating URL
    const handleTabChange = useCallback((tab: TabType) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);
    return (
      <div
        ref={ref}
        className="tailwind-scope tw-pl-6 tw-pr-6 tw-sticky tw-top-0 tw-z-20 tw-overflow-hidden tw-bg-black/80 tw-backdrop-blur tw-border-b tw-border-solid tw-border-iron-900 tw-border-x-0 tw-border-t-0"
      >
        <div className="tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-overflow-x-auto horizontal-menu-hide-scrollbar">
          <div className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4">
            <button
              onClick={() => handleTabChange("feed")}
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
              onClick={() => handleTabChange("latest")}
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