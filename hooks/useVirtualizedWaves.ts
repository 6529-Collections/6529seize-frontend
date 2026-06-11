"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

const SENTINEL_HEIGHT = 40;
type VirtualRowHeight<T> = number | ((item: T, index: number) => number);

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

const measureRows = <T>(items: readonly T[], rowHeight: VirtualRowHeight<T>) =>
  items.reduce<{
    readonly measurements: readonly Omit<VirtualItem, "index">[];
    readonly totalHeight: number;
  }>(
    (state, item, index) => {
      const size =
        typeof rowHeight === "function" ? rowHeight(item, index) : rowHeight;

      return {
        measurements: [
          ...state.measurements,
          {
            start: state.totalHeight,
            size,
          },
        ],
        totalHeight: state.totalHeight + size,
      };
    },
    {
      measurements: [],
      totalHeight: 0,
    }
  );

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

  // Restore scroll position on mount
  useEffect(() => {
    if (!isActive) {
      return;
    }
    const el = scrollContainerRef.current;
    if (!el) return;

    restoreScrollPosition(el, getPosition(key));
    const onScroll = () => {
      setScrollOffset(el.scrollTop);
      setPosition(key, el.scrollTop);
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      setPosition(key, el.scrollTop);
      el.removeEventListener("scroll", onScroll);
    };
  }, [getPosition, setPosition, key, scrollContainerRef, isActive]);

  const viewportHeight = scrollContainerRef.current?.clientHeight ?? 0;
  const listOffset = listContainerRef.current?.offsetTop ?? 0;
  const { measurements, totalHeight: measuredRowsHeight } = useMemo(
    () => measureRows(items, rowHeight),
    [items, rowHeight]
  );
  const visibleStart = Math.max(scrollOffset - listOffset, 0);
  const visibleEnd = scrollOffset + viewportHeight - listOffset;
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
