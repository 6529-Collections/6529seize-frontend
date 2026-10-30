"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

const SCROLL_IDLE_MS = 180;

/** Keep values live without moving cards underneath an active scroll gesture. */
export function useScrollStableLeaderboardItems<T>(
  items: readonly T[],
  getItemId: (item: T) => string,
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  windowKey: string
): readonly T[] {
  const latest = useRef({ items, getItemId });
  const [scrollOrder, setScrollOrder] = useState<{
    windowKey: string;
    ids: readonly string[];
  } | null>(null);
  useLayoutEffect(() => {
    latest.current = { items, getItemId };
  }, [items, getItemId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let touching = false;
    const retainOrder = () => {
      const snapshot = latest.current;
      setScrollOrder((current) =>
        current?.windowKey === windowKey
          ? current
          : {
              windowKey,
              ids: snapshot.items.map(snapshot.getItemId),
            }
      );
    };
    const settle = () => {
      clearTimeout(timer);
      if (!touching)
        timer = setTimeout(() => setScrollOrder(null), SCROLL_IDLE_MS);
    };
    const scroll = () => {
      retainOrder();
      settle();
    };
    const touchStart = () => {
      touching = true;
      clearTimeout(timer);
      retainOrder();
    };
    const touchEnd = () => {
      touching = false;
      settle();
    };
    // Keep scores/ranks live for the entire gesture. A maximum retention timer
    // would move cards under an uninterrupted scroll. scrollend reconciles as
    // soon as wheel/trackpad/momentum scrolling ends; the idle timer is a fallback.
    const scrollEnd = () => {
      clearTimeout(timer);
      if (!touching) setScrollOrder(null);
    };
    container.addEventListener("scroll", scroll, { passive: true });
    container.addEventListener("scrollend", scrollEnd, { passive: true });
    container.addEventListener("touchstart", touchStart, { passive: true });
    container.addEventListener("touchend", touchEnd, { passive: true });
    container.addEventListener("touchcancel", touchEnd, { passive: true });
    return () => {
      clearTimeout(timer);
      container.removeEventListener("scroll", scroll);
      container.removeEventListener("scrollend", scrollEnd);
      container.removeEventListener("touchstart", touchStart);
      container.removeEventListener("touchend", touchEnd);
      container.removeEventListener("touchcancel", touchEnd);
    };
  }, [scrollContainerRef, windowKey]);

  return useMemo(() => {
    if (scrollOrder?.windowKey !== windowKey) return items;
    const remaining = new Map(items.map((item) => [getItemId(item), item]));
    const ordered: T[] = [];
    for (const id of scrollOrder.ids) {
      const item = remaining.get(id);
      if (item !== undefined) ordered.push(item);
      remaining.delete(id);
    }
    // Visibility removals apply immediately; new entries can appear at the end
    // until the gesture settles. Never reuse stale card data.
    return [...ordered, ...remaining.values()];
  }, [items, getItemId, scrollOrder, windowKey]);
}
