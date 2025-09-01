"use client";

import React, { useState } from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import Home from "./Home";
import HomeFeed from "./HomeFeed";
import useDeviceInfo from "@/hooks/useDeviceInfo";

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

  // For mobile app, return null to let mobile layout handle routing
  if (isApp) {
    return null;
  }

  return (
    <div className="tw-h-full tw-px-6 tw-pt-4 tw-pb-6 tw-bg-iron-950">
      {/* Tab Navigation - matching profile page design */}
      <div className="tw-overflow-hidden mb-2">
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
              className={`tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold tw-bg-transparent tw-border-0 ${
                activeTab === "feed" ? "tw-pointer-events-none" : ""
              }`}
            >
              <div
                className={
                  activeTab === "feed"
                    ? "tw-text-iron-50 tw-whitespace-nowrap tw-font-semibold tw-py-4 tw-px-1"
                    : "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 tw-whitespace-nowrap tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
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
                    ? "tw-text-iron-50 tw-whitespace-nowrap tw-font-semibold tw-py-4 tw-px-1"
                    : "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 tw-whitespace-nowrap tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
                }
              >
                Latest Drop
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tw-h-full">
        {activeTab === "feed" ? (
          <div>
            <HomeFeed />
          </div>
        ) : (
          <Home featuredNft={featuredNft} featuredNextgen={featuredNextgen} />
        )}
      </div>
    </div>
  );
}
