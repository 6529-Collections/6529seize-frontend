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
const EMPTY_TOKENS: NextGenToken[] = [];

interface TokenSlideshowProps {
  readonly collectionId: number;
  readonly initialTokens?: NextGenToken[] | undefined;
}

export default function TokenSlideshow({
  collectionId,
  initialTokens = EMPTY_TOKENS,
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
    <div ref={swiperContainerRef} className="tw-w-full">
      <Swiper
        className="[&_.swiper-button-next:active]:tw-translate-y-0 [&_.swiper-button-next:active]:tw-scale-100 [&_.swiper-button-next:active_svg]:tw-bg-white/15 [&_.swiper-button-next:focus-visible]:tw-outline-none [&_.swiper-button-next:focus-visible]:tw-ring-2 [&_.swiper-button-next:focus-visible]:tw-ring-inset [&_.swiper-button-next:focus-visible]:tw-ring-primary-400 [&_.swiper-button-next:hover]:-tw-translate-y-0.5 [&_.swiper-button-next:hover]:tw-scale-105 [&_.swiper-button-next:hover]:!tw-text-white [&_.swiper-button-next:hover_svg]:tw-bg-white/10 [&_.swiper-button-next]:!tw-bottom-0 [&_.swiper-button-next]:tw-h-11 [&_.swiper-button-next]:tw-w-11 [&_.swiper-button-next]:!tw-text-iron-400 [&_.swiper-button-next]:tw-transition [&_.swiper-button-next]:tw-duration-200 [&_.swiper-button-next]:motion-reduce:tw-transform-none [&_.swiper-button-next_svg]:tw-h-9 [&_.swiper-button-next_svg]:tw-w-9 [&_.swiper-button-next_svg]:tw-rounded-full [&_.swiper-button-next_svg]:tw-p-2 [&_.swiper-button-next_svg]:tw-transition-colors [&_.swiper-button-prev:active]:tw-translate-y-0 [&_.swiper-button-prev:active]:tw-scale-100 [&_.swiper-button-prev:active_svg]:tw-bg-white/15 [&_.swiper-button-prev:focus-visible]:tw-outline-none [&_.swiper-button-prev:focus-visible]:tw-ring-2 [&_.swiper-button-prev:focus-visible]:tw-ring-inset [&_.swiper-button-prev:focus-visible]:tw-ring-primary-400 [&_.swiper-button-prev:hover]:-tw-translate-y-0.5 [&_.swiper-button-prev:hover]:tw-scale-105 [&_.swiper-button-prev:hover]:!tw-text-white [&_.swiper-button-prev:hover_svg]:tw-bg-white/10 [&_.swiper-button-prev]:!tw-bottom-0 [&_.swiper-button-prev]:tw-h-11 [&_.swiper-button-prev]:tw-w-11 [&_.swiper-button-prev]:!tw-text-iron-400 [&_.swiper-button-prev]:tw-transition [&_.swiper-button-prev]:tw-duration-200 [&_.swiper-button-prev]:motion-reduce:tw-transform-none [&_.swiper-button-prev_svg]:tw-h-9 [&_.swiper-button-prev_svg]:tw-w-9 [&_.swiper-button-prev_svg]:tw-rounded-full [&_.swiper-button-prev_svg]:tw-p-2 [&_.swiper-button-prev_svg]:tw-transition-colors [&_.swiper-slide-active_.nextgen-slideshow-token-label]:!tw-text-white [&_.swiper-slide-active_img]:!tw-opacity-100 [&_.swiper-slide:hover_.nextgen-slideshow-token-label]:!tw-text-white [&_.swiper-slide_img]:tw-opacity-75 [&_.swiper-slide_img]:tw-transition-[transform,opacity] [&_.swiper-slide_img]:tw-duration-300 [&_.swiper-slide_img]:motion-reduce:tw-transition-none [&_.swiper-slide_img:hover]:!tw-opacity-100"
        modules={[Navigation, A11y, Autoplay]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
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
            className="tw-select-none tw-pb-6 tw-pt-4"
          >
            <MemoizedTokenImage
              token={token}
              info_class="nextgen-slideshow-token-label tw-text-sm tw-text-iron-400 tw-transition-colors tw-duration-200"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
