import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";

export function usePersistentScrollOffset(
  scrollKey: string,
  scrollContainerRef: RefObject<HTMLDivElement | null>
): number {
  const { getPosition, setPosition } = useScrollPositionContext();
  const [initialOffset] = useState(() => getPosition(scrollKey));

  const persistScrollPosition = useEffectEvent(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setPosition(scrollKey, container.scrollTop);
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      persistScrollPosition();
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      persistScrollPosition();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [persistScrollPosition, scrollKey]);

  return initialOffset;
}
