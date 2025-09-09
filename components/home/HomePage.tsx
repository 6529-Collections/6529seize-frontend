"use client";

import React, { useState, useCallback, useRef } from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import Home from "./Home";
import HomeFeed from "./HomeFeed";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import Image from "next/image";
import { InitialActivityData } from "../latest-activity/fetchInitialActivityData";

interface HomePageProps {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
}

export default function HomePage({
  featuredNft,
  featuredNextgen,
  initialActivityData,
  initialTokens,
}: HomePageProps) {
  const { isApp } = useDeviceInfo();
  const [activeTab, setActiveTab] = useState<"feed" | "latest">("latest");
  const { registerRef } = useLayout();
  const { isAuthenticated } = useSeizeConnectContext();

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
    <div className="tw-h-full tw-bg-black">
      {/* Tab Navigation */}
      <div
        ref={setTabsRef}
        className="tw-px-6 tw-sticky tw-top-0 tw-z-50 tw-overflow-hidden tw-bg-black/80 tw-backdrop-blur tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0"
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

      <div className="tw-h-full tw-px-4">
        {activeTab === "feed" ? (
          <div className="tw-h-full tw-overflow-hidden tailwind-scope">
            {isAuthenticated ? (
              <HomeFeed />
            ) : (
              <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-px-6 tw-min-h-[85dvh]">
                <Image
                  unoptimized
                  priority
                  loading="eager"
                  src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
                  alt="Brain"
                  width={304}
                  height={450}
                  className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
                />
                <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
                  <h1 className="tw-text-xl tw-font-bold">
                    This content is only available to connected wallets.
                  </h1>
                  <p className="tw-text-base tw-text-gray-400">
                    Connect your wallet to continue.
                  </p>
                  <HeaderUserConnect />
                </div>
              </div>
            )}
          </div>
        ) : (
          <Home
            featuredNft={featuredNft}
            featuredNextgen={featuredNextgen}
            initialActivityData={initialActivityData}
            initialTokens={initialTokens}
          />
        )}
      </div>
    </div>
  );
}
