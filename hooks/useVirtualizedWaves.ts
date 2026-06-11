"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

const SENTINEL_HEIGHT = 40;
type VirtualRowHeight<T> = number | ((item: T, index: number) => number);

interface VirtualLayout {
  readonly viewportHeight: number;
  readonly listOffset: number;
}

interface UseVirtualizedWavesOptions<T> {
  readonly items: readonly T[];
  readonly key: string;
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  readonly listContainerRef: React.RefObject<HTMLDivElement | null>;
  readonly rowHeight?: VirtualRowHeight<T> | undefined;
  readonly overscan?: number | undefined;
  readonly isActive?: boolean | undefined;
}

const restoreScrollPosition = (element: HTMLElement, top: number) => {
  if (typeof element.scrollTo === "function") {
    element.scrollTo({ top });
  }
};

const readVirtualLayout = (
  scrollContainer: HTMLElement | null,
  listContainer: HTMLDivElement | null
): VirtualLayout => ({
  viewportHeight: scrollContainer?.clientHeight ?? 0,
  listOffset: listContainer?.offsetTop ?? 0,
});

const areVirtualLayoutsEqual = (
  previousLayout: VirtualLayout,
  nextLayout: VirtualLayout
) =>
  previousLayout.viewportHeight === nextLayout.viewportHeight &&
  previousLayout.listOffset === nextLayout.listOffset;

const measureRows = <T>(
  items: readonly T[],
  rowHeight: VirtualRowHeight<T>
) => {
  const measurements: Omit<VirtualItem, "index">[] = [];
  let totalHeight = 0;

  let index = 0;
  for (const item of items) {
    const size =
      typeof rowHeight === "function" ? rowHeight(item, index) : rowHeight;

    measurements.push({
      start: totalHeight,
      size,
    });
    totalHeight += size;
    index += 1;
  }

  return {
    measurements,
    totalHeight,
  };
};

export function useVirtualizedWaves<T>({
  items,
  key,
  scrollContainerRef,
  listContainerRef,
  rowHeight = 72,
  overscan = 5,
  isActive = true,
}: UseVirtualizedWavesOptions<T>) {
  const { getPosition, setPosition } = useScrollPositionContext();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [layout, setLayout] = useState<VirtualLayout>({
    viewportHeight: 0,
    listOffset: 0,
  });

  const updateLayout = useCallback(() => {
    const nextLayout = readVirtualLayout(
      scrollContainerRef.current,
      listContainerRef.current
    );

    setLayout((previousLayout) =>
      areVirtualLayoutsEqual(previousLayout, nextLayout)
        ? previousLayout
        : nextLayout
    );
  }, [listContainerRef, scrollContainerRef]);

  const scheduleFrame = useCallback((callback: () => void) => {
    if (typeof globalThis.requestAnimationFrame === "function") {
      const id = globalThis.requestAnimationFrame(callback);
      return () => globalThis.cancelAnimationFrame(id);
    }

    const id = globalThis.setTimeout(callback, 16);
    return () => globalThis.clearTimeout(id);
  }, []);

  // Restore scroll position on mount
  useLayoutEffect(() => {
    if (!isActive) {
      return;
    }

    let isDisposed = false;
    let cancelScheduledFrame: (() => void) | null = null;
    let cleanupScrollBinding: (() => void) | null = null;

    const bindScrollContainer = () => {
      if (isDisposed || cleanupScrollBinding !== null) {
        return;
      }

      const el = scrollContainerRef.current;
      if (!el) {
        cancelScheduledFrame = scheduleFrame(bindScrollContainer);
        return;
      }

      restoreScrollPosition(el, getPosition(key));
      setScrollOffset(el.scrollTop);
      updateLayout();
      const onScroll = () => {
        setScrollOffset(el.scrollTop);
        setPosition(key, el.scrollTop);
        updateLayout();
      };
      el.addEventListener("scroll", onScroll);

      const canObserveResize = typeof globalThis.ResizeObserver === "function";
      const resizeObserver = canObserveResize
        ? new globalThis.ResizeObserver(updateLayout)
        : null;

      resizeObserver?.observe(el);
      if (listContainerRef.current !== null) {
        resizeObserver?.observe(listContainerRef.current);
      }

      cleanupScrollBinding = () => {
        setPosition(key, el.scrollTop);
        el.removeEventListener("scroll", onScroll);
        resizeObserver?.disconnect();
      };
    };

    bindScrollContainer();

    return () => {
      isDisposed = true;
      cancelScheduledFrame?.();
      cleanupScrollBinding?.();
    };
  }, [
    getPosition,
    isActive,
    key,
    listContainerRef,
    scheduleFrame,
    scrollContainerRef,
    setPosition,
    updateLayout,
  ]);

  const { measurements, totalHeight: measuredRowsHeight } = useMemo(
    () => measureRows(items, rowHeight),
    [items, rowHeight]
  );
  const visibleStart = Math.max(scrollOffset - layout.listOffset, 0);
  const visibleEnd = scrollOffset + layout.viewportHeight - layout.listOffset;
  const firstVisibleIndex = measurements.findIndex(
    (measurement) => measurement.start + measurement.size > visibleStart
  );
  const rawStartIndex =
    firstVisibleIndex === -1 ? items.length : firstVisibleIndex;
  let lastVisibleIndex = -1;
  for (let index = measurements.length - 1; index >= 0; index -= 1) {
    if ((measurements[index]?.start ?? 0) < visibleEnd) {
      lastVisibleIndex = index;
      break;
    }
  }
  const rawEndIndex =
    lastVisibleIndex === -1 ? rawStartIndex : lastVisibleIndex + 1;
  const startIndex = Math.max(rawStartIndex - overscan, 0);
  const endIndex = Math.min(rawEndIndex + overscan, items.length);

  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const measurement = measurements[i];
    if (measurement) {
      virtualItems.push({ index: i, ...measurement });
    }
  }

  // Sentinel item for infinite scrolling
  virtualItems.push({
    index: items.length,
    start: measuredRowsHeight,
    size: SENTINEL_HEIGHT,
  });

  const totalHeight = measuredRowsHeight + SENTINEL_HEIGHT;

  return {
    containerRef: scrollContainerRef,
    virtualItems,
    totalHeight,
    sentinelRef,
  };
}
