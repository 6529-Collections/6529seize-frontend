"use client";

import { useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import SubmissionCarousel from "./carousel/SubmissionCarousel";
import CarouselActiveItemVote from "./carousel/CarouselActiveItemVote";
import CarouselActiveItemDetails from "./carousel/CarouselActiveItemDetails";
import { NowMintingSection } from "./now-minting";
import { NextMintLeadingSection } from "./next-mint-leading";
import { BoostedSection } from "./boosted";
import { ExploreWavesSection } from "./explore-waves";
import { HeroHeader } from "./hero";

export default function HomePageContent() {
  const [activeDrop, setActiveDrop] = useState<ExtendedDrop | null>(null);

  return (
    <div className="tw-px-8">
      <section className="tw-grid tw-h-screen tw-grid-rows-[auto_1fr_auto] tw-pt-6 tw-pb-4 tw-box-border">
        <HeroHeader />
        <div className="tw-min-h-0">
          <SubmissionCarousel onActiveDropChange={setActiveDrop} />
        </div>
        <CarouselActiveItemVote drop={activeDrop} />
      </section>
      <section className="tw-py-8">
        <CarouselActiveItemDetails drop={activeDrop} />
      </section>
      <div className="tw-py-8">
        <NowMintingSection />
        <NextMintLeadingSection />
        <BoostedSection />
        <ExploreWavesSection />
      </div>
    </div>
  );
}
