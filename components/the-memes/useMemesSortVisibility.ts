import type { VolumeType } from "@/entities/INFT";
import type { MemesSort } from "@/types/enums";
import { useEffect, useRef } from "react";

export default function useMemesSortVisibility(
  sort: MemesSort,
  volumeType: VolumeType
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;

    const keepSelectedVisible = () => {
      if (scroller.scrollWidth <= scroller.clientWidth) return;
      const selected = scroller.querySelector<HTMLElement>(
        '[aria-pressed="true"]'
      );
      if (!selected) return;
      // Scroll only the horizontal strip; scrollIntoView also moves the page.
      const strip = scroller.getBoundingClientRect();
      const option = selected.getBoundingClientRect();
      if (option.left < strip.left + 12) {
        scroller.scrollLeft += option.left - strip.left - 12;
      } else if (option.right > strip.right - 28) {
        scroller.scrollLeft += option.right - strip.right + 28;
      }
    };

    keepSelectedVisible();
    const observer = new ResizeObserver(keepSelectedVisible);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [sort, volumeType]);

  return ref;
}
