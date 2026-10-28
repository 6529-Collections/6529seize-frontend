"use client";

import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import HomeHowToStart from "@/components/home/newcomer/HomeHowToStart";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import HomePageTextSection from "@/components/home/HomePageTextSection";
import HomeNewcomerIntro from "@/components/home/newcomer/HomeNewcomerIntro";
import HomeWhatIs6529 from "@/components/home/newcomer/HomeWhatIs6529";
import { NextMintLeadingSection } from "@/components/home/next-mint-leading/NextMintLeadingSection";
import { HeroHeader } from "./hero";
import { LatestDropSection } from "./now-minting";
import { useHomepageTracking } from "./useHomepageTracking";

export default function HomePageContent() {
  const { connectionState, hasValidWalletAuth } = useSeizeConnectContext();
  const mintStatus = useNowMintingStatus();
  const { rootRef, onClickCapture } = useHomepageTracking(hasValidWalletAuth);
  const showNewcomerIntro =
    connectionState !== "initializing" &&
    connectionState !== "connecting" &&
    !hasValidWalletAuth;

  return (
    <div
      ref={rootRef}
      onClickCapture={onClickCapture}
      onAuxClickCapture={onClickCapture}
      className="tw-overflow-x-hidden tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800"
    >
      <HeroHeader>{showNewcomerIntro && <HomeNewcomerIntro />}</HeroHeader>
      {showNewcomerIntro && <HomeWhatIs6529 />}
      <LatestDropSection mintStatus={mintStatus} />
      {showNewcomerIntro && <HomeHowToStart />}
      <HomePageTextSection />
      <NextMintLeadingSection />
      <ExploreWavesSection />
    </div>
  );
}
