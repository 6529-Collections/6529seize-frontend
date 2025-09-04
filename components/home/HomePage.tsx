"use client";

import React, { useState, useCallback, useRef } from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import Home from "./Home";
import HomeFeed from "./HomeFeed";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";

interface HomePageProps {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
}

export default function HomePage({
  featuredNft,
  featuredNextgen,
}: HomePageProps) {
  const { isApp } = useDeviceInfo();
  const [activeTab, setActiveTab] = useState<"feed" | "latest">("feed");
  const { registerRef } = useLayout();

  // Local ref for tabs
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // Callback ref for registration with LayoutContext
  const setTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      tabsRef.current = element;
      // Register with LayoutContext
      registerRef("tabs", element);
    },
    [registerRef]
  );

  // For mobile app, return null to let mobile layout handle routing
  if (isApp) {
    return null;
  }

  return (
    <div className="tw-h-full tw-bg-iron-950">
      {/* Tab Navigation */}
      <div
        ref={setTabsRef}
        className="tw-px-6 tw-sticky tw-top-0 tw-z-50 tw-overflow-hidden tw-bg-iron-950/80 tw-backdrop-blur-sm tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0"
      >
        <div
          className="tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-overflow-x-auto horizontal-menu-hide-scrollbar"
          aria-label="Tabs"
        >
          <div
            className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("feed")}
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
              onClick={() => setActiveTab("latest")}
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

      <div className="tw-h-full tw-px-6 tw-bg-iron-950">
        {activeTab === "feed" ? (
          <div className="tw-h-full tw-overflow-hidden">
            <HomeFeed />
          </div>
        ) : (
          <Home featuredNft={featuredNft} featuredNextgen={featuredNextgen} />
        )}
      </div>
    </div>
  );
}
