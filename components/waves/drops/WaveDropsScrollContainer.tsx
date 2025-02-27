import React, { forwardRef, useRef, useEffect, useState } from "react";

interface WaveDropsScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
  readonly onTopIntersection: () => void;
  readonly newItemsCount: number;
  readonly isFetchingNextPage: boolean;
  readonly disableAutoPosition?: boolean;
}

const MIN_OUT_OF_VIEW_COUNT = 30;

export const WaveDropsScrollContainer = forwardRef<
  HTMLDivElement,
  WaveDropsScrollContainerProps
>(
  (
    {
      children,
      onScroll,
      onTopIntersection,
      newItemsCount,
      isFetchingNextPage,
      disableAutoPosition,
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);
    const previousHeightRef = useRef<number>(0);
    const previousNewItemsCountRef = useRef<number>(0);

    useEffect(() => {
      if (
        !disableAutoPosition &&
        contentRef.current &&
        ref &&
        "current" in ref
      ) {
        const scrollContainer = ref.current;
        if (!scrollContainer) {
          return;
        }

        // Only adjust scroll if new items were added
        if (newItemsCount > previousNewItemsCountRef.current) {
          const currentHeight = contentRef.current.scrollHeight;
          const heightDifference = currentHeight - previousHeightRef.current;
          
          // Only adjust if there's a height change and we're not at the bottom
          if (heightDifference > 0 && scrollContainer.scrollTop > 0) {
            // Maintain the same view by adjusting scroll position by the height difference
            scrollContainer.scrollTop += heightDifference;
          }
          
          previousHeightRef.current = currentHeight;
          previousNewItemsCountRef.current = newItemsCount;
        }
      }
    }, [newItemsCount, ref, disableAutoPosition]);

    // Store initial height after first render
    useEffect(() => {
      if (contentRef.current) {
        previousHeightRef.current = contentRef.current.scrollHeight;
        previousNewItemsCountRef.current = newItemsCount;
      }
    }, []);

    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      if (isFetchingNextPage) {
        return;
      }
      if (throttleTimeoutRef.current) return;
      const { currentTarget } = event;
      const currentScrollTop = currentTarget.scrollTop;

      throttleTimeoutRef.current = setTimeout(() => {
        onScroll();
        const direction = currentScrollTop > lastScrollTop ? "down" : "up";
        setLastScrollTop(currentScrollTop);

        if (direction === "down") {
          throttleTimeoutRef.current = null;
          return;
        }

        const dropElements =
          contentRef.current?.querySelectorAll("[id^='drop-']");
        if (!dropElements) {
          throttleTimeoutRef.current = null;
          return;
        }

        const containerRect = currentTarget.getBoundingClientRect();
        let outOfViewCount = 0;

        dropElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < containerRect.top) {
            outOfViewCount++;
          }
        });

        if (outOfViewCount <= MIN_OUT_OF_VIEW_COUNT) {
          onTopIntersection();
        }

        throttleTimeoutRef.current = null;
      }, 100);
    };

    return (
      <div
        ref={ref}
        className="tw-pb-2 tw-bg-iron-950 tw-flex tw-flex-col-reverse tw-flex-grow no-scrollbar tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transition-all tw-duration-300"
        onScroll={handleScroll}
      >
        <div className="tw-flex tw-flex-col-reverse tw-flex-grow">
          <div ref={contentRef} className="tw-overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

WaveDropsScrollContainer.displayName = "WaveDropsScrollContainer";