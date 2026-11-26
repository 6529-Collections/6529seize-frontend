import {
  useEffectEvent,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";
import { usePhoneNavigationScreenActive } from "@/contexts/PhoneNavigationScreenContext";

export function usePersistentScrollOffset(
  scrollKey: string,
  scrollContainerRef: RefObject<HTMLElement | null>
): number {
  const { getPosition, setPosition } = useScrollPositionContext();
  const screenActive = usePhoneNavigationScreenActive();
  const [initialOffset] = useState(() => getPosition(scrollKey));

  const persistScrollPosition = useEffectEvent((container: HTMLElement) => {
    setPosition(scrollKey, container.scrollTop);
  });

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !screenActive) {
      return;
    }

    const handleScroll = () => {
      persistScrollPosition(container);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      // Save while the scrollport is still attached; detached nodes can report zero.
      persistScrollPosition(container);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [screenActive, scrollContainerRef, scrollKey]);

  return initialOffset;
}
