"use client";

import SubmissionCarousel from "./carousel/SubmissionCarousel";
import { NowMintingSection } from "./now-minting";
import { NextMintLeadingSection } from "./next-mint-leading";
import { BoostedSection } from "./boosted";

export default function HomePageContent() {
  return (
    <div className="tw-py-8">
      <SubmissionCarousel />
      <NowMintingSection />
      <NextMintLeadingSection />
      <BoostedSection />
    </div>
  );
}
