"use client";

import React, { useMemo } from "react";
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
import { useHomeTabs } from "./useHomeTabs";
import SpinnerLoader from "../common/SpinnerLoader";

interface HomeWebProps {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
  readonly isMemeMintingActive: boolean;
}

export default function HomeWeb({
  featuredNft,
  featuredNextgen,
  initialActivityData,
  initialTokens,
  isMemeMintingActive,
}: HomeWebProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const { isAuthenticated, connectionState } = useSeizeConnectContext();
  const { registerRef } = useLayout();
  const { drop, isDropOpen, onDropClose } = useDropModal();
  const { spaces } = useLayout();
  const { activeTab, handleTabChange } = useHomeTabs();

  const isWalletInitializing =
    connectionState === "initializing" || connectionState === "connecting";

  // Callback ref for registration with LayoutContext
  const setTabsRef = useMemo(
    () => (element: HTMLDivElement | null) => {
      registerRef("tabs", element);
    },
    [registerRef]
  );

  return (
    <div className="tw-h-full">
      {isDropOpen && drop && (
        <div
          className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-[49] tw-bg-black"
          style={{
            left: hasTouchScreen ? 0 : "var(--left-rail)",
            top: spaces.headerSpace,
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
          <div className="tw-h-full tw-bg-black tw-overflow-hidden tailwind-scope tw-px-2 lg:tw-px-6 xl:tw-px-8">
            {isWalletInitializing ? (
              <SpinnerLoader text="Loading feed..." />
            ) : isAuthenticated ? (
              <HomeFeed />
            ) : (
              <ConnectWallet />
            )}
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
