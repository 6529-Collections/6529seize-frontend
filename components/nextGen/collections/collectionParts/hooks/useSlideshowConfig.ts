import { useSyncExternalStore } from "react";

interface UseSlideshowConfigReturn {
  slidesPerView: number;
}

const getServerSnapshot = () => 1;

function getSnapshot(): number {
  if (window.innerWidth > 1200) return 3.5;
  if (window.innerWidth > 500) return 2;
  return 1;
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useSlideshowConfig(): UseSlideshowConfigReturn {
  const slidesPerView = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    slidesPerView,
  };
}
