"use client";

import { useCallback, useRef, useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import CarouselActiveItemDetails from "./carousel/CarouselActiveItemDetails";
import CarouselActiveItemVote from "./carousel/CarouselActiveItemVote";
import SubmissionCarousel, {
  type SubmissionCarouselHandle,
} from "./carousel/SubmissionCarousel";
import { CarouselHeader } from "./hero";

export default function SubmissionCarouselSection() {
  const [activeDrop, setActiveDrop] = useState<ExtendedDrop | null>(null);
  const carouselRef = useRef<SubmissionCarouselHandle>(null);
  const isPointerInsideRef = useRef(false);
  const isVotingModalOpenRef = useRef(false);
  const isAutoplayPausedRef = useRef(false);

  const updateAutoplayState = useCallback(() => {
    const shouldPause =
      isPointerInsideRef.current || isVotingModalOpenRef.current;
    if (shouldPause === isAutoplayPausedRef.current) {
      return;
    }
    isAutoplayPausedRef.current = shouldPause;
    if (shouldPause) {
      carouselRef.current?.pauseAutoplay();
    } else {
      carouselRef.current?.resumeAutoplay();
    }
  }, []);

  const handlePointerEnter = useCallback(() => {
    isPointerInsideRef.current = true;
    updateAutoplayState();
  }, [updateAutoplayState]);

  const handlePointerMove = useCallback(() => {
    if (isPointerInsideRef.current) {
      return;
    }
    isPointerInsideRef.current = true;
    updateAutoplayState();
  }, [updateAutoplayState]);

  const handlePointerLeave = useCallback(() => {
    isPointerInsideRef.current = false;
    updateAutoplayState();
  }, [updateAutoplayState]);

  const handleVoteOpen = useCallback(() => {
    isVotingModalOpenRef.current = true;
    updateAutoplayState();
  }, [updateAutoplayState]);

  const handleVoteClose = useCallback(() => {
    isVotingModalOpenRef.current = false;
    updateAutoplayState();
  }, [updateAutoplayState]);

  const handleCarouselRef = useCallback(
    (instance: SubmissionCarouselHandle | null) => {
      carouselRef.current = instance;
      updateAutoplayState();
    },
    [updateAutoplayState]
  );

  return (
    <div
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <section className="tw-grid tw-h-auto tw-grid-rows-[auto_1fr_auto] sm:tw-h-[100svh] [@media(min-height:1200px)]:tw-h-[min(100svh,900px)] [@media(min-width:768px)_and_(orientation:portrait)_and_(max-height:1199px)]:tw-h-auto [@media(min-width:768px)_and_(orientation:portrait)_and_(max-height:1199px)]:tw-grid-rows-[auto_auto_auto]">
        <CarouselHeader />
        <div className="tw-min-h-0 [@media(min-height:1200px)]:tw-max-h-[800px] [@media(min-width:768px)_and_(orientation:portrait)_and_(max-height:1199px)]:tw-h-[min(70svh,600px)]">
          <SubmissionCarousel
            ref={handleCarouselRef}
            onActiveDropChange={setActiveDrop}
          />
        </div>
        {activeDrop && (
          <CarouselActiveItemVote
            drop={activeDrop}
            onVoteOpen={handleVoteOpen}
            onVoteClose={handleVoteClose}
          />
        )}
      </section>
      <CarouselActiveItemDetails drop={activeDrop} />
    </div>
  );
}
