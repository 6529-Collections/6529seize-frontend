"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

const SENTINEL_HEIGHT = 40;

export function useVirtualizedWaves<T>(
  items: readonly T[],
  key: string,
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  listContainerRef: React.RefObject<HTMLDivElement | null>,
  rowHeight = 72,
  overscan = 5
) {
  const { getPosition, setPosition } = useScrollPositionContext();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Restore scroll position on mount
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = getPosition(key);
      const onScroll = () => {
        setScrollOffset(el.scrollTop);
        setPosition(key, el.scrollTop);
      };
      el.addEventListener("scroll", onScroll);
      return () => {
        setPosition(key, el.scrollTop);
        el.removeEventListener("scroll", onScroll);
      };
    }
  }, [getPosition, setPosition, key, scrollContainerRef]);

  const viewportHeight = scrollContainerRef.current?.clientHeight ?? 0;
  const listOffset = listContainerRef.current?.offsetTop ?? 0;
  const startIndex = Math.max(
    Math.floor((scrollOffset - listOffset) / rowHeight) - overscan,
    0
  );
  const endIndex = Math.min(
    Math.ceil((scrollOffset + viewportHeight) / rowHeight) + overscan,
    items.length
  );

  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    virtualItems.push({ index: i, start: i * rowHeight, size: rowHeight });
  }

  // Sentinel item for infinite scrolling
  virtualItems.push({
    index: items.length,
    start: items.length * rowHeight,
    size: SENTINEL_HEIGHT,
  });

  const totalHeight = items.length * rowHeight + SENTINEL_HEIGHT;

  return {
    containerRef: scrollContainerRef,
    virtualItems,
    totalHeight,
    sentinelRef,
  };
}
