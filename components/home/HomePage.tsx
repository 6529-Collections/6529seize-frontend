"use client";

import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { InitialActivityData } from "../latest-activity/fetchInitialActivityData";
import HomeApp from "./HomeApp";
import HomeWeb from "./HomeWeb";

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
  const { isApp } = useDeviceInfo();

  return isApp ? (
    <HomeApp
      featuredNft={featuredNft}
      featuredNextgen={featuredNextgen}
      initialActivityData={initialActivityData}
      initialTokens={initialTokens}
      isMemeMintingActive={isMemeMintingActive}
    />
  ) : (
    <HomeWeb
      featuredNft={featuredNft}
      featuredNextgen={featuredNextgen}
      initialActivityData={initialActivityData}
      initialTokens={initialTokens}
      isMemeMintingActive={isMemeMintingActive}
    />
  );
}
