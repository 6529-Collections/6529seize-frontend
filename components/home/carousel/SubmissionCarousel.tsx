"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
} from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import SubmissionArtworkCard from "./SubmissionArtworkCard";
import CarouselArrow from "./CarouselArrow";

interface SubmissionCarouselProps {
  readonly onActiveDropChange?: (drop: ExtendedDrop | null) => void;
}

export default function SubmissionCarousel({
  onActiveDropChange,
}: SubmissionCarouselProps) {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const waveId = seizeSettings.memes_wave_id;

  const { drops, isFetching } = useWaveDropsLeaderboard({
    waveId: waveId ?? "",
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    pausePolling: !waveId,
  });

  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const cardGap = 4;
  const inactiveScale = 0.68;
  const slideTransition =
    "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s cubic-bezier(0.25, 1, 0.5, 1)";
  const inactiveFilter = "grayscale(100%) blur(6px)";
  const slideWidth = "var(--carousel-card-width)";
  const carouselVars = {
    "--carousel-inactive-scale": `${inactiveScale}`,
    "--carousel-gap": `${cardGap}px`,
    "--carousel-arrow-offset":
      "calc((var(--carousel-card-width) / 2) + var(--carousel-gap) + (var(--carousel-card-width) * var(--carousel-inactive-scale) / 2))",
  } as CSSProperties;

  const shuffledDrops = useMemo(() => {
    const filtered = drops.filter(
      (drop) => (drop.parts[0]?.media.length ?? 0) > 0
    );
    // Deterministic shuffle using hash of drop ID for stable ordering
    const hashCode = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };
    return [...filtered].sort((a, b) => hashCode(a.id) - hashCode(b.id));
  }, [drops]);

  const activeDrop = useMemo(
    () => shuffledDrops[activeIndex] ?? shuffledDrops[0] ?? null,
    [activeIndex, shuffledDrops]
  );

  const handleSlideChange = useCallback((swiper: SwiperInstance) => {
    setActiveIndex(swiper.activeIndex);
    setCanScrollLeft(!swiper.isBeginning);
    setCanScrollRight(!swiper.isEnd);
  }, []);

  useEffect(() => {
    onActiveDropChange?.(activeDrop);
  }, [activeDrop, onActiveDropChange]);

  useEffect(() => {
    if (activeIndex >= shuffledDrops.length && shuffledDrops.length > 0) {
      setActiveIndex(0);
      swiperRef.current?.slideTo(0, 0);
    }
  }, [activeIndex, shuffledDrops.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    if (direction === "left") {
      swiper.slidePrev();
    } else {
      swiper.slideNext();
    }
  }, []);
  const showArrows = true;

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
    <div
      className="tw-relative tw-h-full tw-min-h-0 tw-@container [--carousel-card-width:clamp(220px,80%,440px)] md:[--carousel-card-width:clamp(160px,50%,440px)]"
      style={carouselVars}
    >
      <div className="tw-mx-auto tw-flex tw-h-full tw-w-full tw-flex-col">
        {showArrows && (
          <div className="tw-mb-3 lg:tw-mb-2 tw-flex tw-items-center tw-gap-x-4 tw-justify-end md:tw-justify-between tw-px-6 md:tw-hidden">
            <CarouselArrow
              direction="left"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              placement="inline"
              className="tw-p-2"
            />
            <CarouselArrow
              direction="right"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              placement="inline"
              className="tw-p-2"
            />
          </div>
        )}

        <div className="tw-relative tw-min-h-0 tw-flex-1 tw-overflow-hidden">
          {showArrows && (
            <CarouselArrow
              direction="left"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="tw-hidden md:tw-flex"
              style={{ left: "calc(50% - var(--carousel-arrow-offset))" }}
            />
          )}

          <Swiper
            className="submission-carousel-swiper tw-h-full tw-overflow-hidden"
            modules={[Autoplay]}
            slidesPerView="auto"
            centeredSlides
            spaceBetween={cardGap}
            speed={450}
            initialSlide={0}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              handleSlideChange(swiper);
            }}
            onSlideChange={handleSlideChange}
          >
          {shuffledDrops.map((drop, index) => {
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);

            return (
              <SwiperSlide
                key={drop.id}
                className="tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-visible"
                style={{ width: slideWidth }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => swiperRef.current?.slideTo(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      swiperRef.current?.slideTo(index);
                    }
                  }}
                  className="tw-h-auto tw-w-full tw-aspect-[4/5] tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 md:tw-aspect-auto md:tw-h-full"
                  style={{
                    opacity: isActive ? 1 : 0.22,
                    filter: isActive ? "none" : inactiveFilter,
                    zIndex: isActive ? 10 : 10 - distance,
                    transition: slideTransition,
                    transform: isActive
                      ? "translate3d(0, -8px, 0) scale(1)"
                      : `translate3d(0, 0, 0) scale(${inactiveScale})`,
                    transformOrigin: "center",
                    willChange: distance <= 1 ? "transform, opacity" : "auto",
                  }}
                >
                  <SubmissionArtworkCard drop={drop} isActive={isActive} />
                </div>
              </SwiperSlide>
            );
          })}
          </Swiper>

          {showArrows && (
            <CarouselArrow
              direction="right"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="tw-hidden md:tw-flex"
              style={{ left: "calc(50% + var(--carousel-arrow-offset))" }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
