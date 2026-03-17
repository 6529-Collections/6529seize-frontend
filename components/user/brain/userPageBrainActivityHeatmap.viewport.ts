import {
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { COLUMN_STRIDE_PX } from "./userPageBrainActivityHeatmap.helpers";

type ViewportMetrics = Readonly<{
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}>;

type MutableValueRef<T> = {
  current: T;
};

const EMPTY_VIEWPORT_METRICS: ViewportMetrics = {
  scrollLeft: 0,
  clientWidth: 0,
  scrollWidth: 0,
};

function snapViewportToLatest(viewport: HTMLDivElement | null) {
  if (!viewport) {
    return;
  }

  const maxScrollLeft = Math.max(
    0,
    viewport.scrollWidth - viewport.clientWidth
  );
  // Align to whole week columns so the latest visible edge does not land mid-cell.
  viewport.scrollLeft =
    Math.floor(maxScrollLeft / COLUMN_STRIDE_PX) * COLUMN_STRIDE_PX;
}

function readViewportMetrics(
  viewport: HTMLDivElement | null,
  cachedMetricsRef: MutableValueRef<ViewportMetrics>
): ViewportMetrics {
  if (!viewport) {
    return EMPTY_VIEWPORT_METRICS;
  }

  const nextMetrics = {
    scrollLeft: viewport.scrollLeft,
    clientWidth: viewport.clientWidth,
    scrollWidth: viewport.scrollWidth,
  } as const;
  const previousMetrics = cachedMetricsRef.current;

  if (
    previousMetrics.scrollLeft === nextMetrics.scrollLeft &&
    previousMetrics.clientWidth === nextMetrics.clientWidth &&
    previousMetrics.scrollWidth === nextMetrics.scrollWidth
  ) {
    return previousMetrics;
  }

  cachedMetricsRef.current = nextMetrics;
  return nextMetrics;
}

function subscribeToViewportMetrics(
  viewport: HTMLDivElement | null,
  onStoreChange: () => void
) {
  if (!viewport) {
    return () => {};
  }

  const content = viewport.firstElementChild;
  let frameId = 0;

  const notify = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(onStoreChange);
  };

  notify();
  viewport.addEventListener("scroll", notify, { passive: true });

  if (typeof ResizeObserver === "undefined") {
    window.addEventListener("resize", notify);

    return () => {
      cancelAnimationFrame(frameId);
      viewport.removeEventListener("scroll", notify);
      window.removeEventListener("resize", notify);
    };
  }

  const resizeObserver = new ResizeObserver(notify);
  resizeObserver.observe(viewport);
  if (content) {
    resizeObserver.observe(content);
  }

  return () => {
    cancelAnimationFrame(frameId);
    viewport.removeEventListener("scroll", notify);
    resizeObserver.disconnect();
  };
}

export function useHeatmapViewport(resetKey?: string) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cachedMetricsRef = useRef(EMPTY_VIEWPORT_METRICS);

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    cachedMetricsRef.current = EMPTY_VIEWPORT_METRICS;
  }, []);

  useLayoutEffect(() => {
    cachedMetricsRef.current = EMPTY_VIEWPORT_METRICS;
    snapViewportToLatest(viewportRef.current);
  }, [resetKey]);

  const getViewportSnapshot = useCallback(() => {
    return readViewportMetrics(viewportRef.current, cachedMetricsRef);
  }, []);

  const subscribeToViewport = useCallback((onStoreChange: () => void) => {
    return subscribeToViewportMetrics(viewportRef.current, onStoreChange);
  }, []);

  const viewportMetrics = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    () => EMPTY_VIEWPORT_METRICS
  );

  return { viewportRef: setViewportRef, viewportMetrics };
}
