"use client";

import { useState, useRef, useCallback } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import SubmissionCarousel, { type SubmissionCarouselHandle } from "./carousel/SubmissionCarousel";
import CarouselActiveItemVote from "./carousel/CarouselActiveItemVote";
import CarouselActiveItemDetails from "./carousel/CarouselActiveItemDetails";
import { NowMintingSection } from "./now-minting";
import { NextMintLeadingSection } from "./next-mint-leading";
import { BoostedSection } from "./boosted";
import { ExploreWavesSection } from "./explore-waves";
import { CarouselHeader, HeroHeader } from "./hero";

export default function HomePageContent() {
  const [activeDrop, setActiveDrop] = useState<ExtendedDrop | null>(null);
  const carouselRef = useRef<SubmissionCarouselHandle>(null);

  const pauseAutoplay = useCallback(() => carouselRef.current?.pauseAutoplay(), []);
  const resumeAutoplay = useCallback(() => carouselRef.current?.resumeAutoplay(), []);

  return (
    <div className="tw-overflow-x-hidden tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900">
      <HeroHeader />
      <NowMintingSection />
      <section
        className="tw-grid tw-h-auto tw-grid-rows-[auto_1fr_auto] sm:tw-h-[100svh] [@media(min-width:768px)_and_(orientation:portrait)_and_(max-height:1199px)]:tw-h-auto [@media(min-width:768px)_and_(orientation:portrait)_and_(max-height:1199px)]:tw-grid-rows-[auto_auto_auto] [@media(min-height:1200px)]:tw-h-auto [@media(min-height:1200px)]:tw-grid-rows-[auto_auto_auto]"
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
      >
        <CarouselHeader />
        <div className="tw-min-h-0 [@media(min-width:768px)_and_(orientation:portrait)_and_(max-height:1199px)]:tw-h-[min(70svh,600px)] [@media(min-height:1200px)]:tw-max-h-[800px]">
          <SubmissionCarousel ref={carouselRef} onActiveDropChange={setActiveDrop} />
        </div>
        <CarouselActiveItemVote drop={activeDrop} />
      </section>
      <div onMouseEnter={pauseAutoplay} onMouseLeave={resumeAutoplay}>
        <CarouselActiveItemDetails drop={activeDrop} />
      </div>
      <div className="tw-mt-10 md:tw-mt-16 tw-border tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 md:tw-pt-16">
        <NextMintLeadingSection />
        <BoostedSection />
        <ExploreWavesSection />
      </div>
    </div>
  );
}
