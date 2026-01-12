"use client";

import SubmissionCarousel from "./carousel/SubmissionCarousel";
import { NowMintingSection } from "./now-minting";
import { NextMintLeadingSection } from "./next-mint-leading";
import { BoostedSection } from "./boosted";
import { ExploreWavesSection } from "./explore-waves";
import { HeroHeader } from "./hero";

export default function HomePageContent() {
  return (
    <div className="tw-py-8">
      <HeroHeader />
      <SubmissionCarousel />
      <NowMintingSection />
      <NextMintLeadingSection />
      <BoostedSection />
      <ExploreWavesSection />
    </div>
  );
}
