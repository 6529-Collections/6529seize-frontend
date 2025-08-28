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

export default function HomePage({ featuredNft, featuredNextgen }: HomePageProps) {
  const { isApp } = useDeviceInfo();
  const [activeTab, setActiveTab] = useState<"feed" | "latest">("feed");

  // For mobile app, return null to let mobile layout handle routing
  if (isApp) {
    return null;
  }

  return (
    <div className="tw-h-full">
      {/* Tab Navigation */}
      <div className="tw-border-b tw-border-iron-800 tw-mb-6">
        <nav className="tw-flex tw-space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("feed")}
            className={`tw-whitespace-nowrap tw-py-4 tw-px-1 tw-border-b-2 tw-font-medium tw-text-sm ${
              activeTab === "feed"
                ? "tw-border-primary-400 tw-text-primary-400"
                : "tw-border-transparent tw-text-iron-300 hover:tw-text-iron-100 hover:tw-border-iron-300"
            }`}
          >
            My Feed
          </button>
          <button
            onClick={() => setActiveTab("latest")}
            className={`tw-whitespace-nowrap tw-py-4 tw-px-1 tw-border-b-2 tw-font-medium tw-text-sm ${
              activeTab === "latest"
                ? "tw-border-primary-400 tw-text-primary-400"
                : "tw-border-transparent tw-text-iron-300 hover:tw-text-iron-100 hover:tw-border-iron-300"
            }`}
          >
            Latest Drop
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tw-h-full">
        {activeTab === "feed" ? (
          <HomeFeed />
        ) : (
          <Home featuredNft={featuredNft} featuredNextgen={featuredNextgen} />
        )}
      </div>
    </div>
  );
}