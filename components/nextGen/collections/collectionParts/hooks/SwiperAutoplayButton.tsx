"use client";

import { faPauseCircle, faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useSwiper } from "swiper/react";
import useCapacitor from "../../../../../hooks/useCapacitor";

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
    <div className="text-center">
      <FontAwesomeIcon
        style={{ height: "24px", cursor: "pointer" }}
        onClick={() => {
          setManuallyPaused(!manuallyPaused);
        }}
        icon={manuallyPaused ? faPlayCircle : faPauseCircle}
      />
    </div>
  );
}