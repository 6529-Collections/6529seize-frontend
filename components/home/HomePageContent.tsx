"use client";

import SubmissionCarousel from "./carousel/SubmissionCarousel";
import { NowMintingSection } from "./now-minting";

export default function HomePageContent() {
  return (
    <div className="tw-py-8">
      <SubmissionCarousel />
      <NowMintingSection />
    </div>
  );
}
