"use client";

import { faPauseCircle, faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useSwiper } from "swiper/react";
import useCapacitor from "@/hooks/useCapacitor";

interface SwiperAutoplayButtonProps {
  readonly isInViewport: boolean;
}

export default function SwiperAutoplayButton({
  isInViewport,
}: SwiperAutoplayButtonProps) {
  const swiper = useSwiper();
  const { isCapacitor } = useCapacitor();
  const [manuallyPaused, setManuallyPaused] = useState(isCapacitor);

  useEffect(() => {
    if (manuallyPaused || !isInViewport) {
      swiper.autoplay.stop();
    } else if (isInViewport && !manuallyPaused) {
      swiper.autoplay.start();
    }
  }, [manuallyPaused, isInViewport, swiper.autoplay]);

  return (
    <div className="tw-flex tw-h-11 tw-items-center tw-justify-center tw-text-center">
      <button
        type="button"
        aria-label={manuallyPaused ? "Play slideshow" : "Pause slideshow"}
        className="tw-inline-flex tw-min-h-11 tw-min-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-100 tw-transition hover:tw-bg-white/10 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
        onClick={() => {
          setManuallyPaused(!manuallyPaused);
        }}
      >
        <FontAwesomeIcon
          className="tw-h-8 tw-w-8"
          icon={manuallyPaused ? faPlayCircle : faPauseCircle}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
