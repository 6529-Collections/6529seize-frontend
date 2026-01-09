"use client";

import SubmissionCarousel from "./carousel/SubmissionCarousel";
import { NowMintingSection } from "./now-minting";
import { NextMintLeadingSection } from "./next-mint-leading";

export default function HomePageContent() {
  return (
    <div className="tw-py-8">
      <SubmissionCarousel />
      <NowMintingSection />
      <NextMintLeadingSection />
    </div>
  );
}
