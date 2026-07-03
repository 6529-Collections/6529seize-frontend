"use client";

import { memo, useRef } from "react";
import { A11y, Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { NextGenToken } from "@/entities/INextgen";
import { NextGenTokenImage } from "@/components/nextGen/collections/nextgenToken/NextGenTokenImage";
import SwiperAutoplayButton from "./SwiperAutoplayButton";
import { useTokenSlideshow } from "./useTokenSlideshow";
import { useSlideshowConfig } from "./useSlideshowConfig";
import { useSlideshowAutoplay } from "./useSlideshowAutoplay";

// Memoized image component to prevent re-downloads on parent re-renders
const MemoizedTokenImage = memo(NextGenTokenImage);

interface TokenSlideshowProps {
  readonly collectionId: number;
  readonly initialTokens?: NextGenToken[] | undefined;
}

export default function TokenSlideshow({
  collectionId,
  initialTokens = [],
}: TokenSlideshowProps) {
  const swiperContainerRef = useRef<HTMLDivElement>(null);
  const { displayTokens, onSlideChange } = useTokenSlideshow(
    collectionId,
    initialTokens
  );
  const { slidesPerView } = useSlideshowConfig();
  const { isInViewport, setSwiperInstance } =
    useSlideshowAutoplay(swiperContainerRef);
  return (
    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
        <div ref={swiperContainerRef}>
          <Swiper
            modules={[Navigation, A11y, Autoplay]}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            initialSlide={2}
            spaceBetween={20}
            slidesPerView={Math.min(slidesPerView, displayTokens.length)}
            navigation
            centeredSlides
            pagination={{ clickable: true }}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => {
              onSlideChange(swiper.realIndex);
            }}
          >
            {displayTokens.length > 1 && (
              <SwiperAutoplayButton isInViewport={isInViewport} />
            )}
            {displayTokens.map((token, index) => (
              <SwiperSlide
                key={`${token.id}-${index}`}
                className="tw-select-none tw-pb-6 tw-pt-6"
              >
                <MemoizedTokenImage token={token} info_class="tw-text-sm" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}
