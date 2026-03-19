"use client";

import React, { forwardRef, useCallback, useRef } from "react";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";

const TOP_SENTINEL_ROOT_MARGIN = "200px 0px 0px 0px";

interface WaveDropsReverseContainerProps {
  readonly children: React.ReactNode;
  readonly onTopIntersection: () => void;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly bottomPaddingClassName?: string | undefined;
  readonly containerClassName?: string | undefined;
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
      bottomPaddingClassName,
      containerClassName,
    },
    ref
  ) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);

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
        rootMargin: TOP_SENTINEL_ROOT_MARGIN,
        threshold: 0,
      },
      handleIntersection,
      !!scrollContainerRef.current
    );

    React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

    return (
      <div
        ref={scrollContainerRef}
        className={`tw-min-h-0 tw-flex-1 ${
          bottomPaddingClassName ?? "tw-pb-6"
        } no-scrollbar tw-flex tw-flex-col-reverse tw-overflow-y-auto tw-overflow-x-hidden tw-bg-iron-950 tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 lg:tw-scrollbar-thin ${containerClassName ?? ""}`}
      >
        <div className="tw-flex tw-flex-col">
          {hasNextPage && isFetchingNextPage && (
            <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
              <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400"></div>
            </div>
          )}
          {children}
        </div>
        <div ref={topSentinelRef} style={{ height: "1px" }} />
      </div>
    );
  }
);

WaveDropsReverseContainer.displayName = "WaveDropsReverseContainer";
