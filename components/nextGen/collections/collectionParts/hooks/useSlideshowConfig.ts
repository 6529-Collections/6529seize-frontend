import { useCallback, useEffect, useState } from "react";

interface UseSlideshowConfigReturn {
  slidesPerView: number;
}

export function useSlideshowConfig(): UseSlideshowConfigReturn {
  const getSlidesPerView = useCallback(() => {
    if (window.innerWidth > 1200) {
      return 4;
    } else if (window.innerWidth > 500) {
      return 2;
    }
    return 1;
  }, []);

  const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(getSlidesPerView());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getSlidesPerView]);

  return {
    slidesPerView,
  };
}