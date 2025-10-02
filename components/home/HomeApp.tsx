"use client";

import React, { useEffect } from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import Home from "./Home";
import { InitialActivityData } from "../latest-activity/fetchInitialActivityData";
import HomeFeed from "./HomeFeed";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import ConnectWallet from "../common/ConnectWallet";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useHomeTabs } from "./useHomeTabs";
import useDeviceInfo from "@/hooks/useDeviceInfo";

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
  const { registerRef } = useLayout();
  const { activeTab } = useHomeTabs();
  const { isApp } = useDeviceInfo();

  useEffect(() => {
    registerRef("tabs", null);
  }, [registerRef]);

  useEffect(() => {
    if (!isApp) return;

    const previousOverflow = document.body.style.overflow;

    if (activeTab === "feed") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }

    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [activeTab, isApp]);

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
    <div>
      <div>{content}</div>
    </div>
  );
}
