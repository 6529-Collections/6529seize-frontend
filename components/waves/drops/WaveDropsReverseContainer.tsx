"use client";

import React, { forwardRef, useRef, useEffect, useCallback } from "react";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";


interface WaveDropsReverseContainerProps {
  readonly children: React.ReactNode;
  readonly onTopIntersection: () => void;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly onUserScroll?: (
    direction: "up" | "down",
    isAtBottom: boolean
  ) => void;
}

export const WaveDropsReverseContainer = forwardRef<
  HTMLDivElement,
  WaveDropsReverseContainerProps
>(
  (
    {
      children,
      onTopIntersection,
      isFetchingNextPage,
      hasNextPage,
      onUserScroll,
    },
    ref
  ) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);
    const isAtBottom = useRef<boolean>(true);
    const scrollRafId = useRef<number | null>(null);

    const handleIntersection = useCallback(
      (entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          onTopIntersection();
        }
      },
      [onTopIntersection]
    );

    useIntersectionObserver(
      topSentinelRef,
      {
        root: scrollContainerRef.current,
        rootMargin: "1px 0px 0px 0px",
        threshold: 0,
      },
      handleIntersection,
      !!scrollContainerRef.current
    );

    const handleScroll = useCallback(() => {
      if (scrollRafId.current) {
        cancelAnimationFrame(scrollRafId.current);
      }
      scrollRafId.current = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const { scrollTop } = container;
        // In a flex-col-reverse container, we're at the visual bottom when scrollTop is near 0
        const currentIsAtBottom = scrollTop > -5;
        isAtBottom.current = currentIsAtBottom;
        // In a flex-col-reverse container, scrolling "up" means the scrollTop is increasing
        // and scrolling "down" means the scrollTop is decreasing
        const direction = scrollTop < lastScrollTop.current ? "up" : "down";
        onUserScroll?.(direction, currentIsAtBottom);
        lastScrollTop.current = scrollTop;
        scrollRafId.current = null;
      });
    }, [onUserScroll]);

    // Cleanup for any pending animation frames
    useEffect(() => {
      return () => {
        if (scrollRafId.current) {
          cancelAnimationFrame(scrollRafId.current);
        }
      };
    }, []);

    React.useImperativeHandle(ref, () => scrollContainerRef.current!);

    return (
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="tw-pb-6 tw-bg-iron-950 tw-flex tw-flex-col-reverse tw-overflow-y-auto tw-overflow-x-hidden no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
      >
        <div className="tw-flex tw-flex-col-reverse">
          {children}
          {hasNextPage && isFetchingNextPage && (
            <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
              <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
            </div>
          )}
        </div>
        <div ref={topSentinelRef} style={{ height: "1px" }} />
      </div>
    );
  });

WaveDropsReverseContainer.displayName = "WaveDropsReverseContainer";
