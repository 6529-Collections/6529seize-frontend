"use client";

import React, { useCallback, useEffect, useState } from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import Home from "./Home";
import HomeFeed from "./HomeFeed";
import HomePageTabs from "./HomePageTabs";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import ConnectWallet from "../common/ConnectWallet";
import { InitialActivityData } from "../latest-activity/fetchInitialActivityData";
import { useDropModal } from "@/hooks/useDropModal";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";

const HOME_TAB_STORAGE_KEY = "home.activeTab";

interface HomePageProps {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
  readonly isMemeMintingActive: boolean;
}

export default function HomePage({
  featuredNft,
  featuredNextgen,
  initialActivityData,
  initialTokens,
  isMemeMintingActive,
}: HomePageProps) {
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const { isAuthenticated } = useSeizeConnectContext();
  const { registerRef } = useLayout();
  const { drop, isDropOpen, onDropClose } = useDropModal();
  const [activeTab, setActiveTab] = useState<"feed" | "latest">("latest");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedTab = window.localStorage.getItem(HOME_TAB_STORAGE_KEY);
      if (savedTab === "feed" || savedTab === "latest") {
        setActiveTab(savedTab);
      }
    } catch (error) {
      console.warn("Failed to read home tab from storage", error);
    }
  }, []);

  const handleTabChange = useCallback((tab: "feed" | "latest") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(HOME_TAB_STORAGE_KEY, tab);
      } catch (error) {
        console.warn("Failed to persist home tab to storage", error);
      }
    }
  }, []);

  // Callback ref for registration with LayoutContext
  const setTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerRef("tabs", element);
    },
    [registerRef]
  );

  // For mobile app, return null to let mobile layout handle routing
  if (isApp) {
    return null;
  }

  return (
    <div className="tw-h-full">
      {isDropOpen && drop && (
        <div
          className="tw-fixed tw-inset-0 tw-z-[49] tw-bg-black"
          style={{
            left: hasTouchScreen ? 0 : "var(--left-rail)", // 0 for mobile, sidebar offset for desktop
            transition: "none",
          }}
        >
          <BrainDesktopDrop
            drop={{
              type: DropSize.FULL,
              ...drop,
              stableKey: drop.id,
              stableHash: drop.id,
            }}
            onClose={onDropClose}
          />
        </div>
      )}

      <HomePageTabs
        ref={setTabsRef}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="tw-h-full">
        {activeTab === "feed" ? (
          <div className="tw-min-h-full tw-bg-black tw-overflow-hidden tailwind-scope tw-px-2 lg:tw-px-6 xl:tw-px-8">
            {isAuthenticated ? <HomeFeed /> : <ConnectWallet />}
          </div>
        ) : (
          <Home
            featuredNft={featuredNft}
            isMemeMintingActive={isMemeMintingActive}
            featuredNextgen={featuredNextgen}
            initialActivityData={initialActivityData}
            initialTokens={initialTokens}
          />
        )}
      </div>
    </div>
  );
}
