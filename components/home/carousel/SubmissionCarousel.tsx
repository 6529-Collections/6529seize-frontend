"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import SubmissionArtworkCard from "./SubmissionArtworkCard";
import CarouselArrow from "./CarouselArrow";
import CarouselActiveItemDetails from "./CarouselActiveItemDetails";

export default function SubmissionCarousel() {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const waveId = seizeSettings.memes_wave_id;

  const { drops, isFetching } = useWaveDropsLeaderboard({
    waveId: waveId ?? "",
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    pausePolling: !waveId,
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolled = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const shuffledDrops = useMemo(() => {
    const filtered = drops.filter(
      (drop) => (drop.parts[0]?.media.length ?? 0) > 0
    );
    // Fisher-Yates shuffle
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [drops]);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll<HTMLDivElement>(
      "[data-carousel-item]"
    );
    if (cards.length === 0) return;

    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(trackCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
    setCanScrollLeft(closestIndex > 0);
    setCanScrollRight(closestIndex < shuffledDrops.length - 1);
  }, [shuffledDrops.length]);

  const scrollToIndex = useCallback((index: number, instant = false) => {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll<HTMLDivElement>(
      "[data-carousel-item]"
    );
    const card = cards[index];
    if (!card) return;

    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const scrollLeft =
      card.offsetLeft - trackRect.width / 2 + cardRect.width / 2;

    track.scrollTo({
      left: scrollLeft,
      behavior: instant ? "instant" : "smooth",
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex);
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [updateActiveIndex, drops]);

  // Scroll to second item on initial load (instant, no animation)
  useEffect(() => {
    if (shuffledDrops.length > 1 && !hasInitialScrolled.current) {
      hasInitialScrolled.current = true;
      requestAnimationFrame(() => {
        scrollToIndex(1, true);
      });
    }
  }, [shuffledDrops.length, scrollToIndex]);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const newIndex =
        direction === "left"
          ? Math.max(0, activeIndex - 1)
          : Math.min(shuffledDrops.length - 1, activeIndex + 1);
      scrollToIndex(newIndex);
    },
    [activeIndex, shuffledDrops.length, scrollToIndex]
  );

  if (!isLoaded || !waveId) {
    return null;
  }

  if (isFetching && shuffledDrops.length === 0) {
    return (
      <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
        <div className="tw-text-sm tw-text-iron-500">Loading...</div>
      </div>
    );
  }

  if (shuffledDrops.length === 0) {
    return null;
  }

  return (
    <div className="tw-relative tw-@container">
      <CarouselArrow
        direction="left"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
      />

      <div
        ref={trackRef}
        className="tw-flex tw-items-center tw-overflow-x-auto tw-scroll-smooth tw-scrollbar-none"
        style={{
          gap: "16px",
          paddingLeft: "calc(50% - 175px)",
          paddingRight: "calc(50% - 175px)",
        }}
      >
        {shuffledDrops.map((drop, index) => {
          const isActive = index === activeIndex;
          const distance = Math.abs(index - activeIndex);

          return (
            <button
              type="button"
              key={drop.id}
              data-carousel-item
              onClick={() => scrollToIndex(index)}
              className="tw-flex-shrink-0 tw-rounded-xl tw-border-none tw-bg-transparent tw-p-0 tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              style={{
                width: "350px",
                transform: `scale(${isActive ? 1 : 0.85})`,
                opacity: isActive ? 1 : 0.4,
                filter: isActive ? "none" : "grayscale(50%)",
                zIndex: isActive ? 10 : 10 - distance,
                transition:
                  "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.4s cubic-bezier(0.33, 1, 0.68, 1), filter 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
              }}
            >
              <SubmissionArtworkCard drop={drop} />
            </button>
          );
        })}
      </div>

      <CarouselArrow
        direction="right"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
      />

      <CarouselActiveItemDetails
        drop={shuffledDrops[activeIndex] ?? shuffledDrops[0] ?? null}
      />
    </div>
  );
}
