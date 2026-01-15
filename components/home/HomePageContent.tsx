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
    <div className="tw-border-r tw-border-solid tw-border-l-0 tw-border-y-0 tw-border-iron-900 tw-overflow-x-hidden">
      <section className="tw-grid tw-h-[100svh] tw-grid-rows-[auto_1fr_auto] tw-pt-8 tw-pb-4 [@media(min-height:1200px)]:tw-h-auto [@media(min-height:1200px)]:tw-grid-rows-[auto_auto_auto]">
        <HeroHeader />
        <div className="tw-min-h-0 [@media(min-height:1200px)]:tw-max-h-[800px]">
          <SubmissionCarousel onActiveDropChange={setActiveDrop} />
        </div>
        <CarouselActiveItemVote drop={activeDrop} />
      </section>
      <section className="tw-px-4 md:tw-px-6 lg:tw-px-8 tw-py-4">
        <CarouselActiveItemDetails drop={activeDrop} />
      </section>
      <div className="tw-pt-20 tw-pb-16">
        <NowMintingSection />
        <NextMintLeadingSection />
        <BoostedSection />
        <ExploreWavesSection />
      </div>
    </div>
  );
}
