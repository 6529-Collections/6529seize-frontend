"use client";

import React, { useCallback, type ReactNode } from "react";
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
  const { registerRef, spaces } = useLayout();
  const { drop, isDropOpen, onDropClose } = useDropModal();
  const { activeTab, handleTabChange } = useHomeTabs();

  const isWalletInitializing =
    connectionState === "initializing" || connectionState === "connecting";

  // Memoized callback ref for LayoutContext registration
  const setTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerRef("tabs", element);
    },
    [registerRef]
  );

  let feedContent: ReactNode;
  if (isWalletInitializing) {
    feedContent = <SpinnerLoader text="Loading feed..." />;
  } else if (isAuthenticated) {
    feedContent = <HomeFeed />;
  } else {
    feedContent = <ConnectWallet />;
  }

  const sidebarLeftOffset = hasTouchScreen ? 0 : "var(--left-rail)";

  return (
    <div className="tw-h-full">
      {isDropOpen && drop && (
        <div
          className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-[49] tw-bg-black"
          style={{
            left: sidebarLeftOffset,
            right: "var(--layout-margin, 0px)",
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
          <div className="tw-h-full tw-bg-black tw-overflow-hidden tailwind-scope tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-border-solid tw-border-r tw-border-iron-700/95 tw-border-y-0 tw-border-l-0">
            {feedContent}
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
