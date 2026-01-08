"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import SubmissionArtworkCard from "./SubmissionArtworkCard";
import CarouselArrow from "./CarouselArrow";

export default function SubmissionCarousel() {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const waveId = seizeSettings.memes_wave_id;

  const { drops, isFetching } = useWaveDropsLeaderboard({
    waveId: waveId ?? "",
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    pausePolling: !waveId,
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const dropsWithMedia = drops.filter(
    (drop) => (drop.parts[0]?.media.length ?? 0) > 0
  );

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
    setCanScrollRight(closestIndex < dropsWithMedia.length - 1);
  }, [dropsWithMedia.length]);

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

  const scrollToIndex = useCallback((index: number) => {
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

    track.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, []);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const newIndex =
        direction === "left"
          ? Math.max(0, activeIndex - 1)
          : Math.min(dropsWithMedia.length - 1, activeIndex + 1);
      scrollToIndex(newIndex);
    },
    [activeIndex, dropsWithMedia.length, scrollToIndex]
  );

  if (!isLoaded || !waveId) {
    return null;
  }

  if (isFetching && dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
        <div className="tw-text-sm tw-text-iron-500">Loading...</div>
      </div>
    );
  }

  if (dropsWithMedia.length === 0) {
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
        className="tw-flex tw-items-center tw-gap-6 tw-overflow-x-auto tw-scroll-smooth tw-py-12 tw-scrollbar-none"
        style={{
          paddingLeft: "calc(50% - 150px)",
          paddingRight: "calc(50% - 150px)",
        }}
      >
        {dropsWithMedia.map((drop, index) => {
          const isActive = index === activeIndex;
          const distance = Math.abs(index - activeIndex);
          const scale = isActive ? 1.15 : Math.max(0.75, 1 - distance * 0.1);

          return (
            <button
              type="button"
              key={drop.id}
              data-carousel-item
              onClick={() => scrollToIndex(index)}
              className="tw-flex-shrink-0 tw-rounded-xl tw-border-none tw-bg-transparent tw-p-0 tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              style={{
                width: "260px",
                transform: `scale(${scale})`,
                opacity: isActive ? 1 : 0.6,
                filter: isActive ? "none" : "grayscale(30%)",
                zIndex: isActive ? 10 : 10 - distance,
                transition:
                  "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
    </div>
  );
}
