"use client";

import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useDropModal } from "@/hooks/useDropModal";
import React, { useEffect } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import ConnectWallet from "../common/ConnectWallet";
import type { InitialActivityData } from "../latest-activity/fetchInitialActivityData";
import Home from "./Home";
import HomeFeed from "./HomeFeed";
import { useHomeTabs } from "./useHomeTabs";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";

interface HomeAppProps {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
  readonly isMemeMintingActive: boolean;
}

export default function HomeApp({
  featuredNft,
  featuredNextgen,
  initialActivityData,
  initialTokens,
  isMemeMintingActive,
}: HomeAppProps) {
  const { isAuthenticated } = useSeizeConnectContext();
  const { registerRef, spaces } = useLayout();
  const { activeTab } = useHomeTabs();
  const { isApp } = useDeviceInfo();
  const { drop, isDropOpen, onDropClose } = useDropModal();

  useEffect(() => {
    registerRef("tabs", null);
  }, [registerRef]);

  useEffect(() => {
    if (!isApp) return;

    if (activeTab === "feed" || isDropOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [activeTab, isApp, isDropOpen]);

  let content: React.ReactNode;

  if (activeTab === "feed") {
    content = isAuthenticated ? (
      <div className=" tw-bg-black tw-overflow-hidden tailwind-scope tw-px-2 sm:tw-px-4">
        <HomeFeed />
      </div>
    ) : (
      <ConnectWallet />
    );
  } else {
    content = (
      <Home
        featuredNft={featuredNft}
        isMemeMintingActive={isMemeMintingActive}
        featuredNextgen={featuredNextgen}
        initialActivityData={initialActivityData}
        initialTokens={initialTokens}
      />
    );
  }

  return (
    <div className="tw-relative">
      {isDropOpen && drop && (
        <div
          className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-40"
          style={{ top: spaces.headerSpace }}
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
      <div>{content}</div>
    </div>
  );
}
