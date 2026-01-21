"use client";

import SubmissionCarouselSection from "./SubmissionCarouselSection";
import { NowMintingSection } from "./now-minting";
import { NextMintLeadingSection } from "./next-mint-leading";
import { BoostedSection } from "./boosted";
import { ExploreWavesSection } from "./explore-waves";

export default function HomePageContent() {
  return (
    <div className="tw-overflow-x-hidden tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900">
      <NowMintingSection />
      <SubmissionCarouselSection />
      <div className="tw-mt-10 tw-border tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 md:tw-mt-16 md:tw-pt-16">
        <NextMintLeadingSection />
        <BoostedSection />
        <ExploreWavesSection />
      </div>
    </div>
  );
}
