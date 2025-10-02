import { useEffect, useState, RefObject } from "react";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";

interface UseSlideshowAutoplayReturn {
  isInViewport: boolean;
  setSwiperInstance: (swiper: any) => void;
}

export function useSlideshowAutoplay(
  slideshowRef: RefObject<HTMLDivElement | null>
): UseSlideshowAutoplayReturn {
  const [isInViewport, setIsInViewport] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  useIntersectionObserver(slideshowRef, { threshold: 0.3 }, (entry) =>
    setIsInViewport(entry.isIntersecting)
  );

  // Stop autoplay initially when swiper is created
  useEffect(() => {
    if (swiperInstance?.autoplay) {
      swiperInstance.autoplay.stop();
    }
  }, [swiperInstance]);

  // Control autoplay based on viewport visibility
  useEffect(() => {
    if (swiperInstance?.autoplay) {
      if (isInViewport) {
        swiperInstance.autoplay.start();
      } else {
        swiperInstance.autoplay.stop();
      }
    }
  }, [isInViewport, swiperInstance]);

  return {
    isInViewport,
    setSwiperInstance,
  };
}