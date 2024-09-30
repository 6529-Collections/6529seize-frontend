import { dir } from "console";
import React, { forwardRef, useRef, useEffect, useState } from "react";

interface WaveDropsScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScroll: () => void;
  readonly onTopIntersection: () => void;
  readonly newItemsCount: number;
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
    },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);

    // todo make it only up scroll
    useEffect(() => {
      if (contentRef.current  && ref && "current" in ref) {
        const scrollContainer = ref.current;
        if (!scrollContainer) {
          return
        }
        const contentHeight = contentRef.current.scrollHeight;
        const scrollTop = scrollContainer.scrollTop;
        const clientHeight = scrollContainer.clientHeight;

        if (scrollTop + clientHeight < contentHeight) {
          scrollContainer.scrollTop =
            scrollTop + (contentRef.current.scrollHeight - contentHeight);
        }
      }
    }, [newItemsCount, ref]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      const currentScrollTop = event.currentTarget.scrollTop;
      const direction = currentScrollTop > lastScrollTop ? "down" : "up";

      const dropElements =
        contentRef.current?.querySelectorAll("[id^='drop-']");
      if (!dropElements) return;

      const containerRect = event.currentTarget.getBoundingClientRect();
      let outOfViewCount = 0;

      dropElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (direction === "up" && rect.bottom < containerRect.top) {
          outOfViewCount++;
        } else if (direction === "down" && rect.top > containerRect.bottom) {
          outOfViewCount++;
        }
      });

      onScroll();
      setLastScrollTop(currentScrollTop);

      if (outOfViewCount <= MIN_OUT_OF_VIEW_COUNT) {
        if (direction === "up") {
          onTopIntersection();
        } 
      }
    };

    return (
      <div
        ref={ref}
        className="tw-bg-iron-950 tw-flex tw-flex-col-reverse tw-flex-grow tw-overflow-y-auto tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-transition-all tw-duration-300"
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
