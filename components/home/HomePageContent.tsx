"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { BoostedSection } from "@/components/home/boosted/BoostedSection";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import HomePageTextSection from "@/components/home/HomePageTextSection";
import HomeNewcomerIntro from "@/components/home/newcomer/HomeNewcomerIntro";
import { NextMintLeadingSection } from "@/components/home/next-mint-leading/NextMintLeadingSection";
import { HeroHeader } from "./hero";
import { LatestDropSection } from "./now-minting";

export default function HomePageContent() {
  const { connectionState, hasValidWalletAuth } = useSeizeConnectContext();
  const showNewcomerIntro =
    connectionState !== "initializing" &&
    connectionState !== "connecting" &&
    !hasValidWalletAuth;

  return (
    <div className="tw-overflow-x-hidden tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800">
      <HeroHeader />
      {showNewcomerIntro && <HomeNewcomerIntro />}
      <LatestDropSection />
      <HomePageTextSection />
      <div className="tw-h-px tw-w-full tw-bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_15%,rgba(255,255,255,0.08)_85%,transparent_100%)]" />
      <div className="tw-pt-10 md:tw-pt-16">
        <NextMintLeadingSection />
        <BoostedSection />
        <ExploreWavesSection />
      </div>
    </div>
  );
}
