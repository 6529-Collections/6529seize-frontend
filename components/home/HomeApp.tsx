"use client";

import React from "react";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import Home from "./Home";
import { InitialActivityData } from "../latest-activity/fetchInitialActivityData";

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
  // App version shows the Home component directly (latest drop content)
  return (
    <Home
      featuredNft={featuredNft}
      isMemeMintingActive={isMemeMintingActive}
      featuredNextgen={featuredNextgen}
      initialActivityData={initialActivityData}
      initialTokens={initialTokens}
    />
  );
}