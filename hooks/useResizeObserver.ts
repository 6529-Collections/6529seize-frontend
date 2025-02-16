import { useEffect, useRef } from "react";

export function useResizeMeasure(
  onResize: (element: HTMLElement, newHeight: number) => void
) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    let lastHeight = element.offsetHeight;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // If you only observe one element, you can just read entry.contentRect
        if (entry.target === element) {
          const newHeight = Math.round(entry.contentRect.height);
          // Compare to avoid calling measure() on every 1px repaint
          if (newHeight !== lastHeight) {
            lastHeight = newHeight;
            onResize(element, newHeight);
          }
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onResize]);

  return ref;
}
