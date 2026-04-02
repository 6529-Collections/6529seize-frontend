import { useCallback, useLayoutEffect, useRef } from "react";

function snapViewportToLatest(viewport: HTMLDivElement | null) {
  if (!viewport) {
    return;
  }

  const maxScrollLeft = Math.max(
    0,
    viewport.scrollWidth - viewport.clientWidth
  );
  // Show the latest column fully, even when the viewport width is not aligned to a column stride.
  viewport.scrollLeft = maxScrollLeft;
}

export function useHeatmapViewport(resetKey?: string) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
  }, []);

  useLayoutEffect(() => {
    snapViewportToLatest(viewportRef.current);
  }, [resetKey]);

  return { viewportRef: setViewportRef };
}
